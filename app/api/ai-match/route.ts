import { generateObject } from "ai"
import { createServiceClient } from "@/lib/supabase/service"
import { z } from "zod"

const MatchResultSchema = z.object({
  isMatch: z.boolean().describe("true se i due animali potrebbero essere lo stesso"),
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Score da 0 a 100 che indica la probabilità che siano lo stesso animale"),
  matchingFeatures: z.array(z.string()).describe("Caratteristiche fisiche che corrispondono tra le due immagini"),
  differingFeatures: z.array(z.string()).describe("Caratteristiche fisiche che differiscono tra le due immagini"),
  analysis: z.string().describe("Analisi dettagliata in italiano di massimo 3 frasi"),
})

// Haversine formula — returns distance in km between two coordinates
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Max radius in km: smarrimento e avvistamento devono essere entro questa distanza
const GEO_RADIUS_KM = 30

export async function POST(req: Request) {
  try {
    const { sightingReportId } = await req.json()

    if (!sightingReportId) {
      return Response.json({ error: "Missing sightingReportId" }, { status: 400 })
    }

    // Use service client to bypass RLS — this route runs server-side without a user session
    const supabase = createServiceClient()

    // Get the sighting report
    const { data: sightingReport, error: sightingError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", sightingReportId)
      .eq("report_type", "avvistato")
      .single()

    if (sightingError || !sightingReport) {
      return Response.json({ error: "Sighting report not found" }, { status: 404 })
    }

    if (!sightingReport.image_url) {
      return Response.json({ error: "No image in sighting report" }, { status: 400 })
    }

    const sightingImageUrl = sightingReport.image_url.split(",")[0].trim()
    const sightingLat: number | null = sightingReport.latitude ?? null
    const sightingLon: number | null = sightingReport.longitude ?? null

    // Get all active lost reports for the same animal type with an image
    const { data: allLostReports, error: lostError } = await supabase
      .from("reports")
      .select("*")
      .eq("report_type", "smarrito")
      .eq("animal_type", sightingReport.animal_type)
      .eq("status", "active")
      .not("image_url", "is", null)

    if (lostError) {
      return Response.json({ error: "Error fetching lost reports" }, { status: 500 })
    }

    if (!allLostReports || allLostReports.length === 0) {
      return Response.json({ matches: [], message: "No lost reports to compare" })
    }

    // ── Geographic filter ────────────────────────────────────────────────────
    // If both reports have coordinates, use Haversine within GEO_RADIUS_KM.
    // If coordinates are missing, fall back to city name comparison.
    // If no geo data at all, include the report (fail-open).
    const lostReports = allLostReports.filter((r) => {
      const lostLat: number | null = r.latitude ?? null
      const lostLon: number | null = r.longitude ?? null

      if (sightingLat !== null && sightingLon !== null && lostLat !== null && lostLon !== null) {
        return haversineKm(sightingLat, sightingLon, lostLat, lostLon) <= GEO_RADIUS_KM
      }

      if (sightingReport.city && r.city) {
        const sightingCity = sightingReport.city.trim().toLowerCase()
        const lostCity = r.city.trim().toLowerCase()
        if (sightingCity === lostCity || sightingCity.split(" ")[0] === lostCity.split(" ")[0]) {
          return true
        }
      }

      // No geo info → include (fail-open so we never miss a real match)
      return true
    })
    // ────────────────────────────────────────────────────────────────────────

    if (lostReports.length === 0) {
      return Response.json({
        matches: [],
        message: `No lost reports within ${GEO_RADIUS_KM}km`,
        totalAnalyzed: 0,
        totalFiltered: allLostReports.length,
      })
    }

    const matches: Array<{
      lostReportId: string
      confidenceScore: number
      analysis: string
      lostReport: typeof lostReports[0]
    }> = []

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zampe-sicure.it"

    for (const lostReport of lostReports) {
      if (!lostReport.image_url) continue

      const lostImageUrl = lostReport.image_url.split(",")[0].trim()

      const lostLat: number | null = lostReport.latitude ?? null
      const lostLon: number | null = lostReport.longitude ?? null
      const distanceLabel =
        sightingLat !== null && sightingLon !== null && lostLat !== null && lostLon !== null
          ? `${Math.round(haversineKm(sightingLat, sightingLon, lostLat, lostLon))} km di distanza`
          : "distanza sconosciuta"

      try {
        const { object: output } = await generateObject({
          // google/gemini-2.0-flash: multimodale, ~10x più economico di Claude Sonnet
          model: "google/gemini-2.0-flash",
          schema: MatchResultSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Sei un esperto di riconoscimento visivo di animali domestici. Analizza le due immagini e determina se potrebbero essere lo stesso animale.

PRIMA immagine: animale SMARRITO (${lostReport.animal_type}, nome: "${lostReport.animal_name || "sconosciuto"}", zona: ${lostReport.city}).
SECONDA immagine: animale AVVISTATO (${sightingReport.animal_type}, zona: ${sightingReport.city}, ${distanceLabel} dallo smarrimento).

Confronta:
- Razza/specie e taglia
- Colore e pattern del mantello
- Segni particolari, macchie, marcature
- Forma di orecchie, muso, coda

Scala confidenceScore:
- 90-100: stesso animale (certezza quasi assoluta o foto identiche)
- 70-89: molto probabilmente lo stesso
- 50-69: possibile ma incerto
- 0-49: probabilmente diversi`,
                },
                { type: "image", image: new URL(lostImageUrl) },
                { type: "image", image: new URL(sightingImageUrl) },
              ],
            },
          ],
        })

        if (output && output.confidenceScore >= 60) {
          matches.push({
            lostReportId: lostReport.id,
            confidenceScore: output.confidenceScore,
            analysis: output.analysis,
            lostReport,
          })

          await supabase.from("ai_matches").upsert(
            {
              sighting_report_id: sightingReportId,
              lost_report_id: lostReport.id,
              confidence_score: output.confidenceScore,
              ai_analysis: JSON.stringify({
                analysis: output.analysis,
                matchingFeatures: output.matchingFeatures,
                differingFeatures: output.differingFeatures,
              }),
              status: "pending",
              notified_at: new Date().toISOString(),
            },
            { onConflict: "sighting_report_id,lost_report_id" }
          )

          const notificationData = {
            sighting_report_id: sightingReportId,
            lost_report_id: lostReport.id,
            confidence_score: output.confidenceScore,
          }

          // Notify owner of lost report
          if (lostReport.user_id) {
            await supabase.from("notifications").insert({
              user_id: lostReport.user_id,
              type: "ai_match",
              title: `Possibile corrispondenza al ${output.confidenceScore}%!`,
              message: `L'AI ha trovato una possibile corrispondenza tra il tuo animale smarrito "${lostReport.animal_name || "senza nome"}" e un avvistamento a ${sightingReport.city}. Controlla subito!`,
              data: notificationData,
              is_read: false,
            })

            await fetch(`${appUrl}/api/send-push`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: lostReport.user_id,
                title: `Possibile match al ${output.confidenceScore}%!`,
                body: `L'AI ha trovato un possibile avvistamento del tuo "${lostReport.animal_name || "animale smarrito"}" a ${sightingReport.city}.`,
                url: `/segnalazioni/${sightingReportId}`,
              }),
            }).catch(() => { })
          }

          // Notify owner of sighting report
          if (sightingReport.user_id) {
            await supabase.from("notifications").insert({
              user_id: sightingReport.user_id,
              type: "ai_match",
              title: `Il tuo avvistamento corrisponde al ${output.confidenceScore}%!`,
              message: `L'AI ha trovato che l'animale che hai avvistato a ${sightingReport.city} potrebbe essere "${lostReport.animal_name || "un animale smarrito"}". Il proprietario è stato avvisato!`,
              data: notificationData,
              is_read: false,
            })

            await fetch(`${appUrl}/api/send-push`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: sightingReport.user_id,
                title: `Il tuo avvistamento ha un match al ${output.confidenceScore}%!`,
                body: `L'animale che hai avvistato a ${sightingReport.city} potrebbe essere "${lostReport.animal_name || "un animale smarrito"}". Il proprietario è stato avvisato!`,
                // ✅ FIX: prima usava lostReportId (non definito). Ora usa lostReport.id
                url: `/segnalazioni/${lostReport.id}`,
              }),
            }).catch(() => { })
          }
        }
      } catch {
        // Continue with other reports if one fails
      }
    }

    matches.sort((a, b) => b.confidenceScore - a.confidenceScore)

    return Response.json({
      matches: matches.map((m) => ({
        lostReportId: m.lostReportId,
        confidenceScore: m.confidenceScore,
        analysis: m.analysis,
        animalName: m.lostReport.animal_name,
        city: m.lostReport.city,
      })),
      totalAnalyzed: lostReports.length,
      totalFiltered: allLostReports.length - lostReports.length,
    })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
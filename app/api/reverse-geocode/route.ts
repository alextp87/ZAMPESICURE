import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const lat = Number(body?.lat)
    const lon = Number(body?.lon)

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 })
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` +
      `&addressdetails=1&zoom=18&accept-language=it`

    const res = await fetch(url, {
      headers: {
        "User-Agent": "ZampeSicure/1.0 (reverse-geocode)",
        "Accept": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Nominatim error" }, { status: 502 })
    }

    const data = await res.json()
    const addr = data?.address || {}

    const street =
      addr.road ||
      addr.pedestrian ||
      addr.footway ||
      addr.path ||
      addr.residential ||
      addr.locality ||
      ""

    const houseNumber = addr.house_number || ""

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      ""

    const region = addr.state || addr.region || ""

    const streetLine = [street, houseNumber].filter(Boolean).join(", ")
    const cityRegion = [city, region].filter(Boolean).join(", ")
    const full = [streetLine, cityRegion].filter(Boolean).join(", ")

    return NextResponse.json({
      street: streetLine || "",
      city: city || "",
      region: region || "",
      full: full || data?.display_name || "",
      display_name: data?.display_name || "",
      raw: data,
    })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
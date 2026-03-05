import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendPushNotification } from "@/lib/web-push"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({} as any))
  const target = body.target === "all" ? "all" : "user"
  const userId = String(body.userId || "").trim()
  const title = String(body.title || "").trim()
  const message = String(body.body || "").trim()
  const url = String(body.url || "/").trim() || "/"

  if (!title || !message) {
    return NextResponse.json({ error: "Missing title/body" }, { status: 400 })
  }

  if (target === "user" && !userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    // IMPORTANT: createServiceClient uses SUPABASE_SERVICE_ROLE_KEY.
    // If it's missing, it will throw and previously caused a generic 500.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            "Missing server env vars for Supabase service client. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (Production + Preview).",
        },
        { status: 500 },
      )
    }

    const svc = createServiceClient()

    const getSubscriptionsForUser = async (uid: string) => {
      const { data, error } = await svc
        .from("push_subscriptions")
        .select("id,endpoint,p256dh,auth")
        .eq("user_id", uid)
      if (error) return []
      return data || []
    }

    const sendToUser = async (uid: string) => {
      const subs = await getSubscriptionsForUser(uid)
      if (!subs.length) return { sent: 0, expired: [] as string[] }

      let sent = 0
      const expired: string[] = []

      for (const sub of subs) {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title, body: message, url },
        )

        if (result.success) sent++
        else if (result.expired) expired.push(sub.id)
      }

      if (expired.length) {
        await svc.from("push_subscriptions").delete().in("id", expired)
      }

      return { sent, expired }
    }

    if (target === "user") {
      const r = await sendToUser(userId)
      return NextResponse.json({ success: true, target: "user", userId, sent: r.sent, expired: r.expired.length })
    }

    // all
    const { data: usersWithSubs, error } = await svc.from("push_subscriptions").select("user_id")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const userIds = Array.from(new Set((usersWithSubs || []).map((r: any) => r.user_id).filter(Boolean))) as string[]

    let totalSent = 0
    let totalExpired = 0

    for (const uid of userIds) {
      const r = await sendToUser(uid)
      totalSent += r.sent
      totalExpired += r.expired.length
    }

    return NextResponse.json({ success: true, target: "all", users: userIds.length, sent: totalSent, expired: totalExpired })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
}

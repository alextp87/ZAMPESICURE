import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendPushNotification } from "@/lib/web-push"

export async function POST(req: Request) {
  try {
    const { userId, title, body, url } = await req.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" })
    }

    let sent = 0
    const expired: string[] = []

    for (const sub of subscriptions) {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { title, body, url: url || "/" }
      )

      if (result.success) {
        sent++
      } else if (result.expired) {
        expired.push(sub.id)
      }
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expired)
    }

    return NextResponse.json({ sent, expired: expired.length })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

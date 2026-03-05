import webpush from "web-push"

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
}

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.")
  }

  webpush.setVapidDetails(
    "mailto:info@zampe-sicure.it",
    publicKey,
    privateKey
  )

  return webpush
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    const wp = getWebPush()
    await wp.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        icon: payload.icon || "/icons/icon-192x192.png",
        badge: payload.badge || "/icons/icon-96x96.png",
      })
    )
    return { success: true }
  } catch (error: unknown) {
    const err = error as { statusCode?: number }
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, expired: true }
    }
    return { success: false, error }
  }
}

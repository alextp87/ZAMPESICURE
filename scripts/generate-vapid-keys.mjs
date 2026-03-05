// Generate VAPID keys for Web Push
// Run once with: node scripts/generate-vapid-keys.mjs

import webpush from "web-push"

const vapidKeys = webpush.generateVAPIDKeys()
console.log("VAPID Keys generated:")
console.log("")
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey)
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey)
console.log("")
console.log("Add these to your Vercel environment variables.")

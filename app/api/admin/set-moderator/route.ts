import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: Request) {
  try {
    const { userId, isModerator } = await req.json()

    if (!userId || typeof isModerator !== "boolean") {
      return Response.json({ error: "Missing userId or isModerator" }, { status: 400 })
    }

    // Verify the caller is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!callerProfile?.is_admin) {
      return Response.json({ error: "Forbidden - admin only" }, { status: 403 })
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from("profiles")
      .update({ is_moderator: isModerator })
      .eq("id", userId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

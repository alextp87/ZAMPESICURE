import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    // Verify the caller is an authenticated admin
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
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, isAdmin } = await req.json()

    if (!userId || typeof isAdmin !== "boolean") {
      return Response.json({ error: "Missing userId or isAdmin" }, { status: 400 })
    }

    // Use service client to bypass RLS and update the target user
    const serviceSupabase = createServiceClient()
    const { error } = await serviceSupabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

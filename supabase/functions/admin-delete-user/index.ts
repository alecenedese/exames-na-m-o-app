import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", callerUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError) {
      throw new Error(`Failed to validate role: ${roleError.message}`);
    }

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string | undefined;
    try {
      const body = await req.json();
      userId = body?.userId;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId);

    if (profilesError) {
      throw new Error(`Failed to load profiles: ${profilesError.message}`);
    }

    const profileIds = (profiles ?? []).map((profile) => profile.id);

    const { data: clinics, error: clinicsError } = profileIds.length
      ? await supabaseAdmin
          .from("clinics")
          .select("id")
          .in("admin_user_id", profileIds)
      : { data: [], error: null };

    if (clinicsError) {
      throw new Error(`Failed to load clinics: ${clinicsError.message}`);
    }

    const clinicIds = (clinics ?? []).map((clinic) => clinic.id);

    if (clinicIds.length) {
      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from("appointments")
        .select("id")
        .in("clinic_id", clinicIds);

      if (appointmentsError) {
        throw new Error(`Failed to load appointments: ${appointmentsError.message}`);
      }

      const appointmentIds = (appointments ?? []).map((appointment) => appointment.id);

      if (appointmentIds.length) {
        const { error: appointmentExamsError } = await supabaseAdmin
          .from("appointment_exams")
          .delete()
          .in("appointment_id", appointmentIds);

        if (appointmentExamsError) {
          throw new Error(`Failed to delete appointment exams: ${appointmentExamsError.message}`);
        }
      }

      const [appointmentsDelete, pricesDelete, subscriptionsDelete, clinicsDelete] = await Promise.all([
        supabaseAdmin.from("appointments").delete().in("clinic_id", clinicIds),
        supabaseAdmin.from("clinic_exam_prices").delete().in("clinic_id", clinicIds),
        supabaseAdmin.from("clinic_subscriptions").delete().in("clinic_id", clinicIds),
        supabaseAdmin.from("clinics").delete().in("id", clinicIds),
      ]);

      if (appointmentsDelete.error) throw new Error(`Failed to delete appointments: ${appointmentsDelete.error.message}`);
      if (pricesDelete.error) throw new Error(`Failed to delete clinic prices: ${pricesDelete.error.message}`);
      if (subscriptionsDelete.error) throw new Error(`Failed to delete subscriptions: ${subscriptionsDelete.error.message}`);
      if (clinicsDelete.error) throw new Error(`Failed to delete clinics: ${clinicsDelete.error.message}`);
    }

    const [rolesDelete, profileDelete, registrationsDelete] = await Promise.all([
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("user_id", userId),
      supabaseAdmin.from("clinic_registrations").delete().eq("user_id", userId),
    ]);

    if (rolesDelete.error) throw new Error(`Failed to delete user roles: ${rolesDelete.error.message}`);
    if (profileDelete.error) throw new Error(`Failed to delete profile: ${profileDelete.error.message}`);
    if (registrationsDelete.error) throw new Error(`Failed to delete clinic registrations: ${registrationsDelete.error.message}`);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError && !deleteError.message.toLowerCase().includes("not found")) {
      throw new Error(`Failed to delete auth user: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true, deletedClinicIds: clinicIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting user:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

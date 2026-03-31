import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface LinkAnonymousUserRequest {
  anonymousUserId?: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !authorization) {
    return jsonResponse({ error: "Missing Supabase env or auth context" }, 500);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const isAnonymousUser =
    "is_anonymous" in userData.user ? Boolean(userData.user.is_anonymous) : false;

  if (isAnonymousUser) {
    return jsonResponse({ error: "Anonymous users cannot link accounts" }, 400);
  }

  const payload = (await request.json()) as LinkAnonymousUserRequest;
  const anonymousUserId = payload.anonymousUserId?.trim();

  if (!anonymousUserId) {
    return jsonResponse({ error: "anonymousUserId is required" }, 400);
  }

  if (anonymousUserId === userData.user.id) {
    return jsonResponse({ linked: false, reason: "same-user" });
  }

  const { error: childError } = await adminClient
    .from("children")
    .update({
      owner_user_id: userData.user.id,
      owner_anonymous_user_id: anonymousUserId
    })
    .eq("owner_user_id", anonymousUserId);

  if (childError) {
    return jsonResponse({ error: childError.message }, 500);
  }

  const { error: mealPlanError } = await adminClient
    .from("meal_plans")
    .update({
      created_by_user_id: userData.user.id,
      created_by_anonymous_user_id: anonymousUserId
    })
    .eq("created_by_user_id", anonymousUserId);

  if (mealPlanError) {
    return jsonResponse({ error: mealPlanError.message }, 500);
  }

  await adminClient.from("anonymous_users").upsert(
    {
      id: anonymousUserId,
      device_key: `auth-anon:${anonymousUserId}`
    },
    {
      onConflict: "id"
    }
  );

  await adminClient.from("user_identity_links").upsert(
    {
      anonymous_user_id: anonymousUserId,
      user_id: userData.user.id
    },
    {
      onConflict: "anonymous_user_id,user_id"
    }
  );

  return jsonResponse({
    linked: true,
    anonymousUserId,
    userId: userData.user.id
  });
});

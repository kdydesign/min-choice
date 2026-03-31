import type { Provider, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../../lib/supabase";
import {
  ensureSupabasePersistenceReady,
  ensureSupabaseSession
} from "./supabase-bootstrap-service";

const PENDING_ANONYMOUS_LINK_KEY = "min-baby-meals.pending-anonymous-link-user-id";

export function isAnonymousSession(session: Session | null) {
  if (!session?.user) {
    return false;
  }

  return "is_anonymous" in session.user ? Boolean(session.user.is_anonymous) : false;
}

function getPendingAnonymousLinkUserId() {
  return localStorage.getItem(PENDING_ANONYMOUS_LINK_KEY);
}

function setPendingAnonymousLinkUserId(userId: string) {
  localStorage.setItem(PENDING_ANONYMOUS_LINK_KEY, userId);
}

export function clearPendingAnonymousLinkUserId() {
  localStorage.removeItem(PENDING_ANONYMOUS_LINK_KEY);
}

export function getAuthIdentityLabel(session: Session | null) {
  if (!session?.user) {
    return "로그인 필요";
  }

  if (isAnonymousSession(session)) {
    return "익명 사용자";
  }

  return session.user.email ?? "로그인 사용자";
}

export function getAuthProviderLabel(session: Session | null) {
  if (!session?.user) {
    return "미연결";
  }

  if (isAnonymousSession(session)) {
    return "익명 체험";
  }

  const provider = session.user.app_metadata.provider;

  if (provider === "google") {
    return "Google";
  }

  if (provider === "apple") {
    return "Apple";
  }

  return "Supabase Auth";
}

export async function startOAuthSignIn(provider: Provider, currentSession: Session | null) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  if (isAnonymousSession(currentSession)) {
    setPendingAnonymousLinkUserId(currentSession!.user.id);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function continueWithAnonymousSession() {
  const session = await ensureSupabaseSession();
  await ensureSupabasePersistenceReady();
  return session;
}

export async function signOutSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  clearPendingAnonymousLinkUserId();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function linkPendingAnonymousUserToCurrentSession(session: Session | null) {
  const supabase = getSupabaseClient();
  const pendingAnonymousUserId = getPendingAnonymousLinkUserId();

  if (
    !supabase ||
    !pendingAnonymousUserId ||
    !session?.user ||
    isAnonymousSession(session)
  ) {
    return;
  }

  if (pendingAnonymousUserId === session.user.id) {
    clearPendingAnonymousLinkUserId();
    return;
  }

  const { error } = await supabase.functions.invoke("link-anonymous-user", {
    body: {
      anonymousUserId: pendingAnonymousUserId
    }
  });

  if (error) {
    throw error;
  }

  clearPendingAnonymousLinkUserId();
}

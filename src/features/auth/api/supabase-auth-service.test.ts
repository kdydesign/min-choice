import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseClientMock,
  ensureSupabaseSessionMock,
  ensureSupabasePersistenceReadyMock
} = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
  ensureSupabaseSessionMock: vi.fn(),
  ensureSupabasePersistenceReadyMock: vi.fn()
}));

vi.mock("../../../lib/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock
}));

vi.mock("./supabase-bootstrap-service", () => ({
  ensureSupabaseSession: ensureSupabaseSessionMock,
  ensureSupabasePersistenceReady: ensureSupabasePersistenceReadyMock
}));

import {
  continueWithAnonymousSession,
  isAnonymousSessionPaused,
  signOutSupabase
} from "./supabase-auth-service";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function createSession(id: string, isAnonymous: boolean) {
  return {
    user: {
      id,
      app_metadata: {
        provider: isAnonymous ? "anonymous" : "google"
      },
      is_anonymous: isAnonymous
    }
  } as Session;
}

describe("supabase-auth-service", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
    getSupabaseClientMock.mockReset();
    ensureSupabaseSessionMock.mockReset();
    ensureSupabasePersistenceReadyMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pauses anonymous session without calling Supabase signOut", async () => {
    const signOutMock = vi.fn();
    getSupabaseClientMock.mockReturnValue({
      auth: {
        signOut: signOutMock
      }
    });

    const session = createSession("anon-user", true);
    const nextSession = await signOutSupabase(session);

    expect(signOutMock).not.toHaveBeenCalled();
    expect(isAnonymousSessionPaused()).toBe(true);
    expect(nextSession).not.toBe(session);
    expect(nextSession?.user.id).toBe("anon-user");
  });

  it("clears paused state when resuming anonymous session", async () => {
    localStorage.setItem("min-baby-meals.anonymous-session-paused", "true");
    const session = createSession("anon-user", true);

    ensureSupabaseSessionMock.mockResolvedValue(session);
    ensureSupabasePersistenceReadyMock.mockResolvedValue(undefined);

    const nextSession = await continueWithAnonymousSession();

    expect(nextSession).toBe(session);
    expect(isAnonymousSessionPaused()).toBe(false);
    expect(ensureSupabasePersistenceReadyMock).toHaveBeenCalledOnce();
  });

  it("fully signs out authenticated users", async () => {
    const signOutMock = vi.fn().mockResolvedValue({ error: null });
    getSupabaseClientMock.mockReturnValue({
      auth: {
        signOut: signOutMock
      }
    });
    localStorage.setItem("min-baby-meals.anonymous-session-paused", "true");

    const nextSession = await signOutSupabase(createSession("google-user", false));

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(nextSession).toBeNull();
    expect(isAnonymousSessionPaused()).toBe(false);
  });
});

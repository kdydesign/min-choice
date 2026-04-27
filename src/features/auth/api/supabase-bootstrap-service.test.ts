import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseClientMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn()
}));

vi.mock("../../../lib/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock
}));

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

async function loadBootstrapService() {
  return import("./supabase-bootstrap-service");
}

describe("supabase-bootstrap-service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("localStorage", new MemoryStorage());
    getSupabaseClientMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null user id without creating an anonymous session", async () => {
    const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const signInAnonymouslyMock = vi.fn();

    getSupabaseClientMock.mockReturnValue({
      auth: {
        getSession: getSessionMock,
        signInAnonymously: signInAnonymouslyMock
      }
    });

    const { getSupabaseCurrentUserId } = await loadBootstrapService();

    await expect(getSupabaseCurrentUserId()).resolves.toBeNull();
    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("skips persistence bootstrap when there is no existing session", async () => {
    const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const signInAnonymouslyMock = vi.fn();

    getSupabaseClientMock.mockReturnValue({
      auth: {
        getSession: getSessionMock,
        signInAnonymously: signInAnonymouslyMock
      }
    });

    const { ensureSupabasePersistenceReady } = await loadBootstrapService();

    await expect(ensureSupabasePersistenceReady()).resolves.toBeUndefined();
    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });

  it("creates an anonymous session only when explicitly requested", async () => {
    const session = createSession("anon-user", true);
    const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const signInAnonymouslyMock = vi.fn().mockResolvedValue({
      data: { session },
      error: null
    });

    getSupabaseClientMock.mockReturnValue({
      auth: {
        getSession: getSessionMock,
        signInAnonymously: signInAnonymouslyMock
      }
    });

    const { ensureAnonymousSupabaseSession } = await loadBootstrapService();

    await expect(ensureAnonymousSupabaseSession()).resolves.toBe(session);
    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(signInAnonymouslyMock).toHaveBeenCalledOnce();
  });

  it("reuses an existing session instead of creating a new anonymous session", async () => {
    const session = createSession("google-user", false);
    const getSessionMock = vi.fn().mockResolvedValue({ data: { session }, error: null });
    const signInAnonymouslyMock = vi.fn();

    getSupabaseClientMock.mockReturnValue({
      auth: {
        getSession: getSessionMock,
        signInAnonymously: signInAnonymouslyMock
      }
    });

    const { ensureAnonymousSupabaseSession } = await loadBootstrapService();

    await expect(ensureAnonymousSupabaseSession()).resolves.toBe(session);
    expect(getSessionMock).toHaveBeenCalledOnce();
    expect(signInAnonymouslyMock).not.toHaveBeenCalled();
  });
});

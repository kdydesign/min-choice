import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { queryClient } from "../../../lib/query-client";
import { getSupabaseClient } from "../../../lib/supabase";
import { subscribeToSupabaseAuthState } from "../api/supabase-bootstrap-service";
import {
  continueWithAnonymousSession,
  getAuthIdentityLabel,
  getAuthProviderLabel,
  isAnonymousSessionPaused,
  isAnonymousSession,
  linkPendingAnonymousUserToCurrentSession,
  signOutSupabase,
  startOAuthSignIn
} from "../api/supabase-auth-service";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isWorking: boolean;
  errorMessage: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isAnonymousPaused: boolean;
  canAccessApp: boolean;
  identityLabel: string;
  providerLabel: string;
  signInWithGoogle: () => Promise<void>;
  continueAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "인증 처리 중 오류가 발생했어요.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    void supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          console.warn("Failed to read Supabase session", error);
          setErrorMessage("로그인 상태를 확인하지 못했어요.");
        }

        setSession(data.session ?? null);

        if (data.session && !isAnonymousSession(data.session)) {
          try {
            await linkPendingAnonymousUserToCurrentSession(data.session);
          } catch (linkError) {
            console.warn("Failed to link anonymous session", linkError);
            setErrorMessage("기존 익명 데이터를 계정에 연결하지 못했어요.");
          }
        }

        setIsLoading(false);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.warn("Supabase session bootstrap failed", error);
        setErrorMessage("로그인 상태를 준비하지 못했어요.");
        setIsLoading(false);
      });

    const subscription = subscribeToSupabaseAuthState(async (_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      void queryClient.invalidateQueries({ queryKey: ["children"] });
      void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });

      if (nextSession && !isAnonymousSession(nextSession)) {
        try {
          await linkPendingAnonymousUserToCurrentSession(nextSession);
        } catch (error) {
          console.warn("Failed to link anonymous session", error);
          setErrorMessage("기존 익명 데이터를 계정에 연결하지 못했어요.");
        }
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  async function runAuthAction(action: () => Promise<void>) {
    setIsWorking(true);
    setErrorMessage(null);

    try {
      await action();
    } catch (error) {
      console.warn("Auth action failed", error);
      setErrorMessage(getErrorMessage(error));
      throw error;
    } finally {
      setIsWorking(false);
    }
  }

  const value = useMemo<AuthContextValue>(() => {
    const isAnonymous = isAnonymousSession(session);
    const isPaused = isAnonymous && isAnonymousSessionPaused();
    const isAuthenticated = Boolean(session?.user) && !isAnonymous;

    return {
      session,
      user: session?.user ?? null,
      isLoading,
      isWorking,
      errorMessage,
      isAuthenticated,
      isAnonymous,
      isAnonymousPaused: isPaused,
      canAccessApp: Boolean(session?.user) && !isPaused,
      identityLabel: getAuthIdentityLabel(session),
      providerLabel: getAuthProviderLabel(session),
      signInWithGoogle: () =>
        runAuthAction(async () => {
          await startOAuthSignIn("google", session);
        }),
      continueAnonymously: () =>
        runAuthAction(async () => {
          const nextSession = await continueWithAnonymousSession();
          setSession(nextSession);
        }),
      signOut: () =>
        runAuthAction(async () => {
          const nextSession = await signOutSupabase(session);
          setSession(nextSession);
        }),
      clearError: () => setErrorMessage(null)
    };
  }, [errorMessage, isLoading, isWorking, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

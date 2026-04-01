import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Panel } from "../components/panel";
import { LoadingState } from "../components/loading-state";
import { useAuth } from "../features/auth/hooks/use-auth";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { HistoryPage } from "../pages/history-page";
import { HomePage } from "../pages/home-page";
import { LoginPage } from "../pages/login-page";
import { ProfilePage } from "../pages/profile-page";

function RoutePendingScreen() {
  return (
    <div className="auth-shell">
      <Panel eyebrow="Loading" title="로그인 상태를 확인하는 중" subtitle="잠시만 기다려 주세요.">
        <LoadingState
          title="세션을 확인하고 있어요"
          description="Supabase 세션과 계정 연결 상태를 차분하게 준비 중이에요."
        />
      </Panel>
    </div>
  );
}

function ProtectedHomeRoute() {
  const { canAccessApp, isLoading } = useAuth();
  const location = useLocation();
  const { data: profiles = [], isLoading: isProfilesLoading } = useQuery({
    queryKey: ["children"],
    queryFn: listChildProfiles,
    enabled: canAccessApp
  });

  if (isLoading || (canAccessApp && isProfilesLoading)) {
    return <RoutePendingScreen />;
  }

  if (!canAccessApp) {
    return <Navigate to="/login" replace />;
  }

  if (profiles.length === 0 && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

function PublicLoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RoutePendingScreen />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicLoginRoute />} />
        <Route path="/" element={<ProtectedHomeRoute />}>
          <Route index element={<HomePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { SessionCheckingOverlay } from "../features/auth/components/session-checking-overlay";
import { useAuth } from "../features/auth/hooks/use-auth";
import { listChildProfiles } from "../features/children/api/child-profile-repository";
import { HistoryPage } from "../pages/history-page";
import { HomePage } from "../pages/home-page";
import { LoginPage } from "../pages/login-page";
import { ProfilePage } from "../pages/profile-page";

function RoutePendingScreen({
  showLoginBackdrop = false,
  title,
  description
}: {
  showLoginBackdrop?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <div className="session-checking-screen">
      {showLoginBackdrop ? (
        <div aria-hidden="true">
          <LoginPage />
        </div>
      ) : (
        <div className="session-checking-screen-backdrop" aria-hidden="true" />
      )}
      <SessionCheckingOverlay title={title} description={description} />
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

  if (isLoading) {
    return <RoutePendingScreen />;
  }

  if (!canAccessApp) {
    return <Navigate to="/login" replace />;
  }

  if (isProfilesLoading) {
    return (
      <RoutePendingScreen
        title="아이 프로필 확인 중..."
        description="등록된 아이 정보를 준비하고 있어요."
      />
    );
  }

  if (profiles.length === 0 && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

function PublicLoginRoute() {
  const { canAccessApp, isAuthenticated, isLoading, isAnonymousPaused } = useAuth();

  if (isLoading) {
    return <RoutePendingScreen showLoginBackdrop />;
  }

  if (canAccessApp && !isAnonymousPaused) {
    return <Navigate to="/" replace />;
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

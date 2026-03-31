import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Panel } from "../components/panel";
import { useAuth } from "../features/auth/hooks/use-auth";
import { HomePage } from "../pages/home-page";
import { LoginPage } from "../pages/login-page";

function RoutePendingScreen() {
  return (
    <div className="auth-shell">
      <Panel eyebrow="Loading" title="로그인 상태를 확인하는 중" subtitle="잠시만 기다려 주세요.">
        <div className="empty-state">Supabase 세션과 계정 연결 상태를 확인하고 있어요.</div>
      </Panel>
    </div>
  );
}

function ProtectedHomeRoute() {
  const { canAccessApp, isLoading } = useAuth();

  if (isLoading) {
    return <RoutePendingScreen />;
  }

  return canAccessApp ? <HomePage /> : <Navigate to="/login" replace />;
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
        <Route path="/" element={<ProtectedHomeRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

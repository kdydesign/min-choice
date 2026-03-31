import { useNavigate } from "react-router-dom";
import { Panel } from "../components/panel";
import { useAuth } from "../features/auth/hooks/use-auth";

export function LoginPage() {
  const navigate = useNavigate();
  const {
    errorMessage,
    isWorking,
    signInWithApple,
    signInWithGoogle,
    continueAnonymously,
    clearError
  } = useAuth();

  async function handleContinueAnonymously() {
    await continueAnonymously();
    navigate("/", { replace: true });
  }

  return (
    <div className="auth-shell">
      <Panel
        eyebrow="Auth"
        title="로그인하고 아이 식단을 이어서 관리해요"
        subtitle="Google, Apple 또는 익명 체험으로 시작할 수 있어요."
        footer={
          <div className="auth-footer">
            <span>로그인 후에는 기존 익명 데이터와 계정 연동이 가능하도록 구성했습니다.</span>
          </div>
        }
      >
        <div className="auth-stack">
          <div className="notice success">
            Google / Apple 로그인 시 현재 기기에서 쓰던 익명 식단 데이터를 이어받을 수 있어요.
          </div>

          {errorMessage ? (
            <div className="notice danger auth-error">
              <span>{errorMessage}</span>
              <button type="button" className="tiny small" onClick={clearError}>
                닫기
              </button>
            </div>
          ) : null}

          <div className="auth-actions">
            <button type="button" className="primary auth-button" onClick={() => void signInWithGoogle()} disabled={isWorking}>
              Google로 로그인
            </button>
            <button type="button" className="secondary auth-button" onClick={() => void signInWithApple()} disabled={isWorking}>
              Apple로 로그인
            </button>
            <button type="button" className="ghost auth-button" onClick={() => void handleContinueAnonymously()} disabled={isWorking}>
              익명으로 계속하기
            </button>
          </div>

          <ul className="auth-feature-list">
            <li>아이 프로필과 알레르기 정보를 기기/계정 기준으로 분리 관리</li>
            <li>오늘 식단과 최근 식단 이력을 Supabase DB에 저장</li>
            <li>로그인 후 Google·Apple 계정 기준으로 확장 가능한 구조</li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}

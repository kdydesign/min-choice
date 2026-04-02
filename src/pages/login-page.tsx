import { useNavigate } from "react-router-dom";
import figmaLoginArt from "../assets/figma-login-art.png";
import { useAuth } from "../features/auth/hooks/use-auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { errorMessage, isWorking, signInWithGoogle, continueAnonymously, clearError } = useAuth();

  async function handleContinueAnonymously() {
    await continueAnonymously();
    navigate("/", { replace: true });
  }

  return (
    <div className="login-screen">
      <div className="login-screen-card">
        <div className="login-screen-visual">
          <img src={figmaLoginArt} alt="베베 초이스 로고" className="login-screen-image" />
        </div>

        <p className="login-screen-copy">잘먹 있는 재료로 쉬워요! 식단을 손쉽게.</p>

        {errorMessage ? (
          <div className="notice danger auth-error">
            <span>{errorMessage}</span>
            <button type="button" className="tiny small" onClick={clearError}>
              닫기
            </button>
          </div>
        ) : null}

        <div className="login-screen-actions">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="login-provider-button login-provider-google"
            disabled={isWorking}
            aria-busy={isWorking}
          >
            <svg className="login-provider-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{isWorking ? "로그인 준비 중" : "Google로 로그인"}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleContinueAnonymously()}
            className="login-provider-button login-provider-guest"
            disabled={isWorking}
            aria-busy={isWorking}
          >
            <svg className="login-provider-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 12.75a3.75 3.75 0 1 0 0-7.5a3.75 3.75 0 0 0 0 7.5Zm-7.5 8.25a7.5 7.5 0 1 1 15 0h-15Z" />
            </svg>
            <span>{isWorking ? "잠시만 기다려 주세요" : "익명으로 계속하기"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleContinueAnonymously()}
          className="login-screen-link"
          disabled={isWorking}
        >
          간편하게 지금 시작해 보세요!
        </button>
      </div>
    </div>
  );
}

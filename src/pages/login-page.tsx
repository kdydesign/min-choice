import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/brand-logo";
import { useAuth } from "../features/auth/hooks/use-auth";
import onboardingIllustration from "../assets/onboarding-illustration.svg";

export function LoginPage() {
  const navigate = useNavigate();
  const {
    errorMessage,
    isWorking,
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
      <div className="login-stage">
        <div className="login-illustration-card">
          <img
            src={onboardingIllustration}
            alt="따뜻한 주방에서 아기 식사를 준비하는 보호자 일러스트"
            className="login-illustration"
          />
        </div>

        <BrandLogo />

        {errorMessage ? (
          <div className="notice danger auth-error">
            <span>{errorMessage}</span>
            <button type="button" className="tiny small" onClick={clearError}>
              닫기
            </button>
          </div>
        ) : null}

        <div className="login-actions">
          <button
            type="button"
            className="primary auth-button"
            onClick={() => void signInWithGoogle()}
            disabled={isWorking}
            aria-busy={isWorking}
          >
            {isWorking ? "로그인 준비 중" : "Google로 로그인"}
          </button>
          <button
            type="button"
            className="secondary auth-button"
            onClick={() => void handleContinueAnonymously()}
            disabled={isWorking}
            aria-busy={isWorking}
          >
            {isWorking ? "잠시만 기다려 주세요" : "익명으로 계속하기"}
          </button>
        </div>

        <p className="login-copyright">mindoong-corp</p>
      </div>
    </div>
  );
}

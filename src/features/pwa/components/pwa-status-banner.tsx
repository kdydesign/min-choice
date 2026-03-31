import { usePwaInstall } from "../hooks/use-pwa-install";

export function PwaStatusBanner() {
  const { canInstall, isInstalled, isOnline, promptInstall } = usePwaInstall();

  if (isInstalled && isOnline) {
    return null;
  }

  return (
    <div className="pwa-banner">
      {!isOnline ? (
        <div className="notice warning">
          오프라인 상태예요. 최근 저장된 식단과 입력값으로 계속 사용할 수 있어요.
        </div>
      ) : null}
      {canInstall ? (
        <div className="pwa-install-card">
          <div>
            <strong>앱으로 설치</strong>
            <p className="subtle">홈 화면에 추가해 더 빠르게 열고 오프라인에서도 다시 볼 수 있어요.</p>
          </div>
          <button type="button" className="primary small" onClick={promptInstall}>
            설치하기
          </button>
        </div>
      ) : null}
    </div>
  );
}

import { ProgressLayerDialog } from "../../../components/progress-layer-dialog";

const STEP_LABELS = {
  normalizing: "재료 정리",
  generating: "식단 생성",
  saving: "저장"
} as const;

export type MealGenerationStage = keyof typeof STEP_LABELS;

interface MealGenerationProgressProps {
  stage: MealGenerationStage;
  title?: string;
  className?: string;
}

const STEP_ORDER: MealGenerationStage[] = ["normalizing", "generating", "saving"];

function getStepState(stage: MealGenerationStage, step: MealGenerationStage) {
  const currentIndex = STEP_ORDER.indexOf(stage);
  const stepIndex = STEP_ORDER.indexOf(step);

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 9.25 16.75 19 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <span className="meal-generation-progress-spinner" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4a8 8 0 1 1-8 8"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function MealGenerationProgress({
  stage,
  title = "식단 생성 중",
  className
}: MealGenerationProgressProps) {
  return (
    <ProgressLayerDialog
      title={title}
      className={`meal-generation-progress-overlay${className ? ` ${className}` : ""}`}
    >
      <span className="sr-only">{STEP_LABELS[stage]} 단계가 진행 중입니다.</span>

      <div className="meal-generation-progress-track" aria-hidden="true">
        {STEP_ORDER.map((step, index) => {
          const stepState = getStepState(stage, step);

          return (
            <div key={step} className="meal-generation-progress-step-group">
              <div className={`meal-generation-progress-step is-${stepState}`}>
                <div className="meal-generation-progress-step-circle">
                  {stepState === "complete" ? <CheckIcon /> : <SpinnerIcon />}
                </div>
                <span>{STEP_LABELS[step]}</span>
              </div>

              {index < STEP_ORDER.length - 1 ? (
                <div className="meal-generation-progress-arrow">
                  <ArrowIcon />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ProgressLayerDialog>
  );
}

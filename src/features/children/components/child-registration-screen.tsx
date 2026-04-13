import type { ChildProfile } from "../../../types/domain";
import { AppIcon } from "../../../components/icons/app-icon";
import { ChildProfileForm } from "./child-profile-form";

type ChildRegistrationMode = "create" | "edit";

interface ChildRegistrationScreenProps {
  mode?: ChildRegistrationMode;
  initialProfile?: ChildProfile | null;
  submitting?: boolean;
  onSave: (
    payload: Omit<ChildProfile, "id" | "createdAt" | "updatedAt">,
    editingId?: string
  ) => Promise<void> | void;
  onCancel?: () => void;
}

function getRegistrationCopy(mode: ChildRegistrationMode) {
  if (mode === "edit") {
    return {
      title: "아이 정보 수정",
      description: "기존 정보를 수정하고 맞춤 이유식 추천을 이어가세요",
      submitLabel: "프로필 수정"
    };
  }

  return {
    title: "새 아이 등록",
    description: "간단한 정보만 입력하면 맞춤 이유식을 추천해 드려요",
    submitLabel: "프로필 저장"
  };
}

export function ChildRegistrationScreen({
  mode = "create",
  initialProfile = null,
  submitting = false,
  onSave,
  onCancel
}: ChildRegistrationScreenProps) {
  const copy = getRegistrationCopy(mode);

  return (
    <section className="first-child-registration-view" aria-labelledby="child-registration-title">
      <div className="first-child-registration-hero">
        <div className="first-child-registration-hero-icon" aria-hidden="true">
          <AppIcon name="childProfile" size={40} />
        </div>
        <h1 id="child-registration-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      <ChildProfileForm
        initialProfile={initialProfile}
        layout="onboarding"
        submitLabel={copy.submitLabel}
        cancelLabel="취소"
        submitting={submitting}
        onSave={onSave}
        onCancel={onCancel}
      />
    </section>
  );
}

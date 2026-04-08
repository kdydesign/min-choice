import type { ChildProfile } from "../../../types/domain";
import { ChildProfileForm } from "./child-profile-form";

interface FirstChildRegistrationViewProps {
  submitting?: boolean;
  onSave: (
    payload: Omit<ChildProfile, "id" | "createdAt" | "updatedAt">,
    editingId?: string
  ) => Promise<void> | void;
}

export function FirstChildRegistrationView({
  submitting = false,
  onSave
}: FirstChildRegistrationViewProps) {
  return (
    <section className="first-child-registration-view" aria-labelledby="first-child-registration-title">
      <div className="first-child-registration-hero">
        <div className="first-child-registration-hero-icon" aria-hidden="true">
          👶
        </div>
        <h1 id="first-child-registration-title">새 아이 등록</h1>
        <p>간단한 정보만 입력하면 맞춤 이유식을 추천해 드려요</p>
      </div>

      <ChildProfileForm
        layout="onboarding"
        submitLabel="프로필 저장"
        cancelLabel="취소"
        submitting={submitting}
        onSave={onSave}
      />
    </section>
  );
}

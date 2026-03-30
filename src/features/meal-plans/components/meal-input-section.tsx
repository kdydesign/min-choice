import { Panel } from "../../../components/panel";
import { TagInput } from "../../../components/tag-input";
import type { ChildProfile, MealDraft, MealType } from "../../../types/domain";
import { MEAL_TYPES } from "../../../types/domain";
import { MEAL_LABELS } from "../../menus/data/menu-catalog";

interface MealInputSectionProps {
  selectedChild: ChildProfile | null;
  draft: MealDraft;
  allergyWarnings: Record<MealType, string[]>;
  onChange: (mealType: MealType, ingredients: string[]) => void;
  onClear: () => void;
  onGenerate: () => void;
}

export function MealInputSection({
  selectedChild,
  draft,
  allergyWarnings,
  onChange,
  onClear,
  onGenerate
}: MealInputSectionProps) {
  return (
    <Panel eyebrow="Step 2" title="끼니별 재료 입력" subtitle="쉼표 또는 Enter로 재료를 추가">
      {!selectedChild ? (
        <div className="empty-state">식단을 만들 아이를 먼저 선택해 주세요.</div>
      ) : (
        <>
          <div className="meal-grid">
            {MEAL_TYPES.map((mealType) => (
              <TagInput
                key={mealType}
                label={`${MEAL_LABELS[mealType]} 재료`}
                value={draft[mealType]}
                placeholder="예: 소고기, 애호박"
                warningTags={allergyWarnings[mealType]}
                helperText={
                  allergyWarnings[mealType].length > 0
                    ? `알레르기 재료 ${allergyWarnings[mealType].join(", ")}는 추천 계산에서 제외돼요.`
                    : "입력 재료는 태그로 구분돼요."
                }
                onChange={(ingredients) => onChange(mealType, ingredients)}
              />
            ))}
          </div>

          <div className="notice-list">
            {MEAL_TYPES.flatMap((mealType) =>
              allergyWarnings[mealType].length > 0 ? (
                <div key={mealType} className="notice danger">
                  {MEAL_LABELS[mealType]} 입력에서 알레르기 재료 {allergyWarnings[mealType].join(", ")}가
                  감지됐어요.
                </div>
              ) : []
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="primary" onClick={onGenerate}>
              식단 생성
            </button>
            <button type="button" className="secondary" onClick={onClear}>
              입력 비우기
            </button>
          </div>
        </>
      )}
    </Panel>
  );
}

import type { MenuDefinition } from "../../../types/domain";

export const MEAL_LABELS = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁"
} as const;

export const DEFAULT_SUBSTITUTES: Record<string, string[]> = {
  쌀: ["밥", "오트밀"],
  밥: ["죽밥", "오트밀"],
  죽밥: ["밥", "오트밀"],
  오트밀: ["쌀", "밥"],
  감자: ["고구마", "단호박"],
  고구마: ["감자", "단호박"],
  단호박: ["고구마", "감자"],
  두부: ["닭고기", "흰살생선"],
  소고기: ["닭고기", "두부"],
  닭고기: ["소고기", "두부"],
  브로콜리: ["시금치", "애호박"],
  애호박: ["브로콜리", "양배추"],
  양배추: ["애호박", "브로콜리"]
};

export const DEFAULT_MEAL_METRICS = {
  breakfast: { calories: 170, protein: 6, cookTimeMinutes: 15 },
  lunch: { calories: 210, protein: 9, cookTimeMinutes: 18 },
  dinner: { calories: 220, protein: 10, cookTimeMinutes: 20 }
} as const;

export const MENU_CATALOG: MenuDefinition[] = [
  {
    id: "beef-zucchini-porridge",
    name: "소고기 애호박 죽",
    mealTypes: ["breakfast", "dinner"],
    primaryIngredients: ["소고기", "애호박"],
    optionalIngredients: [],
    pantryIngredients: ["쌀"],
    hiddenIngredients: ["물"],
    defaultMissingIngredients: ["쌀"],
    substitutes: { 쌀: ["밥", "오트밀"] },
    cookingStyle: "죽",
    mainProtein: "소고기",
    description: "부드럽게 끓여 아침이나 저녁에 부담 없이 먹일 수 있는 메뉴",
    textureNote: "알갱이를 충분히 익혀 한 번 더 으깨 주면 더 편하게 먹을 수 있어요.",
    caution: "소고기는 핏물을 제거하고 잘게 다져 사용해 주세요.",
    calories: 180,
    protein: 8,
    cookTimeMinutes: 15,
    recipeSummary: [
      "소고기와 애호박을 아주 잘게 다집니다.",
      "쌀이나 대체 재료를 넣고 충분히 퍼질 때까지 끓입니다.",
      "질감을 확인하고 필요하면 한 번 더 으깨 마무리합니다."
    ]
  },
  {
    id: "beef-zucchini-soft-rice",
    name: "소고기 애호박 무른밥",
    mealTypes: ["breakfast", "lunch", "dinner"],
    primaryIngredients: ["소고기", "애호박"],
    optionalIngredients: [],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "무른밥",
    mainProtein: "소고기",
    description: "소고기와 애호박을 촉촉하게 익혀 24개월 이상 아이도 먹기 좋은 한 그릇 메뉴",
    textureNote: "알갱이가 너무 크지 않도록 밥과 재료를 충분히 부드럽게 섞어 주세요.",
    caution: "소고기는 잘게 다져 충분히 익히고, 애호박은 한입 크기로 부드럽게 익혀 주세요.",
    calories: 225,
    protein: 12,
    cookTimeMinutes: 18,
    recipeSummary: [
      "소고기와 애호박을 먹기 좋게 잘게 준비합니다.",
      "밥과 함께 육수를 더해 촉촉한 무른밥 질감이 되도록 익힙니다.",
      "아이가 씹기 편한 한입 크기로 정리해 마무리합니다."
    ]
  },
  {
    id: "cabbage-tofu-fried-rice",
    name: "양배추 두부 볶음밥",
    mealTypes: ["lunch"],
    primaryIngredients: ["양배추", "두부", "당근"],
    optionalIngredients: [],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["참기름"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "볶음밥",
    mainProtein: "두부",
    description: "양배추와 두부를 부드럽게 볶아 점심 한 그릇으로 좋은 메뉴",
    textureNote: "볶기 전에 물을 조금 넣으면 훨씬 촉촉하게 만들 수 있어요.",
    caution: "두부는 수분을 살짝 빼고 으깨서 넣으면 식감이 더 부드러워져요.",
    calories: 210,
    protein: 9,
    cookTimeMinutes: 18,
    recipeSummary: [
      "양배추와 당근을 잘게 다집니다.",
      "두부를 으깨고 밥과 함께 약한 불에서 촉촉하게 볶습니다.",
      "아이가 먹기 좋도록 마지막에 한 번 더 잘게 섞어 마무리합니다."
    ]
  },
  {
    id: "beef-potato-broccoli-rice",
    name: "소고기 감자 브로콜리 무른밥",
    mealTypes: ["lunch", "dinner"],
    primaryIngredients: ["소고기", "감자", "브로콜리"],
    optionalIngredients: [],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "무른밥",
    mainProtein: "소고기",
    description: "소고기와 채소를 함께 익혀 든든하게 먹일 수 있는 저녁 메뉴",
    textureNote: "브로콜리는 꽃 부분을 잘게 다져야 목 넘김이 부드러워져요.",
    caution: "감자는 푹 익혀 포슬하게 으깨 주세요.",
    calories: 240,
    protein: 11,
    cookTimeMinutes: 20,
    recipeSummary: [
      "소고기, 감자, 브로콜리를 먹기 좋게 작게 준비합니다.",
      "밥과 함께 냄비에 넣고 물이나 육수를 더해 무르게 끓입니다.",
      "전체 질감이 고르게 퍼지면 한 번 섞어 완성합니다."
    ]
  },
  {
    id: "chicken-sweetpotato-porridge",
    name: "닭고기 고구마 죽",
    mealTypes: ["breakfast", "dinner"],
    primaryIngredients: ["닭고기", "고구마"],
    optionalIngredients: [],
    pantryIngredients: ["쌀"],
    hiddenIngredients: ["물"],
    defaultMissingIngredients: ["쌀"],
    substitutes: { 쌀: ["밥", "오트밀"] },
    cookingStyle: "죽",
    mainProtein: "닭고기",
    description: "달큰한 고구마와 닭고기로 아침에 편하게 시작할 수 있는 죽 메뉴",
    textureNote: "고구마는 섬유질이 남지 않도록 곱게 으깨 주세요.",
    caution: "닭고기는 지방이 적은 부위를 사용하고 완전히 익혀 주세요.",
    calories: 190,
    protein: 9,
    cookTimeMinutes: 16,
    recipeSummary: [
      "닭고기를 삶아 잘게 찢고 고구마는 푹 익혀 으깹니다.",
      "쌀 또는 대체 재료와 함께 냄비에 넣고 부드럽게 끓입니다.",
      "한 번 더 저어 걸쭉한 질감을 맞춘 뒤 식혀 제공합니다."
    ]
  },
  {
    id: "chicken-sweetpotato-soft-rice",
    name: "닭고기 고구마 무른밥",
    mealTypes: ["breakfast", "lunch", "dinner"],
    primaryIngredients: ["닭고기", "고구마"],
    optionalIngredients: [],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "무른밥",
    mainProtein: "닭고기",
    description: "닭고기와 고구마를 촉촉하게 익혀 아침에도 부담 없이 먹을 수 있는 메뉴",
    textureNote: "고구마가 뭉치지 않도록 밥과 함께 고르게 섞어 주세요.",
    caution: "닭고기는 잘게 찢어 충분히 익히고, 고구마는 목 넘김이 편하도록 부드럽게 익혀 주세요.",
    calories: 230,
    protein: 11,
    cookTimeMinutes: 17,
    recipeSummary: [
      "닭고기를 익혀 잘게 찢고 고구마는 부드럽게 익혀 준비합니다.",
      "밥과 함께 넣고 수분을 더해 촉촉한 무른밥 질감으로 익힙니다.",
      "전체 재료를 고르게 섞어 한입 크기로 정리합니다."
    ]
  },
  {
    id: "zucchini-potato-porridge",
    name: "애호박 감자 죽",
    mealTypes: ["breakfast", "lunch"],
    primaryIngredients: ["애호박", "감자"],
    optionalIngredients: [],
    pantryIngredients: ["쌀"],
    hiddenIngredients: ["물"],
    defaultMissingIngredients: ["쌀"],
    substitutes: { 쌀: ["밥", "오트밀"] },
    cookingStyle: "죽",
    mainProtein: "채소",
    description: "채소 위주로 부드럽게 만들 수 있어 가볍게 먹이기 좋은 메뉴",
    textureNote: "감자를 충분히 익혀 전분감이 자연스럽게 풀리게 해 주세요.",
    caution: "채소 껍질은 최대한 얇게 제거해 주세요.",
    calories: 160,
    protein: 3,
    cookTimeMinutes: 14,
    recipeSummary: [
      "애호박과 감자를 잘게 썰어 푹 익힙니다.",
      "쌀이나 대체 재료를 넣고 충분히 저어가며 끓입니다.",
      "질감이 남으면 으깨서 부드럽게 마무리합니다."
    ]
  },
  {
    id: "zucchini-potato-soft-rice",
    name: "애호박 감자 무른밥",
    mealTypes: ["breakfast", "lunch", "dinner"],
    primaryIngredients: ["애호박", "감자"],
    optionalIngredients: [],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "무른밥",
    mainProtein: "채소",
    description: "애호박과 감자를 촉촉하게 익혀 큰 아이도 편하게 먹기 좋은 채소 한 그릇",
    textureNote: "감자가 너무 부서지지 않게 익히고, 애호박은 한입 크기로 부드럽게 남겨 주세요.",
    caution: "채소 껍질은 제거하고 너무 뜨겁지 않게 식혀 주세요.",
    calories: 185,
    protein: 4,
    cookTimeMinutes: 16,
    recipeSummary: [
      "애호박과 감자를 먹기 좋은 크기로 준비합니다.",
      "밥과 함께 육수를 더해 촉촉하고 부드러운 질감으로 익힙니다.",
      "아이가 씹기 편한 한입 크기로 정리해 마무리합니다."
    ]
  },
  {
    id: "broccoli-tofu-rice",
    name: "브로콜리 두부 덮밥",
    mealTypes: ["lunch", "dinner"],
    primaryIngredients: ["브로콜리", "두부"],
    optionalIngredients: ["당근"],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["참기름"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "덮밥",
    mainProtein: "두부",
    description: "두부와 브로콜리를 촉촉하게 올려 균형 있게 먹이기 좋은 메뉴",
    textureNote: "브로콜리는 너무 크게 남지 않도록 잘게 썰어 주세요.",
    caution: "두부는 한 번 데쳐 사용하면 더 부드럽게 먹일 수 있어요.",
    calories: 200,
    protein: 10,
    cookTimeMinutes: 15,
    recipeSummary: [
      "브로콜리와 당근을 충분히 익혀 잘게 자릅니다.",
      "두부를 으깨고 채소와 함께 살짝 끓여 소스를 만듭니다.",
      "밥 위에 올려 촉촉하게 섞어 제공합니다."
    ]
  },
  {
    id: "pumpkin-chicken-stew",
    name: "닭고기 단호박 스튜",
    mealTypes: ["lunch", "dinner"],
    primaryIngredients: ["닭고기", "단호박"],
    optionalIngredients: ["감자", "양배추"],
    pantryIngredients: [],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["감자"],
    substitutes: { 감자: ["고구마", "단호박"] },
    cookingStyle: "스튜",
    mainProtein: "닭고기",
    description: "부드러운 단호박으로 농도를 내 저녁에 든든하게 먹일 수 있는 메뉴",
    textureNote: "국물은 너무 묽지 않게 졸여 숟가락으로 먹기 좋게 해 주세요.",
    caution: "닭고기는 잘게 찢고 단호박 껍질은 제거해 주세요.",
    calories: 220,
    protein: 11,
    cookTimeMinutes: 22,
    recipeSummary: [
      "닭고기와 단호박, 감자를 푹 익힙니다.",
      "재료를 고르게 섞어가며 걸쭉하게 졸입니다.",
      "한입 크기로 정리한 뒤 미지근하게 식혀 제공합니다."
    ]
  },
  {
    id: "spinach-potato-egg-scramble",
    name: "시금치 감자 달걀 스크램블",
    mealTypes: ["breakfast", "lunch"],
    primaryIngredients: ["시금치", "감자", "달걀"],
    optionalIngredients: [],
    pantryIngredients: [],
    hiddenIngredients: ["올리브유"],
    defaultMissingIngredients: [],
    substitutes: {},
    cookingStyle: "스크램블",
    mainProtein: "달걀",
    description: "포슬한 감자와 달걀을 곁들여 아침에 빠르게 준비하기 좋은 메뉴",
    textureNote: "달걀은 완전히 익힌 뒤 부드럽게 으깨 주세요.",
    caution: "달걀은 완전히 익힌 뒤 잘게 풀어 목 넘김을 확인해 주세요.",
    calories: 185,
    protein: 8,
    cookTimeMinutes: 12,
    recipeSummary: [
      "감자와 시금치를 충분히 익혀 잘게 자릅니다.",
      "풀어둔 달걀과 함께 약한 불에서 천천히 익힙니다.",
      "전체 재료를 부드럽게 섞어 수분감을 맞춥니다."
    ]
  },
  {
    id: "beef-cabbage-rice",
    name: "소고기 양배추 덮밥",
    mealTypes: ["lunch", "dinner"],
    primaryIngredients: ["소고기", "양배추"],
    optionalIngredients: ["당근"],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["죽밥", "오트밀"] },
    cookingStyle: "덮밥",
    mainProtein: "소고기",
    description: "소고기와 양배추를 함께 조리해 점심이나 저녁에 활용하기 좋은 메뉴",
    textureNote: "양배추는 숨이 푹 죽도록 익혀야 먹기 편해요.",
    caution: "소고기는 질기지 않게 잘게 다져 넣어 주세요.",
    calories: 230,
    protein: 12,
    cookTimeMinutes: 17,
    recipeSummary: [
      "소고기와 양배추를 작게 준비합니다.",
      "당근이 있으면 함께 넣고 부드럽게 익힙니다.",
      "밥 위에 올리거나 함께 끓여 촉촉하게 마무리합니다."
    ]
  },
  {
    id: "tofu-zucchini-risotto",
    name: "두부 애호박 리조또",
    mealTypes: ["breakfast", "lunch", "dinner"],
    primaryIngredients: ["두부", "애호박"],
    optionalIngredients: [],
    pantryIngredients: ["밥", "쌀"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["쌀", "오트밀"] },
    cookingStyle: "리조또",
    mainProtein: "두부",
    description: "두부와 애호박을 섞어 부드러운 한 그릇으로 먹이기 좋은 메뉴",
    textureNote: "물을 조금 더 넣어 묽게 만들면 씹기 부담이 줄어요.",
    caution: "두부가 덩어리지지 않도록 충분히 풀어 끓여 주세요.",
    calories: 195,
    protein: 9,
    cookTimeMinutes: 16,
    recipeSummary: [
      "두부와 애호박을 잘게 썰거나 으깹니다.",
      "밥이나 쌀과 함께 묽은 질감이 될 때까지 끓입니다.",
      "전체 재료가 부드럽게 섞이면 식혀 제공합니다."
    ]
  },
  {
    id: "sweetpotato-broccoli-mash",
    name: "고구마 브로콜리 매시",
    mealTypes: ["breakfast", "lunch"],
    primaryIngredients: ["고구마", "브로콜리"],
    optionalIngredients: [],
    pantryIngredients: [],
    hiddenIngredients: ["우유"],
    defaultMissingIngredients: [],
    substitutes: {},
    cookingStyle: "매시",
    mainProtein: "채소",
    description: "달큰한 고구마로 맛을 내 가볍게 곁들이기 좋은 채소 메뉴",
    textureNote: "브로콜리는 줄기보다 꽃 부분 위주로 넣으면 더 부드러워요.",
    caution: "수분이 부족하면 따뜻한 물로 농도를 조절해 주세요.",
    calories: 150,
    protein: 3,
    cookTimeMinutes: 10,
    recipeSummary: [
      "고구마를 푹 찌고 브로콜리를 익혀 잘게 다집니다.",
      "둘을 함께 으깨며 부드러운 질감을 만듭니다.",
      "필요하면 물을 넣어 묽기를 조절합니다."
    ]
  },
  {
    id: "chicken-carrot-risotto",
    name: "닭고기 당근 리조또",
    mealTypes: ["lunch", "dinner"],
    primaryIngredients: ["닭고기", "당근"],
    optionalIngredients: ["양배추"],
    pantryIngredients: ["밥"],
    hiddenIngredients: ["육수"],
    defaultMissingIngredients: ["밥"],
    substitutes: { 밥: ["쌀", "오트밀"] },
    cookingStyle: "리조또",
    mainProtein: "닭고기",
    description: "당근과 닭고기로 색감과 단백질을 함께 챙길 수 있는 메뉴",
    textureNote: "당근은 충분히 익혀 단맛이 올라오게 해 주세요.",
    caution: "닭고기는 잘게 찢어 목 넘김을 확인해 주세요.",
    calories: 215,
    protein: 11,
    cookTimeMinutes: 18,
    recipeSummary: [
      "닭고기와 당근을 잘게 준비합니다.",
      "밥이나 쌀과 함께 넣고 묽게 끓입니다.",
      "촉촉한 리조또 질감이 되면 식혀 제공합니다."
    ]
  }
];

export function getMealMetricsByType(mealType: keyof typeof DEFAULT_MEAL_METRICS) {
  return DEFAULT_MEAL_METRICS[mealType];
}

export function getMenuDefinitionByKey(input: { id?: string | null; name?: string | null }) {
  const normalizedId = input.id?.trim();
  const normalizedName = input.name?.trim();

  return (
    MENU_CATALOG.find((menu) => {
      if (normalizedId && menu.id === normalizedId) {
        return true;
      }

      if (normalizedName && menu.name === normalizedName) {
        return true;
      }

      return false;
    }) ?? null
  );
}

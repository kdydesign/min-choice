import type { NormalizedProduct } from "./normalize-product.ts";

const ALLERGY_SYNONYMS: Record<string, string[]> = {
  달걀: ["달걀", "계란", "난황", "난백"],
  계란: ["계란", "달걀", "난황", "난백"],
  우유: ["우유", "치즈", "분유", "유청", "버터"],
  대두: ["대두", "두부", "콩", "간장"],
  두부: ["두부", "대두", "콩"],
  밀: ["밀", "밀가루", "소면", "국수"],
  땅콩: ["땅콩"],
  견과: ["견과", "아몬드", "호두", "캐슈넛"],
  새우: ["새우"],
  게: ["게", "꽃게"],
  생선: ["생선", "대구", "명태", "연어", "참치"]
};

function normalizeKeyword(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function getAllergyKeywordMatches(title: string, allergies: string[]) {
  const normalizedTitle = normalizeKeyword(title);
  const keywords = allergies.flatMap((allergy) => {
    const normalized = allergy.trim();
    if (!normalized) {
      return [];
    }

    return ALLERGY_SYNONYMS[normalized] ?? [normalized];
  });

  return [...new Set(keywords.filter((keyword) => normalizedTitle.includes(normalizeKeyword(keyword))))];
}

export function applyAllergyKeywordFilter(input: {
  product: NormalizedProduct;
  allergies: string[];
  excludeMatches: boolean;
}) {
  const matches = getAllergyKeywordMatches(input.product.title, input.allergies);
  const warningBadges = matches.length > 0 ? [`알레르기 키워드: ${matches.join(", ")}`] : [];

  return {
    ...input.product,
    allergyKeywordMatches: matches,
    warningBadges,
    isHiddenByAllergyFilter: input.excludeMatches && matches.length > 0
  };
}

import type { NormalizedProduct } from "./normalize-product.ts";

const INCLUDE_KEYWORDS = [
  "이유식",
  "유아식",
  "아기",
  "아이",
  "베이비",
  "키즈",
  "아기반찬",
  "아이반찬",
  "완료기",
  "무른밥",
  "죽",
  "퓨레",
  "간식"
];

const EXCLUDE_KEYWORDS = [
  "강아지",
  "고양이",
  "반려동물",
  "성인용",
  "다이어트",
  "헬스",
  "영양제",
  "건강기능식품",
  "이유식 용기",
  "이유식용기",
  "이유식 스푼",
  "이유식스푼",
  "이유식마스터기",
  "이유식 마스터기",
  "제조기",
  "죽제조기",
  "죽 제조기",
  "두유제조기",
  "두유 제조기",
  "두유기",
  "메이커",
  "믹서기",
  "블렌더",
  "착즙기",
  "기계",
  "도구",
  "커터",
  "칼",
  "포크",
  "스트로우",
  "지퍼백",
  "지퍼 백",
  "스티커",
  "띠지",
  "쿠폰",
  "아이스팩",
  "턱받이",
  "보관용기",
  "조리기",
  "식판",
  "빨대컵"
];

const EXCLUDE_CATEGORY_KEYWORDS = [
  "주방가전",
  "주방용품",
  "주방기구",
  "조리기구",
  "이유용품",
  "유아용품",
  "수유용품",
  "문구/사무",
  "생활/건강",
  "가전",
  "디지털"
];

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function isFoodProduct(product: NormalizedProduct) {
  const categoryHaystack = [
    product.category1,
    product.category2,
    product.category3,
    product.category4
  ].join(" ");
  const haystack = [
    product.normalizedTitle,
    categoryHaystack
  ].join(" ");

  if (includesAny(haystack, EXCLUDE_KEYWORDS)) {
    return false;
  }

  if (includesAny(categoryHaystack, EXCLUDE_CATEGORY_KEYWORDS)) {
    return false;
  }

  if (includesAny(haystack, INCLUDE_KEYWORDS)) {
    return true;
  }

  return product.category1.includes("식품") || product.category2.includes("식품");
}

export function scoreProductRelevance(product: NormalizedProduct) {
  const haystack = [
    product.normalizedTitle,
    product.category1,
    product.category2,
    product.category3,
    product.category4
  ].join(" ");
  let score = 0;

  for (const keyword of INCLUDE_KEYWORDS) {
    if (haystack.includes(keyword)) {
      score += 10;
    }
  }

  if (product.imageUrl) {
    score += 2;
  }

  if (!product.isHiddenByAllergyFilter && product.allergyKeywordMatches.length === 0) {
    score += 2;
  }

  return score;
}

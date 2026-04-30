import type { NormalizedProduct } from "./normalize-product.ts";

const INCLUDE_KEYWORDS = [
  "이유식",
  "유아식",
  "아기반찬",
  "아이반찬",
  "어린이반찬",
  "반찬",
  "완료기",
  "후기",
  "중기",
  "초기",
  "무른밥",
  "진밥",
  "죽",
  "덮밥",
  "국",
  "탕",
  "볶음밥",
  "리조또",
  "퓨레",
  "큐브"
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
  "그릇",
  "도자기",
  "식기",
  "접시",
  "스푼",
  "젓가락",
  "컵",
  "용기",
  "도시락통",
  "앞치마",
  "장난감",
  "교구",
  "책",
  "파우치",
  "가방",
  "보냉백",
  "냄비",
  "도마",
  "조리도구",
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
  "식기",
  "식기/컵",
  "조리기구",
  "이유용품",
  "유아용품",
  "수유용품",
  "문구/사무",
  "완구",
  "도서",
  "생활용품",
  "생활/건강",
  "가전",
  "디지털"
];

const HIGH_RELEVANCE_KEYWORDS = ["이유식", "유아식", "아기반찬", "아이반찬", "어린이반찬"];
const FOOD_FORM_KEYWORDS = ["반찬", "죽", "무른밥", "진밥", "덮밥", "국", "탕", "볶음밥", "리조또", "퓨레", "큐브"];
const STAGE_KEYWORDS = ["완료기", "후기", "중기", "초기"];
const TRUSTED_BRANDS = ["베베쿡", "짱죽", "루솔", "엘빈즈", "팜투베이비"];

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function normalizeShoppingTitle(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildCategoryText(product: NormalizedProduct) {
  return normalizeShoppingTitle([
    product.category1,
    product.category2,
    product.category3,
    product.category4
  ].join(" "));
}

function buildNormalizedProductText(product: NormalizedProduct) {
  return normalizeShoppingTitle([
    product.title,
    product.normalizedTitle,
    product.mallName,
    product.category1,
    product.category2,
    product.category3,
    product.category4
  ].join(" "));
}

export function isBabyFoodProduct(product: NormalizedProduct) {
  const categoryText = buildCategoryText(product);
  const normalizedText = buildNormalizedProductText(product);

  if (includesAny(normalizedText, EXCLUDE_KEYWORDS)) {
    return false;
  }

  if (includesAny(categoryText, EXCLUDE_CATEGORY_KEYWORDS)) {
    return false;
  }

  if (includesAny(normalizedText, INCLUDE_KEYWORDS)) {
    return true;
  }

  return product.category1.includes("식품") || product.category2.includes("식품");
}

export function isFoodProduct(product: NormalizedProduct) {
  return isBabyFoodProduct(product);
}

export function getBabyFoodRelevanceScore(product: NormalizedProduct) {
  const normalizedText = buildNormalizedProductText(product);
  let score = 0;

  if (includesAny(normalizedText, EXCLUDE_KEYWORDS)) {
    score -= 100;
  }

  for (const keyword of HIGH_RELEVANCE_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      score += 40;
    }
  }

  for (const keyword of FOOD_FORM_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      score += 15;
    }
  }

  for (const keyword of STAGE_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      score += 8;
    }
  }

  for (const keyword of TRUSTED_BRANDS) {
    if (normalizedText.includes(keyword)) {
      score += 12;
    }
  }

  if (product.imageUrl) {
    score += 2;
  }

  if (!product.isHiddenByAllergyFilter && product.allergyKeywordMatches.length === 0) {
    score += 2;
  }

  if (product.price <= 0) {
    score -= 30;
  }

  return score;
}

export function scoreProductRelevance(product: NormalizedProduct) {
  return getBabyFoodRelevanceScore(product);
}

import type { MealType } from "../../types/domain";

export const PRODUCT_SEARCH_CATEGORIES = [
  "all",
  "baby_food",
  "toddler_food",
  "baby_side_dish",
  "snack"
] as const;

export type ProductSearchCategory = (typeof PRODUCT_SEARCH_CATEGORIES)[number];

export const PRODUCT_SEARCH_SOURCES = ["manual", "child_suggestion", "meal_result"] as const;

export type ProductSearchSource = (typeof PRODUCT_SEARCH_SOURCES)[number];

export interface ProductSearchFilters {
  onlyNaverPay: boolean;
  excludeUsed: boolean;
  excludeRental: boolean;
  excludeOverseas: boolean;
  excludeAllergyKeywordMatches: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface ChildSearchContext {
  childId: string;
  childName: string;
  ageMonths: number;
  birthDate: string;
  allergies: string[];
}

export interface MealProductSearchContext {
  mealPlanId?: string | null;
  mealPlanItemId?: string | null;
  mealType: MealType;
  originMenuName: string;
}

export interface ProductSearchRequest {
  query: string;
  category: ProductSearchCategory;
  childId?: string | null;
  useChildContext: boolean;
  source: ProductSearchSource;
  mealContext?: MealProductSearchContext | null;
  filters: ProductSearchFilters;
  limit: number;
}

export type ProductSearchNotice = string;

export interface ProductSearchItem {
  id: string;
  provider: "naver";
  providerProductId: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  mallName: string;
  price: number;
  displayPrice: string;
  priceRank: number;
  allergyKeywordMatches: string[];
  warningBadges: string[];
  fetchedAt: string;
}

export interface ProductSearchResponse {
  query: string;
  normalizedQuery: string;
  provider: "naver";
  fetchedAt: string;
  cacheTtlSeconds: number;
  notices: ProductSearchNotice[];
  items: ProductSearchItem[];
}

export interface ProductClickLogInput {
  productResultId?: string | null;
  childId?: string | null;
  source: ProductSearchSource;
  mealPlanId?: string | null;
  mealPlanItemId?: string | null;
  provider: "naver";
  outboundUrl: string;
}

export const DEFAULT_PRODUCT_SEARCH_FILTERS: ProductSearchFilters = {
  onlyNaverPay: false,
  excludeUsed: true,
  excludeRental: true,
  excludeOverseas: true,
  excludeAllergyKeywordMatches: true,
  minPrice: null,
  maxPrice: null
};

export const PRODUCT_SEARCH_NOTICES: ProductSearchNotice[] = [
  "가격은 검색 시점 기준이며 실제 구매 가격, 배송비, 옵션가는 쇼핑몰에서 달라질 수 있어요.",
  "제품 성분, 알레르기, 월령 적합성은 구매 전 상세 페이지에서 꼭 확인해 주세요."
];

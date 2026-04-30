import { getBabyFoodRelevanceScore } from "./filter-product.ts";
import type { NormalizedProduct } from "./normalize-product.ts";

export type ProductSearchSortMode = "recommended" | "price_low";

export const MIN_BABY_FOOD_RELEVANCE_SCORE = 10;

function compareProductPrice(left: NormalizedProduct, right: NormalizedProduct) {
  const leftPrice = left.price > 0 ? left.price : Number.POSITIVE_INFINITY;
  const rightPrice = right.price > 0 ? right.price : Number.POSITIVE_INFINITY;
  return leftPrice - rightPrice;
}

function compareImagePresence(left: NormalizedProduct, right: NormalizedProduct) {
  return Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl));
}

function compareAllergyWarnings(left: NormalizedProduct, right: NormalizedProduct) {
  return left.allergyKeywordMatches.length - right.allergyKeywordMatches.length;
}

function compareTitle(left: NormalizedProduct, right: NormalizedProduct) {
  return left.title.localeCompare(right.title, "ko");
}

function compareRecommended(left: NormalizedProduct, right: NormalizedProduct) {
  if (right.relevanceScore !== left.relevanceScore) {
    return right.relevanceScore - left.relevanceScore;
  }

  const priceComparison = compareProductPrice(left, right);
  if (priceComparison !== 0) {
    return priceComparison;
  }

  const imageComparison = compareImagePresence(left, right);
  if (imageComparison !== 0) {
    return imageComparison;
  }

  const allergyComparison = compareAllergyWarnings(left, right);
  if (allergyComparison !== 0) {
    return allergyComparison;
  }

  return compareTitle(left, right);
}

function comparePriceLow(left: NormalizedProduct, right: NormalizedProduct) {
  const priceComparison = compareProductPrice(left, right);
  if (priceComparison !== 0) {
    return priceComparison;
  }

  return compareRecommended(left, right);
}

function getComparator(sortMode: ProductSearchSortMode) {
  if (sortMode === "price_low") {
    return comparePriceLow;
  }

  return compareRecommended;
}

export function sortBabyFoodShoppingResults(
  products: NormalizedProduct[],
  sortMode: ProductSearchSortMode = "recommended"
) {
  return [...products]
    .map((product) => ({
      ...product,
      relevanceScore: getBabyFoodRelevanceScore(product)
    }))
    .filter((product) => product.relevanceScore >= MIN_BABY_FOOD_RELEVANCE_SCORE)
    .sort(getComparator(sortMode))
    .map((product, index) => ({
      ...product,
      priceRank: index + 1
    }));
}

export function rankProducts(
  products: NormalizedProduct[],
  sortMode: ProductSearchSortMode = "recommended"
) {
  return sortBabyFoodShoppingResults(products, sortMode);
}

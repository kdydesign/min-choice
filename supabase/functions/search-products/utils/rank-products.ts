import { getBabyFoodRelevanceScore } from "./filter-product.ts";
import type { NormalizedProduct } from "./normalize-product.ts";

function compareProductPrice(left: NormalizedProduct, right: NormalizedProduct) {
  const leftPrice = left.price > 0 ? left.price : Number.POSITIVE_INFINITY;
  const rightPrice = right.price > 0 ? right.price : Number.POSITIVE_INFINITY;
  return leftPrice - rightPrice;
}

export function sortBabyFoodShoppingResults(products: NormalizedProduct[]) {
  return [...products]
    .map((product) => ({
      ...product,
      relevanceScore: getBabyFoodRelevanceScore(product)
    }))
    .sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      const priceComparison = compareProductPrice(left, right);
      if (priceComparison !== 0) {
        return priceComparison;
      }

      if (Boolean(right.imageUrl) !== Boolean(left.imageUrl)) {
        return Number(Boolean(right.imageUrl)) - Number(Boolean(left.imageUrl));
      }

      if (left.allergyKeywordMatches.length !== right.allergyKeywordMatches.length) {
        return left.allergyKeywordMatches.length - right.allergyKeywordMatches.length;
      }

      return left.title.localeCompare(right.title, "ko");
    })
    .map((product, index) => ({
      ...product,
      priceRank: index + 1
    }));
}

export function rankProducts(products: NormalizedProduct[]) {
  return sortBabyFoodShoppingResults(products);
}

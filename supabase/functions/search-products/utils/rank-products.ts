import { scoreProductRelevance } from "./filter-product.ts";
import type { NormalizedProduct } from "./normalize-product.ts";

export function rankProducts(products: NormalizedProduct[]) {
  return [...products]
    .map((product) => ({
      ...product,
      relevanceScore: scoreProductRelevance(product)
    }))
    .sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      if (left.price !== right.price) {
        return left.price - right.price;
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

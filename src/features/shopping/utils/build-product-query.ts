import type { ProductSearchCategory } from "../types";

const PRESERVE_QUERY_KEYWORDS = ["이유식", "유아식", "아기", "아이반찬", "아기반찬", "퓨레"];

const CATEGORY_SUFFIX: Record<ProductSearchCategory, string> = {
  all: "이유식",
  baby_food: "이유식",
  toddler_food: "유아식",
  baby_side_dish: "아기반찬",
  snack: "아기 간식"
};

function stripAutoAgeMonth(value: string) {
  return value.replace(/(^|\s)\d{1,2}\s*개월(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
}

export function buildProductSearchQuery(input: {
  query: string;
  category: ProductSearchCategory;
}) {
  const rawQuery = stripAutoAgeMonth(input.query);

  if (!rawQuery) {
    return "";
  }

  if (PRESERVE_QUERY_KEYWORDS.some((keyword) => rawQuery.includes(keyword))) {
    return rawQuery;
  }

  return `${rawQuery} ${CATEGORY_SUFFIX[input.category]}`.trim();
}

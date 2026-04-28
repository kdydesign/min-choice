import { describe, expect, it } from "vitest";
import {
  buildCacheKey,
  PRODUCT_SEARCH_FILTER_POLICY_VERSION
} from "../../../../supabase/functions/search-products/utils/cache-key.ts";
import { isFoodProduct } from "../../../../supabase/functions/search-products/utils/filter-product.ts";
import type { NormalizedProduct } from "../../../../supabase/functions/search-products/utils/normalize-product.ts";

function product(
  title: string,
  categories: Partial<
    Pick<NormalizedProduct, "category1" | "category2" | "category3" | "category4">
  > = {}
): NormalizedProduct {
  return {
    provider: "naver",
    providerProductId: title,
    title,
    normalizedTitle: title.toLowerCase(),
    imageUrl: "https://example.com/image.jpg",
    productUrl: "https://example.com/product",
    mallName: "테스트몰",
    price: 1000,
    highPrice: null,
    brand: "",
    maker: "",
    category1: categories.category1 ?? "식품",
    category2: categories.category2 ?? "가공식품",
    category3: categories.category3 ?? "",
    category4: categories.category4 ?? "",
    productType: "",
    relevanceScore: 0,
    priceRank: 0,
    allergyKeywordMatches: [],
    warningBadges: [],
    isHiddenByAllergyFilter: false,
    fetchedAt: "2026-04-28T12:00:00+09:00",
    rawJson: {}
  };
}

describe("product search filter policy", () => {
  it("removes cooking devices, tools, and packing supplies even when baby food keywords are present", () => {
    const excludedTitles = [
      "이유식 죽제조기 콩물 건강식 가정용 자동 전기 두유 기계",
      "남양 키친플라워 대용량 두유제조기 이유식 죽 스프 제조기",
      "맘코니 올스텐 두유기 이유식 메이커",
      "키친아트 이유식 믹서기",
      "이유식 용기 스티커띠지 제작",
      "이유식 아이스팩 추가",
      "어브로드마켓 바나나 커터 유아식도구"
    ];

    for (const title of excludedTitles) {
      expect(isFoodProduct(product(title)), title).toBe(false);
    }
  });

  it("removes non-food product categories before inclusion keywords are considered", () => {
    expect(
      isFoodProduct(
        product("이유식 죽 조리용 자동 메이커", {
          category1: "생활/건강",
          category2: "주방가전",
          category3: "조리기구"
        })
      )
    ).toBe(false);
  });

  it("keeps edible prepared baby food products", () => {
    const includedTitles = [
      "남양 아이꼬야 맘스쿠킹 이유식 소고기와 두부 진밥",
      "매일유업 맘마밀 안심이유식 가리비와두부",
      "고구마 바나나 퓨레",
      "브로콜리 두부 아기반찬"
    ];

    for (const title of includedTitles) {
      expect(isFoodProduct(product(title)), title).toBe(true);
    }
  });
});

describe("product search cache key", () => {
  it("includes the filter policy version to avoid stale cached results", () => {
    const key = buildCacheKey({
      provider: "naver",
      normalizedQuery: "두부 쌀 이유식",
      category: "baby_food",
      filters: {
        excludeAllergyKeywordMatches: true,
        excludeOverseas: true,
        excludeRental: true,
        excludeUsed: true,
        maxPrice: null,
        minPrice: null,
        onlyNaverPay: false
      },
      allergyKeywords: [],
      limit: 20
    });

    expect(key).toContain(PRODUCT_SEARCH_FILTER_POLICY_VERSION);
  });
});

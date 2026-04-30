import { describe, expect, it } from "vitest";
import {
  buildCacheKey,
  PRODUCT_SEARCH_FILTER_POLICY_VERSION
} from "../../../../supabase/functions/search-products/utils/cache-key.ts";
import { applyAllergyKeywordFilter } from "../../../../supabase/functions/search-products/utils/allergy-keyword-filter.ts";
import {
  getBabyFoodRelevanceScore,
  isFoodProduct,
  normalizeShoppingTitle
} from "../../../../supabase/functions/search-products/utils/filter-product.ts";
import {
  getNaverShoppingDisplayLimit,
  NaverShoppingProvider,
  NAVER_SHOPPING_SEARCH_SORT
} from "../../../../supabase/functions/search-products/providers/naver-shopping.ts";
import { sortBabyFoodShoppingResults } from "../../../../supabase/functions/search-products/utils/rank-products.ts";
import type { NormalizedProduct } from "../../../../supabase/functions/search-products/utils/normalize-product.ts";

type ProductOverrides = Partial<
  Pick<NormalizedProduct, "mallName" | "brand" | "maker" | "price" | "imageUrl">
>;

function product(
  title: string,
  categories: Partial<
    Pick<NormalizedProduct, "category1" | "category2" | "category3" | "category4">
  > = {},
  overrides: ProductOverrides = {}
): NormalizedProduct {
  return {
    provider: "naver",
    providerProductId: title,
    title,
    normalizedTitle: title.toLowerCase(),
    imageUrl: overrides.imageUrl ?? "https://example.com/image.jpg",
    productUrl: "https://example.com/product",
    mallName: overrides.mallName ?? "테스트몰",
    price: overrides.price ?? 1000,
    highPrice: null,
    brand: overrides.brand ?? "",
    maker: overrides.maker ?? "",
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
  it("normalizes shopping text before filtering and scoring", () => {
    expect(normalizeShoppingTitle("<b>베베쿡</b>&amp; 이유식")).toBe("베베쿡 & 이유식");
  });

  it("removes cooking devices, tools, and packing supplies even when baby food keywords are present", () => {
    const excludedTitles = [
      "이유식 죽제조기 콩물 건강식 가정용 자동 전기 두유 기계",
      "남양 키친플라워 대용량 두유제조기 이유식 죽 스프 제조기",
      "맘코니 올스텐 두유기 이유식 메이커",
      "키친아트 이유식 믹서기",
      "이유식 용기 스티커띠지 제작",
      "이유식 아이스팩 추가",
      "어브로드마켓 바나나 커터 유아식도구",
      "아기 도자기 그릇",
      "이유식 용기",
      "유아 식판",
      "아기 스푼 포크 세트",
      "이유식 책",
      "아기반찬 보관용기"
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
      "브로콜리 두부 아기반찬",
      "베베쿡 아기반찬",
      "짱죽 완료기 이유식",
      "유아식 반찬 세트",
      "소고기 애호박 무른밥"
    ];

    for (const title of includedTitles) {
      expect(isFoodProduct(product(title)), title).toBe(true);
    }
  });

  it("scores domain-specific baby food products above generic food products", () => {
    const trustedBabyFood = product("베베쿡 한우 아기반찬 완료기 세트", {}, { price: 7000 });
    const genericFood = product("소고기 국산 다짐육", {}, { price: 2000 });

    expect(getBabyFoodRelevanceScore(trustedBabyFood)).toBeGreaterThan(
      getBabyFoodRelevanceScore(genericFood)
    );
  });

  it("sorts by relevance first and then by lower price", () => {
    const sorted = sortBabyFoodShoppingResults([
      product("베베쿡 아기반찬", {}, { price: 6500 }),
      product("소고기 다짐육", {}, { price: 1000 }),
      product("베베쿡 아기반찬", {}, { price: 3500 })
    ]);

    expect(sorted[0].title).toBe("베베쿡 아기반찬");
    expect(sorted[0].price).toBe(3500);
    expect(sorted[1].title).toBe("베베쿡 아기반찬");
    expect(sorted[1].price).toBe(6500);
    expect(sorted).toHaveLength(2);
  });

  it("sorts low prices only after relevance scoring and food filtering", () => {
    const sorted = sortBabyFoodShoppingResults(
      [
        product("소고기 다짐육", {}, { price: 100 }),
        product("베베쿡 아기반찬", {}, { price: 6500 }),
        product("짱죽 완료기 이유식", {}, { price: 3500 }),
        product("아기반찬 보관용기", {}, { price: 50 })
      ].filter((item) => isFoodProduct(item)),
      "price_low"
    );

    expect(sorted.map((item) => item.title)).toEqual([
      "짱죽 완료기 이유식",
      "베베쿡 아기반찬"
    ]);
  });

  it("uses relevance as the tie breaker for price sorting", () => {
    const sorted = sortBabyFoodShoppingResults(
      [
        product("소고기 죽", {}, { price: 3500 }),
        product("베베쿡 완료기 이유식", {}, { price: 3500 })
      ],
      "price_low"
    );

    expect(sorted[0].title).toBe("베베쿡 완료기 이유식");
  });

  it("sends missing or zero prices to the end of low price sorting", () => {
    const lowSorted = sortBabyFoodShoppingResults(
      [
        product("베베쿡 아기반찬 0원", {}, { price: 0 }),
        product("베베쿡 아기반찬 3000원", {}, { price: 3000 })
      ],
      "price_low"
    );

    expect(lowSorted.at(-1)?.price).toBe(0);
  });

  it("matches allergy keywords against title, seller, brand, maker, and categories", () => {
    const filtered = applyAllergyKeywordFilter({
      product: product("안심 이유식 세트", { category3: "영유아식" }, { brand: "우유맘" }),
      allergies: ["우유"],
      excludeMatches: true
    });

    expect(filtered.allergyKeywordMatches).toContain("우유");
    expect(filtered.isHiddenByAllergyFilter).toBe(true);
  });
});

describe("naver shopping provider policy", () => {
  it("requests similarity sort with a wider display window", async () => {
    const fetchCalls: string[] = [];
    const originalFetch = globalThis.fetch;
    const mockedFetch: typeof fetch = async (input) => {
      fetchCalls.push(String(input));
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };

    globalThis.fetch = mockedFetch;

    try {
      const provider = new NaverShoppingProvider("client-id", "client-secret");

      await provider.search({
        query: "아기반찬",
        limit: 20,
        onlyNaverPay: false,
        excludeUsed: true,
        excludeRental: true,
        excludeOverseas: true
      });

      const requestUrl = new URL(fetchCalls[0]);
      expect(requestUrl.searchParams.get("sort")).toBe(NAVER_SHOPPING_SEARCH_SORT);
      expect(requestUrl.searchParams.get("display")).toBe("60");
      expect(requestUrl.searchParams.get("exclude")).toBe("used:rental:cbshop");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses naverpay filter only when requested", async () => {
    const fetchCalls: string[] = [];
    const originalFetch = globalThis.fetch;
    const mockedFetch: typeof fetch = async (input) => {
      fetchCalls.push(String(input));
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };

    globalThis.fetch = mockedFetch;

    try {
      const provider = new NaverShoppingProvider("client-id", "client-secret");

      await provider.search({
        query: "소고기 이유식",
        limit: 20,
        onlyNaverPay: true,
        excludeUsed: true,
        excludeRental: true,
        excludeOverseas: true
      });

      const requestUrl = new URL(fetchCalls[0]);
      expect(requestUrl.searchParams.get("sort")).toBe("sim");
      expect(requestUrl.searchParams.get("filter")).toBe("naverpay");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("keeps naver display between 50 and 100", () => {
    expect(getNaverShoppingDisplayLimit(10)).toBe(50);
    expect(getNaverShoppingDisplayLimit(20)).toBe(60);
    expect(getNaverShoppingDisplayLimit(80)).toBe(100);
  });
});

describe("product search cache key", () => {
  it("includes the filter policy version to avoid stale cached results", () => {
    const key = buildCacheKey({
      provider: "naver",
      normalizedQuery: "두부 쌀 이유식",
      category: "baby_food",
      sortMode: "recommended",
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

import type { NaverShoppingItem } from "../utils/normalize-product.ts";

interface NaverShoppingSearchInput {
  query: string;
  limit: number;
  onlyNaverPay: boolean;
  excludeUsed: boolean;
  excludeRental: boolean;
  excludeOverseas: boolean;
}

interface NaverShoppingResponse {
  items?: NaverShoppingItem[];
}

export class NaverShoppingProvider {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  async search(input: NaverShoppingSearchInput) {
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    const exclude = [
      input.excludeUsed ? "used" : null,
      input.excludeRental ? "rental" : null,
      input.excludeOverseas ? "cbshop" : null
    ].filter((item): item is string => Boolean(item));
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    url.searchParams.set("query", input.query);
    url.searchParams.set("display", String(Math.min(Math.max(input.limit, 1), 100)));
    url.searchParams.set("start", "1");
    url.searchParams.set("sort", "asc");

    if (exclude.length > 0) {
      url.searchParams.set("exclude", exclude.join(":"));
    }

    if (input.onlyNaverPay) {
      url.searchParams.set("filter", "naverpay");
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Naver-Client-Id": this.clientId,
          "X-Naver-Client-Secret": this.clientSecret
        },
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Naver Shopping API failed with ${response.status}`);
      }

      const payload = (await response.json()) as NaverShoppingResponse;
      return Array.isArray(payload.items) ? payload.items : [];
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

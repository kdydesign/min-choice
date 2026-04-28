import { describe, expect, it } from "vitest";
import { buildProductSearchQuery } from "./build-product-query";

describe("buildProductSearchQuery", () => {
  it("adds category suffix when the query has no product keyword", () => {
    expect(buildProductSearchQuery({ query: "소고기", category: "baby_food" })).toBe("소고기 이유식");
    expect(buildProductSearchQuery({ query: "닭고기", category: "baby_side_dish" })).toBe(
      "닭고기 아기반찬"
    );
  });

  it("keeps existing product keywords", () => {
    expect(buildProductSearchQuery({ query: "고구마 퓨레", category: "snack" })).toBe("고구마 퓨레");
  });

  it("does not keep numeric month text in generated queries", () => {
    expect(buildProductSearchQuery({ query: "12개월 소고기", category: "baby_food" })).toBe(
      "소고기 이유식"
    );
  });
});

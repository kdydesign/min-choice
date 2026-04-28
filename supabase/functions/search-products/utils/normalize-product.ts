export interface NaverShoppingItem {
  title?: unknown;
  link?: unknown;
  image?: unknown;
  lprice?: unknown;
  hprice?: unknown;
  mallName?: unknown;
  productId?: unknown;
  productType?: unknown;
  brand?: unknown;
  maker?: unknown;
  category1?: unknown;
  category2?: unknown;
  category3?: unknown;
  category4?: unknown;
}

export interface NormalizedProduct {
  provider: "naver";
  providerProductId: string;
  title: string;
  normalizedTitle: string;
  imageUrl: string;
  productUrl: string;
  mallName: string;
  price: number;
  highPrice: number | null;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  productType: string;
  relevanceScore: number;
  priceRank: number;
  allergyKeywordMatches: string[];
  warningBadges: string[];
  isHiddenByAllergyFilter: boolean;
  fetchedAt: string;
  rawJson: NaverShoppingItem;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeProductTitle(title: string) {
  return title
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNaverProduct(item: NaverShoppingItem, fetchedAt: string): NormalizedProduct | null {
  const title = normalizeProductTitle(readString(item.title));
  const productUrl = readString(item.link);
  const price = readNumber(item.lprice);

  if (!title || !productUrl || price <= 0) {
    return null;
  }

  return {
    provider: "naver",
    providerProductId: readString(item.productId) || `${title}-${price}`,
    title,
    normalizedTitle: title.toLowerCase(),
    imageUrl: readString(item.image),
    productUrl,
    mallName: readString(item.mallName),
    price,
    highPrice: readNumber(item.hprice) || null,
    brand: readString(item.brand),
    maker: readString(item.maker),
    category1: readString(item.category1),
    category2: readString(item.category2),
    category3: readString(item.category3),
    category4: readString(item.category4),
    productType: readString(item.productType),
    relevanceScore: 0,
    priceRank: 0,
    allergyKeywordMatches: [],
    warningBadges: [],
    isHiddenByAllergyFilter: false,
    fetchedAt,
    rawJson: item
  };
}

export function formatDisplayPrice(price: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(price))}원`;
}

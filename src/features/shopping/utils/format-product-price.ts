export function formatProductPrice(price: number | null | undefined) {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return "가격 확인 필요";
  }

  return `${new Intl.NumberFormat("ko-KR").format(Math.round(price))}원`;
}

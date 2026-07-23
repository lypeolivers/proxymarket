import type { TCustomerGift } from '@/modules/customer/types/customer.model'

type GiftLineLike = {
  customer_gift_id: number | null
  quantity: string
}

export function sumGiftQuantityInLines(
  items: GiftLineLike[],
  giftId: number,
  excludeIndex?: number,
): number {
  return items.reduce((sum, line, index) => {
    if (excludeIndex != null && index === excludeIndex) return sum
    if (line.customer_gift_id !== giftId) return sum
    const qty = Number(line.quantity)
    return Number.isFinite(qty) && qty > 0 ? sum + qty : sum
  }, 0)
}

export function availableGiftUnitsForLine(input: {
  gift: TCustomerGift
  items: GiftLineLike[]
  lineIndex: number
  orderGiftUsageByGiftId: Map<number, number>
}): number {
  const { gift, items, lineIndex, orderGiftUsageByGiftId } = input
  const reservedElsewhere = sumGiftQuantityInLines(items, gift.id, lineIndex)
  const baselineRemaining =
    gift.quantity_remaining + (orderGiftUsageByGiftId.get(gift.id) ?? 0)
  return Math.max(0, baselineRemaining - reservedElsewhere)
}

export function allocateCustomerGiftId(input: {
  gifts: TCustomerGift[]
  items: GiftLineLike[]
  lineIndex: number
  lineQuantity: number
  orderGiftUsageByGiftId: Map<number, number>
}): number | null {
  const { gifts, items, lineIndex, lineQuantity, orderGiftUsageByGiftId } = input

  if (!Number.isFinite(lineQuantity) || lineQuantity < 1) return null

  for (const gift of gifts) {
    const available = availableGiftUnitsForLine({
      gift,
      items,
      lineIndex,
      orderGiftUsageByGiftId,
    })
    if (available >= lineQuantity) return gift.id
  }

  return null
}

export function totalGiftUnitsAvailable(input: {
  gifts: TCustomerGift[]
  items: GiftLineLike[]
  orderGiftUsageByGiftId: Map<number, number>
}): number {
  return input.gifts.reduce((sum, gift) => {
    const available = availableGiftUnitsForLine({
      gift,
      items: input.items,
      lineIndex: -1,
      orderGiftUsageByGiftId: input.orderGiftUsageByGiftId,
    })
    return sum + available
  }, 0)
}

export function buildOrderGiftUsageMap(
  items: Array<{ customer_gift_id: number | null; quantity: number }>,
): Map<number, number> {
  const map = new Map<number, number>()
  for (const item of items) {
    if (item.customer_gift_id == null) continue
    map.set(
      item.customer_gift_id,
      (map.get(item.customer_gift_id) ?? 0) + item.quantity,
    )
  }
  return map
}

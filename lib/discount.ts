// App discount rules
// The app discount applies to every item except MRP items, which are sold at their printed price.

export const APP_DISCOUNT_RATE = 0.1;

type MrpFlagged = {
  is_mrp?: boolean | null;
  menu_items?: { is_mrp?: boolean | null } | null; // Joined from order_items.menu_item_id
};

type PricedItem = MrpFlagged & {
  price: number;
  quantity: number;
};

export function isMrpItem(item: MrpFlagged): boolean {
  return Boolean(item.is_mrp ?? item.menu_items?.is_mrp);
}

// Total value of MRP items (excluded from the discount)
export function getMrpAmount(items: PricedItem[]): number {
  return items
    .filter(isMrpItem)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Discount amount for a set of items, skipping MRP items
export function getAppDiscount(items: PricedItem[]): number {
  const eligible = items
    .filter((item) => !isMrpItem(item))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  return Math.round(eligible * APP_DISCOUNT_RATE * 100) / 100;
}

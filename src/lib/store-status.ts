export type SubscriptionState = "active" | "pending" | "expired";

/**
 * A store is considered expired when its plan was explicitly stopped or its
 * renewal date has passed. Stores created before renewal dates existed (null)
 * stay active so the migration doesn't close old stores by surprise.
 */
export function subscriptionState(store: {
  planStatus: string;
  planRenewsAt: Date | null;
}): SubscriptionState {
  if (["expired", "cancelled", "canceled", "stopped"].includes(store.planStatus)) {
    return "expired";
  }
  if (store.planRenewsAt && store.planRenewsAt.getTime() <= Date.now()) {
    return "expired";
  }
  return store.planStatus === "pending" ? "pending" : "active";
}

export function storeIsLive(store: {
  active: boolean;
  planStatus: string;
  planRenewsAt: Date | null;
}) {
  return store.active && subscriptionState(store) !== "expired";
}

export function daysUntil(date: Date | null) {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function subscriptionStateLabel(state: SubscriptionState) {
  if (state === "expired") return "منتهي";
  if (state === "pending") return "بانتظار التفعيل";
  return "نشط";
}

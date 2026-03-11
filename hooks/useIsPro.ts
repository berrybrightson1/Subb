/**
 * hooks/useIsPro.ts
 * App is currently free — everyone gets full premium access.
 * This stub always returns isPro: true for all users.
 */
export function useIsPro(_userId?: string) {
    return {
        isPro: true,
        loading: false,
        onPurchaseSuccess: async () => {},
        restorePurchases: async () => {},
    };
}

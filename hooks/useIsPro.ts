/**
 * hooks/useIsPro.ts
 * Determines whether the current user has an active Subb Pro subscription.
 *
 * Strategy (layered fallback):
 *  1. Try RevenueCat Purchases.getCustomerInfo() for 'pro_features' entitlement
 *  2. Fall back to Firestore `users/{uid}.isPro` for cross-platform consistency
 *
 * NOTE: react-native-purchases requires a native build (not Expo Go).
 *       On simulator/Expo Go, RevenueCat calls are skipped and Firestore is used.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../lib/firebase';

const REVENUECAT_API_KEY =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'test_bKPpVzaW6jDWjcvrssAiFNgJPhQ';
const PRO_ENTITLEMENT = 'pro_features';

// ─── Lazy RevenueCat import (gracefully fails in Expo Go) ─────────────────────
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Purchases = require('react-native-purchases').default;
} catch {
    // Not available in Expo Go / web
}

export function useIsPro(userId?: string) {
    const [isPro, setIsPro] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkEntitlement = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Try RevenueCat first
            if (Purchases) {
                if (!Purchases.isConfigured) {
                    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
                }

                if (userId) {
                    await Purchases.logIn(userId);
                }

                const info = await Purchases.getCustomerInfo();
                const active = info.entitlements.active[PRO_ENTITLEMENT];
                if (active !== undefined) {
                    const proStatus = !!active;
                    setIsPro(proStatus);
                    // Sync to Firestore for cross-platform reads
                    if (userId) {
                        await setDoc(doc(db, 'users', userId), { isPro: proStatus }, { merge: true });
                    }
                    setLoading(false);
                    return;
                }
            }
        } catch {
            // RevenueCat unavailable or error — fall through to Firestore
        }

        // 2. Fallback: read Firestore isPro field
        try {
            if (userId) {
                const snap = await getDoc(doc(db, 'users', userId));
                if (snap.exists()) {
                    setIsPro(snap.data()?.isPro === true);
                }
            }
        } catch {
            setIsPro(false);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        checkEntitlement();
    }, [checkEntitlement]);

    /**
     * Call after a successful RevenueCat purchase to ensure Firestore is synced
     * and in-memory state is updated immediately.
     */
    const onPurchaseSuccess = useCallback(async () => {
        setIsPro(true);
        if (userId) {
            await setDoc(doc(db, 'users', userId), { isPro: true }, { merge: true });
        }
    }, [userId]);

    const restorePurchases = useCallback(async () => {
        // Dev toggle: if no Purchases (Expo Go) or we're in __DEV__, toggle local status
        if (!Purchases || __DEV__) {
            const nextStatus = !isPro;
            setIsPro(nextStatus);
            if (userId) {
                await setDoc(doc(db, 'users', userId), { isPro: nextStatus }, { merge: true });
            }
            return;
        }

        try {
            const info = await Purchases.restorePurchases();
            const active = info.entitlements.active[PRO_ENTITLEMENT];
            if (active) {
                await onPurchaseSuccess();
            }
        } catch {
            // silent
        }
    }, [Purchases, isPro, userId, onPurchaseSuccess]);

    return { isPro, loading, onPurchaseSuccess, restorePurchases };
}

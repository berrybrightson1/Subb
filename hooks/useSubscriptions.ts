import { addDoc, collection, deleteDoc, doc, onSnapshot, query, Timestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { cancelRenewalAlert, cancelTrialUrgentAlert, scheduleRenewalAlert, scheduleTrialUrgentAlert } from '../lib/notifications';

export type SubStatus = 'active' | 'pending_action' | 'cancelled';
export type SubCategory = 'Entertainment' | 'Productivity' | 'Health' | 'Education' | 'Utilities' | 'Other';

export interface Subscription {
    id: string;
    name: string;
    cost: number;
    billingCycle: 'Mo' | 'Yr';
    category?: SubCategory;
    startDate?: Timestamp;
    nextBillingDate: Timestamp;
    isTrial: boolean;
    trialEndDate?: Timestamp | null;
    remindMeDaysBefore: number;
    status?: SubStatus;
    cancelledAt?: Timestamp | null;
    cancelUrl?: string;
    lastActivityDate?: Timestamp | null;
    isGhost?: boolean;
    isPaid?: boolean;
}

export function useSubscriptions(userId?: string) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe = () => { };

        if (!userId) {
            setSubscriptions([]);
            setLoading(false);
            return;
        }

        try {
            const path = `users/${userId}/subscriptions`;
            const q = query(collection(db, path));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const subs = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                })) as Subscription[];
                setSubscriptions(subs);
                setLoading(false);
            }, (error) => {
                console.error('useSubscriptions: Firestore error', error.code, error.message);
                setSubscriptions([]);
                setLoading(false);
            });
        } catch (err) {
            console.error('useSubscriptions: Setup error', err);
            setLoading(false);
        }

        return () => unsubscribe();
    }, [userId]);

    const addSubscription = async (userId: string, sub: Omit<Subscription, 'id'>) => {
        const ref = await addDoc(collection(db, `users/${userId}/subscriptions`), {
            ...sub,
            status: 'active' as SubStatus,
            isPaid: false,
        });
        // Auto-schedule renewal alert for the new sub
        const fullSub: Subscription = { id: ref.id, ...sub, status: 'active' };
        scheduleRenewalAlert(fullSub).catch(console.warn);
        // Schedule urgent 24h trial alert if applicable
        if (fullSub.isTrial) {
            scheduleTrialUrgentAlert(fullSub).catch(console.warn);
        }
        return ref;
    };

    const updateSubscription = async (
        userId: string,
        subId: string,
        data: Partial<Omit<Subscription, 'id'>>
    ) => {
        return updateDoc(doc(db, `users/${userId}/subscriptions`, subId), data);
    };

    const deleteSubscription = async (userId: string, subId: string) => {
        cancelRenewalAlert(subId).catch(console.warn);
        cancelTrialUrgentAlert(subId).catch(console.warn);
        return deleteDoc(doc(db, `users/${userId}/subscriptions`, subId));
    };

    /** Advance billing date by one cycle and mark active again */
    const renewSubscription = async (userId: string, sub: Subscription) => {
        const base = sub.nextBillingDate.toDate();
        const next = new Date(base);
        if (sub.billingCycle === 'Mo') next.setMonth(next.getMonth() + 1);
        else next.setFullYear(next.getFullYear() + 1);
        await updateDoc(doc(db, `users/${userId}/subscriptions`, sub.id), {
            status: 'active' as SubStatus,
            nextBillingDate: Timestamp.fromDate(next),
            isTrial: false,
            trialEndDate: null,
            isPaid: false,
        });
        // Re-schedule with new date; cancel urgent trial alert on conversion
        cancelTrialUrgentAlert(sub.id).catch(console.warn);
        const updated: Subscription = { ...sub, nextBillingDate: Timestamp.fromDate(next), isTrial: false, trialEndDate: null, isPaid: false };
        scheduleRenewalAlert(updated).catch(console.warn);
    };

    /** Mark sub as paid for the current cycle */
    const markAsPaid = async (userId: string, subId: string) => {
        return updateDoc(doc(db, `users/${userId}/subscriptions`, subId), {
            isPaid: true,
        });
    };

    /** Soft-cancel: moves sub to History */
    const cancelSubscription = async (userId: string, subId: string) => {
        cancelRenewalAlert(subId).catch(console.warn);
        cancelTrialUrgentAlert(subId).catch(console.warn);
        return updateDoc(doc(db, `users/${userId}/subscriptions`, subId), {
            status: 'cancelled' as SubStatus,
            cancelledAt: Timestamp.now(),
        });
    };

    /** Restore a cancelled sub back to active */
    const restoreSubscription = async (userId: string, subId: string) => {
        return updateDoc(doc(db, `users/${userId}/subscriptions`, subId), {
            status: 'active' as SubStatus,
            cancelledAt: null,
        });
    };

    return {
        subscriptions,
        loading,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        renewSubscription,
        cancelSubscription,
        restoreSubscription,
        markAsPaid,
    };
}

import { addMonths, addYears, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function calculateDaysRemaining(nextBillingDate: Timestamp | Date | null | undefined): number {
    if (!nextBillingDate) return 0;

    const targetDate = nextBillingDate instanceof Timestamp ? nextBillingDate.toDate() : nextBillingDate;
    const today = new Date();

    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    return differenceInDays(targetDate, today);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}

export function calculateNextBillingDate(startDate: Date, cycle: 'Mo' | 'Yr'): Date {
    return cycle === 'Mo' ? addMonths(startDate, 1) : addYears(startDate, 1);
}

// ─── Ghost Sub Detection ──────────────────────────────────────────────────────
/** Returns true if lastActivityDate is set and is more than 30 days in the past */
export function flagGhostSub(lastActivityDate: Timestamp | null | undefined): boolean {
    if (!lastActivityDate) return false;
    const activityDate = lastActivityDate instanceof Timestamp ? lastActivityDate.toDate() : lastActivityDate;
    const diffMs = Date.now() - activityDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > 30;
}

/** Compute hours remaining until a future date (floored) */
export function hoursUntil(date: Timestamp | Date | null | undefined): number {
    if (!date) return 0;
    const target = date instanceof Timestamp ? date.toDate() : date;
    const diffMs = target.getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

/**
 * lib/notifications.ts
 * Core notification scheduling engine for Subb.
 * Uses local notifications only — no server or push token required.
 */
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Subscription } from '../hooks/useSubscriptions';

// ─── Android Channel ──────────────────────────────────────────────────────────
const CHANNEL_ID = 'subb-alerts';

async function ensureAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Subb Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#A855F7',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
    });
}

// ─── Permission Request ───────────────────────────────────────────────────────
export async function registerForPushNotificationsAsync(): Promise<boolean> {
    if (!Device.isDevice) {
        // Simulator — skip but don't crash
        return false;
    }

    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        });
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

// ─── Identifier helpers ───────────────────────────────────────────────────────
const notifId = (subId: string) => `subb-renewal-${subId}`;
const trialUrgentId = (subId: string) => `subb-trial-urgent-${subId}`;

// ─── Schedule a single renewal alert ─────────────────────────────────────────
export async function scheduleRenewalAlert(sub: Subscription): Promise<void> {
    // Cancel any existing notification for this sub first
    await cancelRenewalAlert(sub.id);

    // Use trial end date if applicable, otherwise next billing date
    const rawDate = sub.isTrial && sub.trialEndDate
        ? sub.trialEndDate.toDate()
        : sub.nextBillingDate?.toDate();

    if (!rawDate) return;

    const remindDays = sub.remindMeDaysBefore ?? 3;
    const triggerDate = new Date(rawDate.getTime() - remindDays * 24 * 60 * 60 * 1000);

    // Don't schedule if the trigger is in the past
    if (triggerDate.getTime() <= Date.now()) return;

    const title = sub.isTrial
        ? `Trial ending soon: ${sub.name}`
        : `Renewal coming up: ${sub.name}`;

    const body = sub.isTrial
        ? `Your free trial converts in ${remindDays} day${remindDays !== 1 ? 's' : ''}. Cancel if you don't want to be charged.`
        : `${sub.name} renews in ${remindDays} day${remindDays !== 1 ? 's' : ''}.`;

    await Notifications.scheduleNotificationAsync({
        identifier: notifId(sub.id),
        content: {
            title,
            body,
            sound: 'default',
            data: { subId: sub.id, type: 'renewal' },
            ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        },
    });
}

// ─── Cancel a single alert ────────────────────────────────────────────────────
export async function cancelRenewalAlert(subId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notifId(subId));
}

// ─── Schedule Urgent 24h Trial Alert ─────────────────────────────────────────
export async function scheduleTrialUrgentAlert(sub: Subscription): Promise<void> {
    if (!sub.isTrial) return;

    // Cancel existing urgent alert for this sub first
    await cancelTrialUrgentAlert(sub.id);

    const billingDate = sub.nextBillingDate?.toDate();
    if (!billingDate) return;

    // Fire exactly 24h before billing
    const triggerDate = new Date(billingDate.getTime() - 24 * 60 * 60 * 1000);

    // Don't schedule if trigger is already in the past
    if (triggerDate.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
        identifier: trialUrgentId(sub.id),
        content: {
            title: `Trial ending in 24h: ${sub.name}`,
            body: `Your free trial converts to a paid plan tomorrow. Cancel now to avoid being charged.`,
            sound: 'default',
            data: { subId: sub.id, type: 'trial-urgent' },
            ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        },
    });
}

// ─── Cancel a single trial urgent alert ──────────────────────────────────────
export async function cancelTrialUrgentAlert(subId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(trialUrgentId(subId));
}

// ─── Re-sync ALL alerts (called on sign-in / app start) ──────────────────────
export async function rescheduleAllAlerts(subs: Subscription[]): Promise<void> {
    // Cancel all existing subb notifications (renewal + trial urgent)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
        if (n.identifier.startsWith('subb-renewal-') || n.identifier.startsWith('subb-trial-urgent-')) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
    }

    // Re-schedule all active subs
    for (const sub of subs) {
        if (sub.status !== 'cancelled') {
            await scheduleRenewalAlert(sub);
            if (sub.isTrial) {
                await scheduleTrialUrgentAlert(sub);
            }
        }
    }
}

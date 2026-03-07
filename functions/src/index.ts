import { addDays, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

/** Every hour: mark overdue active subs as pending_action */
export const checkExpiredSubs = onSchedule("every 1 hours", async () => {
    const now = admin.firestore.Timestamp.now();

    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
        const subsSnapshot = await db
            .collection(`users/${userDoc.id}/subscriptions`)
            .where("status", "==", "active")
            .get();

        const batch = db.batch();
        let count = 0;

        for (const subDoc of subsSnapshot.docs) {
            const data = subDoc.data();
            const isTrial = data.isTrial || false;
            const targetDate: admin.firestore.Timestamp | undefined =
                isTrial && data.trialEndDate ? data.trialEndDate : data.nextBillingDate;

            if (!targetDate) continue;

            // If billing/trial date has passed, mark pending_action
            if (targetDate.toMillis() < now.toMillis()) {
                batch.update(subDoc.ref, { status: "pending_action" });
                count++;
            }
        }

        if (count > 0) await batch.commit();
    }

    console.log("checkExpiredSubs complete.");
});

export const checkRenewals = onSchedule("every day 00:00", async (event) => {
    console.log("Starting daily subscription renewal check...");

    try {
        const usersSnapshot = await db.collection("users").get();

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userTimezone = userData.timezone || "UTC";

            const subsSnapshot = await db.collection(`users/${userDoc.id}/subscriptions`).get();

            for (const subDoc of subsSnapshot.docs) {
                const subData = subDoc.data();

                const nextBillingDateTimestamp = subData.nextBillingDate as admin.firestore.Timestamp | undefined;
                const trialEndDateTimestamp = subData.trialEndDate as admin.firestore.Timestamp | undefined;
                const remindMeDaysBefore = subData.remindMeDaysBefore || 0;
                const isTrial = subData.isTrial || false;

                const targetDateTimestamp = isTrial && trialEndDateTimestamp ? trialEndDateTimestamp : nextBillingDateTimestamp;

                if (!targetDateTimestamp) continue;

                const targetDate = targetDateTimestamp.toDate();
                const targetZonedDate = toZonedTime(targetDate, userTimezone);

                const now = new Date();
                const nowZoned = toZonedTime(now, userTimezone);

                const notificationDate = addDays(targetZonedDate, -remindMeDaysBefore);

                if (isSameDay(nowZoned, notificationDate)) {
                    console.log(`Sending reminder to user ${userDoc.id} for subscription ${subData.name}`);

                    await db.collection(`users/${userDoc.id}/notifications`).add({
                        title: isTrial ? `Trial Ending: ${subData.name}` : `Upcoming Charge: ${subData.name}`,
                        body: `Your subscription for ${subData.name} will be active in ${remindMeDaysBefore} days. Cost: $${subData.cost}.`,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false,
                        subscriptionId: subDoc.id,
                    });
                }
            }
        }

        console.log("Successfully completed daily renewal checks.");
    } catch (error) {
        console.error("Error running daily renewal checks:", error);
    }
});

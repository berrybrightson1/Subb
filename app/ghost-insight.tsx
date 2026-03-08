import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ghost, TrendingDown, X, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { useAppSettings } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { formatCurrency } from '../lib/utils';
import { toast } from '../lib/toast';

export default function GhostInsightScreen() {
    const { subId } = useLocalSearchParams<{ subId: string }>();
    const { colors, currency } = useAppSettings();
    const { user } = useAuth();
    const { subscriptions, cancelSubscription } = useSubscriptions(user?.uid);
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const sub = subscriptions.find(s => s.id === subId) ?? null;

    function dismiss() {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }

    async function handleCancel() {
        if (!sub || !user) return;
        try {
            await cancelSubscription(user.uid, sub.id);
            toast.success(`${sub.name} cancelled`);
        } catch {
            toast.error('Failed to cancel');
        }
        dismiss();
    }

    if (!sub) return null;

    const yearlyCost  = sub.billingCycle === 'Mo' ? sub.cost * 12 : sub.cost;
    const monthlyCost = sub.billingCycle === 'Yr' ? sub.cost / 12 : sub.cost;

    return (
        <View style={[s.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                    <X color={colors.text} size={18} strokeWidth={2} />
                </TouchableOpacity>
                <Text variant="display" style={[s.title, { color: colors.text }]}>Ghost Subscription</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={s.content}>
                {/* Icon */}
                <View style={[s.iconWrap, { backgroundColor: 'rgba(148,163,184,0.1)' }]}>
                    <Ghost color="#94A3B8" size={32} strokeWidth={1.8} />
                </View>

                <Text variant="display" style={[s.heading, { color: colors.text }]}>{sub.name}</Text>
                <Text variant="sans" style={[s.sub, { color: colors.muted }]}>No activity detected in 30+ days</Text>

                {/* Insight card */}
                <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={s.cardRow}>
                        <TrendingDown color="#EF4444" size={18} strokeWidth={2} />
                        <Text variant="sans" style={[s.cardLabel, { color: colors.muted }]}>Potential yearly waste</Text>
                        <Text variant="sansBold" style={[s.cardValue, { color: '#EF4444' }]}>{formatCurrency(yearlyCost, currency)}</Text>
                    </View>
                    <View style={[s.sep, { backgroundColor: colors.border }]} />
                    <View style={s.cardRow}>
                        <Zap color={colors.accent} size={18} strokeWidth={2} />
                        <Text variant="sans" style={[s.cardLabel, { color: colors.muted }]}>Monthly drain</Text>
                        <Text variant="sansBold" style={[s.cardValue, { color: colors.accent }]}>{formatCurrency(monthlyCost, currency)}</Text>
                    </View>
                </View>

                <Text variant="sans" style={[s.hint, { color: colors.muted }]}>
                    You haven't used this subscription in over a month. Cancelling it could save you money.
                </Text>
            </View>

            {/* Fixed footer */}
            <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.bg }]}>
                <TouchableOpacity style={[s.cancelBtn, { backgroundColor: '#EF4444' }]} onPress={handleCancel} activeOpacity={0.85}>
                    <Ghost color="#fff" size={16} strokeWidth={2} />
                    <Text variant="brand" style={s.cancelBtnText}>Cancel This Subscription</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.keepBtn, { borderColor: colors.border }]} onPress={dismiss} activeOpacity={0.7}>
                    <Text variant="sans" style={[s.keepBtnText, { color: colors.muted }]}>Keep It</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title:    { fontSize: 17, letterSpacing: -0.3 },
    closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

    content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 16 },

    iconWrap: {
        width: 72, height: 72, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
    },
    heading: { fontSize: 22, letterSpacing: -0.5, textAlign: 'center', marginTop: -4 },
    sub:     { fontSize: 14, textAlign: 'center', marginTop: -8 },

    card:    { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
    cardLabel: { flex: 1, fontSize: 14 },
    cardValue: { fontSize: 15 },
    sep:     { height: StyleSheet.hairlineWidth },

    hint: { fontSize: 14, lineHeight: 22, textAlign: 'center' },

    footer:    { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
    cancelBtn: { height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    cancelBtnText: { fontSize: 16, color: '#fff', letterSpacing: 0.2 },
    keepBtn:   { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    keepBtnText: { fontSize: 15 },
});

import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2, Clock, CreditCard, Ghost, Plus, RotateCcw, Search, Smartphone, Tv, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostInsightModal } from '../../components/GhostInsightModal';
import { SubscriptionActionSheet } from '../../components/SubscriptionActionSheet';
import { useAppSettings } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useIncognito } from '../../hooks/useIncognito';
import { Subscription, useSubscriptions } from '../../hooks/useSubscriptions';
import { ThemeColors } from '../../lib/theme';
import { calculateDaysRemaining, flagGhostSub, formatCurrency, hoursUntil } from '../../lib/utils';

export default function SubscriptionsScreen() {
    const { user, loading: authLoading } = useAuth();
    const { subscriptions, loading: subsLoading, renewSubscription, cancelSubscription, restoreSubscription } = useSubscriptions(user?.uid);
    const { colors, currency } = useAppSettings();
    const { incognito } = useIncognito();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchVisible, setSearchVisible] = useState(false);
    const [actionSub, setActionSub] = useState<Subscription | null>(null);
    const [ghostSub, setGhostSub] = useState<Subscription | null>(null);

    const s = useMemo(() => makeStyles(colors), [colors]);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/auth');
    }, [user, authLoading]);

    const getServiceIcon = (name: string, color = colors.text) => {
        const l = name.toLowerCase();
        if (l.includes('netflix') || l.includes('disney') || l.includes('hbo')) return <Tv color={color} size={22} />;
        if (l.includes('icloud') || l.includes('mobile')) return <Smartphone color={color} size={22} />;
        return <CreditCard color={color} size={22} />;
    };

    const getCycleProgress = (sub: Subscription) => {
        const daysRemaining = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
        const totalDays = sub.billingCycle === 'Mo' ? 30 : 365;
        return Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));
    };

    const q = searchQuery.toLowerCase();

    // Current = active + pending_action (not cancelled)
    const current = subscriptions
        .filter(s => s.status !== 'cancelled')
        .filter(s => !q || s.name.toLowerCase().includes(q));

    // History = cancelled
    const history = subscriptions
        .filter(s => s.status === 'cancelled')
        .filter(s => !q || s.name.toLowerCase().includes(q));

    const monthlyTotal = current.reduce((acc, sub) => {
        return acc + (sub.billingCycle === 'Mo' ? sub.cost : sub.cost / 12);
    }, 0);

    if (authLoading || subsLoading || !user) {
        return (
            <SafeAreaView style={s.container}>
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <Text style={s.headerTitle}>Subscriptions</Text>
                <View style={s.headerRight}>
                    <TouchableOpacity
                        style={[s.iconBtn, searchVisible && s.iconBtnActive]}
                        onPress={() => { setSearchVisible(v => !v); setSearchQuery(''); }}
                    >
                        <Search color={searchVisible ? colors.accent : colors.text} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add')}>
                        <Plus color="#fff" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            {searchVisible && (
                <View style={s.searchBar}>
                    <Search color={colors.muted} size={15} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search subscriptions..."
                        placeholderTextColor={colors.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        selectionColor={colors.accent}
                        underlineColorAndroid="transparent"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X color={colors.muted} size={15} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Summary */}
                <Text style={s.sectionEyebrow}>MONTHLY TOTAL</Text>
                <Text style={s.sectionBig}>{formatCurrency(monthlyTotal, currency)}</Text>

                {/* ── CURRENT section ── */}
                <Text style={s.sectionLabel}>Current</Text>

                {current.length === 0 ? (
                    <View style={s.emptyBox}>
                        <CheckCircle2 color={colors.muted} size={22} strokeWidth={1.5} />
                        <Text style={s.emptyText}>No active subscriptions</Text>
                    </View>
                ) : (
                    <View style={s.list}>
                        {current.map(sub => {
                            const isPending = sub.status === 'pending_action';
                            const daysLeft = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
                            const isUrgent = !isPending && daysLeft >= 0 && daysLeft <= 3;
                            const progress = getCycleProgress(sub);
                            const isGhost = flagGhostSub(sub.lastActivityDate);
                            const trialHoursLeft = sub.isTrial ? hoursUntil(sub.nextBillingDate) : 0;
                            const showTrialBadge = sub.isTrial && daysLeft <= 2;

                            const cardBg = isPending
                                ? 'rgba(245,158,11,0.08)'
                                : isUrgent ? 'rgba(239,68,68,0.08)' : colors.card;
                            const cardBorder = isPending
                                ? 'rgba(245,158,11,0.3)'
                                : isUrgent ? 'rgba(239,68,68,0.3)' : 'transparent';
                            const accentColor = isPending ? '#F59E0B' : isUrgent ? '#EF4444' : '#3B82F6';

                            return (
                                <TouchableOpacity
                                    key={sub.id}
                                    style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1 }]}
                                    onPress={() => isPending ? setActionSub(sub) : router.push(`/sub/${sub.id}`)}
                                    activeOpacity={0.75}
                                >
                                    <View style={s.cardHeader}>
                                        <View style={[s.cardIcon, { backgroundColor: isPending ? 'rgba(245,158,11,0.15)' : colors.cardAlt }]}>
                                            {getServiceIcon(sub.name, isPending ? '#F59E0B' : isUrgent ? '#EF4444' : colors.text)}
                                        </View>
                                        <View style={s.cardInfo}>
                                            <View style={s.cardNameRow}>
                                                <Text
                                                    style={[
                                                        s.cardName,
                                                        (isPending || isUrgent) && { color: isPending ? '#F59E0B' : '#EF4444' },
                                                        incognito && s.incognitoText
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {incognito ? '••••••••' : sub.name}
                                                </Text>
                                                {isGhost && (
                                                    <TouchableOpacity
                                                        onPress={() => setGhostSub(sub)}
                                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                                    >
                                                        <Ghost color="#64748B" size={13} strokeWidth={2} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <Text style={s.cardBilling}>
                                                {isPending
                                                    ? (sub.isTrial ? 'Trial ended — action needed' : 'Overdue — action needed')
                                                    : daysLeft < 0 ? 'Overdue'
                                                        : daysLeft === 0 ? 'Due today'
                                                            : `Billing in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                                                }
                                            </Text>
                                        </View>
                                        <View style={s.cardRight}>
                                            <Text
                                                style={[
                                                    s.cardCost,
                                                    (isPending || isUrgent) && { color: isPending ? '#F59E0B' : '#EF4444' },
                                                    incognito && s.incognitoText
                                                ]}
                                            >
                                                {incognito ? '••••' : formatCurrency(sub.cost, currency)}
                                            </Text>
                                            <Text style={s.cardFreq}>/ {sub.billingCycle}</Text>
                                            {/* Trial countdown or label */}
                                            {showTrialBadge && !isPending && (
                                                <View style={s.trialBadge}>
                                                    <Clock color="#F59E0B" size={9} strokeWidth={2.5} />
                                                    <Text style={s.trialBadgeText}>
                                                        {trialHoursLeft > 0 ? `${trialHoursLeft}h` : 'Today'}
                                                    </Text>
                                                </View>
                                            )}
                                            {sub.isTrial && !showTrialBadge && !isPending && (
                                                <View style={s.trialLabel}>
                                                    <Text style={s.trialLabelText}>TRIAL</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {isPending ? (
                                        <View style={s.actionPrompt}>
                                            <AlertCircle color="#F59E0B" size={14} strokeWidth={2} />
                                            <Text style={s.actionPromptText}>Tap to renew or cancel</Text>
                                        </View>
                                    ) : (
                                        <View style={s.progressContainer}>
                                            <View style={s.progressHeader}>
                                                <Text style={s.progressLabel}>Cycle Progress</Text>
                                                <Text style={[s.progressValue, { color: accentColor }]}>{Math.round(progress)}%</Text>
                                            </View>
                                            <View style={s.progressBarBg}>
                                                <View style={[s.progressBarFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── HISTORY section ── */}
                {history.length > 0 && (
                    <>
                        <Text style={[s.sectionLabel, { marginTop: 32 }]}>History</Text>
                        <View style={s.historyList}>
                            {history.map(sub => (
                                <View key={sub.id} style={s.historyRow}>
                                    <View style={[s.historyIcon, { backgroundColor: colors.cardAlt }]}>
                                        {getServiceIcon(sub.name, colors.muted)}
                                    </View>
                                    <View style={s.historyInfo}>
                                        <Text style={s.historyName}>{sub.name}</Text>
                                        <Text style={s.historySub}>
                                            {sub.cancelledAt?.toDate
                                                ? `Cancelled ${sub.cancelledAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                : 'Cancelled'
                                            }
                                        </Text>
                                    </View>
                                    <View style={s.historyRight}>
                                        <Text style={s.historyCost}>{formatCurrency(sub.cost, currency)}</Text>
                                        <TouchableOpacity
                                            style={s.restoreBtn}
                                            onPress={() => restoreSubscription(user.uid, sub.id)}
                                            activeOpacity={0.7}
                                        >
                                            <RotateCcw color={colors.accent} size={13} strokeWidth={2} />
                                            <Text style={[s.restoreText, { color: colors.accent }]}>Restore</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {current.length === 0 && history.length === 0 && !searchQuery && (
                    <View style={s.emptyBox}>
                        <Text style={s.emptyText}>No subscriptions yet. Tap + to add.</Text>
                    </View>
                )}

            </ScrollView>

            {/* Action Sheet for pending_action subs */}
            <SubscriptionActionSheet
                visible={actionSub !== null}
                sub={actionSub}
                userId={user.uid}
                onRenew={(sub) => renewSubscription(user.uid, sub)}
                onCancel={(subId) => cancelSubscription(user.uid, subId)}
                onClose={() => setActionSub(null)}
            />

            {/* Ghost Insight Modal */}
            <GhostInsightModal
                visible={ghostSub !== null}
                sub={ghostSub}
                currency={currency}
                onCancel={() => {
                    if (ghostSub) cancelSubscription(user.uid, ghostSub.id);
                    setGhostSub(null);
                }}
                onKeep={() => setGhostSub(null)}
            />
        </SafeAreaView>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 16, marginBottom: 12,
        },
        headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        iconBtn: {
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
        },
        iconBtnActive: { backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.accent },
        addBtn: {
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
        },
        searchBar: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.card, marginHorizontal: 20, marginBottom: 12,
            borderRadius: 12, paddingHorizontal: 14, height: 42, gap: 10,
        },
        searchInput: { flex: 1, color: colors.text, fontSize: 14, height: '100%' },
        scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
        sectionEyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
        sectionBig: { color: colors.text, fontSize: 34, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
        sectionLabel: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
        list: { gap: 12 },
        card: { borderRadius: 16, padding: 18 },
        cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
        cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
        cardInfo: { flex: 1 },
        cardName: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
        cardBilling: { color: colors.muted, fontSize: 12 },
        cardRight: { alignItems: 'flex-end' },
        cardCost: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 3 },
        cardFreq: { color: colors.muted, fontSize: 12 },
        actionPrompt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        actionPromptText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
        progressContainer: {},
        progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
        progressLabel: { color: colors.muted, fontSize: 11 },
        progressValue: { fontSize: 11, fontWeight: '700' },
        progressBarBg: { height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
        progressBarFill: { height: '100%', borderRadius: 3 },
        // History
        historyList: { gap: 2 },
        historyRow: {
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        historyIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12, opacity: 0.5 },
        historyInfo: { flex: 1 },
        historyName: { color: colors.muted, fontSize: 14, fontWeight: '600', marginBottom: 2 },
        historySub: { color: colors.border, fontSize: 12 },
        historyRight: { alignItems: 'flex-end', gap: 6 },
        historyCost: { color: colors.muted, fontSize: 14, fontWeight: '600' },
        restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        restoreText: { fontSize: 12, fontWeight: '600' },
        emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
        emptyText: { color: colors.muted, fontSize: 14 },
        // Ghost + Trial + Incognito additions
        cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
        incognitoText: { opacity: 0.12, letterSpacing: 2 },
        trialBadge: {
            backgroundColor: 'rgba(245,158,11,0.12)',
            flexDirection: 'row', alignItems: 'center',
            gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 3,
        },
        trialBadgeText: { color: '#F59E0B', fontSize: 9, fontWeight: '800' },
        trialLabel: {
            backgroundColor: 'rgba(239,68,68,0.1)',
            paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 3,
        },
        trialLabelText: { color: '#EF4444', fontSize: 9, fontWeight: '800' },
    });
}

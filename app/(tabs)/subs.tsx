import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2, Clock, CreditCard, Ghost, Lock, Plus, RotateCcw, Search, Smartphone, Target, Tv, X, MoreHorizontal } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DonutChart } from '../../components/DonutChart';
import { SubscriptionActionSheet } from '../../components/SubscriptionActionSheet';
import { SubscriptionMenuSheet } from '../../components/SubscriptionMenuSheet';
import { Text } from '../../components/Text';
import { IncognitoText } from '../../components/ui/IncognitoText';
import { useAppSettings } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useIncognito } from '../../hooks/useIncognito';
import { useIsPro } from '../../hooks/useIsPro';
import { Subscription, useSubscriptions } from '../../hooks/useSubscriptions';
import { ThemeColors } from '../../lib/theme';
import { calculateDaysRemaining, flagGhostSub, formatCurrency, hoursUntil } from '../../lib/utils';

export default function SubscriptionsScreen() {
    const { user, loading: authLoading } = useAuth();
    const { subscriptions, loading: subsLoading, renewSubscription, cancelSubscription, restoreSubscription, markAsPaid } = useSubscriptions(user?.uid);
    const { colors, currency } = useAppSettings();
    const { incognito } = useIncognito();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchVisible, setSearchVisible] = useState(false);
    const [actionSub, setActionSub] = useState<Subscription | null>(null);
    const [menuSub, setMenuSub] = useState<Subscription | null>(null);

    const { isPro } = useIsPro();
    const [budget, setBudget] = useState(0);

    useFocusEffect(useCallback(() => {
        AsyncStorage.getItem('monthlyBudget').then(val => {
            if (val) setBudget(Number(val));
        });
    }, []));

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

    // Screen fade-in on tab focus
    const screenOpacity = useSharedValue(0);
    const screenY       = useSharedValue(10);
    useFocusEffect(
        useCallback(() => {
            screenOpacity.value = withTiming(1, { duration: 260 });
            screenY.value       = withTiming(0, { duration: 260 });
            return () => { screenOpacity.value = 0; screenY.value = 10; };
        }, [])
    );
    const screenStyle = useAnimatedStyle(() => ({
        opacity:   screenOpacity.value,
        transform: [{ translateY: screenY.value }],
    }));

    if (authLoading || subsLoading || !user) {
        return (
            <View style={s.container}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <Animated.View style={[s.container, screenStyle]}>
            {/* Header */}
            <View style={[s.header, { paddingTop: Math.max(insets.top, 24) }]}>
                <Text variant="display" style={s.headerTitle}>Subscriptions</Text>
                <View style={s.headerRight}>
                    <TouchableOpacity
                        style={[s.iconBtn, searchVisible && s.iconBtnActive]}
                        onPress={() => { setSearchVisible(v => !v); setSearchQuery(''); }}
                    >
                        <Search color={searchVisible ? colors.accent : colors.text} size={18} />
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
                <Text variant="brand" style={s.sectionEyebrow}>MONTHLY TOTAL</Text>
                <Text variant="sansBold" style={s.sectionBig}>{formatCurrency(monthlyTotal, currency)}</Text>

                {/* ── ANALYTICS section ── */}
                <Text variant="display" style={s.sectionLabel}>Insights</Text>

                <View style={s.analyticsContainer}>
                        {budget > 0 ? (
                            <TouchableOpacity style={s.budgetCard} onPress={() => router.push('/budget')} activeOpacity={0.7}>
                                <View style={s.budgetHeaderRow}>
                                    <View style={s.budgetIconBox}>
                                        <Target color={colors.accent} size={18} strokeWidth={2} />
                                    </View>
                                    <View style={s.budgetInfo}>
                                        <Text variant="brand" style={s.budgetTitle}>Monthly Budget</Text>
                                        <Text variant="sansBold" style={s.budgetAmt}>{formatCurrency(budget, currency)}</Text>
                                    </View>
                                    <View style={s.budgetRight}>
                                        <Text variant="sansBold" style={[s.budgetRemaining, monthlyTotal > budget && { color: colors.danger || '#EF4444' }]}>
                                            {monthlyTotal > budget ? 'Over budget' : `${formatCurrency(budget - monthlyTotal, currency)} left`}
                                        </Text>
                                    </View>
                                </View>
                                <View style={s.budgetProgressBg}>
                                    <View style={[s.budgetProgressFill, { width: `${Math.max(0, Math.min(100, (monthlyTotal / budget) * 100))}%`, backgroundColor: monthlyTotal > budget ? colors.danger || '#EF4444' : colors.accent }]} />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={s.budgetSetupCard} onPress={() => router.push('/budget')} activeOpacity={0.7}>
                                <View style={s.budgetIconBox}>
                                    <Target color={colors.accent} size={18} strokeWidth={2} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="brand" style={s.budgetTitle}>Set a Budget</Text>
                                    <Text variant="sans" style={s.budgetSub}>Track your spending limits easily.</Text>
                                </View>
                                <Plus color={colors.muted} size={20} />
                            </TouchableOpacity>
                        )}

                        <View style={s.donutWrap}>
                            <DonutChart subscriptions={current} currency={currency} compact />
                        </View>
                    </View>

                {/* ── CURRENT section ── */}
                <Text variant="display" style={[s.sectionLabel, { marginTop: 24 }]}>Current</Text>

                {current.length === 0 ? (
                    <View style={s.emptyBox}>
                        <CheckCircle2 color={colors.muted} size={22} strokeWidth={1.5} />
                        <Text variant="sans" style={s.emptyText}>No active subscriptions</Text>
                    </View>
                ) : (
                    <View style={s.list}>
                        {current.map(sub => {
                            const isPending = sub.status === 'pending_action';
                            const daysLeft = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
                            const isOverdue = !isPending && daysLeft < 0;
                            const isDueSoon = !isPending && !isOverdue && daysLeft <= 3;
                            const progress = getCycleProgress(sub);
                            const isGhost = flagGhostSub(sub.lastActivityDate);
                            const trialHoursLeft = sub.isTrial ? hoursUntil(sub.nextBillingDate) : 0;
                            const showTrialBadge = sub.isTrial && daysLeft <= 2;

                            // Distinct colors: amber = due soon, red = overdue
                            const cardBg = sub.isPaid
                                ? 'rgba(16,185,129,0.08)'
                                : isPending
                                    ? 'rgba(245,158,11,0.08)'
                                    : isOverdue ? 'rgba(239,68,68,0.08)'
                                        : isDueSoon ? 'rgba(251,146,60,0.08)' : colors.card;
                            const cardBorder = sub.isPaid
                                ? 'rgba(16,185,129,0.3)'
                                : isPending
                                    ? 'rgba(245,158,11,0.3)'
                                    : isOverdue ? 'rgba(239,68,68,0.3)'
                                        : isDueSoon ? 'rgba(251,146,60,0.3)' : 'transparent';
                            const accentColor = sub.isPaid ? '#10B981' : isPending ? '#F59E0B' : isOverdue ? '#EF4444' : isDueSoon ? '#FB923C' : '#3B82F6';

                            return (
                                <TouchableOpacity
                                    key={sub.id}
                                    style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1 }]}
                                    onPress={() => isPending ? setActionSub(sub) : router.push(`/sub/${sub.id}`)}
                                    activeOpacity={0.75}
                                >
                                    <View style={s.cardHeader}>
                                        <View style={[s.cardIcon, {
                                            backgroundColor: isPending ? 'rgba(245,158,11,0.15)'
                                                : isOverdue ? 'rgba(239,68,68,0.12)'
                                                    : isDueSoon ? 'rgba(251,146,60,0.12)' : colors.cardAlt
                                        }]}>
                                            {getServiceIcon(sub.name,
                                                isPending ? '#F59E0B'
                                                : isOverdue ? '#EF4444'
                                                : isDueSoon ? '#FB923C' : colors.text)}
                                        </View>
                                        <View style={s.cardInfo}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <IncognitoText
                                                    variant="brand"
                                                    style={[
                                                        s.cardName,
                                                        !sub.isPaid && (
                                                            isPending ? { color: '#F59E0B' }
                                                            : isOverdue ? { color: '#EF4444' }
                                                            : isDueSoon ? { color: '#FB923C' }
                                                            : {}
                                                        )
                                                    ]}
                                                    incognito={incognito}
                                                    numberOfLines={1}
                                                >
                                                    {sub.name}
                                                </IncognitoText>
                                            </View>
                                            <Text variant="sans" style={[s.cardBilling, !sub.isPaid && (
                                                isPending ? { color: '#F59E0B' }
                                                : isOverdue ? { color: '#EF4444' }
                                                : isDueSoon ? { color: '#FB923C' }
                                                : {}
                                            )]}>
                                                {isPending
                                                    ? (sub.isTrial ? 'Trial ended — action needed' : 'Overdue — action needed')
                                                    : isOverdue ? 'Overdue'
                                                        : daysLeft === 0 ? 'Due today'
                                                            : `Billing in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                                                }
                                            </Text>
                                        </View>
                                        <View style={s.cardRight}>
                                            {sub.isPaid ? (
                                                <>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                        <CheckCircle2 color="#10B981" size={14} strokeWidth={2.5} />
                                                        <Text variant="brand" style={{ fontSize: 13, color: '#10B981', marginLeft: 4 }}>PAID</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                                                        <IncognitoText variant="sans" style={{ color: colors.muted, fontSize: 13 }} incognito={incognito}>
                                                            {formatCurrency(sub.cost, currency)}
                                                        </IncognitoText>
                                                        <Text variant="sans" style={[s.cardFreq, { marginTop: 0, marginLeft: 2, fontSize: 12 }]}>/ {sub.billingCycle}</Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                      <IncognitoText
                                                          variant="sansBold"
                                                          style={[
                                                              s.cardCost,
                                                              (isPending || isOverdue || isDueSoon) && !sub.isPaid && { color: isPending ? '#F59E0B' : isOverdue ? '#EF4444' : '#FB923C' }
                                                          ]}
                                                          incognito={incognito}
                                                      >
                                                          {formatCurrency(sub.cost, currency)}
                                                      </IncognitoText>
                                                    </View>
                                                    <Text variant="sans" style={s.cardFreq}>/ {sub.billingCycle}</Text>
                                                </>
                                            )}
                                            {/* Trial countdown or label */}
                                            {showTrialBadge && !isPending && (
                                                <View style={s.trialBadge}>
                                                    <Clock color="#F59E0B" size={9} strokeWidth={2.5} />
                                                    <Text variant="brand" style={s.trialBadgeText}>
                                                        {trialHoursLeft > 0 ? `${trialHoursLeft}h` : 'Today'}
                                                    </Text>
                                                </View>
                                            )}
                                            {sub.isTrial && !showTrialBadge && !isPending && (
                                                <View style={s.trialLabel}>
                                                    <Text variant="brand" style={s.trialLabelText}>TRIAL</Text>
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                                onPress={() => setMenuSub(sub)}
                                                style={{ marginTop: 8 }}
                                            >
                                                <MoreHorizontal color={colors.muted} size={18} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {isPending ? (
                                        <View style={s.actionPrompt}>
                                            <AlertCircle color="#F59E0B" size={14} strokeWidth={2} />
                                            <Text variant="sans" style={s.actionPromptText}>Tap to renew or cancel</Text>
                                        </View>
                                    ) : (
                                        <View style={[s.progressBarBg, { marginTop: 4 }]}>
                                            <View style={[s.progressBarFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
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
                        <Text variant="display" style={[s.sectionLabel, { marginTop: 32 }]}>History</Text>
                        <View style={s.historyList}>
                            {history.map(sub => (
                                <View key={sub.id} style={s.historyRow}>
                                    <View style={[s.historyIcon, { backgroundColor: colors.cardAlt }]}>
                                        {getServiceIcon(sub.name, colors.muted)}
                                    </View>
                                    <View style={s.historyInfo}>
                                        <IncognitoText variant="brand" style={s.historyName} incognito={incognito} numberOfLines={1}>
                                            {sub.name}
                                        </IncognitoText>
                                        <Text variant="sans" style={s.historySub}>
                                            {sub.cancelledAt?.toDate
                                                ? `Cancelled ${sub.cancelledAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                : 'Cancelled'
                                            }
                                        </Text>
                                    </View>
                                    <View style={s.historyRight}>
                                        <IncognitoText variant="sansBold" style={s.historyCost} incognito={incognito}>
                                            {formatCurrency(sub.cost, currency)}
                                        </IncognitoText>
                                        <TouchableOpacity
                                            style={s.restoreBtn}
                                            onPress={() => restoreSubscription(user.uid, sub.id)}
                                            activeOpacity={0.7}
                                        >
                                            <RotateCcw color={colors.accent} size={13} strokeWidth={2} />
                                            <Text variant="brand" style={[s.restoreText, { color: colors.accent }]}>Restore</Text>
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

            <SubscriptionActionSheet
                visible={actionSub !== null}
                sub={actionSub}
                userId={user.uid}
                onRenew={(sub) => renewSubscription(user.uid, sub)}
                onCancel={(subId) => cancelSubscription(user.uid, subId)}
                onClose={() => setActionSub(null)}
            />

            <SubscriptionMenuSheet
                visible={menuSub !== null}
                sub={menuSub}
                onPaid={() => menuSub && markAsPaid(user.uid, menuSub.id)}
                onRenew={() => menuSub && renewSubscription(user.uid, menuSub)}
                onClose={() => setMenuSub(null)}
            />

        </Animated.View>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 16, marginBottom: 12,
        },
        headerTitle: { fontSize: 16, color: colors.text, letterSpacing: -0.3 },
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
        scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
        sectionEyebrow: { fontSize: 11, color: colors.muted, letterSpacing: 1.5, marginTop: 16, marginBottom: 4 },
        sectionBig: { fontSize: 32, color: colors.text, letterSpacing: -1, marginBottom: 24 },
        sectionLabel: { fontSize: 15, color: colors.text, letterSpacing: -0.2, marginBottom: 12 },
        list: { gap: 12 },
        card: { borderRadius: 16, padding: 18 },
        cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
        cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
        cardInfo: { flex: 1 },
        cardName: { fontSize: 15, color: colors.text, letterSpacing: -0.2, flex: 1 },
        cardBilling: { color: colors.muted, fontSize: 12 },
        cardRight: { alignItems: 'flex-end' },
        cardCost: { fontSize: 15, color: colors.text },
        cardFreq: { color: colors.muted, fontSize: 12 },
        actionPrompt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        actionPromptText: { fontSize: 13, color: '#F59E0B' },
        progressContainer: {},
        progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
        progressLabel: { color: colors.muted, fontSize: 11 },
        progressValue: { fontSize: 11, color: colors.text },
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
        historyName: { fontSize: 14, color: colors.muted, letterSpacing: -0.2 },
        historySub: { color: colors.muted, fontSize: 12, opacity: 0.6 },
        historyCost: { fontSize: 14, color: colors.muted },
        historyRight: { alignItems: 'flex-end', gap: 6 },
        restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        restoreText: { fontSize: 12, color: colors.accent },
        emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
        emptyText: { color: colors.muted, fontSize: 14 },
        // Ghost + Trial
        cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
        incognitoText: { opacity: 0.12, letterSpacing: 2 },
        trialBadge: {
            backgroundColor: 'rgba(245,158,11,0.12)',
            flexDirection: 'row', alignItems: 'center',
            gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 3,
        },
        trialBadgeText: { fontSize: 10, color: '#F59E0B' },
        trialLabel: {
            backgroundColor: 'rgba(239,68,68,0.1)',
            paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 3,
        },
        trialLabelText: { fontSize: 10, color: colors.danger },
        // Analytics
        analyticsContainer: { gap: 16, marginBottom: 8 },
        donutWrap: { alignItems: 'center', marginVertical: 10 },
        budgetCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
        budgetSetupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 },
        budgetHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
        budgetIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
        budgetInfo: { flex: 1 },
        budgetTitle: { fontSize: 14, color: colors.text, letterSpacing: -0.2, marginBottom: 2 },
        budgetAmt: { color: colors.muted, fontSize: 13 },
        budgetSub: { color: colors.muted, fontSize: 13 },
        budgetRemaining: { fontSize: 13, color: colors.success },
        budgetRight: { alignItems: 'flex-end' },
        budgetProgressBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
        budgetProgressFill: { height: '100%', borderRadius: 3 },
        // Locked
        lockedCard: { backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', alignItems: 'center' },
        lockedIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
        lockedTitle: { fontSize: 18, color: colors.text, letterSpacing: -0.3, marginBottom: 10 },
        lockedSub: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
        lockedBtn: { backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
        lockedBtnText: { fontSize: 14, color: colors.text },
        // Modal
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
        modalContent: { backgroundColor: colors.modal, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
        modalTitle: { fontSize: 18, color: colors.text, letterSpacing: -0.3, textAlign: 'center', marginBottom: 8 },
        modalSub: { color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
        modalInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 16, height: 60, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
        modalCurrency: { fontSize: 20, color: colors.muted, marginRight: 8 },
        modalInput: { flex: 1, fontSize: 24, color: colors.text },
        modalActions: { flexDirection: 'row', gap: 12 },
        modalBtnCancel: { flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
        modalBtnCancelText: { fontSize: 15, color: colors.muted },
        modalBtnSave: { flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
        modalBtnSaveText: { fontSize: 15, color: '#FFFFFF' },
    });
}

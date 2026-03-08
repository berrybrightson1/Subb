import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AlertCircle,
  Bell,
  BellOff,
  Calculator,
  Clock,
  CreditCard,
  Ghost,
  Plus,
  Shield,
  ShieldOff,
  Smartphone,
  Tv,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DonutChart } from '../../components/DonutChart';
import { GhostInsightModal } from '../../components/GhostInsightModal';
import { SubscriptionActionSheet } from '../../components/SubscriptionActionSheet';
import { Text } from '../../components/Text';
import { UserAvatar } from '../../components/UserAvatar';
import { IncognitoText } from '../../components/ui/IncognitoText';
import { useAppSettings } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useIncognito } from '../../hooks/useIncognito';
import { useIsPro } from '../../hooks/useIsPro';
import { Subscription, useSubscriptions } from '../../hooks/useSubscriptions';
import { ThemeColors } from '../../lib/theme';
import { toast } from '../../lib/toast';
import { calculateDaysRemaining, flagGhostSub, formatCurrency, hoursUntil } from '../../lib/utils';

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useIsPro(user?.uid);
  const { subscriptions, loading: subsLoading, renewSubscription, cancelSubscription } = useSubscriptions(user?.uid);
  const { colors, currency, taxEnabled, taxRate } = useAppSettings();
  const { incognito, enableIncognito, disableIncognito } = useIncognito();
  const router = useRouter();
  const [notifVisible, setNotifVisible] = useState(false);
  const [actionSub, setActionSub] = useState<Subscription | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [ghostSub, setGhostSub] = useState<Subscription | null>(null);
  // Track which sub IDs have already fired a haptic on entrance
  const animatedIds = useRef<Set<string>>(new Set());

  // Refresh avatar whenever this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userAvatarId').then(id => {
        setAvatarId(id);
      });
    }, [])
  );

  const s = useMemo(() => makeStyles(colors), [colors]);

  // Screen fade-in on tab focus
  const screenOpacity = useSharedValue(0);
  const screenY      = useSharedValue(10);
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

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading]);

  const getServiceIcon = (name: string, color = colors.text) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('netflix') || lowercase.includes('disney') || lowercase.includes('hbo'))
      return <Tv color={color} size={24} />;
    if (lowercase.includes('icloud') || lowercase.includes('mobile'))
      return <Smartphone color={color} size={24} />;
    return <CreditCard color={color} size={24} />;
  };

  const monthlyBurnRaw = subscriptions
    .filter(sub => sub.status !== 'cancelled')
    .reduce((acc, sub) => acc + (sub.billingCycle === 'Mo' ? sub.cost : sub.cost / 12), 0);
  const monthlyBurn = taxEnabled ? monthlyBurnRaw * (1 + taxRate / 100) : monthlyBurnRaw;

  const upcomingSubs = subscriptions
    .filter(sub => {
      const days = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
      return days >= 0 && days <= 2;
    })
    .sort((a, b) => {
      const daysA = calculateDaysRemaining(a.isTrial ? a.trialEndDate : a.nextBillingDate);
      const daysB = calculateDaysRemaining(b.isTrial ? b.trialEndDate : b.nextBillingDate);
      return daysA - daysB;
    });

  // Subs that are within their personal remindMeDaysBefore window
  const notifSubs = subscriptions
    .filter(sub => {
      const days = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
      return days >= 0 && days <= sub.remindMeDaysBefore;
    })
    .sort((a, b) => {
      const daysA = calculateDaysRemaining(a.isTrial ? a.trialEndDate : a.nextBillingDate);
      const daysB = calculateDaysRemaining(b.isTrial ? b.trialEndDate : b.nextBillingDate);
      return daysA - daysB;
    });

  if (authLoading || subsLoading || !user) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Animated.View style={[s.container, screenStyle]}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <UserAvatar
              avatarId={avatarId}
              displayName={user.displayName || user.email?.split('@')[0] || 'U'}
              size={32}
            />
          </TouchableOpacity>
          <Text variant="display" style={s.headerTitle}>Subscriptions</Text>
          <View style={s.headerRight}>
            {/* Incognito Toggle */}
            <TouchableOpacity
              style={[s.iconBtn, incognito && { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: colors.accent, borderWidth: 1 }]}
              onPress={incognito ? disableIncognito : enableIncognito}
              activeOpacity={0.8}
            >
              {incognito
                ? <ShieldOff color={colors.accent} size={18} strokeWidth={2} />
                : <Shield color={colors.muted} size={18} strokeWidth={2} />
              }
            </TouchableOpacity>
            {/* Calculator */}
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => {
                if (!isPro) {
                  toast.info('Subb Calc is a Pro feature');
                  router.push('/paywall');
                  return;
                }
                router.push('/calc');
              }}
            >
              <Calculator color={colors.text} size={20} />
            </TouchableOpacity>
            {/* Bell */}
            <TouchableOpacity style={s.bellBtn} onPress={() => setNotifVisible(true)}>
              <Bell color={colors.text} size={20} />
              {notifSubs.length > 0 && (
                <View style={s.badge}>
                  <Text variant="brand" style={s.badgeText}>{notifSubs.length > 9 ? '9+' : notifSubs.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Mode Banner */}
        {incognito && (
          <View style={[s.privacyBanner, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)' }]}>
            <Shield color={colors.accent} size={14} strokeWidth={2} />
            <Text variant="sans" style={[s.privacyText, { color: colors.accent }]}>Privacy Mode Active — values hidden</Text>
          </View>
        )}

        {/* Monthly Burn Hero */}
        <View style={[s.burnHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.burnHeader}>
            <View style={[s.burnIcon, { backgroundColor: colors.accentMuted }]}>
              <CreditCard color={colors.accent} size={20} strokeWidth={2.5} />
            </View>
            <Text variant="brand" style={s.burnLabel}>Current Monthly Spend</Text>
          </View>
          <IncognitoText variant="sansBold" style={s.burnAmount} incognito={incognito}>
            {formatCurrency(monthlyBurn, currency)}
          </IncognitoText>
          <View style={[s.taxIndicator, { backgroundColor: colors.cardAlt }]}>
            <Text variant="sans" style={[s.taxText, { color: colors.muted }]}>
              {taxEnabled ? `Includes ${taxRate}% Tax` : 'Base subscription total'}
            </Text>
          </View>
        </View>

        {/* Spending breakdown */}
        {subscriptions.filter(sub => sub.status !== 'cancelled').length > 0 && (
          <View style={[s.donutSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text variant="display" style={s.subSectionTitle}>Spending Analysis</Text>
            <DonutChart subscriptions={subscriptions} currency={currency} compact />
          </View>
        )}

        {/* Upcoming in 48h */}
        {upcomingSubs.length > 0 && (
          <View style={s.sectionHeader}>
            <Text variant="display" style={s.sectionTitle}>Due Soon</Text>
          </View>
        )}
        {upcomingSubs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.horizontalScroll} contentContainerStyle={s.horizontalContent}>
            {upcomingSubs.map((sub) => {
              const days = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[s.upcomingCard, { backgroundColor: sub.isTrial ? colors.danger : '#EF4444' }]}
                  onPress={() => router.push(`/sub/${sub.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={s.upcomingTop}>
                    <View style={[s.smallIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      {getServiceIcon(sub.name, '#fff')}
                    </View>
                    <Text variant="brand" style={[s.upcomingDays, { color: 'rgba(255,255,255,0.8)' }]}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </Text>
                  </View>
                  <IncognitoText variant="brand" style={[s.upcomingName, { color: '#FFFFFF' }]} incognito={incognito} numberOfLines={1}>
                    {sub.name}
                  </IncognitoText>
                  <IncognitoText variant="sansBold" style={[s.upcomingCost, { color: '#FFFFFF' }]} incognito={incognito}>
                    {formatCurrency(sub.cost, currency)}
                  </IncognitoText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* All Active */}
        <View style={s.sectionHeader}>
          <Text variant="display" style={s.sectionTitle}>All Subscriptions</Text>
        </View>

        <Animated.View
          layout={LinearTransition.springify().damping(15)}
          style={[s.groupedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {subscriptions.filter(sub => sub.status !== 'cancelled').map((sub, idx, arr) => {
            const isPending = sub.status === 'pending_action';
            const daysLeft = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
            const isUrgent = !isPending && daysLeft <= 3;
            const isLast = idx === arr.length - 1;
            const isGhost = flagGhostSub(sub.lastActivityDate);

            // Trial countdown: hours remaining until nextBillingDate
            const trialHoursLeft = sub.isTrial ? hoursUntil(sub.nextBillingDate) : 0;
            const showTrialBadge = sub.isTrial && daysLeft <= 2; // show 48h out

            return (
              <Animated.View
                key={sub.id}
                entering={ZoomIn.springify().damping(15).withCallback((finished) => {
                  'worklet';
                  if (finished && !animatedIds.current.has(sub.id)) {
                    animatedIds.current.add(sub.id);
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                  }
                })}
                layout={LinearTransition.springify().damping(15)}
              >
                <TouchableOpacity
                  style={[
                    s.subRow,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
                  ]}
                  onPress={() => isPending ? setActionSub(sub) : router.push(`/sub/${sub.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[s.subIconBox, { backgroundColor: isPending ? 'rgba(245,158,11,0.1)' : colors.cardAlt }]}>
                    {getServiceIcon(sub.name, isPending ? '#F59E0B' : isUrgent ? colors.danger : colors.text)}
                  </View>

                  <View style={s.subInfo}>
                    <View style={s.subNameRow}>
                      <IncognitoText
                        variant="brand"
                        style={[s.subName, { color: isPending ? '#F59E0B' : colors.text }]}
                        incognito={incognito}
                        numberOfLines={1}
                      >
                        {sub.name}
                      </IncognitoText>
                      {/* Ghost indicator */}
                      {isGhost && (
                        <TouchableOpacity
                          onPress={() => setGhostSub(sub)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={s.ghostBtn}
                        >
                          <Ghost color="#64748B" size={14} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text variant="sans" style={[s.subStatus, { color: isUrgent ? colors.danger : colors.muted }]}>
                      {isPending
                        ? (sub.isTrial ? 'Trial Ended' : 'Action Required')
                        : isUrgent
                          ? (daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'Due Tomorrow' : `Due in ${daysLeft} days`)
                          : sub.isTrial ? 'Trial Subscription' : `${sub.billingCycle === 'Mo' ? 'Monthly' : 'Yearly'} Plan`
                      }
                    </Text>
                  </View>

                  <View style={s.subRight}>
                    <IncognitoText variant="sansBold" style={[s.subPrice, { color: colors.text }]} incognito={incognito}>
                      {formatCurrency(sub.cost, currency)}
                    </IncognitoText>
                    {/* Trial countdown badge */}
                    {showTrialBadge && !isPending && (
                      <View style={s.trialBadge}>
                        <Clock color="#F59E0B" size={9} strokeWidth={2.5} />
                        <Text variant="brand" style={s.trialBadgeText}>
                          {trialHoursLeft > 0 ? `${trialHoursLeft}h` : 'Today'}
                        </Text>
                      </View>
                    )}
                    {/* Trial label badge (when not urgent) */}
                    {sub.isTrial && !showTrialBadge && !isPending && (
                      <View style={[s.trialLabel]}>
                        <Text variant="brand" style={s.trialLabelText}>TRIAL</Text>
                      </View>
                    )}
                    {isPending && (
                      <View style={s.urgentBadge}>
                        <AlertCircle color="#F59E0B" size={10} />
                        <Text variant="brand" style={s.urgentText}>FIX</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          {subscriptions.filter(sub => sub.status !== 'cancelled').length === 0 && (
            <View style={s.emptyState}>
              <Text variant="sans" style={[s.emptyText, { color: colors.muted }]}>No active subscriptions</Text>
            </View>
          )}
        </Animated.View>

      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/add')}>
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

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

      {/* Notification Center Modal */}
      <Modal visible={notifVisible} transparent animationType="slide" onRequestClose={() => setNotifVisible(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setNotifVisible(false)} />
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.modalHeader}>
              <Text variant="display" style={s.modalTitle}>Notifications</Text>
              <TouchableOpacity style={s.closeBtn} onPress={() => setNotifVisible(false)}>
                <X color={colors.muted} size={18} />
              </TouchableOpacity>
            </View>

            {notifSubs.length === 0 ? (
              <View style={s.emptyNotif}>
                <BellOff color={colors.cardAlt} size={40} strokeWidth={1.5} />
                <Text variant="display" style={s.emptyNotifTitle}>All clear</Text>
                <Text variant="sans" style={s.emptyNotifSub}>No upcoming renewals in your alert window.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.notifList}>
                {notifSubs.map(sub => {
                  const days = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
                  const isUrgent = days <= 1;
                  return (
                    <TouchableOpacity key={sub.id} style={s.notifCard} activeOpacity={0.7} onPress={() => { setNotifVisible(false); router.push(`/sub/${sub.id}`); }}>
                      <View style={[s.notifDot, { backgroundColor: isUrgent ? colors.danger : colors.accent }]} />
                      <View style={[s.notifIcon, { backgroundColor: isUrgent ? colors.dangerMuted : colors.accentMuted }]}>
                        {getServiceIcon(sub.name)}
                      </View>
                      <View style={s.notifInfo}>
                        <Text variant="brand" style={s.notifName}>{sub.name}</Text>
                        <Text variant="sans" style={[s.notifWhen, { color: isUrgent ? colors.danger : colors.muted }]}>
                          {sub.isTrial ? 'Trial ends ' : 'Renews '}
                          {days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}
                        </Text>
                      </View>
                      <IncognitoText variant="sansBold" style={[s.notifCost, { color: isUrgent ? colors.danger : colors.text }]} incognito={incognito}>
                        {formatCurrency(sub.cost, currency)}
                      </IncognitoText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: 20, paddingBottom: 140 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    },
    bellBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-end' },
    badge: {
      position: 'absolute', top: -4, right: -6,
      backgroundColor: colors.danger, borderRadius: 8,
      minWidth: 16, height: 16,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 3,
    },
    privacyBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
      borderWidth: 1, marginBottom: 16,
    },
    // Burn Hero
    burnHero: {
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      marginBottom: 20,
      alignItems: 'center',
    },
    burnHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    burnIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    taxIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    // Spending Section
    donutSection: { borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    horizontalScroll: { marginHorizontal: -20, marginBottom: 24 },
    horizontalContent: { paddingHorizontal: 20, gap: 12 },
    // Upcoming Card
    upcomingCard: {
      width: 130, padding: 14, borderRadius: 20, gap: 10,
      shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    upcomingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    smallIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    // Grouped Card (Premium List)
    groupedCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
    subRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    subIconBox: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    subInfo: { flex: 1 },
    subNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    ghostBtn: { padding: 2 },
    subRight: { alignItems: 'flex-end', gap: 4 },
    trialBadge: {
      backgroundColor: 'rgba(245,158,11,0.12)',
      flexDirection: 'row', alignItems: 'center',
      gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    trialLabel: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    urgentBadge: {
      backgroundColor: 'rgba(245,158,11,0.1)',
      flexDirection: 'row', alignItems: 'center',
      gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    emptyState: { padding: 40, alignItems: 'center' },
    blurOverlay: {
      position: 'absolute', top: 0, left: 0,
      alignItems: 'center', justifyContent: 'center',
    },
    blurBar: {
      height: '60%',
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 4,
    },
    fab: {
      position: 'absolute', bottom: 32, right: 24,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: colors.modal,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: '70%', paddingTop: 12,
      borderTopWidth: 1, borderColor: colors.card,
    },
    handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.cardAlt, marginBottom: 16 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    // Text styles (must carry color from theme — no hardcoding)
    headerTitle: { fontSize: 16, color: colors.text, letterSpacing: -0.3 },
    burnLabel: { fontSize: 14, color: colors.muted, letterSpacing: 0.2 },
    burnAmount: { fontSize: 36, color: colors.text, letterSpacing: -1, marginBottom: 12 },
    subSectionTitle: { fontSize: 14, color: colors.text, marginBottom: 12, letterSpacing: -0.2 },
    sectionTitle: { fontSize: 15, color: colors.text, letterSpacing: -0.2 },
    taxText: { fontSize: 12, color: colors.muted },
    upcomingDays: { fontSize: 11 },
    upcomingName: { fontSize: 14, letterSpacing: -0.2 },
    upcomingCost: { fontSize: 15 },
    subName: { fontSize: 15, color: colors.text, letterSpacing: -0.2, flex: 1 },
    subStatus: { fontSize: 12, color: colors.muted },
    subPrice: { fontSize: 15, color: colors.text },
    badgeText: { fontSize: 10, color: '#FFFFFF' },
    trialBadgeText: { fontSize: 10, color: '#F59E0B' },
    trialLabelText: { fontSize: 10, color: colors.danger },
    urgentText: { fontSize: 10, color: '#F59E0B' },
    emptyText: { fontSize: 14, color: colors.muted },
    modalTitle: { fontSize: 17, color: colors.text, letterSpacing: -0.3 },
    emptyNotif: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
    emptyNotifTitle: { fontSize: 17, color: colors.text, marginTop: 16, marginBottom: 8 },
    emptyNotifSub: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    notifList: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
    notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14 },
    notifDot: { width: 8, height: 8, borderRadius: 4 },
    notifIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    notifInfo: { flex: 1 },
    notifName: { fontSize: 14, color: colors.text, marginBottom: 2 },
    notifCost: { fontSize: 14, color: colors.text },
    notifWhen: { fontSize: 13, color: colors.muted },
    privacyText: { fontSize: 13, color: colors.accent },
  });
}


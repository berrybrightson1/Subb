import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Pencil,
  RotateCcw,
  Smartphone,
  Trash2,
  Tv,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingGroup } from '../../components/ui/SettingGroup';
import { SettingRow } from '../../components/ui/SettingRow';
import { useAppSettings } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { ThemeColors } from '../../lib/theme';
import { toast } from '../../lib/toast';
import { calculateDaysRemaining, formatCurrency } from '../../lib/utils';

// ─── Months ───────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  prefix,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  prefix?: string;
  colors: ThemeColors;
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value.length > 0 ? 1 : 0)).current;
  const isUp = focused || value.length > 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isUp ? 1 : 0,
      duration: 140,
      useNativeDriver: false,
    }).start();
  }, [isUp]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [19, 7] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 11] });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.muted, colors.accent],
  });

  return (
    <View
      style={[
        fiStyles.wrapper,
        { backgroundColor: colors.card, borderColor: focused ? colors.accent : 'transparent' },
      ]}
    >
      <Animated.Text style={[fiStyles.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      <View style={fiStyles.row}>
        {prefix !== undefined && isUp && (
          <Text style={[fiStyles.prefix, { color: colors.muted }]}>{prefix}</Text>
        )}
        <TextInput
          style={[fiStyles.input, { color: colors.text, paddingTop: isUp ? 14 : 0 }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          keyboardAppearance="dark"
          selectionColor={colors.accent}
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
}

const fiStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 62,
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  floatLabel: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  prefix: { fontSize: 16, marginRight: 2 },
  input: { flex: 1, fontSize: 16 },
});

// ─── Inline Date Picker Modal ─────────────────────────────────────────────────
function DatePickerModal({
  visible,
  title,
  value,
  accentColor,
  onConfirm,
  onCancel,
  colors,
}: {
  visible: boolean;
  title: string;
  value: Date;
  accentColor: string;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);

  function stepYear(dir: number) { setYear(y => y + dir); }
  function stepMonth(dir: number) {
    setMonth(m => {
      const next = m + dir;
      if (next < 0) { setYear(y => y - 1); return 11; }
      if (next > 11) { setYear(y => y + 1); return 0; }
      return next;
    });
  }
  function stepDay(dir: number) {
    setDay(d => {
      const next = d + dir;
      const max = new Date(year, month + 1, 0).getDate();
      if (next < 1) return max;
      if (next > max) return 1;
      return next;
    });
  }

  if (!visible) return null;

  return (
    <View style={dpStyles.overlay}>
      <TouchableOpacity style={dpStyles.backdrop} activeOpacity={1} onPress={onCancel} />
      <View style={[dpStyles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
        <View style={[dpStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={[dpStyles.cancel, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[dpStyles.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={() => onConfirm(new Date(year, month, safeDay))}>
            <Text style={[dpStyles.done, { color: accentColor }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={dpStyles.wheels}>
          {[
            { label: String(safeDay).padStart(2, '0'), step: stepDay },
            { label: MONTHS[month], step: stepMonth },
            { label: String(year), step: stepYear },
          ].map((wheel, i) => (
            <View key={i} style={[dpStyles.wheel, { backgroundColor: colors.cardAlt, flex: i === 0 ? 1 : 1.4 }]}>
              <TouchableOpacity onPress={() => wheel.step(-1)} style={dpStyles.arrow}>
                <ChevronLeft color={colors.muted} size={20} />
              </TouchableOpacity>
              <Text style={[dpStyles.value, { color: colors.text }]}>{wheel.label}</Text>
              <TouchableOpacity onPress={() => wheel.step(1)} style={dpStyles.arrow}>
                <ChevronRight color={colors.muted} size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const dpStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancel: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: '600' },
  done: { fontSize: 16, fontWeight: '700' },
  wheels: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 24, gap: 8 },
  wheel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  arrow: { padding: 4 },
  value: { fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { subscriptions, updateSubscription, deleteSubscription, cancelSubscription } = useSubscriptions(user?.uid);
  const { colors, currency } = useAppSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const s = useMemo(() => makeStyles(colors), [colors]);

  const sub = subscriptions.find(s => s.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [cycle, setCycle] = useState<'Mo' | 'Yr'>('Mo');
  const [billingDate, setBillingDate] = useState(new Date());
  const [isTrial, setIsTrial] = useState(false);
  const [remindDays, setRemindDays] = useState('3');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Sync form from sub when navigating to this screen
  useEffect(() => {
    if (!sub) return;
    setName(sub.name);
    setCost(String(sub.cost));
    setCycle(sub.billingCycle);
    setIsTrial(sub.isTrial);
    setRemindDays(String(sub.remindMeDaysBefore));
    const dateSource = sub.isTrial ? sub.trialEndDate : sub.nextBillingDate;
    setBillingDate(dateSource?.toDate?.() ?? new Date());
  }, [sub?.id]);

  const getServiceIcon = useCallback((subName: string, size = 28) => {
    const lc = subName.toLowerCase();
    if (lc.includes('netflix') || lc.includes('disney') || lc.includes('hbo'))
      return <Tv color={colors.text} size={size} />;
    if (lc.includes('icloud') || lc.includes('mobile'))
      return <Smartphone color={colors.text} size={size} />;
    return <CreditCard color={colors.text} size={size} />;
  }, [colors.text]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost <= 0) { toast.error('Invalid amount'); return; }
    if (!user || !sub) return;

    try {
      await updateSubscription(user.uid, sub.id, {
        name: name.trim(),
        cost: parsedCost,
        billingCycle: cycle,
        isTrial,
        nextBillingDate: isTrial ? sub.nextBillingDate : Timestamp.fromDate(billingDate),
        trialEndDate: isTrial ? Timestamp.fromDate(billingDate) : null,
        remindMeDaysBefore: parseInt(remindDays, 10) || 3,
      });
      setIsEditing(false);
      toast.success('Subb Updated');
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleCancel = () => {
    if (!sub) return;
    setName(sub.name);
    setCost(String(sub.cost));
    setCycle(sub.billingCycle);
    setIsTrial(sub.isTrial);
    setRemindDays(String(sub.remindMeDaysBefore));
    const dateSource = sub.isTrial ? sub.trialEndDate : sub.nextBillingDate;
    setBillingDate(dateSource?.toDate?.() ?? new Date());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!user || !sub) return;
    try {
      await deleteSubscription(user.uid, sub.id);
      toast.success(`${sub.name} removed`);
      router.back();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCancelSub = async () => {
    if (!user || !sub) return;
    try {
      await cancelSubscription(user.uid, sub.id);
      toast.success(`${sub.name} moved to History`);
      router.back();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (!sub) {
    return (
      <SafeAreaView style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={22} />
          <Text style={s.backLabel}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const daysLeft = calculateDaysRemaining(sub.isTrial ? sub.trialEndDate : sub.nextBillingDate);
  const totalDays = sub.billingCycle === 'Mo' ? 30 : 365;
  const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));
  const progressColor = sub.isTrial ? colors.danger : colors.accent;
  const billingLabel =
    daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={[s.headerAction, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Edit</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[s.headerAction, { color: colors.accent, fontWeight: '700' }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[s.editScroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <View style={s.fieldGroup}>
              <FloatingInput
                label="Service Name"
                value={name}
                onChangeText={setName}
                colors={colors}
              />
            </View>

            {/* Cost + Cycle */}
            <View style={[s.fieldGroup, { flexDirection: 'row', gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <FloatingInput
                  label="Amount"
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="decimal-pad"
                  prefix={currency === 'JPY' ? '¥' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}
                  colors={colors}
                />
              </View>
              <View style={[s.cycleWrapper, { flex: 1, backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[s.cycleBtn, cycle === 'Mo' && { backgroundColor: colors.accent }]}
                  onPress={() => setCycle('Mo')}
                >
                  <Text style={[s.cycleTxt, { color: cycle === 'Mo' ? '#fff' : colors.muted }]}>Monthly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cycleBtn, cycle === 'Yr' && { backgroundColor: colors.accent }]}
                  onPress={() => setCycle('Yr')}
                >
                  <Text style={[s.cycleTxt, { color: cycle === 'Yr' ? '#fff' : colors.muted }]}>Yearly</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date */}
            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: colors.muted }]}>
                {isTrial ? 'Trial Ends' : 'Next Billing Date'}
              </Text>
              <TouchableOpacity style={[s.dateBtn, { backgroundColor: colors.card }]} onPress={() => setPickerOpen(true)}>
                <CalendarDays color={isTrial ? colors.danger : colors.accent} size={18} />
                <Text style={[s.dateTxt, { color: isTrial ? colors.danger : colors.text }]}>
                  {fmtDate(billingDate)}
                </Text>
                <Text style={[s.dateCaret, { color: colors.muted }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Trial toggle */}
            <View style={[s.trialCard, { backgroundColor: colors.card }]}>
              <View style={s.trialLeft}>
                <View style={[s.trialBadge, { backgroundColor: colors.dangerMuted }]}>
                  <Clock color={colors.danger} size={20} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.trialTitle, { color: colors.text }]}>Free Trial</Text>
                  <Text style={[s.trialSub, { color: colors.muted }]}>
                    {isTrial ? 'Alert fires before conversion' : 'Standard subscription'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isTrial}
                onValueChange={setIsTrial}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {/* Remind days */}
            <View style={s.fieldGroup}>
              <FloatingInput
                label="Remind me before (days)"
                value={remindDays}
                onChangeText={setRemindDays}
                keyboardType="number-pad"
                colors={colors}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <DatePickerModal
          visible={pickerOpen}
          title={isTrial ? 'Trial End Date' : 'Next Billing Date'}
          value={billingDate}
          accentColor={isTrial ? colors.danger : colors.accent}
          onConfirm={(d) => { setBillingDate(d); setPickerOpen(false); }}
          onCancel={() => setPickerOpen(false)}
          colors={colors}
        />
      </SafeAreaView>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={22} />
          <Text style={s.backLabel}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.editChip, { backgroundColor: colors.accentMuted }]}
          onPress={() => setIsEditing(true)}
        >
          <Pencil color={colors.accent} size={14} />
          <Text style={[s.editChipText, { color: colors.accent }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.viewScroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Area */}
        <View style={[s.heroContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.heroIconBox, { backgroundColor: sub.isTrial ? colors.dangerMuted : colors.accentMuted }]}>
            {getServiceIcon(sub.name, 36)}
          </View>
          <Text style={[s.heroName, { color: colors.text }]}>{sub.name}</Text>
          <Text style={[s.heroCost, { color: colors.text }]}>
            {formatCurrency(sub.cost, currency)}
            <Text style={[s.heroFreq, { color: colors.muted }]}> / {sub.billingCycle === 'Mo' ? 'mo' : 'yr'}</Text>
          </Text>

          <View style={[s.statusBadge, {
            backgroundColor: sub.status === 'cancelled' ? 'rgba(107,114,128,0.1)'
              : sub.status === 'pending_action' ? 'rgba(245,158,11,0.1)'
                : sub.isTrial ? colors.dangerMuted : colors.accentMuted
          }]}>
            <Text style={[s.statusText, {
              color: sub.status === 'cancelled' ? '#6B7280'
                : sub.status === 'pending_action' ? '#F59E0B'
                  : sub.isTrial ? colors.danger : colors.accent
            }]}>
              {sub.status === 'cancelled' ? 'Inactive'
                : sub.status === 'pending_action' ? 'Action Required'
                  : sub.isTrial ? 'Trialing' : 'Active Subscription'}
            </Text>
          </View>
        </View>

        {/* Subscription Details Group */}
        <SettingGroup label="Subscription Info" colors={colors}>
          <SettingRow
            label={sub.isTrial ? 'Trial Ends' : 'Next Billing'}
            icon={<CalendarDays size={18} color="#fff" />}
            iconBg={sub.isTrial ? colors.danger : colors.accent}
            subLabel={fmtDate((sub.isTrial ? sub.trialEndDate : sub.nextBillingDate)?.toDate?.() ?? new Date())}
            rightContent={<Text style={[s.detailValue, { color: colors.text }]}>{billingLabel}</Text>}
            colors={colors}
            showArrow={false}
          />
          <SettingRow
            label="Alert Offset"
            icon={<Clock size={18} color="#fff" />}
            iconBg="#F59E0B"
            subLabel={`Notify ${sub.remindMeDaysBefore} days before`}
            colors={colors}
            showArrow={false}
          />
          <SettingRow
            label="Billing Cycle"
            icon={<RotateCcw size={18} color="#fff" />}
            iconBg="#3B82F6"
            subLabel={sub.billingCycle === 'Mo' ? 'Monthly' : 'Yearly'}
            colors={colors}
            last
            showArrow={false}
          />
        </SettingGroup>

        {/* Cycle Progress Card */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardHeader}>
            <Text style={[s.cardTitle, { color: colors.muted }]}>Current Cycle Progress</Text>
            <Text style={[s.cardPct, { color: progressColor }]}>{Math.round(progress)}%</Text>
          </View>
          <View style={[s.progBg, { backgroundColor: colors.cardAlt }]}>
            <View style={[s.progFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
          </View>
        </View>

        {/* Management Zone */}
        <SettingGroup label="Account Management" colors={colors}>
          {sub.status !== 'cancelled' && (
            <SettingRow
              label="Cancel Subscription"
              icon={<RotateCcw size={18} color="#fff" />}
              iconBg="#F59E0B"
              colors={colors}
              onPress={() => setConfirmCancel(true)}
            />
          )}
          <SettingRow
            label="Delete Forever"
            icon={<Trash2 size={18} color="#fff" />}
            iconBg={colors.danger}
            colors={colors}
            danger
            last
            onPress={() => setConfirmDelete(true)}
          />
        </SettingGroup>

        {/* Confirmation Overlays (keeping the existing confirm zones for now but adding spacing) */}
        {confirmCancel && (
          <View style={[s.confirmOverlay, { backgroundColor: colors.card, borderColor: '#F59E0B' }]}>
            <Text style={[s.confirmTitle, { color: colors.text }]}>Cancel {sub.name}?</Text>
            <Text style={[s.confirmSub, { color: colors.muted }]}>Moves to History. You can restore it later.</Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={[s.confBtn, { backgroundColor: colors.cardAlt }]} onPress={() => setConfirmCancel(false)}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.confBtn, { backgroundColor: '#F59E0B' }]} onPress={handleCancelSub}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {confirmDelete && (
          <View style={[s.confirmOverlay, { backgroundColor: colors.card, borderColor: colors.danger }]}>
            <Text style={[s.confirmTitle, { color: colors.text }]}>Delete {sub.name}?</Text>
            <Text style={[s.confirmSub, { color: colors.muted }]}>This action cannot be undone.</Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={[s.confBtn, { backgroundColor: colors.cardAlt }]} onPress={() => setConfirmDelete(false)}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.confBtn, { backgroundColor: colors.danger }]} onPress={handleDelete}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
    headerAction: { fontSize: 16 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    backLabel: { color: colors.text, fontSize: 16 },
    editChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    editChipText: { fontSize: 14, fontWeight: '600' },

    // View mode premium
    viewScroll: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },
    heroContainer: {
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
    },
    heroIconBox: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroName: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
    heroCost: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
    heroFreq: { fontSize: 16, fontWeight: '400' },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },

    detailValue: { fontSize: 15, fontWeight: '700' },

    // Card/Progress
    card: { borderRadius: 24, padding: 20, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardPct: { fontSize: 15, fontWeight: '800' },
    progBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progFill: { height: '100%', borderRadius: 4 },

    confirmOverlay: {
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      marginTop: 8,
      gap: 12,
    },
    confirmTitle: { fontSize: 18, fontWeight: '700' },
    confirmSub: { fontSize: 14, lineHeight: 20 },
    confirmActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    confBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    // Edit mode
    editScroll: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
    fieldGroup: { marginBottom: 14 },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    cycleWrapper: {
      borderRadius: 14,
      height: 62,
      padding: 4,
      flexDirection: 'row',
      gap: 4,
    },
    cycleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    cycleTxt: { fontSize: 13, fontWeight: '600' },
    dateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
      gap: 10,
    },
    dateTxt: { flex: 1, fontSize: 16 },
    dateCaret: { fontSize: 20, marginTop: -2 },
    trialCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
    },
    trialLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    trialBadge: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    trialTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    trialSub: { fontSize: 12 },
  });
}

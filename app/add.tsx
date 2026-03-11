import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, ChevronRight as Arrow, Lock, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { CATEGORY_COLORS } from '../components/DonutChart';
import { useAppSettings } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useIsPro } from '../hooks/useIsPro';
import { SubCategory, useSubscriptions } from '../hooks/useSubscriptions';
import { toast } from '../lib/toast';

const ACCENT = '#A855F7';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Inline Date Picker ───────────────────────────────────────────────────────
interface DatePickerProps {
    visible: boolean;
    title: string;
    value: Date;
    accentColor?: string;
    onConfirm: (d: Date) => void;
    onCancel: () => void;
}

function DatePickerModal({ visible, title, value, accentColor = ACCENT, onConfirm, onCancel }: DatePickerProps) {
    const insets = useSafeAreaInsets();
    const { colors } = useAppSettings();
    const [year, setYear] = useState(value.getFullYear());
    const [month, setMonth] = useState(value.getMonth());
    const [day, setDay] = useState(value.getDate());

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const safeDay = Math.min(day, daysInMonth);

    function stepYear(dir: number) { setYear(y => y + dir); }
    function stepMonth(dir: number) {
        setMonth(m => {
            let next = m + dir;
            if (next < 0) { setYear(y => y - 1); return 11; }
            if (next > 11) { setYear(y => y + 1); return 0; }
            return next;
        });
    }
    function stepDay(dir: number) {
        setDay(d => {
            let next = d + dir;
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
            <View style={[dpStyles.sheet, { backgroundColor: colors.modal, paddingBottom: insets.bottom + 8 }]}>
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
                    <View style={[dpStyles.wheel, { backgroundColor: colors.cardAlt }]}>
                        <TouchableOpacity onPress={() => stepDay(-1)} style={dpStyles.arrow}><ChevronLeft color={colors.muted} size={20} /></TouchableOpacity>
                        <Text style={[dpStyles.value, { color: colors.text }]}>{safeDay.toString().padStart(2, '0')}</Text>
                        <TouchableOpacity onPress={() => stepDay(1)} style={dpStyles.arrow}><ChevronRight color={colors.muted} size={20} /></TouchableOpacity>
                    </View>
                    <View style={[dpStyles.wheel, { flex: 1.5, backgroundColor: colors.cardAlt }]}>
                        <TouchableOpacity onPress={() => stepMonth(-1)} style={dpStyles.arrow}><ChevronLeft color={colors.muted} size={20} /></TouchableOpacity>
                        <Text style={[dpStyles.value, { color: colors.text }]}>{MONTHS[month]}</Text>
                        <TouchableOpacity onPress={() => stepMonth(1)} style={dpStyles.arrow}><ChevronRight color={colors.muted} size={20} /></TouchableOpacity>
                    </View>
                    <View style={[dpStyles.wheel, { flex: 1.5, backgroundColor: colors.cardAlt }]}>
                        <TouchableOpacity onPress={() => stepYear(-1)} style={dpStyles.arrow}><ChevronLeft color={colors.muted} size={20} /></TouchableOpacity>
                        <Text style={[dpStyles.value, { color: colors.text }]}>{year}</Text>
                        <TouchableOpacity onPress={() => stepYear(1)} style={dpStyles.arrow}><ChevronRight color={colors.muted} size={20} /></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const dpStyles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
    title: { fontSize: 15 },
    cancel: { fontSize: 16 },
    done: { fontSize: 16 },
    wheels: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 24, gap: 8 },
    wheel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 8 },
    value: { fontSize: 18, minWidth: 36, textAlign: 'center' },
    arrow: { padding: 4 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const CATEGORIES: SubCategory[] = ['Entertainment', 'Productivity', 'Health', 'Education', 'Utilities', 'Other'];
type DateField = 'start' | 'billing';

export default function AddSubscriptionScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { addSubscription, subscriptions } = useSubscriptions(user?.uid);
    const { colors } = useAppSettings();
    const { isPro } = useIsPro(user?.uid);
    const insets = useSafeAreaInsets();

    const FREE_SUB_LIMIT = 5;
    const activeSubCount = subscriptions.filter(s => s.status !== 'cancelled').length;

    function dismiss() {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }

    const params = useLocalSearchParams<{ initialAmount?: string }>();
    const [name, setName] = useState('');
    const [cost, setCost] = useState(params.initialAmount || '');
    const [cycle, setCycle] = useState<'Mo' | 'Yr'>('Mo');
    const [isTrial, setIsTrial] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [billingDate, setBillingDate] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() + 1); return d;
    });
    const [remindDays, setRemindDays] = useState('3');
    const [category, setCategory] = useState<SubCategory>('Other');
    const [pickerField, setPickerField] = useState<DateField | null>(null);

    function onConfirm(date: Date) {
        if (pickerField === 'start') {
            setStartDate(date);
            const next = new Date(date);
            if (cycle === 'Mo') next.setMonth(next.getMonth() + 1);
            else next.setFullYear(next.getFullYear() + 1);
            setBillingDate(next);
        } else {
            setBillingDate(date);
        }
        setPickerField(null);
    }

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Service name is required'); return; }
        const parsedCost = parseFloat(cost);
        if (!cost || isNaN(parsedCost) || parsedCost <= 0) { toast.error('Enter a valid price'); return; }
        if (!user) { toast.error('You must be logged in'); return; }
        try {
            await addSubscription(user.uid, {
                name: name.trim(), cost: parsedCost, billingCycle: cycle, category, isTrial,
                startDate: Timestamp.fromDate(startDate),
                nextBillingDate: Timestamp.fromDate(billingDate),
                trialEndDate: isTrial ? Timestamp.fromDate(billingDate) : null,
                remindMeDaysBefore: parseInt(remindDays, 10) || 3,
            });
            toast.success(`${name.trim()} added!`);
            dismiss();
        } catch {
            toast.error('Failed to save subscription');
        }
    };

    const sep = <View style={[s.sep, { backgroundColor: colors.border }]} />;

    return (
        <KeyboardAvoidingView
            style={[s.container, { backgroundColor: colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                    <X color={colors.text} size={18} strokeWidth={2} />
                </TouchableOpacity>
                <Text variant="display" style={[s.title, { color: colors.text }]}>New Subscription</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.scroll}
            >
                {/* ── Service & Price ── */}
                <Text variant="sans" style={[s.sectionLabel, { color: colors.muted }]}>DETAILS</Text>
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.row}>
                        <Text variant="sans" style={[s.label, { color: colors.text }]}>Service</Text>
                        <TextInput
                            style={[s.input, { color: colors.text }]}
                            placeholder="e.g. Netflix"
                            placeholderTextColor={colors.muted}
                            value={name}
                            onChangeText={setName}
                            autoCorrect={false}
                        />
                    </View>
                    {sep}
                    <View style={s.row}>
                        <Text variant="sans" style={[s.label, { color: colors.text }]}>Price</Text>
                        <View style={s.rowRight}>
                            <TextInput
                                style={[s.input, { color: colors.text, textAlign: 'right', minWidth: 60 }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.muted}
                                keyboardType="decimal-pad"
                                value={cost}
                                onChangeText={setCost}
                            />
                            <View style={[s.segment, { backgroundColor: colors.cardAlt }]}>
                                <TouchableOpacity
                                    style={[s.segBtn, cycle === 'Mo' && { backgroundColor: ACCENT }]}
                                    onPress={() => setCycle('Mo')}
                                >
                                    <Text variant="brand" style={[s.segTxt, { color: cycle === 'Mo' ? '#fff' : colors.muted }]}>Monthly</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.segBtn, cycle === 'Yr' && { backgroundColor: ACCENT }]}
                                    onPress={() => setCycle('Yr')}
                                >
                                    <Text variant="brand" style={[s.segTxt, { color: cycle === 'Yr' ? '#fff' : colors.muted }]}>Yearly</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Billing ── */}
                <Text variant="sans" style={[s.sectionLabel, { color: colors.muted }]}>BILLING</Text>
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={s.row} onPress={() => setPickerField('start')}>
                        <Text variant="sans" style={[s.label, { color: colors.text }]}>Start Date</Text>
                        <View style={s.rowRight}>
                            <Text variant="sans" style={[s.value, { color: colors.muted }]}>{formatDate(startDate)}</Text>
                            <Arrow color={colors.muted} size={14} />
                        </View>
                    </TouchableOpacity>
                    {sep}
                    <TouchableOpacity style={s.row} onPress={() => setPickerField('billing')}>
                        <Text variant="sans" style={[s.label, { color: colors.text }]}>{isTrial ? 'Trial End' : 'Next Bill'}</Text>
                        <View style={s.rowRight}>
                            <Text variant="sans" style={[s.value, { color: isTrial ? '#EF4444' : colors.muted }]}>{formatDate(billingDate)}</Text>
                            <Arrow color={colors.muted} size={14} />
                        </View>
                    </TouchableOpacity>
                    {sep}
                    <View style={s.row}>
                        <Text variant="sans" style={[s.label, { color: colors.text }]}>Reminder</Text>
                            <View style={s.rowRight}>
                                <TextInput
                                    style={[s.input, { color: colors.text, textAlign: 'right', width: 32 }]}
                                    keyboardType="number-pad"
                                    value={remindDays}
                                    onChangeText={setRemindDays}
                                    maxLength={2}
                                />
                                <Text variant="sans" style={{ color: colors.muted, fontSize: 14 }}>days before</Text>
                            </View>
                    </View>
                </View>

                {/* ── Options ── */}
                <Text variant="sans" style={[s.sectionLabel, { color: colors.muted }]}>OPTIONS</Text>
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.row}>
                        <Text variant="sans" style={[s.label, { color: colors.text }]}>Free Trial</Text>
                        <Switch
                            value={isTrial}
                            onValueChange={setIsTrial}
                            trackColor={{ false: colors.border, true: ACCENT }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* ── Category ── */}
                <Text variant="sans" style={[s.sectionLabel, { color: colors.muted }]}>CATEGORY</Text>
                <View style={[s.card, { backgroundColor: colors.card }]}>
                    <View style={s.catGrid}>
                        {CATEGORIES.map(cat => {
                            const active = category === cat;
                            const color  = CATEGORY_COLORS[cat];
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[s.chip, { backgroundColor: colors.cardAlt }, active && { backgroundColor: `${color}22`, borderColor: color }]}
                                    onPress={() => setCategory(cat)}
                                    activeOpacity={0.7}
                                >
                                    <Text variant="brand" style={[s.chipTxt, { color: colors.muted }, active && { color }]}>{cat}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Fixed footer */}
            <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.bg }]}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: ACCENT }]} onPress={handleSave} activeOpacity={0.85}>
                    <Text variant="brand" style={s.saveTxt}>Add Subscription</Text>
                </TouchableOpacity>
            </View>

            <DatePickerModal visible={pickerField === 'start'} title="Start Date" value={startDate} accentColor={ACCENT} onConfirm={onConfirm} onCancel={() => setPickerField(null)} />
            <DatePickerModal visible={pickerField === 'billing'} title={isTrial ? 'Trial End Date' : 'Next Billing Date'} value={billingDate} accentColor={isTrial ? '#EF4444' : ACCENT} onConfirm={onConfirm} onCancel={() => setPickerField(null)} />
        </KeyboardAvoidingView>
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

    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    footer: { paddingHorizontal: 16, paddingTop: 12 },

    sectionLabel: { fontSize: 12, letterSpacing: 0.6, marginTop: 20, marginBottom: 8, marginLeft: 4 },

    card:    { borderRadius: 14, overflow: 'hidden' },
    row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 50 },
    rowRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
    sep:     { height: StyleSheet.hairlineWidth, marginLeft: 16 },

    label: { fontSize: 15 },
    input: { fontSize: 15 },
    value: { fontSize: 15 },

    segment: { flexDirection: 'row', borderRadius: 8, padding: 2 },
    segBtn:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    segTxt:  { fontSize: 13 },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
    chip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    chipTxt: { fontSize: 13 },

    saveBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    saveTxt: { fontSize: 16, color: '#fff', letterSpacing: 0.2 },
});

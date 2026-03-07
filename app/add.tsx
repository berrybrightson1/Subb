import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Hash, Tag, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_COLORS } from '../components/DonutChart';
import { Paywall } from '../components/Paywall';
import { SettingGroup } from '../components/ui/SettingGroup';
import { SettingRow } from '../components/ui/SettingRow';
import { useAppSettings } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useIsPro } from '../hooks/useIsPro';
import { SubCategory, useSubscriptions } from '../hooks/useSubscriptions';
import { toast } from '../lib/toast';

const ACCENT = '#A855F7';
const BG = '#0F0F13';
const MUTED = '#A1A1AA';

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

    function confirm() {
        onConfirm(new Date(year, month, safeDay));
    }

    if (!visible) return null;

    return (
        <View style={dpStyles.overlay}>
            <TouchableOpacity style={dpStyles.backdrop} activeOpacity={1} onPress={onCancel} />
            <View style={[dpStyles.sheet, { paddingBottom: insets.bottom + 8 }]}>
                {/* Header */}
                <View style={dpStyles.header}>
                    <TouchableOpacity onPress={onCancel}>
                        <Text style={dpStyles.cancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={dpStyles.title}>{title}</Text>
                    <TouchableOpacity onPress={confirm}>
                        <Text style={[dpStyles.done, { color: accentColor }]}>Done</Text>
                    </TouchableOpacity>
                </View>

                <View style={dpStyles.wheels}>
                    {/* Day */}
                    <View style={dpStyles.wheel}>
                        <TouchableOpacity onPress={() => stepDay(-1)} style={dpStyles.arrow}>
                            <ChevronLeft color={MUTED} size={20} />
                        </TouchableOpacity>
                        <Text style={dpStyles.value}>{safeDay.toString().padStart(2, '0')}</Text>
                        <TouchableOpacity onPress={() => stepDay(1)} style={dpStyles.arrow}>
                            <ChevronRight color={MUTED} size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Month */}
                    <View style={[dpStyles.wheel, { flex: 1.5 }]}>
                        <TouchableOpacity onPress={() => stepMonth(-1)} style={dpStyles.arrow}>
                            <ChevronLeft color={MUTED} size={20} />
                        </TouchableOpacity>
                        <Text style={dpStyles.value}>{MONTHS[month]}</Text>
                        <TouchableOpacity onPress={() => stepMonth(1)} style={dpStyles.arrow}>
                            <ChevronRight color={MUTED} size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Year */}
                    <View style={[dpStyles.wheel, { flex: 1.5 }]}>
                        <TouchableOpacity onPress={() => stepYear(-1)} style={dpStyles.arrow}>
                            <ChevronLeft color={MUTED} size={20} />
                        </TouchableOpacity>
                        <Text style={dpStyles.value}>{year}</Text>
                        <TouchableOpacity onPress={() => stepYear(1)} style={dpStyles.arrow}>
                            <ChevronRight color={MUTED} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const dpStyles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
        backgroundColor: '#1A1A22',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A35',
    },
    cancel: { color: MUTED, fontSize: 16 },
    title: { color: '#fff', fontSize: 16, fontWeight: '600' },
    done: { fontSize: 16, fontWeight: '700' },
    wheels: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 24,
        gap: 8,
    },
    wheel: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C23',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    arrow: { padding: 4 },
    value: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const CATEGORIES: SubCategory[] = ['Entertainment', 'Productivity', 'Health', 'Education', 'Utilities', 'Other'];
type DateField = 'start' | 'billing';

export default function AddSubscriptionScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { addSubscription, subscriptions } = useSubscriptions(user?.uid);
    const { colors } = useAppSettings();
    const { isPro, onPurchaseSuccess } = useIsPro(user?.uid);
    const insets = useSafeAreaInsets();
    const [paywallVisible, setPaywallVisible] = useState(false);

    const FREE_SUB_LIMIT = 5;
    const activeSubCount = subscriptions.filter(s => s.status !== 'cancelled').length;

    // On web there may be no stack to go back to — fall back to home
    function dismiss() {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }

    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [cycle, setCycle] = useState<'Mo' | 'Yr'>('Mo');
    const [isTrial, setIsTrial] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [billingDate, setBillingDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d;
    });
    const [remindDays, setRemindDays] = useState('3');
    const [category, setCategory] = useState<SubCategory>('Other');

    const [pickerField, setPickerField] = useState<DateField | null>(null);

    function openPicker(field: DateField) { setPickerField(field); }

    function onConfirm(date: Date) {
        if (pickerField === 'start') {
            setStartDate(date);
            // Auto-calculate billing date based on cycle
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

        // ─── Paywall Cap: Free users limited to 5 active subscriptions
        if (!isPro && activeSubCount >= FREE_SUB_LIMIT) {
            toast.info('Upgrade to Subb Pro for unlimited subscriptions');
            setPaywallVisible(true);
            return;
        }

        try {
            await addSubscription(user.uid, {
                name: name.trim(),
                cost: parsedCost,
                billingCycle: cycle,
                category,
                isTrial,
                startDate: Timestamp.fromDate(startDate),
                nextBillingDate: Timestamp.fromDate(billingDate),
                trialEndDate: isTrial ? Timestamp.fromDate(billingDate) : null,
                remindMeDaysBefore: parseInt(remindDays, 10) || 3,
            });
            toast.success(`${name.trim()} added!`);
            dismiss();
        } catch (error) {
            toast.error('Failed to save subscription');
            console.error(error);
        }
    };

    return (
        <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={dismiss} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheet}
            >
                <View style={styles.handle} />

                <View style={styles.header}>
                    <Text style={styles.title}>New Subscription</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
                        <X color={MUTED} size={20} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.form}
                >
                    <SettingGroup label="Basic Details" colors={colors}>
                        <SettingRow
                            label="Service"
                            icon={<Tag size={18} color="#fff" />}
                            iconBg={ACCENT}
                            colors={colors}
                            showArrow={false}
                            rightContent={
                                <TextInput
                                    style={[styles.input, { color: colors.text, textAlign: 'right', maxWidth: 180 }]}
                                    placeholder="e.g. Netflix"
                                    placeholderTextColor={colors.muted}
                                    value={name}
                                    onChangeText={setName}
                                    autoCorrect={false}
                                />
                            }
                        />
                        <SettingRow
                            label="Price"
                            icon={<Hash size={18} color="#fff" />}
                            iconBg="#10B981"
                            colors={colors}
                            showArrow={false}
                            rightContent={
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ color: colors.text, fontWeight: '700' }}>$</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, textAlign: 'right', width: 80, fontWeight: '700' }]}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.muted}
                                        keyboardType="decimal-pad"
                                        value={cost}
                                        onChangeText={setCost}
                                    />
                                </View>
                            }
                        />
                        <SettingRow
                            label="Cycle"
                            icon={<CalendarDays size={18} color="#fff" />}
                            iconBg="#3B82F6"
                            colors={colors}
                            last
                            showArrow={false}
                            rightContent={
                                <View style={styles.cycleWrapper}>
                                    <TouchableOpacity
                                        style={[styles.cycleBtn, cycle === 'Mo' && { backgroundColor: ACCENT }]}
                                        onPress={() => setCycle('Mo')}
                                    >
                                        <Text style={[styles.cycleTxt, cycle === 'Mo' && { color: '#fff' }]}>Mo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.cycleBtn, cycle === 'Yr' && { backgroundColor: ACCENT }]}
                                        onPress={() => setCycle('Yr')}
                                    >
                                        <Text style={[styles.cycleTxt, cycle === 'Yr' && { color: '#fff' }]}>Yr</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </SettingGroup>

                    <SettingGroup label="Alerts & Timing" colors={colors}>
                        <SettingRow
                            label="Billing Start"
                            icon={<CalendarDays size={18} color="#fff" />}
                            iconBg="#F59E0B"
                            colors={colors}
                            onPress={() => openPicker('start')}
                            rightContent={<Text style={[styles.valueText, { color: colors.text }]}>{formatDate(startDate)}</Text>}
                        />
                        <SettingRow
                            label={isTrial ? 'Trial End' : 'Next Bill'}
                            icon={<CalendarDays size={18} color="#fff" />}
                            iconBg={isTrial ? '#EF4444' : ACCENT}
                            colors={colors}
                            onPress={() => openPicker('billing')}
                            rightContent={<Text style={[styles.valueText, { color: isTrial ? '#EF4444' : colors.text }]}>{formatDate(billingDate)}</Text>}
                        />
                        <SettingRow
                            label="Reminder"
                            icon={<Clock size={18} color="#fff" />}
                            iconBg="#6366F1"
                            colors={colors}
                            showArrow={false}
                            rightContent={
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, textAlign: 'right', width: 40 }]}
                                        placeholder="3"
                                        placeholderTextColor={colors.muted}
                                        keyboardType="number-pad"
                                        value={remindDays}
                                        onChangeText={setRemindDays}
                                        maxLength={2}
                                    />
                                    <Text style={{ color: colors.muted, fontSize: 13 }}>days</Text>
                                </View>
                            }
                            last
                        />
                    </SettingGroup>

                    <SettingGroup label="Additional Info" colors={colors}>
                        <SettingRow
                            label="Free Trial"
                            icon={<Clock size={18} color="#fff" />}
                            iconBg="#EF4444"
                            colors={colors}
                            showArrow={false}
                            rightContent={
                                <Switch
                                    value={isTrial}
                                    onValueChange={setIsTrial}
                                    trackColor={{ false: colors.border, true: ACCENT }}
                                    thumbColor="#fff"
                                />
                            }
                        />
                        <View style={{ padding: 16 }}>
                            <Text style={styles.catLabel}>Category</Text>
                            <View style={styles.catRow}>
                                {CATEGORIES.map(cat => {
                                    const active = category === cat;
                                    const color = CATEGORY_COLORS[cat];
                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.catChip,
                                                { backgroundColor: colors.cardAlt },
                                                active && { backgroundColor: `${color}22`, borderColor: color },
                                            ]}
                                            onPress={() => setCategory(cat)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={[styles.catChipTxt, { color: colors.muted }, active && { color }]}>{cat}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </SettingGroup>
                </ScrollView>

                {/* Sticky footer button */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                        <Text style={styles.saveTxt}>Add Subscription</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Custom Date Pickers */}
            <DatePickerModal
                visible={pickerField === 'start'}
                title="Start Date"
                value={startDate}
                accentColor={ACCENT}
                onConfirm={onConfirm}
                onCancel={() => setPickerField(null)}
            />
            <DatePickerModal
                visible={pickerField === 'billing'}
                title={isTrial ? 'Trial End Date' : 'Next Billing Date'}
                value={billingDate}
                accentColor={isTrial ? '#EF4444' : ACCENT}
                onConfirm={onConfirm}
                onCancel={() => setPickerField(null)}
            />
            {/* Paywall */}
            <Paywall
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                onSuccess={onPurchaseSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
        backgroundColor: BG,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingTop: 12,
    },
    handle: {
        alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
        backgroundColor: '#333', marginBottom: 16,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, marginBottom: 16,
    },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#1A1A22', alignItems: 'center', justifyContent: 'center',
    },
    form: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },

    input: { fontSize: 15 },
    valueText: { fontSize: 15, fontWeight: '600' },

    cycleWrapper: { flexDirection: 'row', backgroundColor: '#1A1A22', borderRadius: 10, padding: 3, gap: 2 },
    cycleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
    cycleTxt: { color: MUTED, fontSize: 11, fontWeight: '700' },

    catLabel: { color: MUTED, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    catChipTxt: { fontSize: 13, fontWeight: '600' },

    footer: {
        paddingHorizontal: 24, paddingTop: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    },
    saveBtn: {
        backgroundColor: ACCENT, height: 56,
        borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    },
    saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

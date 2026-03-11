import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import {
    Bell,
    CircleDollarSign,
    Crown,
    Download,
    Languages,
    LifeBuoy,
    LogOut,
    Minus,
    Moon,
    Palette,
    Plus,
    RotateCcw,
    Sun,
    SunMoon,
    Trash2
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { UserAvatar } from '../../components/UserAvatar';
import { SettingGroup } from '../../components/ui/SettingGroup';
import { SettingRow } from '../../components/ui/SettingRow';
import { CURRENCIES, useAppSettings } from '../../contexts/AppContext';
import { GoalType } from '../../contexts/OnboardingContext';
import { useAuth } from '../../hooks/useAuth';
import { useIncognito } from '../../hooks/useIncognito';
import { useIsPro } from '../../hooks/useIsPro';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { auth } from '../../lib/firebase';
import { ThemeMode } from '../../lib/theme';
import { toast } from '../../lib/toast';
import { formatCurrency } from '../../lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const SLATE = '#94A3B8';

const GOAL_META: Record<GoalType, { label: string; color: string; bg: string; border: string }> = {
    save: { label: 'Save Money', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    alerts: { label: 'Stay Informed', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
    trials: { label: 'Cancel Trials', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
};

const THEME_OPTIONS: { mode: ThemeMode; label: string; Icon: React.ComponentType<{ color: string; size: number }> }[] = [
    { mode: 'light', label: 'Light', Icon: Sun },
    { mode: 'dark', label: 'Dark', Icon: Moon },
    { mode: 'system', label: 'System', Icon: SunMoon },
];

export default function SettingsScreen() {
    const { user, loading } = useAuth();
    const { subscriptions } = useSubscriptions(user?.uid);
    const {
        colors,
        themeMode,
        setThemeMode,
        currency,
        setCurrency,
        taxEnabled,
        setTaxEnabled,
        taxRate,
        setTaxRate,
        notifDays,
        setNotifDays,
        isDark
    } = useAppSettings();
    const { isPro, onPurchaseSuccess, restorePurchases } = useIsPro(user?.uid);
    const { incognito, enableIncognito, disableIncognito } = useIncognito();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState('');
    const [nameDraft, setNameDraft] = useState('');
    const [goal, setGoal] = useState<GoalType | null>(null);
    const [avatarId, setAvatarId] = useState<string | null>(null);
    const nameInputRef = useRef<TextInput>(null);

    useEffect(() => {
        AsyncStorage.getItem('userGoal').then(g => {
            if (g) setGoal(g as GoalType);
        });
    }, []);

    useFocusEffect(useCallback(() => {
        AsyncStorage.getItem('userAvatarId').then(id => {
            if (id) setAvatarId(id);
        });
    }, []));

    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
    }, [user, loading]);

    useEffect(() => {
        if (user) {
            const n = user.displayName || user.email?.split('@')[0] || 'User';
            setNameValue(n);
        }
    }, [user?.displayName, user?.email]);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const activeSubs = subscriptions.filter(s => s.status !== 'cancelled');
    const monthlyRaw = activeSubs.reduce(
        (acc, sub) => acc + (sub.billingCycle === 'Mo' ? sub.cost : sub.cost / 12),
        0
    );
    const monthly = taxEnabled ? monthlyRaw * (1 + taxRate / 100) : monthlyRaw;
    const yearly = monthly * 12;

    // ── Name editing ──────────────────────────────────────────────────────────
    const startEdit = () => {
        setNameDraft(nameValue);
        setEditingName(true);
        setTimeout(() => nameInputRef.current?.focus(), 40);
    };

    const cancelEdit = () => {
        setEditingName(false);
        setNameDraft('');
    };

    const saveName = async () => {
        if (!auth.currentUser) return;
        const trimmed = nameDraft.trim();
        if (!trimmed || trimmed === nameValue) {
            cancelEdit();
            return;
        }
        try {
            await updateProfile(auth.currentUser, { displayName: trimmed });
            setNameValue(trimmed);
            toast.profile('Name updated');
        } catch {
            toast.error('Could not update name');
        }
        setEditingName(false);
    };

    // ── Avatar picker ─────────────────────────────────────────────────────────
    // ── Account actions ───────────────────────────────────────────────────────
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out');
        } catch {
            toast.error('Failed to sign out');
        }
    };

    const handleExport = async () => {
        const header = 'Name,Cost,Billing Cycle,Next Billing Date,Status';
        const rows = subscriptions.map(sub => {
            const date = sub.nextBillingDate?.toDate ? sub.nextBillingDate.toDate().toISOString().split('T')[0] : '';
            return `"${sub.name}",${sub.cost},${sub.billingCycle},${date},${sub.isTrial ? 'Trial' : 'Active'}`;
        });
        try {
            await Share.share({ message: [header, ...rows].join('\n'), title: 'Subscriptions Export' });
            toast.success('Export ready');
        } catch {
            toast.error('Export failed');
        }
    };

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

    if (loading || !user) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={VIOLET} />
            </View>
        );
    }

    const displayName = nameValue || 'User';
    const gm = goal ? GOAL_META[goal] : null;

    return (
        <Animated.View style={[styles.container, { backgroundColor: colors.bg }, screenStyle]}>
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 24) + 20, paddingBottom: Math.max(insets.bottom, 24) + 120 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Profile Header ────────────────────────────────────────── */}
                <View style={styles.header}>
                    <UserAvatar
                        avatarId={avatarId}
                        displayName={displayName}
                        size={90}
                        onPress={() => router.push('/avatar-picker')}
                    />
                    <View style={styles.headerTexts}>
                        {editingName ? (
                            <View style={styles.nameEditRow}>
                                <TextInput
                                    ref={nameInputRef}
                                    style={[styles.nameInput, { color: colors.text, borderBottomColor: VIOLET }]}
                                    value={nameDraft}
                                    onChangeText={setNameDraft}
                                    returnKeyType="done"
                                    onSubmitEditing={saveName}
                                    selectionColor={VIOLET}
                                    autoCorrect={false}
                                />
                                <TouchableOpacity onPress={saveName}>
                                    <Text style={styles.nameAction}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={startEdit} style={styles.nameButton}>
                                <Text variant="display" style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
                            </TouchableOpacity>
                        )}
                        {/* ── Pro Badge ────────────────────────────────────────────── */}
                        <View style={[styles.proBadge, { backgroundColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.3)' }]}>
                            <Crown color={VIOLET} size={13} strokeWidth={2.5} />
                            <Text variant="brand" style={[styles.proBadgeText, { color: VIOLET }]}>Subb Pro</Text>
                        </View>
                        <Text variant="sans" style={[styles.email, { color: colors.muted }]}>{user.email}</Text>
                        {gm && (
                            <View style={[styles.goalBadge, { backgroundColor: gm.bg, borderColor: gm.border }]}>
                                <Text variant="brand" style={[styles.goalBadgeText, { color: gm.color }]}>{gm.label}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Stats Summary ────────────────────────────────────────── */}
                <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.stat}>
                        <Text variant="sansBold" style={[styles.statValue, { color: colors.text }]}>{activeSubs.length}</Text>
                        <Text variant="sans" style={[styles.statLabel, { color: colors.muted }]}>Active</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.stat}>
                        <Text variant="sansBold" style={[styles.statValue, { color: colors.text }]}>{formatCurrency(monthly, currency)}</Text>
                        <Text variant="sans" style={[styles.statLabel, { color: colors.muted }]}>Monthly</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.stat}>
                        <Text variant="sansBold" style={[styles.statValue, { color: colors.text }]}>{formatCurrency(yearly, currency)}</Text>
                        <Text variant="sans" style={[styles.statLabel, { color: colors.muted }]}>Yearly</Text>
                    </View>
                </View>

                {/* ── Settings Groups ──────────────────────────────────────── */}
                <SettingGroup label="Appearance" colors={colors}>
                    <SettingRow
                        label="Theme"
                        icon={<Palette size={18} color="#fff" />}
                        iconBg="#A855F7"
                        colors={colors}
                        showArrow={false}
                        rightContent={
                            <View style={styles.themeToggle}>
                                {THEME_OPTIONS.map(({ mode, Icon }) => (
                                    <TouchableOpacity
                                        key={mode}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setThemeMode(mode);
                                        }}
                                        style={[
                                            styles.themeOption,
                                            themeMode === mode && { backgroundColor: isDark ? '#2A2A35' : '#E5E7EB' }
                                        ]}
                                    >
                                        <Icon size={14} color={themeMode === mode ? VIOLET : colors.muted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        }
                    />
                    <SettingRow
                        label="Currency"
                        icon={<Languages size={18} color="#fff" />}
                        iconBg="#10B981"
                        colors={colors}
                        last
                        showArrow={false}
                        rightContent={
                            <View style={{ width: 180 }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.currencyList}
                                >
                                    {CURRENCIES.map((cur) => (
                                        <TouchableOpacity
                                            key={cur}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setCurrency(cur);
                                            }}
                                            style={[
                                                styles.currencyChip,
                                                currency === cur && { borderColor: VIOLET, backgroundColor: 'rgba(139,92,246,0.1)' }
                                            ]}
                                        >
                                            <Text style={[
                                                styles.currencyText,
                                                { color: currency === cur ? VIOLET : colors.muted }
                                            ]}>{cur}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        }
                    />
                </SettingGroup>

                <SettingGroup label="Preferences" colors={colors}>
                    <SettingRow
                        label="Tax Calculation"
                        subLabel="Include tax in totals"
                        icon={<CircleDollarSign size={18} color="#fff" />}
                        iconBg="#3B82F6"
                        colors={colors}
                        last={!taxEnabled}
                        showArrow={false}
                        rightContent={
                            <Switch
                                value={taxEnabled}
                                onValueChange={v => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setTaxEnabled(v);
                                }}
                                trackColor={{ false: colors.border, true: 'rgba(139,92,246,0.5)' }}
                                thumbColor={taxEnabled ? VIOLET : colors.muted}
                            />
                        }
                    />
                    {taxEnabled && (
                        <SettingRow
                            label="Tax Rate"
                            subLabel={`${taxRate}% applied to costs`}
                            colors={colors}
                            last
                            showArrow={false}
                            rightContent={
                                <View style={styles.stepper}>
                                    <TouchableOpacity onPress={() => setTaxRate(Math.max(0, taxRate - 1))} style={styles.stepBtn}>
                                        <Minus size={16} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepVal, { color: colors.text }]}>{taxRate}</Text>
                                    <TouchableOpacity onPress={() => setTaxRate(Math.min(50, taxRate + 1))} style={styles.stepBtn}>
                                        <Plus size={16} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    )}
                </SettingGroup>

                <SettingGroup label="Pro Features" colors={colors}>
                    <SettingRow
                        label="Restore Purchases"
                        subLabel="Recover a previous Pro purchase"
                        icon={<RotateCcw size={18} color="#fff" />}
                        iconBg="#64748B"
                        colors={colors}
                        last
                        onPress={async () => {
                            toast.success('You already have full access — app is free!');
                        }}
                    />
                </SettingGroup>

                <SettingGroup label="Notifications" colors={colors}>
                    <SettingRow
                        label="Renewal Alerts"
                        subLabel={`Notify ${notifDays} days before`}
                        icon={<Bell size={18} color="#fff" />}
                        iconBg="#F59E0B"
                        colors={colors}
                        last
                        showArrow={false}
                        rightContent={
                            <View style={styles.stepper}>
                                <TouchableOpacity onPress={() => setNotifDays(Math.max(1, notifDays - 1))} style={styles.stepBtn}>
                                    <Minus size={16} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.stepVal, { color: colors.text }]}>{notifDays}</Text>
                                <TouchableOpacity onPress={() => setNotifDays(Math.min(14, notifDays + 1))} style={styles.stepBtn}>
                                    <Plus size={16} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        }
                    />
                </SettingGroup>

                <SettingGroup label="Support" colors={colors}>
                    <SettingRow
                        label="Priority Support"
                        subLabel="Get help directly from the founders"
                        icon={<LifeBuoy size={18} color="#fff" />}
                        iconBg="#10B981"
                        colors={colors}
                        last
                        onPress={() => Linking.openURL('mailto:hello@subb.app')}
                    />
                </SettingGroup>

                <SettingGroup label="Account" colors={colors}>
                    <SettingRow
                        label="Export Subscriptions"
                        icon={<Download size={18} color="#fff" />}
                        iconBg="#8B5CF6"
                        onPress={handleExport}
                        colors={colors}
                    />
                    <SettingRow
                        label="Sign Out"
                        icon={<LogOut size={18} color="#fff" />}
                        iconBg={SLATE}
                        onPress={handleSignOut}
                        colors={colors}
                        last
                    />
                </SettingGroup>

                <SettingGroup label="Danger Zone" colors={colors}>
                    <SettingRow
                        label="Delete Account"
                        icon={<Trash2 size={18} color="#fff" />}
                        iconBg={colors.danger}
                        onPress={() => router.push('/delete-account')}
                        danger
                        colors={colors}
                        last
                    />
                </SettingGroup>

                <Text variant="sans" style={[styles.version, { color: colors.muted }]}>Subb v1.0.0 • Premium Tracker</Text>
            </ScrollView >

        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 140 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 4,
    },
    headerTexts: {
        marginLeft: 18,
        flex: 1,
    },
    displayName: {
        fontSize: 24,
        letterSpacing: -0.5,
    },
    nameButton: {
        paddingVertical: 2,
    },
    email: {
        fontSize: 14,
        marginTop: 2,
    },
    nameEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nameInput: {
        fontSize: 20,
        borderBottomWidth: 1,
        minWidth: 120,
        paddingVertical: 2,
    },
    nameAction: {
        color: VIOLET,
        fontSize: 15,
    },
    goalBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    goalBadgeText: {
        fontSize: 11,
        textTransform: 'uppercase',
    },
    proBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 6,
    },
    proBadgeText: {
        fontSize: 12,
    },

    // Stats Bar
    statsBar: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 18,
        borderWidth: 1,
        marginBottom: 32,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 17,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: '60%',
        alignSelf: 'center',
    },

    // Custom components inside rows
    themeToggle: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 3,
        gap: 2,
    },
    themeOption: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencyList: {
        gap: 8,
        paddingRight: 10,
    },
    currencyChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currencyText: {
        fontSize: 13,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: 2,
    },
    stepBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepVal: {
        fontSize: 14,
        minWidth: 26,
        textAlign: 'center',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 10,
    },
});

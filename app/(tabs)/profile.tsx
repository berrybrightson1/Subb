import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { deleteUser, signOut, updateProfile } from 'firebase/auth';
import {
    Bell,
    CircleDollarSign,
    Crown,
    Download,
    Languages,
    Lock,
    LogOut,
    Mail,
    Minus,
    Moon,
    Palette,
    Plus,
    RotateCcw,
    Sun,
    SunMoon,
    Trash2
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarPicker } from '../../components/AvatarPicker';
import { Paywall } from '../../components/Paywall';
import { SecureDeleteModal } from '../../components/SecureDeleteModal';
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
    const [paywallVisible, setPaywallVisible] = useState(false);

    const [deleteVisible, setDeleteVisible] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState('');
    const [nameDraft, setNameDraft] = useState('');
    const [goal, setGoal] = useState<GoalType | null>(null);
    const [avatarId, setAvatarId] = useState<string | null>(null);
    const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
    const nameInputRef = useRef<TextInput>(null);

    useEffect(() => {
        AsyncStorage.getItem('userGoal').then(g => {
            if (g) setGoal(g as GoalType);
        });
        AsyncStorage.getItem('userAvatarId').then(id => {
            if (id) setAvatarId(id);
        });
    }, []);

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
    const handleAvatarSelected = async (id: string) => {
        setAvatarId(id);
        await AsyncStorage.setItem('userAvatarId', id);
        toast.profile('Avatar updated!');
    };

    // ── Account actions ───────────────────────────────────────────────────────
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out');
        } catch {
            toast.error('Failed to sign out');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            if (!auth.currentUser) throw new Error('No user');
            await deleteUser(auth.currentUser);
            setDeleteVisible(false);
            toast.success('Account deleted');
        } catch (e: any) {
            setDeleteVisible(false);
            toast.error(e.message || 'Failed to delete account');
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

    if (loading || !user) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={VIOLET} />
            </SafeAreaView>
        );
    }

    const displayName = nameValue || 'User';
    const gm = goal ? GOAL_META[goal] : null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Profile Header ────────────────────────────────────────── */}
                <View style={styles.header}>
                    <UserAvatar
                        avatarId={avatarId}
                        displayName={displayName}
                        size={90}
                        onPress={() => setAvatarPickerVisible(true)}
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
                                <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
                            </TouchableOpacity>
                        )}
                        {/* ── Pro Badge ────────────────────────────────────────────── */}
                        {isPro ? (
                            <View style={[styles.proBadge, { backgroundColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.3)' }]}>
                                <Crown color={VIOLET} size={13} strokeWidth={2.5} />
                                <Text style={[styles.proBadgeText, { color: VIOLET }]}>Subb Pro</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.proBadge, { backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.15)' }]}
                                onPress={() => setPaywallVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Crown color="rgba(139,92,246,0.5)" size={13} strokeWidth={2.5} />
                                <Text style={[styles.proBadgeText, { color: 'rgba(139,92,246,0.5)' }]}>Upgrade to Pro</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={[styles.email, { color: colors.muted }]}>{user.email}</Text>
                        {gm && (
                            <View style={[styles.goalBadge, { backgroundColor: gm.bg, borderColor: gm.border }]}>
                                <Text style={[styles.goalBadgeText, { color: gm.color }]}>{gm.label}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Stats Summary ────────────────────────────────────────── */}
                <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{activeSubs.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>Active</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(monthly, currency)}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>Monthly</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(yearly, currency)}</Text>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>Yearly</Text>
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

                {/* ── Pro Features (gated) ─────────────────────────────────── */}
                <SettingGroup label="Pro Features" colors={colors}>
                    <SettingRow
                        label="Gmail Sync"
                        subLabel={isPro ? 'Auto-detect subscriptions' : 'Pro Feature'}
                        icon={isPro ? <Mail size={18} color="#fff" /> : <Lock size={18} color="#fff" />}
                        iconBg={isPro ? '#EA4335' : '#64748B'}
                        colors={colors}
                        onPress={() => {
                            if (!isPro) {
                                toast.info('Gmail Sync is a Pro feature');
                                setPaywallVisible(true);
                            } else {
                                toast.info('Gmail Sync coming soon!');
                            }
                        }}
                    />
                    {!isPro && (
                        <SettingRow
                            label="Subb Pro"
                            subLabel="Unlock all features"
                            icon={<Crown size={18} color="#fff" />}
                            iconBg={VIOLET}
                            colors={colors}
                            onPress={() => setPaywallVisible(true)}
                        />
                    )}
                    <SettingRow
                        label="Restore Purchases"
                        subLabel="Recover a previous Pro purchase"
                        icon={<RotateCcw size={18} color="#fff" />}
                        iconBg="#64748B"
                        colors={colors}
                        last
                        onPress={async () => {
                            await restorePurchases();
                            toast.success(isPro ? 'Pro restored' : 'No active purchases found');
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
                        onPress={() => setDeleteVisible(true)}
                        danger
                        colors={colors}
                        last
                    />
                </SettingGroup>

                <Text style={[styles.version, { color: colors.muted }]}>Subb v1.0.0 • Premium Tracker</Text>
            </ScrollView >

            {/* Paywall */}
            <Paywall
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                onSuccess={async () => {
                    await onPurchaseSuccess();
                    setPaywallVisible(false);
                }}
            />

            <SecureDeleteModal
                visible={deleteVisible}
                onClose={() => setDeleteVisible(false)}
                onConfirm={handleDeleteAccount}
                colors={colors}
            />

            <AvatarPicker
                visible={avatarPickerVisible}
                currentAvatarId={avatarId}
                onSelect={handleAvatarSelected}
                onClose={() => setAvatarPickerVisible(false)}
                colors={colors}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 30 },

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
        fontWeight: '700',
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
        fontWeight: '700',
        borderBottomWidth: 1,
        minWidth: 120,
        paddingVertical: 2,
    },
    nameAction: {
        color: VIOLET,
        fontWeight: '700',
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
        fontWeight: '700',
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
        fontWeight: '700',
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
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
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
        backgroundColor: 'rgba(0,0,0,0.05)',
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
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    currencyText: {
        fontSize: 13,
        fontWeight: '600',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
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
        fontWeight: '700',
        minWidth: 26,
        textAlign: 'center',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 10,
        fontWeight: '500',
    },
});

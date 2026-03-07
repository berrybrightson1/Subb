import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    BellOff,
    CheckCircle2,
    ChevronRight,
    CircleCheck,
    CreditCard,
    Info,
    LayoutDashboard,
    ListChecks,
    Settings2,
    ShieldCheck,
    Wallet,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions, Linking, StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    interpolateColor,
    LinearTransition,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { GoalType, OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { toast } from '../lib/toast';

const { height: SH } = Dimensions.get('window');

// ─── Real Google "G" logo ─────────────────────────────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
            <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            <Path fill="none" d="M0 0h48v48H0z" />
        </Svg>
    );
}

// ─── Per-step color palette ───────────────────────────────────────────────────
const STEP_COLORS = [
    { accent: '#8B5CF6', muted: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.3)', glow: 'rgba(139,92,246,0.06)' },
    { accent: '#3B82F6', muted: 'rgba(59,130,246,0.13)', border: 'rgba(59,130,246,0.3)', glow: 'rgba(59,130,246,0.06)' },
    { accent: '#10B981', muted: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.06)' },
    { accent: '#F59E0B', muted: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.06)' },
];

// ─── Global tokens ────────────────────────────────────────────────────────────
const G = {
    bg: '#0A0A0F',
    card: '#13131A',
    cardBorder: 'rgba(255,255,255,0.07)',
    text: '#F0F0F8',
    muted: '#6B7280',
    mutedLight: '#9CA3AF',
    successMuted: 'rgba(16,185,129,0.13)',
    successBorder: 'rgba(16,185,129,0.3)',
};

// ─── Minimal hero ─────────────────────────────────────────────────────────────
interface HeroProps {
    Icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
    step: number;
}
function Hero({ Icon, step }: HeroProps) {
    const c = STEP_COLORS[step];
    const scale = useSharedValue(0.6);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(60, withSpring(1, { stiffness: 140, damping: 16 }));
        opacity.value = withDelay(60, withTiming(1, { duration: 300 }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[heroStyles.wrap, style]}>
            <View style={[heroStyles.circle, { backgroundColor: c.muted }]}>
                <Icon color={c.accent} size={48} strokeWidth={1.5} />
            </View>
        </Animated.View>
    );
}
const heroStyles = StyleSheet.create({
    wrap: { alignSelf: 'center', marginBottom: 4 },
    circle: {
        width: 120,
        height: 120,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ step }: { step: number }) {
    return (
        <View style={dotStyles.row}>
            {STEP_COLORS.map((c, i) => (
                <Animated.View
                    key={i}
                    layout={LinearTransition.springify().damping(22).stiffness(200)}
                    style={[
                        dotStyles.dot,
                        i === step
                            ? { width: 28, backgroundColor: c.accent }
                            : i < step
                                ? { backgroundColor: 'rgba(255,255,255,0.25)' }
                                : { backgroundColor: 'rgba(255,255,255,0.1)' },
                    ]}
                />
            ))}
        </View>
    );
}
const dotStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Brand toggle ─────────────────────────────────────────────────────────────
function BrandToggle({ value, onChange, accent }: { value: boolean; onChange: (v: boolean) => void; accent: string }) {
    const pos = useSharedValue(value ? 1 : 0);
    const toggle = () => {
        const next = !value;
        pos.value = withSpring(next ? 1 : 0, { stiffness: 300, damping: 25 });
        onChange(next);
    };
    const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * 22 + 3 }] }));
    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(pos.value, [0, 1], ['rgba(255,255,255,0.08)', accent]),
    }));
    return (
        <TouchableOpacity onPress={toggle} activeOpacity={0.9}>
            <Animated.View style={[btStyles.track, trackStyle]}>
                <Animated.View style={[btStyles.thumb, thumbStyle]} />
            </Animated.View>
        </TouchableOpacity>
    );
}
const btStyles = StyleSheet.create({
    track: { width: 52, height: 30, borderRadius: 15 },
    thumb: { position: 'absolute', top: 3, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
});

// ─── Goal card ────────────────────────────────────────────────────────────────
interface GoalCardProps {
    id: GoalType;
    Icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
    title: string;
    subtitle: string;
    iconColor: string;
    iconBg: string;
    iconBorder: string;
    selected: boolean;
    onSelect: (id: GoalType) => void;
    activeAccent: string;
    activeBorder: string;
    activeBg: string;
}
function GoalCard({ id, Icon, title, subtitle, iconColor, iconBg, iconBorder, selected, onSelect, activeAccent, activeBorder, activeBg }: GoalCardProps) {
    const scale = useSharedValue(1);
    const handlePress = () => {
        scale.value = withSequence(
            withSpring(0.96, { stiffness: 400, damping: 15 }),
            withSpring(1, { stiffness: 300, damping: 18 }),
        );
        onSelect(id);
    };
    const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
            <Animated.View
                layout={LinearTransition.springify().damping(22).stiffness(200)}
                style={[
                    gcStyles.card,
                    selected && { borderColor: activeBorder, backgroundColor: activeBg },
                    cardStyle,
                ]}
            >
                <View style={[gcStyles.iconBox, { backgroundColor: iconBg, borderColor: iconBorder }]}>
                    <Icon color={iconColor} size={24} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={gcStyles.title}>{title}</Text>
                    <Text style={gcStyles.subtitle}>{subtitle}</Text>
                </View>
                {selected && (
                    <View style={[gcStyles.check, { backgroundColor: activeBg, borderColor: activeBorder }]}>
                        <CircleCheck color={activeAccent} size={16} strokeWidth={2} />
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}
const gcStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: G.card,
        borderWidth: 1.5,
        borderColor: G.cardBorder,
        borderRadius: 18,
        padding: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    title: { color: G.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
    subtitle: { color: G.muted, fontSize: 13, lineHeight: 18 },
    check: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});

// ─── Shared button ────────────────────────────────────────────────────────────
function PrimaryBtn({ label, onPress, disabled, accent, icon }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    accent: string;
    icon?: React.ReactNode;
}) {
    return (
        <TouchableOpacity
            style={[btnStyles.btn, { backgroundColor: disabled ? `${accent}33` : accent }]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.85}
        >
            {icon}
            <Text style={[btnStyles.label, disabled && { opacity: 0.45 }]}>{label}</Text>
        </TouchableOpacity>
    );
}
const btnStyles = StyleSheet.create({
    btn: {
        height: 58,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    label: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
    const c = STEP_COLORS[0];
    const contentOpacity = useSharedValue(0);
    const contentY = useSharedValue(18);

    useEffect(() => {
        contentOpacity.value = withDelay(420, withTiming(1, { duration: 360 }));
        contentY.value = withDelay(420, withSpring(0, { stiffness: 160, damping: 20 }));
    }, []);

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: contentY.value }],
    }));

    return (
        <View style={[stepBase.root, s0.centered]}>
            <Hero Icon={CreditCard} step={0} />

            <Animated.View style={[stepBase.textBlock, contentStyle]}>
                <Text style={stepBase.title}>Welcome to Subb</Text>
                <Text style={stepBase.subtitle}>
                    Track subscriptions, cut wasteful bills, and never miss a renewal.
                </Text>

                <View style={s0.features}>
                    {[
                        { Icon: Wallet, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', text: 'See exactly where your money goes' },
                        { Icon: Bell, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', text: 'Get alerts before every renewal charge' },
                        { Icon: ShieldCheck, color: '#10B981', bg: 'rgba(16,185,129,0.1)', text: 'Cancel free trials before they convert' },
                    ].map(({ Icon, color, bg, text }, i) => (
                        <View key={i} style={s0.row}>
                            <View style={[s0.iconBox, { backgroundColor: bg }]}>
                                <Icon color={color} size={16} strokeWidth={1.5} />
                            </View>
                            <Text style={s0.rowText}>{text}</Text>
                        </View>
                    ))}
                </View>
            </Animated.View>

            <View style={stepBase.footer}>
                <PrimaryBtn
                    label="Get Started"
                    onPress={onNext}
                    accent={c.accent}
                    icon={<ChevronRight color="#fff" size={18} strokeWidth={2.5} />}
                />
            </View>
        </View>
    );
}
const s0 = StyleSheet.create({
    centered: { justifyContent: 'center' },
    features: { gap: 14, marginTop: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    rowText: { color: G.mutedLight, fontSize: 14, flex: 1, lineHeight: 20 },
});

// ─── Step 1: Goal ─────────────────────────────────────────────────────────────
function StepGoal({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
    const { goal, setGoal } = useOnboarding();
    const c = STEP_COLORS[1];

    const GOAL_CARDS = [
        {
            id: 'save' as GoalType,
            Icon: Wallet,
            title: 'Save Money',
            subtitle: 'Spot wasteful subscriptions fast',
            iconColor: '#F59E0B',
            iconBg: 'rgba(245,158,11,0.12)',
            iconBorder: 'rgba(245,158,11,0.25)',
        },
        {
            id: 'alerts' as GoalType,
            Icon: Bell,
            title: 'Stay Informed',
            subtitle: 'Never miss a renewal date again',
            iconColor: '#3B82F6',
            iconBg: 'rgba(59,130,246,0.12)',
            iconBorder: 'rgba(59,130,246,0.25)',
        },
        {
            id: 'trials' as GoalType,
            Icon: ShieldCheck,
            title: 'Cancel Trials',
            subtitle: 'Beat the billing deadline every time',
            iconColor: '#10B981',
            iconBg: 'rgba(16,185,129,0.12)',
            iconBorder: 'rgba(16,185,129,0.25)',
        },
    ];

    return (
        <View style={stepBase.root}>
            <TouchableOpacity onPress={onBack} style={s1.backBtn}>
                <ArrowLeft color={G.mutedLight} size={20} strokeWidth={1.5} />
            </TouchableOpacity>

            <Hero Icon={ListChecks} step={1} />

            <View style={stepBase.textBlock}>
                <Text style={stepBase.title}>What's your focus?</Text>
                <Text style={stepBase.subtitle}>
                    Pick one goal and we'll tailor your experience around it.
                </Text>

                <View style={s1.cards}>
                    {GOAL_CARDS.map(g => (
                        <GoalCard
                            key={g.id}
                            {...g}
                            selected={goal === g.id}
                            onSelect={setGoal}
                            activeAccent={c.accent}
                            activeBorder={c.border}
                            activeBg={c.muted}
                        />
                    ))}
                </View>
            </View>

            <View style={stepBase.footer}>
                <PrimaryBtn
                    label="Continue"
                    onPress={onNext}
                    disabled={!goal}
                    accent={c.accent}
                    icon={goal ? <ChevronRight color="#fff" size={18} strokeWidth={2.5} /> : undefined}
                />
            </View>
        </View>
    );
}
const s1 = StyleSheet.create({
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: G.card,
        borderWidth: 1,
        borderColor: G.cardBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cards: { gap: 10, marginTop: 4 },
});

// ─── Step 2: Setup ────────────────────────────────────────────────────────────
function StepSetup({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
    const { notifEnabled, setNotifEnabled } = useOnboarding();
    const { user } = useAuth();
    const { signInWithGoogle } = useGoogleAuth();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [notifDenied, setNotifDenied] = useState(false);
    const c = STEP_COLORS[2];

    const handleGoogle = async () => {
        setGoogleLoading(true);
        await signInWithGoogle();
        setGoogleLoading(false);
    };

    const handleNotifToggle = async (value: boolean) => {
        if (value) {
            const granted = await registerForPushNotificationsAsync();
            if (granted) {
                setNotifEnabled(true);
                setNotifDenied(false);
            } else {
                setNotifEnabled(false);
                setNotifDenied(true);
            }
        } else {
            setNotifEnabled(false);
            setNotifDenied(false);
        }
    };

    return (
        <View style={stepBase.root}>
            <TouchableOpacity onPress={onBack} style={s1.backBtn}>
                <ArrowLeft color={G.mutedLight} size={20} strokeWidth={1.5} />
            </TouchableOpacity>

            <Hero Icon={Settings2} step={2} />

            <View style={stepBase.textBlock}>
                <Text style={stepBase.title}>Quick setup</Text>
                <Text style={stepBase.subtitle}>
                    Sync across devices and get notified before every charge.
                </Text>

                <View style={s2.cards}>
                    {/* Auth */}
                    {user ? (
                        <View style={[s2.card, { borderColor: G.successBorder }]}>
                            <View style={[s2.cardIcon, { backgroundColor: G.successMuted }]}>
                                <ShieldCheck color="#10B981" size={22} strokeWidth={1.5} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s2.cardTitle}>Signed in</Text>
                                <Text style={s2.cardSub} numberOfLines={1}>{user.email}</Text>
                            </View>
                            <CheckCircle2 color="#10B981" size={18} strokeWidth={1.5} />
                        </View>
                    ) : (
                        <View style={s2.authBlock}>
                            <TouchableOpacity style={s2.googleBtn} onPress={handleGoogle} disabled={googleLoading} activeOpacity={0.85}>
                                {googleLoading ? (
                                    <ActivityIndicator color="#1a1a1a" />
                                ) : (
                                    <>
                                        <GoogleIcon size={22} />
                                        <Text style={s2.googleText}>Continue with Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <Text style={s2.hint}>Or sign in with email after setup.</Text>
                        </View>
                    )}

                    {/* Notifications */}
                    <View style={s2.card}>
                        <View style={[s2.cardIcon, { backgroundColor: notifEnabled ? c.muted : 'rgba(255,255,255,0.05)' }]}>
                            {notifEnabled
                                ? <Bell color={c.accent} size={22} strokeWidth={1.5} />
                                : <BellOff color={G.muted} size={22} strokeWidth={1.5} />
                            }
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s2.cardTitle}>Renewal Reminders</Text>
                            <Text style={s2.cardSub}>{notifEnabled ? 'Notify me before each charge' : 'Notifications off'}</Text>
                        </View>
                        <BrandToggle value={notifEnabled} onChange={handleNotifToggle} accent={c.accent} />
                    </View>

                    {/* Denied banner */}
                    {notifDenied && (
                        <View style={s2.deniedBanner}>
                            <Info color="#F59E0B" size={16} strokeWidth={2} />
                            <Text style={s2.deniedText}>
                                Permission denied.{' '}
                                <Text style={s2.deniedLink} onPress={() => Linking.openSettings()}>
                                    Open Settings
                                </Text>
                                {' '}to enable notifications.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={stepBase.footer}>
                <PrimaryBtn
                    label="Continue"
                    onPress={onNext}
                    accent={c.accent}
                    icon={<ChevronRight color="#fff" size={18} strokeWidth={2.5} />}
                />
            </View>
        </View>
    );
}
const s2 = StyleSheet.create({
    cards: { gap: 12, marginTop: 4 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: G.card,
        borderWidth: 1,
        borderColor: G.cardBorder,
        borderRadius: 18,
        padding: 16,
    },
    cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardTitle: { color: G.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
    cardSub: { color: G.muted, fontSize: 13 },
    authBlock: { gap: 10 },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#fff',
        height: 54,
        borderRadius: 14,
    },
    googleText: { color: '#1a1a1a', fontSize: 16, fontWeight: '600' },
    hint: { color: G.muted, fontSize: 13, textAlign: 'center' },
    deniedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(245,158,11,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.30)',
        borderRadius: 14,
        padding: 14,
    },
    deniedText: { color: '#D97706', fontSize: 13, flex: 1, lineHeight: 19 },
    deniedLink: { color: '#F59E0B', fontWeight: '700', textDecorationLine: 'underline' },
});

// ─── Step 3: Success ──────────────────────────────────────────────────────────
function StepSuccess() {
    const { goal, notifEnabled } = useOnboarding();
    const router = useRouter();
    const c = STEP_COLORS[3];

    const contentOpacity = useSharedValue(0);
    const contentY = useSharedValue(20);

    useEffect(() => {
        contentOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
        contentY.value = withDelay(500, withSpring(0, { stiffness: 160, damping: 20 }));
    }, []);

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: contentY.value }],
    }));

    const handleEnter = async () => {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        if (goal) await AsyncStorage.setItem('userGoal', goal);
        toast.success('Welcome to Subb');
        router.replace('/(tabs)');
    };

    const GOAL_META: Record<GoalType, { label: string; color: string; bg: string; border: string }> = {
        save: { label: 'Save Money', color: '#F59E0B', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.3)' },
        alerts: { label: 'Stay Informed', color: '#3B82F6', bg: 'rgba(59,130,246,0.13)', border: 'rgba(59,130,246,0.3)' },
        trials: { label: 'Cancel Trials', color: '#10B981', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)' },
    };
    const gm = goal ? GOAL_META[goal] : null;

    return (
        <View style={stepBase.root}>
            <Hero Icon={LayoutDashboard} step={3} />

            <Animated.View style={[stepBase.textBlock, contentStyle]}>
                <Text style={stepBase.title}>You're all set!</Text>
                <Text style={stepBase.subtitle}>
                    You're all set. Start tracking and take control of your spending.
                </Text>

                <View style={s3.chips}>
                    {gm && (
                        <View style={[s3.chip, { backgroundColor: gm.bg, borderColor: gm.border }]}>
                            <Text style={[s3.chipText, { color: gm.color }]}>{gm.label}</Text>
                        </View>
                    )}
                    <View style={[
                        s3.chip,
                        notifEnabled
                            ? { backgroundColor: c.muted, borderColor: c.border }
                            : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: G.cardBorder },
                    ]}>
                        {notifEnabled
                            ? <Bell color={c.accent} size={13} strokeWidth={1.5} />
                            : <BellOff color={G.muted} size={13} strokeWidth={1.5} />
                        }
                        <Text style={[s3.chipText, { color: notifEnabled ? c.accent : G.muted }]}>
                            {notifEnabled ? 'Alerts on' : 'Alerts off'}
                        </Text>
                    </View>
                </View>
            </Animated.View>

            <View style={stepBase.footer}>
                <PrimaryBtn
                    label="Enter Dashboard"
                    onPress={handleEnter}
                    accent={c.accent}
                    icon={<ChevronRight color="#fff" size={18} strokeWidth={2.5} />}
                />
            </View>
        </View>
    );
}
const s3 = StyleSheet.create({
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: { fontSize: 13, fontWeight: '700' },
});

// ─── Shared layout base ───────────────────────────────────────────────────────
const stepBase = StyleSheet.create({
    root: { flex: 1, padding: 28 },
    textBlock: { marginTop: 32 },
    title: { color: G.text, fontSize: 28, fontWeight: '800', marginBottom: 10, letterSpacing: -0.4, lineHeight: 36 },
    subtitle: { color: G.muted, fontSize: 15, lineHeight: 23, marginBottom: 22 },
    footer: { position: 'absolute', bottom: 28, left: 28, right: 28 },
});

// ─── Wizard controller ────────────────────────────────────────────────────────
function WizardContent() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const goTo = useCallback((nextStep: number) => {
        opacity.value = withTiming(0, { duration: 140 }, finished => {
            if (!finished) return;
            runOnJS(setStep)(nextStep);
            translateY.value = 24;
            opacity.value = withTiming(1, { duration: 220 });
            translateY.value = withSpring(0, { stiffness: 200, damping: 22 });
        });
    }, []);

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={wStyles.container}>
            {/* Skip button (steps 0-2 only) */}
            {step < 3 && (
                <View style={wStyles.topBar}>
                    <TouchableOpacity style={wStyles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
                        <Text style={wStyles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Step content */}
            <Animated.View style={[wStyles.stepWrap, animStyle]}>
                {step === 0 && <StepWelcome onNext={() => goTo(1)} />}
                {step === 1 && <StepGoal onNext={() => goTo(2)} onBack={() => goTo(0)} />}
                {step === 2 && <StepSetup onNext={() => goTo(3)} onBack={() => goTo(1)} />}
                {step === 3 && <StepSuccess />}
            </Animated.View>

            {/* Dots — below the button */}
            <View style={wStyles.dotsBar}>
                <ProgressDots step={step} />
            </View>
        </SafeAreaView>
    );
}

const wStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: G.bg },
    topBar: { alignItems: 'flex-end', paddingHorizontal: 28, paddingTop: 4 },
    skipBtn: { paddingVertical: 6, paddingHorizontal: 4 },
    skipText: { color: G.muted, fontSize: 15, fontWeight: '600' },
    stepWrap: { flex: 1 },
    dotsBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 18 },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
    return (
        <OnboardingProvider>
            <WizardContent />
        </OnboardingProvider>
    );
}

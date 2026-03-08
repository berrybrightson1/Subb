import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    PanResponder,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInLeft,
    FadeInRight,
    FadeOutLeft,
    FadeOutRight,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { useAppSettings } from '../contexts/AppContext';
import { registerForPushNotificationsAsync } from '../lib/notifications';

// ─── Content ──────────────────────────────────────────────────────────────────
// Icons from https://3dicons.co — CC0 License (free, no attribution required)
// CDN: Supabase storage — format: /{slug}/{angle}/{size}/{style}.webp
const BASE = 'https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes';
const icon = (slug: string) => `${BASE}/${slug}/dynamic/200/gradient.webp`;

const STEPS = [
    {
        title: 'Discover Hidden Costs',
        subtitle: 'Did you know the average person wastes $130/month on unused subscriptions? Let\'s find yours.',
        image: icon('421bcd-dollar'),
        color: '#8B5CF6',
        bg: '#F3E8FF',
        tint: 'rgba(139,92,246,0.05)'
    },
    {
        title: 'Take Back Control',
        subtitle: 'See exactly where your money goes. We organize all your recurring charges into one beautiful dashboard.',
        image: icon('4a4275-chart'),
        color: '#F59E0B',
        bg: '#FEF3C7',
        tint: 'rgba(245,158,11,0.05)'
    },
    {
        title: 'Never Get Billed Blindly',
        subtitle: 'Get smart alerts before a free trial ends or a renewal hits. You have the power to cancel in time.',
        image: icon('ef4a90-bell'),
        color: '#EF4444',
        bg: '#FEE2E2',
        tint: 'rgba(239,68,68,0.05)'
    },
    {
        title: 'Hit Your Financial Goals',
        subtitle: 'Set monthly spending limits. Subb will warn you if you\'re getting close, keeping more money in your pocket.',
        image: icon('49b6f4-target'),
        color: '#10B981',
        bg: '#D1FAE5',
        tint: 'rgba(16,185,129,0.05)'
    },
    {
        title: 'Your Wallet\'s Best Friend',
        subtitle: 'You work hard for your money. Let Subb protect it. Turn on notifications to activate your defense system.',
        image: icon('b91186-shield'),
        color: '#3B82F6',
        bg: '#DBEAFE',
        tint: 'rgba(59,130,246,0.05)'
    },
];

// ─── Components ───────────────────────────────────────────────────────────────
function ProgressDots({ step, textColor, mutedColor }: { step: number; textColor: string; mutedColor: string }) {
    return (
        <View style={dotStyles.row}>
            {STEPS.map((_, i) => (
                <View
                    key={i}
                    style={[
                        dotStyles.dot,
                        i === step
                            ? { backgroundColor: textColor, width: 18, borderRadius: 3 }
                            : { backgroundColor: mutedColor, opacity: 0.3 },
                    ]}
                />
            ))}
        </View>
    );
}
const dotStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginVertical: 40 },
    dot: { width: 6, height: 6, borderRadius: 3 },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useAppSettings();
    const [step, setStep] = useState(0);
    // Track swipe direction so entering/exiting animations mirror it
    const [dir, setDir] = useState<'forward' | 'backward'>('forward');

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        router.replace('/(tabs)');
    };

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setDir('forward');
            setStep(s => s + 1);
        } else {
            await registerForPushNotificationsAsync();
            await AsyncStorage.setItem('hasOnboarded', 'true');
            router.replace('/(tabs)');
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setDir('backward');
            setStep(s => s - 1);
        }
    };

    // ── Swipe gesture ──────────────────────────────────────────────────────────
    const SWIPE_THRESHOLD = 50; // px — min horizontal distance to count as swipe
    const touchStartX = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, { dx, dy }) =>
                // Only steal the gesture if horizontal > vertical (avoids interfering with ScrollViews)
                Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
            onPanResponderGrant: (evt) => {
                touchStartX.current = evt.nativeEvent.pageX;
            },
            onPanResponderRelease: (_, { dx }) => {
                if (dx < -SWIPE_THRESHOLD) {
                    // Swipe left → advance
                    setDir('forward');
                    setStep(s => (s < STEPS.length - 1 ? s + 1 : s));
                } else if (dx > SWIPE_THRESHOLD) {
                    // Swipe right → go back
                    setDir('backward');
                    setStep(s => (s > 0 ? s - 1 : s));
                }
            },
        })
    ).current;

    // Animation presets that change depending on swipe direction
    const entering = dir === 'forward'
        ? FadeInRight.duration(400).springify()
        : FadeInLeft.duration(400).springify();
    const exiting = dir === 'forward'
        ? FadeOutLeft.duration(300)
        : FadeOutRight.duration(300);

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]} {...panResponder.panHandlers}>
            {/* Dynamic tint backgrounds */}
            {STEPS.map((s, i) => (
                <Animated.View
                    key={`bg-${i}`}
                    style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: s.tint, opacity: step === i ? withTiming(1, { duration: 600 }) : withTiming(0, { duration: 600 }) }
                    ]}
                    pointerEvents="none"
                />
            ))}

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.content}>

                    <View style={styles.heroContainer}>
                        <Animated.View
                            key={`hero-${step}`}
                            entering={entering}
                            exiting={exiting}
                            style={[StyleSheet.absoluteFillObject, styles.heroWrap]}
                        >
                            <View style={[styles.circleShadow, { shadowColor: current.color }]}>
                                <View style={[styles.circle, { backgroundColor: '#FFFFFF' }]}>
                                    <Image
                                        source={{ uri: current.image }}
                                        style={{ width: 180, height: 180 }}
                                        contentFit="contain"
                                        transition={200}
                                    />
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    <ProgressDots step={step} textColor={colors.text} mutedColor={colors.muted} />

                    <Animated.View
                        key={`text-${step}`}
                        entering={entering}
                        exiting={exiting}
                        style={styles.textWrap}
                    >
                        <Text variant="display" style={[styles.title, { color: current.color }]}>{current.title}</Text>
                        <Text variant="sans" style={[styles.subtitle, { color: colors.muted }]}>{current.subtitle}</Text>
                    </Animated.View>

                </View>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
                    {/* Back button (hidden on first step) */}
                    {step > 0 ? (
                        <TouchableOpacity onPress={handleBack} style={styles.skipBtn}>
                            <Text variant="display" style={[styles.skipText, { color: colors.muted }]}>← BACK</Text>
                        </TouchableOpacity>
                    ) : (
                        !isLast && (
                            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                                <Text variant="display" style={[styles.skipText, { color: colors.muted }]}>SKIP</Text>
                            </TouchableOpacity>
                        )
                    )}

                    {/* Spacer when last step and step > 0 is false */}
                    {isLast && step === 0 && <View style={{ width: 60 }} />}

                    <TouchableOpacity onPress={handleNext} style={[styles.nextBtn, { backgroundColor: current.color, shadowColor: current.color, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 8 }]}>
                        <Text variant="display" style={styles.nextText}>{isLast ? 'START NOW' : 'NEXT →'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 40,
    },
    heroContainer: {
        width: 240,
        height: 240,
    },
    heroWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleShadow: {
        borderRadius: 120,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.22,
        shadowRadius: 40,
        elevation: 12,
    },
    circle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrap: {
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
    },
    skipBtn: {
        paddingVertical: 12,
        paddingRight: 20,
    },
    skipText: {
        fontSize: 12,
        letterSpacing: 0.5,
    },
    nextBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 30,
    },
    nextText: {
        fontSize: 12,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});

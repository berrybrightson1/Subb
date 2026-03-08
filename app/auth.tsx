import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { useAppSettings } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { auth, db } from '../lib/firebase';
import { toast } from '../lib/toast';

// Google "G" logo as inline SVG-style component (pure RN, no emoji)
function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: size * 0.75, fontFamily: 'serif', color: '#4285F4' }}>G</Text>
        </View>
    );
}

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();
    const { signInWithGoogle } = useGoogleAuth();
    const { user, loading: authLoading } = useAuth();
    const { colors, isDark } = useAppSettings();

    // Already authenticated — skip straight to the app
    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/');
        }
    }, [user, authLoading]);

    const shakeValue = useSharedValue(0);
    const borderColorValue = useSharedValue(0); // 0 = default, 1 = error, 2 = success

    // Animated style for the form wrapper
    const formAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: shakeValue.value }],
        };
    });

    // Animated style for the inputs' border color
    const borderColorStyle = useAnimatedStyle(() => {
        return {
            borderWidth: 1.5,
            borderColor: interpolateColor(
                borderColorValue.value,
                [0, 1, 2],
                ['transparent', '#EF4444', '#10B981']
            ),
        };
    });

    const triggerErrorFeedback = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        borderColorValue.value = withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(0, { duration: 2500 }) // Fade back eventually
        );
        shakeValue.value = withSequence(
            withTiming(8, { duration: 50 }),
            withTiming(-8, { duration: 50 }),
            withTiming(8, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
    };

    const triggerSuccessFeedback = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        borderColorValue.value = withTiming(2, { duration: 300 });
        // Delay navigation slightly to let the green border and toast show
        await new Promise(resolve => setTimeout(resolve, 800));
    };

    const handleAuth = async () => {
        if (!email || !password) {
            triggerErrorFeedback();
            toast.error('Incorrect credentials. Please try again.');
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Authentication successful. Entering Subb...');
            } else {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCred.user.uid), {
                    email: userCred.user.email,
                    createdAt: new Date(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
                toast.success('Authentication successful. Entering Subb...');
            }
            await triggerSuccessFeedback();
            router.replace('/');
        } catch (error: any) {
            triggerErrorFeedback();
            toast.error('Incorrect credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        const success = await signInWithGoogle();
        setGoogleLoading(false);
        if (success) router.replace('/');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.header}>
                    <View style={[styles.logoPlaceholder, { backgroundColor: colors.accentMuted }]}>
                        <Text variant="display" style={{ fontSize: 28, color: colors.accent }}>S</Text>
                    </View>
                    <Text variant="display" style={[styles.title, { color: colors.text }]}>Welcome to Subb</Text>
                    <Text variant="sans" style={[styles.subtitle, { color: colors.muted }]}>
                        {isLogin ? 'Sign in to manage your subscriptions' : 'Create an account to get started'}
                    </Text>
                </View>

                {/* Form */}
                <Animated.View style={[styles.form, formAnimatedStyle]}>
                    <View style={styles.inputGroup}>
                        <Text variant="brand" style={[styles.label, { color: colors.text }]}>Email</Text>
                        <Animated.View style={[styles.inputWrapper, { backgroundColor: colors.input }, borderColorStyle]}>
                            <TextInput
                                id="email"
                                nativeID="email"
                                style={[styles.input, { color: colors.text }]}
                                placeholder="you@example.com"
                                placeholderTextColor={colors.muted}
                                keyboardType="email-address"
                                keyboardAppearance={isDark ? 'dark' : 'light'}
                                autoCapitalize="none"
                                autoComplete="email"
                                textContentType="username"
                                importantForAutofill="yes"
                                selectionColor={colors.accent}
                                underlineColorAndroid="transparent"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </Animated.View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="brand" style={[styles.label, { color: colors.text }]}>Password</Text>
                        <Animated.View style={[styles.inputWrapper, { backgroundColor: colors.input }, borderColorStyle]}>
                            <TextInput
                                id="password"
                                nativeID="password"
                                style={[styles.input, { color: colors.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                                keyboardAppearance={isDark ? 'dark' : 'light'}
                                autoComplete="password"
                                textContentType="password"
                                importantForAutofill="yes"
                                selectionColor={colors.accent}
                                underlineColorAndroid="transparent"
                                value={password}
                                onChangeText={setPassword}
                            />
                        </Animated.View>
                    </View>

                    {/* Primary action */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                        onPress={handleAuth}
                        disabled={loading || googleLoading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text variant="brand" style={styles.primaryBtnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <Text variant="sans" style={[styles.dividerText, { color: colors.muted }]}>or</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Google Sign-In */}
                    <TouchableOpacity
                        style={[styles.googleBtn, { backgroundColor: colors.modal, borderColor: colors.border }]}
                        onPress={handleGoogle}
                        disabled={loading || googleLoading}
                        activeOpacity={0.85}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color={colors.text} />
                        ) : (
                            <>
                                <GoogleIcon size={20} />
                                <Text variant="brand" style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Toggle login/signup */}
                    <TouchableOpacity
                        style={styles.switchBtn}
                        onPress={() => setIsLogin(!isLogin)}
                        disabled={loading || googleLoading}
                    >
                        <Text variant="sans" style={[styles.switchBtnText, { color: colors.muted }]}>
                            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    logoPlaceholder: {
        width: 64, height: 64, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    title: { fontSize: 26, letterSpacing: -0.5, marginBottom: 8 },
    subtitle: { fontSize: 16, textAlign: 'center' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, letterSpacing: 0.3 },
    inputWrapper: {
        borderRadius: 12, height: 56, paddingHorizontal: 16, justifyContent: 'center',
    },
    input: { flex: 1, fontSize: 16, height: '100%' },
    primaryBtn: {
        height: 56, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginTop: 12,
    },
    primaryBtnText: { fontSize: 15, color: '#FFFFFF', letterSpacing: 0.3 },
    divider: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4,
    },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { fontSize: 13 },
    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 56, borderRadius: 12, borderWidth: 1,
    },
    googleBtnText: { fontSize: 15, letterSpacing: 0.2 },
    switchBtn: { alignItems: 'center', paddingVertical: 12 },
    switchBtnText: { fontSize: 14 },
});

import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from '../lib/toast';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { auth, db } from '../lib/firebase';

// Google "G" logo as inline SVG-style component (pure RN, no emoji)
function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: size * 0.75, fontWeight: '700', color: '#4285F4', fontFamily: 'serif' }}>G</Text>
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

    // Already authenticated — skip straight to the app
    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/');
        }
    }, [user, authLoading]);

    const handleAuth = async () => {
        if (!email || !password) {
            toast.error('Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Welcome back!');
            } else {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCred.user.uid), {
                    email: userCred.user.email,
                    createdAt: new Date(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
                toast.success('Account created!');
            }
            router.replace('/');
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
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
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.header}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>S</Text>
                    </View>
                    <Text style={styles.title}>Welcome to Subb</Text>
                    <Text style={styles.subtitle}>
                        {isLogin ? 'Sign in to manage your subscriptions' : 'Create an account to get started'}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                id="email"
                                nativeID="email"
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#A1A1AA"
                                keyboardType="email-address"
                                keyboardAppearance="dark"
                                autoCapitalize="none"
                                autoComplete="email"
                                textContentType="emailAddress"
                                importantForAutofill="yes"
                                selectionColor="#A855F7"
                                underlineColorAndroid="transparent"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                id="password"
                                nativeID="password"
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#A1A1AA"
                                secureTextEntry
                                keyboardAppearance="dark"
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                textContentType={isLogin ? 'password' : 'newPassword'}
                                importantForAutofill="yes"
                                selectionColor="#A855F7"
                                underlineColorAndroid="transparent"
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>

                    {/* Primary action */}
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} disabled={loading || googleLoading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign-In */}
                    <TouchableOpacity
                        style={styles.googleBtn}
                        onPress={handleGoogle}
                        disabled={loading || googleLoading}
                        activeOpacity={0.85}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#1a1a1a" />
                        ) : (
                            <>
                                <GoogleIcon size={20} />
                                <Text style={styles.googleBtnText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Toggle login/signup */}
                    <TouchableOpacity
                        style={styles.switchBtn}
                        onPress={() => setIsLogin(!isLogin)}
                        disabled={loading || googleLoading}
                    >
                        <Text style={styles.switchBtnText}>
                            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F13' },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    logoPlaceholder: {
        width: 64, height: 64, borderRadius: 16,
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    logoText: { color: '#A855F7', fontSize: 32, fontWeight: 'bold' },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    subtitle: { color: '#A1A1AA', fontSize: 16, textAlign: 'center' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { color: '#fff', fontSize: 14, fontWeight: '500' },
    inputWrapper: {
        backgroundColor: '#1C1C23', borderRadius: 12,
        height: 56, paddingHorizontal: 16, justifyContent: 'center',
    },
    input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
    primaryBtn: {
        backgroundColor: '#A855F7', height: 56,
        borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    divider: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A35' },
    dividerText: { color: '#A1A1AA', fontSize: 13 },
    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, backgroundColor: '#fff', height: 56,
        borderRadius: 12,
    },
    googleBtnText: { color: '#1a1a1a', fontSize: 16, fontWeight: '600' },
    switchBtn: { alignItems: 'center', paddingVertical: 12 },
    switchBtnText: { color: '#A1A1AA', fontSize: 14 },
});

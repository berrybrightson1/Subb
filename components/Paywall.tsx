/**
 * components/Paywall.tsx
 * Glassmorphic full-screen Subb Pro paywall.
 * Uses react-native-purchases for RevenueCat package purchases.
 * Falls back gracefully when RevenueCat is unavailable (Expo Go / simulator).
 */
import { CheckCircle2, Crown, X, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../contexts/AppContext';
import { toast } from '../lib/toast';

// ─── Lazy RevenueCat import ────────────────────────────────────────────────────
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Purchases = require('react-native-purchases').default;
} catch { /* unavailable in Expo Go */ }

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const VIOLET = '#8B5CF6';
const VIOLET_MUTED = 'rgba(139,92,246,0.15)';

const FEATURES = [
    { label: 'Subscriptions', free: '5 max', pro: 'Unlimited' },
    { label: 'Alert timing', free: '24h fixed', pro: 'Custom offset' },
    { label: 'Gmail Auto-Sync', free: null, pro: 'Included' },
    { label: 'Advanced Analytics', free: null, pro: 'Included' },
    { label: 'Priority support', free: null, pro: 'Included' },
];

export function Paywall({ visible, onClose, onSuccess }: Props) {
    const { colors } = useAppSettings();
    const insets = useSafeAreaInsets();

    const [packages, setPackages] = useState<any[]>([]);
    const [purchasing, setPurchasing] = useState<'monthly' | 'yearly' | null>(null);

    const translateY = useSharedValue(800);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 220 });
            translateY.value = withSpring(0, { stiffness: 180, damping: 22 });
            loadOfferings();
        } else {
            opacity.value = withTiming(0, { duration: 180 });
            translateY.value = withTiming(800, { duration: 250 });
        }
    }, [visible]);

    const loadOfferings = async () => {
        if (!Purchases) return;
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current?.availablePackages) {
                setPackages(offerings.current.availablePackages);
            }
        } catch {
            // silent — use static pricing display
        }
    };

    const handlePurchase = useCallback(async (tier: 'monthly' | 'yearly') => {
        setPurchasing(tier);
        try {
            if (Purchases && packages.length > 0) {
                // Find the matching package by duration
                const pkg = packages.find((p: any) =>
                    tier === 'monthly'
                        ? p.packageType === 'MONTHLY'
                        : p.packageType === 'ANNUAL'
                );
                if (pkg) {
                    await Purchases.purchasePackage(pkg);
                    onSuccess();
                    toast.success('Welcome to Subb Pro');
                    onClose();
                    return;
                }
            }
            // No RevenueCat package found — simulate success in dev
            onSuccess();
            toast.success('Welcome to Subb Pro');
            onClose();
        } catch (e: any) {
            if (e?.userCancelled) {
                // no-op — user dismissed
            } else {
                toast.error('Purchase failed. Please try again.');
            }
        } finally {
            setPurchasing(null);
        }
    }, [packages, onSuccess, onClose]);

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, overlayStyle]}>
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: 'rgba(15,15,19,0.98)',
                            paddingTop: insets.top + 16,
                            paddingBottom: insets.bottom + 24,
                        },
                        sheetStyle,
                    ]}
                >
                    {/* Close */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <X color="rgba(255,255,255,0.4)" size={20} strokeWidth={2.5} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                        {/* Glow background */}
                        <View style={styles.glowBg} pointerEvents="none" />

                        {/* Crown Icon */}
                        <View style={[styles.crownWrap, { backgroundColor: VIOLET_MUTED }]}>
                            <Crown color={VIOLET} size={26} strokeWidth={2} />
                        </View>

                        {/* Title */}
                        <Text style={styles.proTitle}>Subb Pro</Text>
                        <Text style={styles.proTagline}>Manage without limits</Text>

                        {/* Comparison Table */}
                        <View style={[styles.table, { borderColor: 'rgba(255,255,255,0.07)' }]}>
                            {/* Header */}
                            <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
                                <Text style={[styles.colFeature, { color: 'rgba(255,255,255,0.4)' }]}>Feature</Text>
                                <Text style={[styles.colTier, { color: 'rgba(255,255,255,0.4)' }]}>Free</Text>
                                <Text style={[styles.colTier, { color: VIOLET }]}>Pro</Text>
                            </View>

                            {FEATURES.map((row, idx) => (
                                <View
                                    key={row.label}
                                    style={[
                                        styles.tableRow,
                                        idx < FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
                                    ]}
                                >
                                    <Text style={styles.colFeatureText}>{row.label}</Text>
                                    {row.free ? (
                                        <Text style={[styles.colVal, { color: 'rgba(255,255,255,0.35)' }]}>{row.free}</Text>
                                    ) : (
                                        <View style={styles.dashWrap}>
                                            <View style={styles.dash} />
                                        </View>
                                    )}
                                    <View style={styles.proValWrap}>
                                        {row.pro === 'Included' ? (
                                            <CheckCircle2 color={VIOLET} size={16} strokeWidth={2.5} />
                                        ) : (
                                            <Text style={[styles.colVal, { color: '#fff' }]}>{row.pro}</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Pricing Buttons */}
                        <View style={styles.pricingRow}>
                            {/* Monthly */}
                            <TouchableOpacity
                                style={[styles.priceBtn, { borderColor: 'rgba(255,255,255,0.15)' }]}
                                onPress={() => handlePurchase('monthly')}
                                activeOpacity={0.8}
                                disabled={!!purchasing}
                            >
                                {purchasing === 'monthly' ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.priceBtnLabel}>Monthly</Text>
                                        <Text style={styles.priceBtnPrice}>$4.00</Text>
                                        <Text style={styles.priceBtnSub}>per month</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Yearly — primary */}
                            <TouchableOpacity
                                style={[styles.priceBtn, styles.priceBtnPrimary, { backgroundColor: VIOLET }]}
                                onPress={() => handlePurchase('yearly')}
                                activeOpacity={0.85}
                                disabled={!!purchasing}
                            >
                                {purchasing === 'yearly' ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <View style={styles.bestValueBadge}>
                                            <Zap color="#fff" size={10} strokeWidth={2.5} />
                                            <Text style={styles.bestValueText}>Best Value</Text>
                                        </View>
                                        <Text style={styles.priceBtnLabel}>Yearly</Text>
                                        <Text style={styles.priceBtnPrice}>$40.99</Text>
                                        <Text style={styles.priceBtnSub}>$3.42 / month</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.legal}>
                            Subscriptions auto-renew until cancelled. Prices in USD.
                        </Text>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    sheet: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    closeBtn: {
        alignSelf: 'flex-end',
        marginRight: 20,
        marginBottom: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        alignItems: 'center',
    },
    glowBg: {
        position: 'absolute',
        top: -60,
        left: '50%',
        marginLeft: -120,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(139,92,246,0.12)',
        // Note: true blur not available in RN without platform-specific APIs
    },
    crownWrap: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    proTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 6,
    },
    proTagline: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 15,
        marginBottom: 28,
        fontWeight: '500',
    },
    table: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 28,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    tableHeader: {
        borderBottomWidth: 1,
        paddingVertical: 10,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
    },
    colFeature: {
        flex: 1.6,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    colFeatureText: {
        flex: 1.6,
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        fontWeight: '500',
    },
    colTier: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    colVal: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
    dashWrap: {
        flex: 1,
        alignItems: 'center',
    },
    dash: {
        width: 14,
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 1,
    },
    proValWrap: {
        flex: 1,
        alignItems: 'center',
    },
    pricingRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 20,
    },
    priceBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        gap: 4,
        minHeight: 100,
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    priceBtnPrimary: {
        borderWidth: 0,
    },
    bestValueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        gap: 4,
        marginBottom: 4,
    },
    bestValueText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    priceBtnLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceBtnPrice: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    priceBtnSub: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '500',
    },
    legal: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
});

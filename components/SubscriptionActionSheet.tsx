import { RotateCcw, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../contexts/AppContext';
import { Subscription } from '../hooks/useSubscriptions';
import { toast } from '../lib/toast';
import { formatCurrency } from '../lib/utils';

interface Props {
    visible: boolean;
    sub: Subscription | null;
    userId: string;
    onRenew: (sub: Subscription) => Promise<void>;
    onCancel: (subId: string) => Promise<void>;
    onClose: () => void;
}

export function SubscriptionActionSheet({ visible, sub, userId, onRenew, onCancel, onClose }: Props) {
    const { colors, currency } = useAppSettings();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState<'renew' | 'cancel' | null>(null);

    const translateY = useSharedValue(400);
    const backdropOpacity = useSharedValue(0);

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    useEffect(() => {
        if (visible) {
            backdropOpacity.value = withTiming(1, { duration: 220 });
            translateY.value = withSpring(0, { stiffness: 260, damping: 28 });
        } else {
            backdropOpacity.value = withTiming(0, { duration: 180 });
            translateY.value = withSpring(400, { stiffness: 300, damping: 30 });
        }
    }, [visible]);

    const dismiss = () => {
        backdropOpacity.value = withTiming(0, { duration: 180 });
        translateY.value = withSpring(400, { stiffness: 300, damping: 30 }, () => {
            runOnJS(onClose)();
        });
    };

    const handleRenew = async () => {
        if (!sub || loading) return;
        setLoading('renew');
        try {
            await onRenew(sub);
            toast.success(`${sub.name} renewed`);
            dismiss();
        } catch {
            toast.error('Failed to renew. Try again.');
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!sub || loading) return;
        setLoading('cancel');
        try {
            await onCancel(sub.id);
            toast.success(`${sub.name} cancelled`);
            dismiss();
        } catch {
            toast.error('Failed to cancel. Try again.');
        } finally {
            setLoading(null);
        }
    };

    if (!visible && !sub) return null;

    const nextDate = sub?.nextBillingDate?.toDate ? (() => {
        const base = sub.nextBillingDate.toDate();
        const next = new Date(base);
        if (sub.billingCycle === 'Mo') next.setMonth(next.getMonth() + 1);
        else next.setFullYear(next.getFullYear() + 1);
        return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    })() : '';

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card }, sheetStyle]}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: colors.border }]} />

                {/* Status badge */}
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>ACTION REQUIRED</Text>
                    </View>
                </View>

                {/* Sub info */}
                <Text style={[styles.subName, { color: colors.text }]}>{sub?.name}</Text>
                <Text style={[styles.subCost, { color: colors.text }]}>
                    {sub ? formatCurrency(sub.cost, currency) : ''}
                    <Text style={[styles.subFreq, { color: colors.muted }]}>
                        {' '}/ {sub?.billingCycle === 'Mo' ? 'month' : 'year'}
                    </Text>
                </Text>

                <Text style={[styles.subHint, { color: colors.muted }]}>
                    {sub?.isTrial
                        ? 'Your free trial has ended. Renew to keep access or cancel.'
                        : 'This subscription has passed its billing date. What would you like to do?'
                    }
                </Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Renew */}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}
                    onPress={handleRenew}
                    disabled={loading !== null}
                    activeOpacity={0.8}
                >
                    <RotateCcw color={colors.accent} size={20} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.actionTitle, { color: colors.accent }]}>
                            {loading === 'renew' ? 'Renewing...' : 'Renew Subscription'}
                        </Text>
                        <Text style={[styles.actionSub, { color: colors.muted }]}>
                            Next billing on {nextDate}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }]}
                    onPress={handleCancel}
                    disabled={loading !== null}
                    activeOpacity={0.8}
                >
                    <XCircle color="#EF4444" size={20} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.actionTitle, { color: '#EF4444' }]}>
                            {loading === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
                        </Text>
                        <Text style={[styles.actionSub, { color: colors.muted }]}>
                            Moved to History — can be restored
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Dismiss */}
                <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.7}>
                    <Text style={[styles.dismissText, { color: colors.muted }]}>Not now</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
    },
    handle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 20,
    },
    badgeRow: { marginBottom: 12 },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(245,158,11,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.35)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    subName: { fontSize: 22, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
    subCost: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    subFreq: { fontSize: 14, fontWeight: '400' },
    subHint: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
    divider: { height: 1, marginBottom: 16 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    actionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    actionSub: { fontSize: 13 },
    dismissBtn: { alignItems: 'center', paddingVertical: 12 },
    dismissText: { fontSize: 15 },
});

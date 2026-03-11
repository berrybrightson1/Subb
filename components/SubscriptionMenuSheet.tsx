import { MoreHorizontal, RotateCcw, Target, XCircle } from 'lucide-react-native';
import React, { useEffect } from 'react';
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
import { formatCurrency } from '../lib/utils';
import { useRouter } from 'expo-router';

interface Props {
    visible: boolean;
    sub: Subscription | null;
    onPaid: () => void;
    onRenew: () => void;
    onClose: () => void;
}

export function SubscriptionMenuSheet({ visible, sub, onPaid, onRenew, onClose }: Props) {
    const { colors, currency } = useAppSettings();
    const insets = useSafeAreaInsets();
    const router = useRouter();

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

    if (!visible && !sub) return null;

    const handleManage = () => {
        dismiss();
        if (sub) router.push(`/sub/${sub.id}`);
    };

    const handleMarkAsPaid = () => {
        onPaid();
        dismiss();
    };

    const handleRenew = () => {
        onRenew();
        dismiss();
    };

    const isCancelled = sub?.status === 'cancelled';
    const isPaid = !!sub?.isPaid;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16, backgroundColor: colors.modal }, sheetStyle]}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: colors.border }]} />

                {/* Sub info */}
                <Text style={[styles.subName, { color: colors.text, fontSize: 18, marginBottom: 4, fontWeight: 'bold' }]}>{sub?.name}</Text>
                <Text style={[styles.subCost, { color: colors.muted, marginBottom: 20 }]}>
                    {sub ? formatCurrency(sub.cost, currency) : ''}
                    <Text style={{ color: colors.muted }}>
                        {' '}/ {sub?.billingCycle === 'Mo' ? 'month' : 'year'}
                    </Text>
                </Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Mark Paid / Renew */}
                {!isPaid ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.card }]}
                        onPress={isCancelled ? handleRenew : handleMarkAsPaid}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: colors.accentMuted }]}>
                            <Target color={colors.accent} size={20} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>
                                {isCancelled ? 'Resubscribe' : 'Mark as Paid'}
                            </Text>
                            <Text style={[styles.actionSub, { color: colors.muted }]}>
                                {isCancelled ? 'Restore this subscription' : 'Log payment for this cycle'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.card }]}
                        onPress={handleRenew}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: colors.accentMuted }]}>
                            <RotateCcw color={colors.accent} size={20} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>
                                Renew Subscription
                            </Text>
                            <Text style={[styles.actionSub, { color: colors.muted }]}>
                                Advances to next billing cycle
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Manage */}
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.card }]}
                    onPress={handleManage}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconBox, { backgroundColor: colors.cardAlt }]}>
                        <Target color={colors.text} size={20} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>
                            Manage
                        </Text>
                        <Text style={[styles.actionSub, { color: colors.muted }]}>
                            Edit details or cancel subscription
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Dismiss */}
                <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.7}>
                    <Text style={[styles.dismissText, { color: colors.muted }]}>Close</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 999,
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
        zIndex: 1000,
    },
    handle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 20,
    },
    divider: { height: 1, marginBottom: 16 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    actionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    actionSub: { fontSize: 13 },
    dismissBtn: { alignItems: 'center', paddingVertical: 12 },
    dismissText: { fontSize: 16, fontWeight: '500' },
    subName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    subCost: { fontSize: 16, marginBottom: 20 },
});

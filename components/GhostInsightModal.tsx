/**
 * components/GhostInsightModal.tsx
 * "Savings Insight" modal shown when a Ghost Sub is detected.
 * A ghost sub is one where lastActivityDate > 30 days ago.
 */
import { Ghost, TrendingDown, X, Zap } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../contexts/AppContext';
import { Subscription } from '../hooks/useSubscriptions';
import { formatCurrency } from '../lib/utils';

interface Props {
    visible: boolean;
    sub: Subscription | null;
    currency: string;
    onCancel: () => void;
    onKeep: () => void;
}

export function GhostInsightModal({ visible, sub, currency, onCancel, onKeep }: Props) {
    const { colors } = useAppSettings();
    const insets = useSafeAreaInsets();

    const translateY = useSharedValue(400);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            translateY.value = withSpring(0, { stiffness: 200, damping: 24 });
        } else {
            opacity.value = withTiming(0, { duration: 180 });
            translateY.value = withTiming(400, { duration: 220 });
        }
    }, [visible]);

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!sub) return null;

    const yearlyCost = sub.billingCycle === 'Mo' ? sub.cost * 12 : sub.cost;
    const monthlyCost = sub.billingCycle === 'Yr' ? sub.cost / 12 : sub.cost;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onKeep}>
            <Animated.View style={[styles.overlay, overlayStyle]}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onKeep} />

                <Animated.View
                    style={[
                        styles.sheet,
                        { backgroundColor: colors.modal, paddingBottom: insets.bottom + 20 },
                        sheetStyle,
                    ]}
                >
                    {/* Handle */}
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.ghostIconWrap, { backgroundColor: 'rgba(148,163,184,0.1)' }]}>
                            <Ghost color="#94A3B8" size={22} strokeWidth={2} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.text }]}>Ghost Subscription</Text>
                            <Text style={[styles.subtitle, { color: colors.muted }]}>No activity detected in 30+ days</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: colors.cardAlt }]}
                            onPress={onKeep}
                        >
                            <X color={colors.muted} size={16} strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>

                    {/* Insight Card */}
                    <View style={[styles.insightCard, { backgroundColor: colors.cardAlt }]}>
                        <View style={styles.insightRow}>
                            <TrendingDown color="#EF4444" size={18} strokeWidth={2} />
                            <Text style={[styles.insightLabel, { color: colors.muted }]}>Potential yearly waste</Text>
                            <Text style={[styles.insightValue, { color: '#EF4444' }]}>
                                {formatCurrency(yearlyCost, currency)}
                            </Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.insightRow}>
                            <Zap color={colors.accent} size={18} strokeWidth={2} />
                            <Text style={[styles.insightLabel, { color: colors.muted }]}>Monthly drain</Text>
                            <Text style={[styles.insightValue, { color: colors.accent }]}>
                                {formatCurrency(monthlyCost, currency)}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.suggestion, { color: colors.muted }]}>
                        over a month. Cancelling it could save you money you&apos;re not spending.
                    </Text>

                    {/* CTAs */}
                    <TouchableOpacity
                        style={[styles.cancelBtn, { backgroundColor: '#EF4444' }]}
                        onPress={onCancel}
                        activeOpacity={0.85}
                    >
                        <Ghost color="#fff" size={16} strokeWidth={2} />
                        <Text style={styles.cancelBtnText}>Cancel This Subscription</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.keepBtn, { borderColor: colors.border }]} onPress={onKeep} activeOpacity={0.7}>
                        <Text style={[styles.keepBtnText, { color: colors.muted }]}>Keep It</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 20,
        gap: 16,
    },
    handle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ghostIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightCard: {
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    insightLabel: {
        flex: 1,
        fontSize: 14,
    },
    insightValue: {
        fontSize: 15,
    },
    divider: {
        height: 1,
    },
    suggestion: {
        fontSize: 14,
        lineHeight: 21,
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 999,
    },
    cancelBtnText: {
        color: '#fff',
        fontSize: 15,
    },
    keepBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 999,
        borderWidth: 1,
    },
    keepBtnText: {
        fontSize: 15,
    },
});

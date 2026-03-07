import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppSettings } from '../contexts/AppContext';
import { Subscription } from '../hooks/useSubscriptions';
import { formatCurrency } from '../lib/utils';

export const CATEGORY_COLORS: Record<string, string> = {
    Entertainment: '#A855F7',
    Productivity:  '#3B82F6',
    Health:        '#10B981',
    Education:     '#F59E0B',
    Utilities:     '#EF4444',
    Other:         '#6B7280',
};

interface Props {
    subscriptions: Subscription[];
    currency: string;
}

export function DonutChart({ subscriptions, currency }: Props) {
    const { colors } = useAppSettings();
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const SIZE = 164;
    const STROKE = 14;
    const RADIUS = (SIZE - STROKE) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const CENTER = SIZE / 2;
    const GAP = 3; // visual gap between segments

    // Tally monthly spend per category (active subs only)
    const totals: Record<string, number> = {};
    for (const sub of subscriptions.filter(s => s.status !== 'cancelled')) {
        const cat = sub.category || 'Other';
        const monthly = sub.billingCycle === 'Mo' ? sub.cost : sub.cost / 12;
        totals[cat] = (totals[cat] || 0) + monthly;
    }

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    // Sort by amount descending
    const segments = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => ({
            category: cat,
            amount,
            pct: (amount / total) * 100,
            color: CATEGORY_COLORS[cat] || '#6B7280',
        }));

    // Build strokeDasharray + strokeDashoffset per segment
    let cumPct = 0;
    const segData = segments.map(seg => {
        const dashLen = Math.max(0, (seg.pct / 100) * CIRCUMFERENCE - GAP);
        const dashOffset = CIRCUMFERENCE - (cumPct / 100) * CIRCUMFERENCE;
        cumPct += seg.pct;
        return { ...seg, dashLen, dashOffset };
    });

    const active = activeIdx !== null ? segData[activeIdx] : null;

    return (
        <View style={s.wrapper}>
            {/* Donut */}
            <View>
                <Svg
                    width={SIZE}
                    height={SIZE}
                    style={{ transform: [{ rotate: '-90deg' }] }}
                >
                    {/* Track */}
                    <Circle
                        cx={CENTER} cy={CENTER} r={RADIUS}
                        fill="none"
                        stroke={colors.cardAlt}
                        strokeWidth={STROKE}
                    />
                    {/* Segments */}
                    {segData.map((seg, i) => (
                        <Circle
                            key={seg.category}
                            cx={CENTER} cy={CENTER} r={RADIUS}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={activeIdx === i ? STROKE + 2 : STROKE - 2}
                            strokeDasharray={`${seg.dashLen} ${CIRCUMFERENCE}`}
                            strokeDashoffset={seg.dashOffset}
                            opacity={activeIdx !== null && activeIdx !== i ? 0.3 : 1}
                        />
                    ))}
                </Svg>

                {/* Center label */}
                <View style={[s.centerOverlay, { width: SIZE, height: SIZE }]}>
                    {active ? (
                        <>
                            <Text style={[s.centerBig, { color: active.color }]}>
                                {Math.round(active.pct)}%
                            </Text>
                            <Text style={[s.centerSmall, { color: colors.muted }]} numberOfLines={1}>
                                {active.category}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={[s.centerBig, { color: colors.text }]}>
                                {formatCurrency(total, currency)}
                            </Text>
                            <Text style={[s.centerSmall, { color: colors.muted }]}>
                                monthly
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Legend */}
            <View style={s.legend}>
                {segData.map((seg, i) => (
                    <TouchableOpacity
                        key={seg.category}
                        style={[s.legendRow, activeIdx === i && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                        onPress={() => setActiveIdx(activeIdx === i ? null : i)}
                        activeOpacity={0.7}
                    >
                        <View style={[s.dot, { backgroundColor: seg.color }]} />
                        <Text style={[s.legendCat, { color: colors.text }]}>{seg.category}</Text>
                        <Text style={[s.legendAmt, { color: colors.muted }]}>
                            {formatCurrency(seg.amount, currency)}
                        </Text>
                        <Text style={[s.legendPct, { color: seg.color }]}>
                            {Math.round(seg.pct)}%
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    wrapper: { alignItems: 'center', gap: 20 },
    centerOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerBig: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
    centerSmall: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
    legend: { width: '100%', gap: 4 },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    legendCat: { flex: 1, fontSize: 13, fontWeight: '500' },
    legendAmt: { fontSize: 13 },
    legendPct: { fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'right' },
});

import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../components/Text';
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
    compact?: boolean;
}

// ─── Compact horizontal bar used on home screen ────────────────────────────
function SpendingBar({ subscriptions, currency }: { subscriptions: Subscription[]; currency: string }) {
    const { colors } = useAppSettings();

    const totals: Record<string, number> = {};
    for (const sub of subscriptions.filter(s => s.status !== 'cancelled')) {
        const cat = sub.category || 'Other';
        const monthly = sub.billingCycle === 'Mo' ? sub.cost : sub.cost / 12;
        totals[cat] = (totals[cat] || 0) + monthly;
    }

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const segments = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => ({
            category: cat,
            amount,
            pct: (amount / total) * 100,
            color: CATEGORY_COLORS[cat] || '#6B7280',
        }));

    return (
        <View style={bar.wrapper}>
            {/* Stacked bar */}
            <View style={[bar.track, { backgroundColor: colors.cardAlt }]}>
                {segments.map((seg, i) => (
                    <View
                        key={seg.category}
                        style={[
                            bar.segment,
                            { width: `${seg.pct}%` as any, backgroundColor: seg.color },
                            i === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                            i === segments.length - 1 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                        ]}
                    />
                ))}
            </View>

            {/* Compact legend — flex wrap */}
            <View style={bar.legend}>
                {segments.map(seg => (
                    <View key={seg.category} style={bar.legendItem}>
                        <View style={[bar.dot, { backgroundColor: seg.color }]} />
                        <Text variant="sans" style={[bar.cat, { color: colors.muted }]}>{seg.category}</Text>
                        <Text variant="sansBold" style={[bar.pct, { color: seg.color }]}>{Math.round(seg.pct)}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const bar = StyleSheet.create({
    wrapper: { gap: 12 },
    track: { height: 8, borderRadius: 6, flexDirection: 'row', overflow: 'hidden' },
    segment: { height: '100%' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    cat: { fontSize: 12 },
    pct: { fontSize: 12 },
});

// ─── Full donut chart used on analytics screen ─────────────────────────────
export function DonutChart({ subscriptions, currency, compact = false }: Props) {
    if (compact) return <SpendingBar subscriptions={subscriptions} currency={currency} />;

    const { colors } = useAppSettings();
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const SIZE = 164;
    const STROKE = 14;
    const RADIUS = (SIZE - STROKE) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const CENTER = SIZE / 2;
    const GAP = 3;

    const totals: Record<string, number> = {};
    for (const sub of subscriptions.filter(s => s.status !== 'cancelled')) {
        const cat = sub.category || 'Other';
        const monthly = sub.billingCycle === 'Mo' ? sub.cost : sub.cost / 12;
        totals[cat] = (totals[cat] || 0) + monthly;
    }

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const segments = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => ({
            category: cat,
            amount,
            pct: (amount / total) * 100,
            color: CATEGORY_COLORS[cat] || '#6B7280',
        }));

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
            <View>
                <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={colors.cardAlt} strokeWidth={STROKE} />
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
                <View style={[s.centerOverlay, { width: SIZE, height: SIZE }]}>
                    {active ? (
                        <>
                            <Text variant="sansBold" style={[s.centerBig, { color: active.color }]}>{Math.round(active.pct)}%</Text>
                            <Text variant="sans" style={[s.centerSmall, { color: colors.muted }]} numberOfLines={1}>{active.category}</Text>
                        </>
                    ) : (
                        <>
                            <Text variant="sansBold" style={[s.centerBig, { color: colors.text }]}>{formatCurrency(total, currency)}</Text>
                            <Text variant="sans" style={[s.centerSmall, { color: colors.muted }]}>monthly</Text>
                        </>
                    )}
                </View>
            </View>

            <View style={s.legend}>
                {segData.map((seg, i) => (
                    <TouchableOpacity
                        key={seg.category}
                        style={[s.legendRow, activeIdx === i && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                        onPress={() => setActiveIdx(activeIdx === i ? null : i)}
                        activeOpacity={0.7}
                    >
                        <View style={[s.dot, { backgroundColor: seg.color }]} />
                        <Text variant="brand" style={[s.legendCat, { color: colors.text }]}>{seg.category}</Text>
                        <Text variant="sansBold" style={[s.legendAmt, { color: colors.muted }]}>{formatCurrency(seg.amount, currency)}</Text>
                        <Text variant="brand" style={[s.legendPct, { color: seg.color }]}>{Math.round(seg.pct)}%</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    wrapper: { alignItems: 'center', gap: 20 },
    centerOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    legend: { width: '100%', gap: 4 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    centerBig: { fontSize: 18 },
    centerSmall: { fontSize: 12, marginTop: 2 },
    legendCat: { flex: 1, fontSize: 13 },
    legendAmt: { fontSize: 13 },
    legendPct: { fontSize: 13, minWidth: 36, textAlign: 'right' },
});

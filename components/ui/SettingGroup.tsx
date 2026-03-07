import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../../lib/theme';

interface Props {
    label?: string;
    children: React.ReactNode;
    colors: ThemeColors;
}

export function SettingGroup({ label, children, colors }: Props) {
    return (
        <View style={s.container}>
            {label && <Text style={[s.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>}
            <View style={[s.card, { backgroundColor: colors.card }]}>
                {children}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        borderRadius: 16,
        paddingHorizontal: 12,
        overflow: 'hidden',
    },
});

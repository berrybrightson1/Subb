import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../lib/theme';

interface Props {
    icon?: React.ReactNode;
    iconBg?: string;
    label: string;
    subLabel?: string;
    rightContent?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
    colors: ThemeColors;
    last?: boolean;
    danger?: boolean;
}

export function SettingRow({
    icon,
    iconBg,
    label,
    subLabel,
    rightContent,
    onPress,
    showArrow = true,
    colors,
    last = false,
    danger = false,
}: Props) {
    const handlePress = () => {
        if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={onPress ? 0.6 : 1}
            onPress={onPress ? handlePress : undefined}
            style={[
                s.container,
                !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
            ]}
        >
            <View style={s.left}>
                {icon && (
                    <View style={[s.iconBox, { backgroundColor: iconBg || colors.cardAlt }]}>
                        {icon}
                    </View>
                )}
                <View style={s.texts}>
                    <Text style={[s.label, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
                    {subLabel && <Text style={[s.subLabel, { color: colors.muted }]}>{subLabel}</Text>}
                </View>
            </View>

            <View style={s.right}>
                {rightContent}
                {onPress && showArrow && !rightContent && (
                    <ChevronRight size={18} color={colors.muted} strokeWidth={2.5} />
                )}
            </View>
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Take up remaining space
        marginRight: 12,
    },
    iconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    texts: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    subLabel: {
        fontSize: 12,
        marginTop: 1,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0, // Never shrink — right content always gets full space
    },
});

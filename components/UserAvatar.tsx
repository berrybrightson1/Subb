import { Smile } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PRESET_AVATARS } from './AvatarPicker';

const VIOLET = '#8B5CF6';

interface Props {
    avatarId?: string | null;
    displayName: string;
    size?: number;
    onPress?: () => void;
}

export function UserAvatar({ avatarId, displayName, size = 80, onPress }: Props) {
    const radius = size / 2;
    const badgeSize = Math.round(size * 0.32);
    const badgeRadius = badgeSize / 2;
    const badgeOffset = Math.round(size * 0.02);

    // Find the preset avatar if one is selected
    const preset = avatarId ? PRESET_AVATARS.find(a => a.id === avatarId) : null;

    // Fallback initials
    const initials = displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const fontSize = size * 0.31;
    const emojiSize = size * 0.52;

    const inner = (
        <View style={[s.glow, { width: size + 6, height: size + 6, borderRadius: radius + 3 }]}>
            {preset ? (
                // Preset emoji avatar
                <View style={[s.presetBg, { width: size, height: size, borderRadius: radius, backgroundColor: preset.bg[0] }]}>
                    <View style={[s.presetOverlay, { backgroundColor: preset.bg[1] }]} />
                    <Text style={[s.emoji, { fontSize: emojiSize }]}>{preset.emoji}</Text>
                </View>
            ) : (
                // Initials fallback
                <View style={[s.fallback, { width: size, height: size, borderRadius: radius }]}>
                    <Text style={[s.initials, { fontSize, color: VIOLET }]}>{initials}</Text>
                </View>
            )}

            {/* Edit badge — shown only when tappable */}
            {onPress && (
                <View style={[
                    s.badge,
                    {
                        width: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeRadius,
                        bottom: badgeOffset,
                        right: badgeOffset,
                    },
                ]}>
                    <Smile color="#fff" size={badgeSize * 0.48} strokeWidth={2} />
                </View>
            )}
        </View>
    );

    if (!onPress) return inner;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            {inner}
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    glow: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: VIOLET,
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 14,
        elevation: 8,
    },
    presetBg: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    presetOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.35,
        transform: [{ translateY: 20 }],
    },
    emoji: {
        textAlign: 'center',
    },
    fallback: {
        backgroundColor: 'rgba(139,92,246,0.13)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    badge: {
        position: 'absolute',
        backgroundColor: VIOLET,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0F0F13',
    },
});

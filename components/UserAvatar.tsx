import { Image } from 'expo-image';
import { Smile } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getAvatarUrl } from './AvatarPicker';

const VIOLET = '#8B5CF6';

interface Props {
    avatarId?: string | null;
    displayName: string;
    size?: number;
    onPress?: () => void;
}

export function UserAvatar({ avatarId, displayName, size = 80, onPress }: Props) {
    const { user } = useAuth();
    const radius = size / 2;
    const badgeSize = Math.round(size * 0.32);
    const badgeRadius = badgeSize / 2;
    const badgeOffset = Math.round(size * 0.02);

    // If an avatarId is chosen, use it. Otherwise, use deterministic UID fallback.
    // If user is somehow not loaded yet, fallback to "default" 
    const seed = avatarId || user?.uid || 'default';

    // Hash the seed to a palette index to keep the background consistent
    const PALETTE = ['#8B5CF6', '#64748B', '#334155', '#475569', '#1E293B'];
    const hashCode = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bgColor = PALETTE[hashCode % PALETTE.length];

    const inner = (
        <View style={[s.glow, { width: size + 6, height: size + 6, borderRadius: radius + 3 }]}>
            <View style={[s.avatarBg, { width: size, height: size, borderRadius: radius, backgroundColor: bgColor }]}>
                <Image
                    source={getAvatarUrl(seed)}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                />
            </View>

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
                    <Smile color="#FFFFFF" size={badgeSize * 0.55} strokeWidth={2.5} />
                </View>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.container}>
                {inner}
            </TouchableOpacity>
        );
    }

    return <View style={s.container}>{inner}</View>;
}

const s = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarBg: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        backgroundColor: VIOLET,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0F172A', // Assumes a dark theme border, but typically it should match bg
    },
});

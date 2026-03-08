import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../lib/theme';

export const PEEP_SEEDS = [
    'Felix', 'Aneka', 'Jack', 'Jocelyn', 'Mason', 'Caleb', 'Christopher', 'Daisy',
    'Destiny', 'Eliza', 'George', 'Grace', 'Harper', 'James', 'Avery', 'Eden',
    'Leo', 'Lucy', 'Oliver', 'Samuel', 'Sophia', 'Thomas', 'Wyatt', 'Zoe'
] as const;

export type AvatarId = string;

// Subb Branding Colors
const PALETTE = ['#8B5CF6', '#64748B', '#334155'];

export function getAvatarUrl(seed: string) {
    return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=transparent`;
}

interface Props {
    visible: boolean;
    currentAvatarId?: string | null;
    onSelect: (avatarId: string) => void;
    onClose: () => void;
    colors: ThemeColors;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function AvatarPicker({ visible, currentAvatarId, onSelect, onClose, colors }: Props) {
    const insets = useSafeAreaInsets();

    const handleSelect = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect(id);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={s.overlay}>
                <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={[s.sheet, { backgroundColor: colors.modal, paddingBottom: insets.bottom + 24 }]}>
                    <View style={[s.handle, { backgroundColor: colors.border }]} />
                    <Text style={[s.title, { color: colors.text }]}>Choose your avatar</Text>
                    <Text style={[s.subtitle, { color: colors.muted }]}>Select a minimalist representation</Text>

                    <ScrollView
                        contentContainerStyle={s.grid}
                        showsVerticalScrollIndicator={false}
                    >
                        {PEEP_SEEDS.map((seed, i) => {
                            const isSelected = currentAvatarId === seed;
                            const bgColor = PALETTE[i % PALETTE.length];

                            return (
                                <AvatarCell
                                    key={seed}
                                    seed={seed}
                                    isSelected={isSelected}
                                    bgColor={bgColor}
                                    borderColor={colors.border}
                                    onSelect={() => handleSelect(seed)}
                                />
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function AvatarCell({ seed, isSelected, bgColor, borderColor, onSelect }: any) {
    const scale = useSharedValue(1);

    const onPressIn = () => { scale.value = withSpring(0.92, { damping: 15 }); };
    const onPressOut = () => { scale.value = withSpring(1, { damping: 15 }); };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedTouchableOpacity
            activeOpacity={0.8}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onSelect}
            style={[
                s.avatarCell,
                animatedStyle,
                { backgroundColor: bgColor },
                isSelected && { borderColor: '#A855F7', borderWidth: 3 },
                !isSelected && { borderColor, borderWidth: 1.5 },
            ]}
        >
            <Image
                source={getAvatarUrl(seed)}
                style={s.avatarImage}
                contentFit="contain"
            />
            {isSelected && (
                <View style={s.selectedBadge}>
                    <Text style={s.selectedCheck}>✓</Text>
                </View>
            )}
        </AnimatedTouchableOpacity>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        height: '82%',
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        alignSelf: 'center', marginBottom: 20,
    },
    title: {
        textAlign: 'center', marginBottom: 6,
    },
    subtitle: {
        fontSize: 14, textAlign: 'center',
        marginBottom: 24, paddingHorizontal: 32,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 14,
        paddingBottom: 40,
        justifyContent: 'center'
    },
    avatarCell: {
        width: '21%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    selectedBadge: {
        position: 'absolute',
        top: 4, right: 4,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: '#A855F7',
        alignItems: 'center', justifyContent: 'center',
    },
    selectedCheck: {
    },
});

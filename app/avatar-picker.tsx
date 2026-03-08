import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import { Text } from '../components/Text';
import { useAppSettings } from '../contexts/AppContext';

export const PEEP_SEEDS = [
    'Felix', 'Aneka', 'Jack', 'Jocelyn', 'Mason', 'Caleb', 'Christopher', 'Daisy',
    'Destiny', 'Eliza', 'George', 'Grace', 'Harper', 'James', 'Avery', 'Eden',
    'Leo', 'Lucy', 'Oliver', 'Samuel', 'Sophia', 'Thomas', 'Wyatt', 'Zoe',
] as const;

const PALETTE = ['#8B5CF6', '#64748B', '#334155'];

export function getAvatarUrl(seed: string) {
    return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=transparent`;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function AvatarCell({ seed, isSelected, bgColor, borderColor, onSelect }: any) {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <AnimatedTouchable
            activeOpacity={0.8}
            onPressIn={() => { scale.value = withSpring(0.92, { damping: 15 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
            onPress={onSelect}
            style={[
                s.cell, animStyle,
                { backgroundColor: bgColor },
                isSelected ? { borderColor: '#A855F7', borderWidth: 3 } : { borderColor, borderWidth: 1.5 },
            ]}
        >
            <Image source={getAvatarUrl(seed)} style={s.image} contentFit="contain" />
            {isSelected && (
                <View style={s.badge}>
                    <Text style={s.badgeCheck}>✓</Text>
                </View>
            )}
        </AnimatedTouchable>
    );
}

export default function AvatarPickerScreen() {
    const router = useRouter();
    const { colors } = useAppSettings();
    const insets = useSafeAreaInsets();
    const [currentId, setCurrentId] = React.useState<string | null>(null);

    React.useEffect(() => {
        AsyncStorage.getItem('userAvatarId').then(id => { if (id) setCurrentId(id); });
    }, []);

    function dismiss() {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }

    async function handleSelect(seed: string) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCurrentId(seed);
        await AsyncStorage.setItem('userAvatarId', seed);
        dismiss();
    }

    return (
        <View style={[s.container, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                    <X color={colors.text} size={18} strokeWidth={2} />
                </TouchableOpacity>
                <Text variant="display" style={[s.title, { color: colors.text }]}>Choose Avatar</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
                {PEEP_SEEDS.map((seed, i) => (
                    <AvatarCell
                        key={seed}
                        seed={seed}
                        isSelected={currentId === seed}
                        bgColor={PALETTE[i % PALETTE.length]}
                        borderColor={colors.border}
                        onSelect={() => handleSelect(seed)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title:    { fontSize: 17, letterSpacing: -0.3 },
    closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    grid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
        gap: 14, justifyContent: 'center',
    },
    cell: {
        width: '21%', aspectRatio: 1,
        borderRadius: 20, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
    },
    image: { width: '100%', height: '100%' },
    badge: {
        position: 'absolute', top: 4, right: 4,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: '#A855F7',
        alignItems: 'center', justifyContent: 'center',
    },
    badgeCheck: { color: '#fff', fontSize: 11 },
});

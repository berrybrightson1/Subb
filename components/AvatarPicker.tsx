import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../lib/theme';

// ─── Preset Avatars ───────────────────────────────────────────────────────────
// Each avatar: emoji + gradient pair
export const PRESET_AVATARS = [
    { id: 'fox', emoji: '🦊', bg: ['#FF6B35', '#FF9500'] },
    { id: 'panda', emoji: '🐼', bg: ['#1A1A2E', '#16213E'] },
    { id: 'cat', emoji: '🐱', bg: ['#A855F7', '#7C3AED'] },
    { id: 'dog', emoji: '🐶', bg: ['#F59E0B', '#D97706'] },
    { id: 'rabbit', emoji: '🐰', bg: ['#EC4899', '#DB2777'] },
    { id: 'bear', emoji: '🐻', bg: ['#8B5E3C', '#6B4226'] },
    { id: 'penguin', emoji: '🐧', bg: ['#3B82F6', '#1D4ED8'] },
    { id: 'lion', emoji: '🦁', bg: ['#F59E0B', '#92400E'] },
    { id: 'koala', emoji: '🐨', bg: ['#6B7280', '#4B5563'] },
    { id: 'owl', emoji: '🦉', bg: ['#7C3AED', '#4C1D95'] },
    { id: 'dragon', emoji: '🐲', bg: ['#10B981', '#065F46'] },
    { id: 'wolf', emoji: '🐺', bg: ['#64748B', '#334155'] },
    { id: 'shark', emoji: '🦈', bg: ['#0EA5E9', '#0369A1'] },
    { id: 'gorilla', emoji: '🦍', bg: ['#4B5563', '#1F2937'] },
    { id: 'unicorn', emoji: '🦄', bg: ['#F472B6', '#A855F7'] },
    { id: 'frog', emoji: '🐸', bg: ['#22C55E', '#15803D'] },
    { id: 'tiger', emoji: '🐯', bg: ['#F97316', '#C2410C'] },
    { id: 'elephant', emoji: '🐘', bg: ['#94A3B8', '#64748B'] },
    { id: 'crab', emoji: '🦀', bg: ['#EF4444', '#B91C1C'] },
    { id: 'octopus', emoji: '🐙', bg: ['#EC4899', '#9D174D'] },
    { id: 'astronaut', emoji: '🧑‍🚀', bg: ['#1E1B4B', '#3730A3'] },
    { id: 'ninja', emoji: '🥷', bg: ['#111827', '#374151'] },
    { id: 'robot', emoji: '🤖', bg: ['#0F172A', '#1E3A5F'] },
    { id: 'ghost', emoji: '👻', bg: ['#6D28D9', '#4C1D95'] },
] as const;

export type AvatarId = typeof PRESET_AVATARS[number]['id'];

interface Props {
    visible: boolean;
    currentAvatarId?: string | null;
    onSelect: (avatarId: string) => void;
    onClose: () => void;
    colors: ThemeColors;
}

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
                <View style={[s.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 24 }]}>
                    <View style={[s.handle, { backgroundColor: colors.border }]} />
                    <Text style={[s.title, { color: colors.text }]}>Choose your avatar</Text>
                    <Text style={[s.subtitle, { color: colors.muted }]}>Pick a character that represents you</Text>

                    <ScrollView
                        contentContainerStyle={s.grid}
                        showsVerticalScrollIndicator={false}
                    >
                        {PRESET_AVATARS.map((avatar) => {
                            const isSelected = currentAvatarId === avatar.id;
                            return (
                                <TouchableOpacity
                                    key={avatar.id}
                                    onPress={() => handleSelect(avatar.id)}
                                    activeOpacity={0.75}
                                    style={[
                                        s.avatarCell,
                                        isSelected && { borderColor: '#A855F7', borderWidth: 3 },
                                        !isSelected && { borderColor: colors.border, borderWidth: 1.5 },
                                    ]}
                                >
                                    {/* Gradient-like dual-layer background */}
                                    <View style={[s.avatarBg, { backgroundColor: avatar.bg[0] }]}>
                                        <View style={[s.avatarBgOverlay, { backgroundColor: avatar.bg[1] }]} />
                                        <Text style={s.avatarEmoji}>{avatar.emoji}</Text>
                                    </View>
                                    {isSelected && (
                                        <View style={s.selectedBadge}>
                                            <Text style={s.selectedCheck}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        maxHeight: '82%',
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        alignSelf: 'center', marginBottom: 20,
    },
    title: {
        fontSize: 20, fontWeight: '700',
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
        paddingBottom: 16,
    },
    avatarCell: {
        width: '21%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    avatarBg: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarBgOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.4,
        transform: [{ translateY: 20 }],
    },
    avatarEmoji: {
        fontSize: 34,
        textAlign: 'center',
    },
    selectedBadge: {
        position: 'absolute',
        top: 4, right: 4,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#A855F7',
        alignItems: 'center', justifyContent: 'center',
    },
    selectedCheck: {
        color: '#fff', fontSize: 11, fontWeight: '800',
    },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { useAppSettings } from '../contexts/AppContext';

const ACCENT = '#A855F7';

export default function BudgetScreen() {
    const { colors, currency } = useAppSettings();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [value, setValue] = useState('');

    useEffect(() => {
        AsyncStorage.getItem('monthlyBudget').then(v => { if (v && v !== '0') setValue(v); });
    }, []);

    function dismiss() {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }

    async function handleSave() {
        const num = Number(value);
        if (!isNaN(num) && num >= 0) {
            await AsyncStorage.setItem('monthlyBudget', num.toString());
        }
        dismiss();
    }

    return (
        <KeyboardAvoidingView
            style={[s.container, { backgroundColor: colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                    <X color={colors.text} size={18} strokeWidth={2} />
                </TouchableOpacity>
                <Text variant="display" style={[s.title, { color: colors.text }]}>Monthly Budget</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={s.body}>
                <Text variant="sans" style={[s.label, { color: colors.muted }]}>Set your monthly spending limit</Text>
                <View style={[s.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text variant="sansBold" style={[s.currency, { color: colors.muted }]}>{currency}</Text>
                    <TextInput
                        style={[s.input, { color: colors.text }]}
                        value={value}
                        onChangeText={setValue}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={colors.muted}
                        autoFocus
                        selectionColor={ACCENT}
                    />
                </View>
            </View>

            {/* Footer */}
            <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.bg }]}>
                <TouchableOpacity style={[s.saveBtn, { backgroundColor: ACCENT }]} onPress={handleSave} activeOpacity={0.85}>
                    <Text variant="brand" style={s.saveTxt}>Save Budget</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    body:     { flex: 1, paddingHorizontal: 20, paddingTop: 32, gap: 12 },
    label:    { fontSize: 14 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 16, height: 64, gap: 8,
    },
    currency: { fontSize: 22 },
    input:    { flex: 1, fontSize: 28, letterSpacing: -0.5 },
    footer:   { paddingHorizontal: 16, paddingTop: 12 },
    saveBtn:  { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    saveTxt:  { fontSize: 16, color: '#fff', letterSpacing: 0.2 },
});

import { useRouter } from 'expo-router';
import { deleteUser } from 'firebase/auth';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { auth } from '../lib/firebase';
import { toast } from '../lib/toast';

// ─── Fixed red palette — always dark, regardless of system theme ──────────────
const BG        = '#0D0608';
const SURFACE   = '#160A0C';
const CARD      = '#1E0D10';
const BORDER    = 'rgba(239,68,68,0.18)';
const RED       = '#F87171';
const RED_DIM   = 'rgba(248,113,113,0.12)';
const TEXT      = '#EEEEF5';
const MUTED     = '#8A8AA8';
const GREEN     = '#34D399';

const CONFIRM_PHRASE = 'confirm delete subb';

export default function DeleteAccountScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [confirmText, setConfirmText] = useState('');
    const [mathAnswer, setMathAnswer] = useState('');
    const [num1, setNum1] = useState(7);
    const [num2, setNum2] = useState(4);

    useEffect(() => {
        setNum1(Math.floor(Math.random() * 9) + 1);
        setNum2(Math.floor(Math.random() * 9) + 1);
    }, []);

    const textOk = confirmText.trim().toLowerCase() === CONFIRM_PHRASE;
    const mathOk = parseInt(mathAnswer, 10) === num1 + num2;
    const canDelete = textOk && mathOk;

    function dismiss() {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }

    const handleDelete = async () => {
        if (!canDelete) return;
        try {
            if (!auth.currentUser) throw new Error('No user');
            await deleteUser(auth.currentUser);
            toast.success('Account deleted');
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete account');
            dismiss();
        }
    };

    return (
        <KeyboardAvoidingView
            style={[s.container, { backgroundColor: BG }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                    <X color={MUTED} size={18} strokeWidth={2} />
                </TouchableOpacity>
                <Text variant="display" style={s.title}>Delete Account</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.scroll}
            >
                {/* Icon */}
                <View style={s.iconWrap}>
                    <ShieldAlert color={RED} size={36} strokeWidth={1.5} />
                </View>

                <Text variant="display" style={s.heading}>Permanent Action</Text>
                <Text variant="sans" style={s.sub}>
                    All your subscriptions, settings, and account data will be permanently erased. This cannot be undone.
                </Text>

                {/* Warning card */}
                <View style={[s.warningCard, { backgroundColor: RED_DIM, borderColor: BORDER }]}>
                    <AlertTriangle color={RED} size={15} strokeWidth={2} />
                    <Text variant="sans" style={s.warningText}>
                        Make sure you have exported your data before proceeding.
                    </Text>
                </View>

                {/* Step 1 */}
                <View style={s.step}>
                    <Text variant="sans" style={s.stepNum}>STEP 1 OF 2</Text>
                    <Text variant="sans" style={s.stepLabel}>
                        Type <Text variant="brand" style={{ color: RED }}>"{CONFIRM_PHRASE}"</Text> below
                    </Text>
                    <View style={[s.inputWrap, { borderColor: textOk ? GREEN : BORDER, backgroundColor: textOk ? 'rgba(52,211,153,0.06)' : CARD }]}>
                        <TextInput
                            style={s.input}
                            value={confirmText}
                            onChangeText={setConfirmText}
                            placeholder={CONFIRM_PHRASE}
                            placeholderTextColor={MUTED}
                            autoCapitalize="none"
                            autoCorrect={false}
                            selectionColor={RED}
                        />
                        {textOk && (
                            <View style={s.checkDot}>
                                <Text style={s.checkMark}>✓</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Step 2 */}
                <View style={s.step}>
                    <Text variant="sans" style={s.stepNum}>STEP 2 OF 2</Text>
                    <Text variant="sans" style={s.stepLabel}>
                        What is <Text variant="brand" style={{ color: RED }}>{num1} + {num2}</Text>?
                    </Text>
                    <View style={[s.inputWrap, { borderColor: mathOk ? GREEN : BORDER, backgroundColor: mathOk ? 'rgba(52,211,153,0.06)' : CARD }]}>
                        <TextInput
                            style={s.input}
                            value={mathAnswer}
                            onChangeText={setMathAnswer}
                            placeholder="Answer"
                            placeholderTextColor={MUTED}
                            keyboardType="number-pad"
                            selectionColor={RED}
                        />
                        {mathOk && (
                            <View style={s.checkDot}>
                                <Text style={s.checkMark}>✓</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Fixed footer */}
            <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: BG }]}>
                <TouchableOpacity
                    style={[s.deleteBtn, canDelete ? s.deleteBtnActive : s.deleteBtnDisabled]}
                    onPress={handleDelete}
                    disabled={!canDelete}
                    activeOpacity={canDelete ? 0.8 : 1}
                >
                    <Text variant="brand" style={[s.deleteBtnText, { opacity: canDelete ? 1 : 0.4 }]}>
                        Delete My Account
                    </Text>
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
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER,
    },
    title:    { fontSize: 17, letterSpacing: -0.3, color: TEXT },
    closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

    scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8, gap: 20 },
    footer: { paddingHorizontal: 16, paddingTop: 12 },

    iconWrap: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: RED_DIM, borderWidth: 1, borderColor: BORDER,
        alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
    },
    heading: { fontSize: 22, letterSpacing: -0.5, color: TEXT, textAlign: 'center', marginTop: -8 },
    sub:     { fontSize: 14, lineHeight: 22, color: MUTED, textAlign: 'center', marginTop: -12 },

    warningCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        borderWidth: 1, borderRadius: 14, padding: 14,
    },
    warningText: { flex: 1, color: RED, fontSize: 13, lineHeight: 20 },

    step:      { gap: 10 },
    stepNum:   { fontSize: 11, letterSpacing: 1, color: RED },
    stepLabel: { fontSize: 14, lineHeight: 20, color: MUTED },

    inputWrap: {
        borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 14, height: 50,
        flexDirection: 'row', alignItems: 'center',
    },
    input: { flex: 1, fontSize: 15, color: TEXT },
    checkDot: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    },
    checkMark: { color: '#fff', fontSize: 13 },

    deleteBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    deleteBtnActive: {
        backgroundColor: RED,
        shadowColor: RED, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    },
    deleteBtnDisabled: {
        backgroundColor: RED,
    },
    deleteBtnText: { fontSize: 16, color: '#fff', letterSpacing: 0.2 },
});

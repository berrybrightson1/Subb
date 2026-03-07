import { AlertTriangle, ShieldAlert, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../lib/theme';

const CONFIRM_PHRASE = 'confirm delete subb';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  colors: ThemeColors;
}

export function SecureDeleteModal({ visible, onClose, onConfirm, colors }: Props) {
  const insets = useSafeAreaInsets();

  const [confirmText, setConfirmText] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(4);

  // Reset & generate new math challenge each time modal opens
  useEffect(() => {
    if (visible) {
      setConfirmText('');
      setMathAnswer('');
      setNum1(Math.floor(Math.random() * 9) + 1);
      setNum2(Math.floor(Math.random() * 9) + 1);
    }
  }, [visible]);

  const textOk = confirmText.trim().toLowerCase() === CONFIRM_PHRASE;
  const mathOk = parseInt(mathAnswer, 10) === num1 + num2;
  const canDelete = textOk && mathOk;

  const s = useMemo(() => makeStyles(colors), [colors]);

  const handleConfirm = async () => {
    if (!canDelete) return;
    await onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Close button */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <X color={colors.muted} size={18} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.content}
          >
            {/* Warning icon */}
            <View style={s.iconWrap}>
              <ShieldAlert color={colors.danger} size={36} strokeWidth={1.5} />
            </View>

            {/* Title */}
            <Text style={s.title}>Delete Account</Text>
            <Text style={s.subtitle}>This action is permanent and cannot be undone.</Text>

            {/* Layer 1: Warning card */}
            <View style={s.warningCard}>
              <AlertTriangle color={colors.danger} size={16} />
              <Text style={s.warningText}>
                All your subscriptions, settings, and account data will be permanently erased.
              </Text>
            </View>

            {/* Layer 2: Text confirmation */}
            <View style={s.layer}>
              <Text style={s.layerNum}>Step 1 of 2</Text>
              <Text style={s.layerLabel}>
                Type{' '}
                <Text style={s.phrase}>"{CONFIRM_PHRASE}"</Text>
                {' '}below
              </Text>
              <View style={[s.inputWrap, textOk && s.inputWrapOk]}>
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder={CONFIRM_PHRASE}
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                  selectionColor={colors.accent}
                  underlineColorAndroid="transparent"
                />
                {textOk && (
                  <View style={s.checkDot}>
                    <Text style={s.checkMark}>✓</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Layer 3: Math challenge */}
            <View style={s.layer}>
              <Text style={s.layerNum}>Step 2 of 2</Text>
              <Text style={s.layerLabel}>
                Prove you're human: what is{' '}
                <Text style={s.phrase}>{num1} + {num2}</Text>?
              </Text>
              <View style={[s.inputWrap, mathOk && s.inputWrapOk]}>
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  value={mathAnswer}
                  onChangeText={setMathAnswer}
                  placeholder="Answer"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  keyboardAppearance="dark"
                  selectionColor={colors.accent}
                  underlineColorAndroid="transparent"
                />
                {mathOk && (
                  <View style={s.checkDot}>
                    <Text style={s.checkMark}>✓</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Delete button */}
            <TouchableOpacity
              style={[s.deleteBtn, canDelete ? s.deleteBtnActive : s.deleteBtnDisabled]}
              onPress={handleConfirm}
              disabled={!canDelete}
              activeOpacity={canDelete ? 0.8 : 1}
            >
              <Text style={[s.deleteBtnText, { opacity: canDelete ? 1 : 0.4 }]}>
                Delete My Account
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.75)',
    },
    sheet: {
      // Red-tinted glassmorphic — very dark with a subtle red cast
      backgroundColor: 'rgba(15,8,18,0.99)',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(239,68,68,0.22)',
      paddingTop: 20,
      maxHeight: '90%',
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 20,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 20,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: 'rgba(239,68,68,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.2)',
    },
    title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
    subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: -12 },

    // Warning card
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.18)',
      borderRadius: 14,
      padding: 14,
    },
    warningText: { flex: 1, color: '#F87171', fontSize: 13, lineHeight: 20 },

    // Layers
    layer: { gap: 10 },
    layerNum: {
      color: colors.danger,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    layerLabel: { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },
    phrase: { color: '#F9FAFB', fontWeight: '700' },

    inputWrap: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputWrapOk: {
      borderColor: '#10B981',
      backgroundColor: 'rgba(16,185,129,0.06)',
    },
    input: { flex: 1, fontSize: 15 },
    checkDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Delete button
    deleteBtn: {
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    deleteBtnActive: {
      backgroundColor: colors.danger,
      shadowColor: colors.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    deleteBtnDisabled: {
      backgroundColor: 'rgba(239,68,68,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
    },
    deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}

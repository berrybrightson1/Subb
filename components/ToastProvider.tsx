import { CircleCheck, CircleX, Info, UserCheck, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../contexts/AppContext';
import { ToastType, _registerToast } from '../lib/toast';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const ICON_COLOR: Record<ToastType, string> = {
  success: '#10B981',
  error: '#EF4444',
  info: '#60A5FA',
  profile: '#8B5CF6',
};

const ICON_BG: Record<ToastType, string> = {
  success: 'rgba(16,185,129,0.18)',
  error: 'rgba(239,68,68,0.18)',
  info: 'rgba(96,165,250,0.18)',
  profile: 'rgba(139,92,246,0.18)',
};

const ICON_MAP = {
  success: CircleCheck,
  error: CircleX,
  info: Info,
  profile: UserCheck,
} as const;

// ─── Individual toast pill ────────────────────────────────────────────────────
function ToastPill({
  item,
  index,
  onDismiss,
}: {
  item: ToastItem;
  index: number;
  onDismiss: (id: string) => void;
}) {
  const { isDark } = useAppSettings();
  const translateY = useSharedValue(80);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  // Animate to correct stack position whenever index changes (new toast pushed in front)
  useEffect(() => {
    const targetY = -(index * 12);
    const targetScale = 1 - index * 0.05;
    const targetOpacity = ([1, 0.7, 0.42] as number[])[index] ?? 0;

    translateY.value = withSpring(targetY, { stiffness: 200, damping: 20 });
    scale.value = withSpring(targetScale, { stiffness: 200, damping: 22 });
    opacity.value = withTiming(targetOpacity, { duration: 200 });
  }, [index]);

  // Auto-dismiss after 3.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 240 });
      translateY.value = withSpring(80, { stiffness: 200, damping: 20 });
      setTimeout(() => onDismiss(item.id), 250);
    }, 3500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const PillIcon = ICON_MAP[item.type];
  const pillBg = isDark ? 'rgba(20,20,28,0.97)' : 'rgba(252,252,254,0.97)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const msgColor = isDark ? '#F4F4F5' : '#111827';
  const closeBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  const closeColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';

  return (
    <Animated.View
      style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }, animStyle]}
    >
      {/* Left icon circle */}
      <View style={[styles.iconWrap, { backgroundColor: ICON_BG[item.type] }]}>
        <PillIcon color={ICON_COLOR[item.type]} size={18} strokeWidth={2.2} />
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: msgColor }]} numberOfLines={2}>
        {item.message}
      </Text>

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: closeBg }]}
        onPress={() => onDismiss(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X color={closeColor} size={13} strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Overlay container (rendered above all content) ──────────────────────────
function ToastOverlay({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;

  return (
    // pointerEvents="box-none" lets taps pass through empty overlay area
    <View
      style={[styles.container, { bottom: insets.bottom + 72 }]}
      pointerEvents="box-none"
    >
      {/*
       * Render oldest first so newest is painted last = highest z-order.
       * toasts[0] = newest (index=0, front, full scale).
       * toasts[1] = second (index=1, peeking behind).
       * toasts[2] = oldest (index=2, barely visible).
       */}
      {[...toasts].reverse().map((item) => (
        <ToastPill
          key={item.id}
          item={item}
          index={toasts.indexOf(item)}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [{ id, type, message }, ...prev].slice(0, 3));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    _registerToast(show);
  }, [show]);

  return (
    <>
      {children}
      <ToastOverlay toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    height: 80,
    justifyContent: 'flex-end',
    zIndex: 99999,
  },
  pill: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 0.5,
    minWidth: 220,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

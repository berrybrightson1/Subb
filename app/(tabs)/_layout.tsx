import { BottomTabBarProps, Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Home, PieChart, Plus, Settings } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { useAppSettings } from '../../contexts/AppContext';
import { NAV_BAR_H } from '../../lib/constants';

const BAR_H = NAV_BAR_H;

type IconComponent = React.ComponentType<{ color: string; size: number; strokeWidth: number }>;

const LEFT_TABS:  { name: string; label: string; Icon: IconComponent }[] = [
  { name: 'index', label: 'Home',      Icon: Home },
  { name: 'subs',  label: 'Analytics', Icon: PieChart },
];
const RIGHT_TABS: { name: string; label: string; Icon: IconComponent }[] = [
  { name: 'profile', label: 'Settings', Icon: Settings },
];

function TabItem({
  focused, label, Icon, colors, onPress,
}: {
  focused: boolean; label: string; Icon: IconComponent; colors: any; onPress: () => void;
}) {
  const active     = useSharedValue(focused ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    active.value = withSpring(focused ? 1 : 0, { damping: 28, stiffness: 300, mass: 0.7 });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(active.value, [0, 1], ['rgba(168,85,247,0)', colors.accentMuted]),
    transform: [{ scale: pressScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:    interpolate(active.value, [0, 0.55, 1], [0, 0, 1]),
    maxWidth:   interpolate(active.value, [0, 1], [0, 90]),
    marginLeft: interpolate(active.value, [0, 1], [0, 6]),
  }));

  const accentIconStyle = useAnimatedStyle(() => ({ opacity: active.value, position: 'absolute' }));
  const mutedIconStyle  = useAnimatedStyle(() => ({ opacity: withTiming(focused ? 0 : 1, { duration: 160 }) }));

  const handlePressIn  = () => { pressScale.value = withTiming(0.92, { duration: 70 }); };
  const handlePressOut = () => { pressScale.value = withTiming(1,   { duration: 100 }); };
  const handlePress    = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
      style={s.cell} android_ripple={{ color: 'transparent' }}>
      <Animated.View style={[s.pill, pillStyle]}>
        <Animated.View style={s.iconWrap}>
          <Animated.View style={mutedIconStyle}>
            <Icon color={colors.muted} size={20} strokeWidth={1.6} />
          </Animated.View>
          <Animated.View style={accentIconStyle}>
            <Icon color={colors.accent} size={20} strokeWidth={2.2} />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[s.labelClip, labelStyle]}>
          <Text variant="brand" style={[s.label, { color: colors.accent }]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function FabButton({ colors }: { colors: any }) {
  const router     = useRouter();
  const pressScale = useSharedValue(1);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn  = () => { pressScale.value = withTiming(0.92, { duration: 70 }); };
  const handlePressOut = () => { pressScale.value = withTiming(1,   { duration: 100 }); };
  const handlePress    = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add');
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={s.cell}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View style={[s.pill, s.fabPill, { backgroundColor: colors.accentMuted }, pillStyle]}>
        <Plus color={colors.accent} size={20} strokeWidth={2.4} />
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useAppSettings();
  const insets     = useSafeAreaInsets();

  const renderTabs = (tabs: typeof LEFT_TABS) =>
    tabs.map((tab) => {
      const routeIndex = state.routes.findIndex(r => r.name === tab.name);
      if (routeIndex === -1) return null;
      const focused = state.index === routeIndex;
      const route   = state.routes[routeIndex];
      const onPress = () => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
      };
      return (
        <TabItem key={tab.name} focused={focused} label={tab.label}
          Icon={tab.Icon} colors={colors} onPress={onPress} />
      );
    });

  return (
    <Animated.View
      style={[s.bar, { height: BAR_H + insets.bottom, paddingBottom: insets.bottom, backgroundColor: colors.card }]}
    >
      {/* Left tabs */}
      {renderTabs(LEFT_TABS)}

      {/* Centred FAB */}
      <FabButton colors={colors} />

      {/* Right tabs */}
      {renderTabs(RIGHT_TABS)}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  cell: {
    flex: 1,
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelClip: { overflow: 'hidden' },
  label: { fontSize: 13 },
  fabPill: { paddingHorizontal: 16 },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="subs" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

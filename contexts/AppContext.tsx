import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { dark, light, ThemeColors, ThemeMode } from '../lib/theme';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'GHS', 'NGN', 'CAD', 'AUD', 'JPY'];

interface AppContextValue {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  currency: string;
  taxEnabled: boolean;
  taxRate: number;
  notifDays: number;
  setThemeMode: (mode: ThemeMode) => void;
  setCurrency: (currency: string) => void;
  setTaxEnabled: (enabled: boolean) => void;
  setTaxRate: (rate: number) => void;
  setNotifDays: (days: number) => void;
}

const AppContext = createContext<AppContextValue>({
  themeMode: 'dark',
  colors: dark,
  isDark: true,
  currency: 'USD',
  taxEnabled: false,
  taxRate: 0,
  notifDays: 3,
  setThemeMode: () => {},
  setCurrency: () => {},
  setTaxEnabled: () => {},
  setTaxRate: () => {},
  setNotifDays: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());
  const [currency, setCurrencyState] = useState('USD');
  const [taxEnabled, setTaxEnabledState] = useState(false);
  const [taxRate, setTaxRateState] = useState(0);
  const [notifDays, setNotifDaysState] = useState(3);
  const [nextIsDark, setNextIsDark] = useState(true);

  const overlayOpacity = useSharedValue(0);

  // Load all settings on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('themeMode'),
      AsyncStorage.getItem('currency'),
      AsyncStorage.getItem('taxEnabled'),
      AsyncStorage.getItem('taxRate'),
      AsyncStorage.getItem('notifDays'),
    ]).then(([tm, cur, tax, tr, nd]) => {
      if (tm) setThemeModeState(tm as ThemeMode);
      if (cur) setCurrencyState(cur);
      if (tax !== null) setTaxEnabledState(tax === 'true');
      if (tr) setTaxRateState(parseFloat(tr));
      if (nd) setNotifDaysState(parseInt(nd, 10));
    });
  }, []);

  // System theme listener
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const isDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? dark : light;

  // Theme change with animated fade-flash transition
  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      const willBeDark =
        mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
      setNextIsDark(willBeDark);
      overlayOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(100, withTiming(0, { duration: 220 })),
      );
      setTimeout(() => {
        setThemeModeState(mode);
        AsyncStorage.setItem('themeMode', mode);
      }, 80);
    },
    [systemScheme, overlayOpacity],
  );

  const setCurrency = useCallback((cur: string) => {
    setCurrencyState(cur);
    AsyncStorage.setItem('currency', cur);
  }, []);

  const setTaxEnabled = useCallback((enabled: boolean) => {
    setTaxEnabledState(enabled);
    AsyncStorage.setItem('taxEnabled', String(enabled));
  }, []);

  const setTaxRate = useCallback((rate: number) => {
    setTaxRateState(rate);
    AsyncStorage.setItem('taxRate', String(rate));
  }, []);

  const setNotifDays = useCallback((days: number) => {
    setNotifDaysState(days);
    AsyncStorage.setItem('notifDays', String(days));
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <AppContext.Provider
      value={{
        themeMode,
        colors,
        isDark,
        currency,
        taxEnabled,
        taxRate,
        notifDays,
        setThemeMode,
        setCurrency,
        setTaxEnabled,
        setTaxRate,
        setNotifDays,
      }}
    >
      <View style={styles.root}>
        {children}
        {/* Full-screen flash overlay that masks the theme-change repaint */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: nextIsDark ? '#000' : '#fff', zIndex: 9999 },
            overlayStyle,
          ]}
        />
      </View>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

export const useAppSettings = () => useContext(AppContext);

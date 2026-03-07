import { Tabs } from 'expo-router';
import { Home, PieChart, Settings } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '../../contexts/AppContext';

export default function TabLayout() {
  const { colors, isDark } = useAppSettings();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: isDark ? '#0F0F13' : '#FFFFFF',
          borderTopColor: colors.tabBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          paddingBottom: insets.bottom,
          height: 49 + insets.bottom,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="subs"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
      {/* Suppress Expo template file from appearing as a tab */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../components/ToastProvider';
import { AppProvider } from '../contexts/AppContext';
import { toast } from '../lib/toast';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => { });

// ─── RevenueCat lazy init (no-ops in Expo Go) ─────────────────────────────────
let Purchases: typeof import('react-native-purchases').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Purchases = require('react-native-purchases').default;
} catch {
  // Not available in Expo Go / web
}

const REVENUECAT_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'test_bKPpVzaW6jDWjcvrssAiFNgJPhQ';

// ─── Foreground notification handler ─────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function ThemedStatusBar() {
  return <StatusBar style="auto" translucent backgroundColor="transparent" />;
}

// ─── App Launch Animation Wrapper ─────────────────────────────────────────────
function AppLaunchWrapper({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    // iOS system spring feel — damping 15, stiffness 120
    scale.value = withSpring(1, { damping: 15, stiffness: 120 }, (finished) => {
      if (finished && Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    });
    opacity.value = withSpring(1, { damping: 15, stiffness: 120 });
  }, []);

  return <Reanimated.View style={animStyle}>{children}</Reanimated.View>;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_500Medium,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Step 1: mount navigator
  useEffect(() => {
    if (fontsLoaded) {
      setIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Step 2: navigate + init RevenueCat after mount
  useEffect(() => {
    if (!isReady) return;
    router.replace('/onboarding');

    // Init RevenueCat once at app startup (idempotent — safe to call multiple times)
    if (Purchases) {
      try {
        if (!Purchases.isConfigured) {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        }
      } catch {
        // Silently ignore — useIsPro hook will re-configure if needed
      }
    }
  }, [isReady]);

  // Step 3: notification listeners
  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      const title = notification.request.content.title ?? 'Subb';
      const body = notification.request.content.body ?? '';
      toast.info(`${title}: ${body}`);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { subId?: string };
      if (data?.subId) {
        router.push(`/sub/${data.subId}`);
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      {isReady && (
        <SafeAreaProvider style={styles.container}>
          <AppProvider>
            <ThemedStatusBar />
            <ToastProvider>
              <AppLaunchWrapper>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                  {/* Main tabs */}
                  <Stack.Screen name="(tabs)" />

                  {/* Add modal — lifts from bottom */}
                  <Stack.Screen
                    name="add"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      contentStyle: { backgroundColor: '#0C0C14' },
                    }}
                  />

                  {/* Sub detail — slide from right (native iOS feel) */}
                  <Stack.Screen
                    name="sub/[id]"
                    options={{
                      animation: 'slide_from_right',
                      animationDuration: 320,
                    }}
                  />

                  <Stack.Screen
                    name="delete-account"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 150, contentStyle: { backgroundColor: '#0D0608' } }}
                  />
                  <Stack.Screen
                    name="avatar-picker"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 150, contentStyle: { backgroundColor: '#0C0C14' } }}
                  />
                  <Stack.Screen
                    name="ghost-insight"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 150, contentStyle: { backgroundColor: '#0C0C14' } }}
                  />
                  <Stack.Screen
                    name="budget"
                    options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 150, contentStyle: { backgroundColor: '#0C0C14' } }}
                  />

                  <Stack.Screen
                    name="calc"
                    options={{ presentation: 'modal' }}
                  />

                  <Stack.Screen
                    name="paywall"
                    options={{ presentation: 'modal' }}
                  />

                  {/* Auth + onboarding — full-screen fade */}
                  <Stack.Screen
                    name="auth"
                    options={{ presentation: 'fullScreenModal', animation: 'fade' }}
                  />
                  <Stack.Screen
                    name="onboarding"
                    options={{ presentation: 'fullScreenModal', animation: 'fade' }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </AppLaunchWrapper>
            </ToastProvider>
          </AppProvider>
        </SafeAreaProvider>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F13',
  },
});

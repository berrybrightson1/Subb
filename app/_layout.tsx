import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../components/ToastProvider';
import { AppProvider, useAppSettings } from '../contexts/AppContext';
import { toast } from '../lib/toast';

// ─── Foreground handler (show alert + play sound while app is open) ───────────
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
  const { isDark } = useAppSettings();
  return <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Step 1: mount the navigator first
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Step 2: navigate only after the Stack is mounted
  useEffect(() => {
    if (isReady) {
      router.replace('/onboarding');
    }
  }, [isReady]);

  // Step 3: wire up notification listeners
  useEffect(() => {
    // Foreground listener → bridge to custom toast pill
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      const title = notification.request.content.title ?? 'Subb';
      const body = notification.request.content.body ?? '';
      toast.info(`${title}: ${body}`);
    });

    // Tap listener → deep-link to sub detail screen
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isReady ? (
        <View style={styles.container} />
      ) : (
        <SafeAreaProvider style={styles.container}>
          <AppProvider>
            <ThemedStatusBar />
            {/* ToastProvider is inside AppProvider so it can read isDark for pill theming */}
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="add" options={{ presentation: 'transparentModal', animation: 'fade' }} />
                <Stack.Screen name="sub/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
                <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
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

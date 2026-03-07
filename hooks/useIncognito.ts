/**
 * hooks/useIncognito.ts
 * Manages the Incognito (Privacy) mode state for Subb.
 * Requires biometric authentication to disable incognito mode.
 * Uses expo-local-authentication — only active on real devices.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '../lib/toast';

const STORAGE_KEY = 'subb_incognito';

export function useIncognito() {
    const [incognito, setIncognito] = useState(false);

    // Load persisted state on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(val => {
            if (val === 'true') setIncognito(true);
        });
    }, []);

    const enableIncognito = useCallback(async () => {
        setIncognito(true);
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
        toast.info('Privacy Mode Enabled');
    }, []);

    const disableIncognito = useCallback(async () => {
        try {
            // Check if hardware is available
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to disable Privacy Mode',
                    fallbackLabel: 'Use Passcode',
                    cancelLabel: 'Cancel',
                    disableDeviceFallback: false,
                });

                if (!result.success) {
                    // User cancelled or failed — keep incognito active
                    if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
                        toast.error('Biometric authentication failed');
                    }
                    return;
                }
            }
            // Hardware not available or not enrolled → allow toggle without biometrics (simulator)
        } catch {
            // Graceful fallback if expo-local-authentication not available
        }

        setIncognito(false);
        await AsyncStorage.setItem(STORAGE_KEY, 'false');
        toast.success('Privacy Mode Disabled');
    }, []);

    return { incognito, enableIncognito, disableIncognito };
}

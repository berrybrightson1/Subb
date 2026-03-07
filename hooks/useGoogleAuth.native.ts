// NATIVE PLATFORM — requires a proper dev build (npx expo run:android / run:ios)
// In Expo Go, GoogleSignin native module is unavailable — we degrade gracefully.
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from '../lib/toast';
import { auth, db } from '../lib/firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

// isExpoGo: Expo Go sets __DEV__ AND lacks a native GoogleSignin binary.
// We detect this by checking if the module can be resolved synchronously without crashing.
function getGoogleSignin() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('@react-native-google-signin/google-signin');
        // Extra guard: in Expo Go the module object is empty / lacks GoogleSignin
        if (!mod?.GoogleSignin?.configure) return null;
        return mod.GoogleSignin;
    } catch {
        return null;
    }
}

export function useGoogleAuth() {
    const signInWithGoogle = async (): Promise<boolean> => {
        const GoogleSignin = getGoogleSignin();

        if (!GoogleSignin) {
            toast.error('Google sign-in requires a custom dev build on device.');
            return false;
        }

        if (!WEB_CLIENT_ID) {
            toast.error('Google sign-in is not configured yet.');
            return false;
        }

        try {
            GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response?.data?.idToken ?? response?.idToken;
            if (!idToken) throw new Error('No ID token returned');

            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            const user = result.user;

            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    createdAt: new Date(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
            }

            toast.success(`Signed in as ${user.displayName ?? user.email}`);
            return true;
        } catch (error: any) {
            if (error?.code === 'SIGN_IN_CANCELLED') return false;
            console.error('Google sign-in error:', error);
            toast.error('Google sign-in failed. Please try again.');
            return false;
        }
    };

    return { signInWithGoogle };
}

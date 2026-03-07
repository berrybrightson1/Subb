// WEB PLATFORM — uses Firebase Auth signInWithPopup, no native modules needed
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from '../lib/toast';
import { auth, db } from '../lib/firebase';

const googleProvider = new GoogleAuthProvider();

export function useGoogleAuth() {
    const signInWithGoogle = async (): Promise<boolean> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Create profile doc if needed — non-blocking, failure is non-fatal
            getDoc(doc(db, 'users', user.uid)).then(snap => {
                if (!snap.exists()) {
                    setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        displayName: user.displayName,
                        createdAt: new Date(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    }).catch(() => { /* rules may not allow yet, user is still signed in */ });
                }
            }).catch(() => { });

            toast.success(`Signed in as ${user.displayName ?? user.email}`);
            return true;
        } catch (error: any) {
            if (error?.code === 'auth/popup-closed-by-user') return false;
            console.error('Google sign-in error:', error);
            toast.error('Google sign-in failed. Please try again.');
            return false;
        }
    };

    return { signInWithGoogle };
}

import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser?.isAnonymous) {
                await auth.signOut();
                setUser(null);
            } else {
                setUser(currentUser);
            }
            setLoading(false);
        });

        // Automatic anonymous sign-in requires explicit console enablement.
        // It has been removed to avoid admin-restricted throwing errors.
        return () => unsubscribe();
    }, []);

    return { user, loading };
}

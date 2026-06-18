import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { refreshAdminToken } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Verify admin role before setting user
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims['role'] === 'admin') {
          await refreshAdminToken(user);
          setUser(user);
        } else {
          // User is authenticated but not admin — clear state
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('wim_admin_token');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}

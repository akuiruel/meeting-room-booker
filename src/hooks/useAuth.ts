import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/config';
import { useToast } from '@/hooks/use-toast';

export interface AuthUser {
  uid: string;
  email: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
        // Check admin role
        await checkAdminRole(firebaseUser.uid);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const userRoleDoc = await getDoc(doc(db, 'user_roles', userId));
      if (userRoleDoc.exists() && userRoleDoc.data()?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Berhasil',
        description: 'Selamat datang kembali!',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Login Gagal',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Registrasi Berhasil',
        description: 'Akun Anda telah dibuat.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Registrasi Gagal',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar dari sistem.',
      });
    } catch (error: any) {
      toast({
        title: 'Logout Gagal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    user,
    session: user, // For backwards compatibility
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  };
};

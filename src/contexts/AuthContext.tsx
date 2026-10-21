import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isRole: (role: UserRole) => boolean;
}

const DEMO_ACCOUNTS: Record<UserRole, { email: string; name: string; uid: string }> = {
  admin: {
    email: 'admin@hadirku.id',
    name: 'Budi Santoso (Admin)',
    uid: 'demo-admin-uid',
  },
  guru: {
    email: 'guru@hadirku.id',
    name: 'Ahmad Fauzi, S.Pd',
    uid: 'demo-guru-uid',
  },
  siswa: {
    email: 'siswa@hadirku.id',
    name: 'Rizky Pratama',
    uid: 'demo-siswa-uid',
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | { uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check demo session from localStorage on initial load
  useEffect(() => {
    const savedDemo = localStorage.getItem('hadirku_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser({ uid: parsed.uid, email: parsed.email });
        setProfile({
          ...parsed,
          createdAt: new Date(parsed.createdAt || Date.now()),
        });
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('hadirku_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              uid: firebaseUser.uid,
              name: data.name || '',
              email: data.email || firebaseUser.email || '',
              role: data.role || 'siswa',
              active: data.active ?? true,
              createdAt: data.createdAt?.toDate() || new Date(),
            });
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemo = async (role: UserRole) => {
    const demo = DEMO_ACCOUNTS[role];
    const demoProfile: UserProfile = {
      uid: demo.uid,
      name: demo.name,
      email: demo.email,
      role,
      active: true,
      createdAt: new Date(),
    };

    localStorage.setItem('hadirku_demo_user', JSON.stringify(demoProfile));
    setUser({ uid: demo.uid, email: demo.email });
    setProfile(demoProfile);
  };

  const login = async (email: string, password: string) => {
    const lowerEmail = email.trim().toLowerCase();

    // Check demo credentials
    if (lowerEmail === 'admin@hadirku.id' && password === 'admin123') {
      await loginAsDemo('admin');
      return;
    }
    if (lowerEmail === 'guru@hadirku.id' && password === 'guru123') {
      await loginAsDemo('guru');
      return;
    }
    if (lowerEmail === 'siswa@hadirku.id' && password === 'siswa123') {
      await loginAsDemo('siswa');
      return;
    }

    // Normal Firebase login
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.removeItem('hadirku_demo_user');
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('hadirku_demo_user');
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setUser(null);
    setProfile(null);
  };

  const isRole = (role: UserRole) => profile?.role === role;

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginAsDemo, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

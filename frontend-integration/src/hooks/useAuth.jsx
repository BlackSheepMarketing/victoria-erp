/**
 * useAuth — REESCRITO para la API nueva (reemplaza supabase.auth.*).
 *
 * ANTES (Supabase):
 *   supabase.auth.signInWithPassword({ email, password })
 *   supabase.auth.signOut()
 *   supabase.auth.getSession()
 *   supabase.auth.onAuthStateChange(...)
 *
 * DESPUES: endpoints propios POST /auth/login, /auth/register, GET /auth/me,
 * y refresh automatico dentro de api.js. La "sesion" es el par de tokens en
 * localStorage; al montar, si hay token se valida con /auth/me.
 *
 * Mantiene una interfaz parecida a la anterior (user, session, loading,
 * signIn, signOut, signUp) para minimizar cambios en las pantallas.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token, recupera el perfil.
  useEffect(() => {
    let activo = true;
    (async () => {
      if (!tokenStore.access) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.get('/auth/me');
        if (activo) setUser(me);
      } catch {
        tokenStore.clear();
        if (activo) setUser(null);
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    tokenStore.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async (payload) => {
    // payload: { email, nombre, password, rolIds? }
    const data = await api.post('/auth/register', payload);
    tokenStore.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Helpers de autorizacion para ocultar/mostrar UI segun permisos.
  const hasPermiso = useCallback(
    (codigo) => !!user?.permisos?.includes(codigo),
    [user],
  );
  const hasRol = useCallback(
    (rol) => !!user?.roles?.includes(rol),
    [user],
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    hasPermiso,
    hasRol,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

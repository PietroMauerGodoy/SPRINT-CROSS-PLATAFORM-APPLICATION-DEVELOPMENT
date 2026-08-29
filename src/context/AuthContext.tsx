import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Usuario } from '../types';
import { useUsuarios } from './UsuariosContext';

// v2: mesmo motivo do UsuariosContext — o formato de Usuario mudou de papel.
const STORAGE_KEY = '@motiva:usuarioLogado:v2';

type AuthContextType = {
  usuario: Usuario | null;
  isHydrated: boolean;
  login: (usuario: string, senha: string) => boolean;
  logout: () => void;
  /** Atualiza o usuário da sessão atual (ex: depois de editar o próprio perfil em Configurações). */
  atualizarUsuarioLogado: (dados: Partial<Usuario>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { buscarPorCredenciais } = useUsuarios();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function carregar() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !ignore) {
          setUsuario(JSON.parse(raw) as Usuario);
        }
      } catch {
        // ignora erro e mantém deslogado
      } finally {
        if (!ignore) setIsHydrated(true);
      }
    }

    void carregar();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (usuario) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usuario)).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    }
  }, [usuario, isHydrated]);

  // A tela de Login não verifica credenciais sozinha — só chama isto, que por
  // sua vez delega ao UsuariosContext (fonte real da lista de contas, com CRUD).
  function login(usuarioDigitado: string, senha: string): boolean {
    const encontrado = buscarPorCredenciais(usuarioDigitado, senha);
    if (!encontrado) return false;
    setUsuario(encontrado);
    return true;
  }

  function logout() {
    setUsuario(null);
  }

  function atualizarUsuarioLogado(dados: Partial<Usuario>) {
    setUsuario((prev) => (prev ? { ...prev, ...dados } : prev));
  }

  return (
    <AuthContext.Provider value={{ usuario, isHydrated, login, logout, atualizarUsuarioLogado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

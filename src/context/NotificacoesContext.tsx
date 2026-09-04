import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { gerarId } from '../utils/id';

export type Notificacao = {
  id:       number;
  cor:      string;
  icone:    string;
  titulo:   string;
  desc:     string;
  criadaEm: Date;
};

type NotificacoesContextType = {
  notificacoes:        Notificacao[];
  naoLidas:            number;
  adicionarNotificacao:(n: Omit<Notificacao, 'id' | 'criadaEm'>) => void;
  marcarTodasLidas:    () => void;
  limparTodas:         () => void;
};

const NotificacoesContext = createContext<NotificacoesContextType | null>(null);

const STORAGE_KEY = '@motiva:notificacoes';
const NAO_LIDAS_KEY = '@motiva:notificacoes_nao_lidas';

const INICIAIS: Notificacao[] = [
  {
    id: 1, cor: '#F59E0B', icone: 'warning-outline',
    titulo: 'Equipe inativa',
    desc: 'Equipe #03 está inativa há mais de 3 dias sem justificativa.',
    criadaEm: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 2, cor: '#3B82F6', icone: 'people-outline',
    titulo: 'Nova equipe criada',
    desc: 'Equipe #11 foi cadastrada e está pronta para receber atribuições.',
    criadaEm: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 3, cor: '#F97316', icone: 'location-outline',
    titulo: 'Equipe em campo',
    desc: 'Equipe #06 registrou entrada no trecho BR-116 Km 55.',
    criadaEm: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 4, cor: '#8B5CF6', icone: 'document-text-outline',
    titulo: 'Relatório disponível',
    desc: 'O relatório semanal de operações foi gerado e está disponível.',
    criadaEm: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export function tempoRelativo(data: Date): string {
  const diff = Math.floor((Date.now() - data.getTime()) / 1000);
  if (diff < 60)   return 'agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) > 1 ? 's' : ''} atrás`;
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(INICIAIS);
  const [naoLidas, setNaoLidas] = useState(INICIAIS.length);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function carregar() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Array<Omit<Notificacao, 'criadaEm'> & { criadaEm: string }>;
          if (Array.isArray(parsed) && !ignore) {
            setNotificacoes(parsed.map((item) => ({ ...item, criadaEm: new Date(item.criadaEm) })));
          }
        }

        const rawNaoLidas = await AsyncStorage.getItem(NAO_LIDAS_KEY);
        if (rawNaoLidas && !ignore) {
          const parsedNaoLidas = Number(rawNaoLidas);
          if (!Number.isNaN(parsedNaoLidas)) {
            setNaoLidas(parsedNaoLidas);
          }
        }
      } catch {
        // ignora erro da leitura e mantém valores iniciais
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
    const payload = notificacoes.map((item) => ({ ...item, criadaEm: item.criadaEm.toISOString() }));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [notificacoes, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(NAO_LIDAS_KEY, String(naoLidas)).catch(() => undefined);
  }, [naoLidas, isHydrated]);

  function adicionarNotificacao(n: Omit<Notificacao, 'id' | 'criadaEm'>) {
    const nova: Notificacao = { ...n, id: gerarId(), criadaEm: new Date() };
    setNotificacoes((prev) => [nova, ...prev]);
    setNaoLidas((prev) => prev + 1);
  }

  function marcarTodasLidas() {
    setNaoLidas(0);
  }

  function limparTodas() {
    setNotificacoes([]);
    setNaoLidas(0);
  }

  return (
    <NotificacoesContext.Provider value={{ notificacoes, naoLidas, adicionarNotificacao, marcarTodasLidas, limparTodas }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  return ctx;
}

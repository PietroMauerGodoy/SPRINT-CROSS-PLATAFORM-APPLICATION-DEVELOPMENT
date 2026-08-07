import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type PapelUsuario = 'Admin' | 'Gestor' | 'Operador de Campo';

export type UsuarioConfig = {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
  avatar?: string;
};

export type NotificacaoPreferencia = {
  novaOcorrenciaCritica: boolean;
  mudancaStatusEquipe:   boolean;
  prazoTrechoVencendo:   boolean;
  relatorioSemanal:      boolean;
  receberPorEmail:       boolean;
};

export type AtividadeLog = {
  id: number;
  usuario: string;
  acao: string;
  dataHora: string;
};

// ─── Dados mockados ─────────────────────────────────────────────────────────

const MOCK_USUARIOS: UsuarioConfig[] = [
  { id: 1, nome: 'Admin Motiva',  email: 'admin@motiva.com',   papel: 'Admin',             avatar: 'perfil_logo' },
  { id: 2, nome: 'João Silva',    email: 'joao.silva@motiva.com', papel: 'Gestor',         avatar: 'perfil_logo' },
  { id: 3, nome: 'Maria Santos',  email: 'maria.santos@motiva.com', papel: 'Operador de Campo', avatar: 'perfil_logo' },
  { id: 4, nome: 'Carlos Oliveira', email: 'carlos.o@motiva.com', papel: 'Operador de Campo', avatar: 'perfil_logo' },
];

const MOCK_LOG: AtividadeLog[] = [
  { id: 5,  usuario: 'Admin Motiva',  acao: 'Atualizou os parâmetros de criticidade da vegetação', dataHora: '12/06/2026 09:32' },
  { id: 4,  usuario: 'João Silva',    acao: 'Cadastrou a Equipe Sigma (#10)',                     dataHora: '12/06/2026 08:15' },
  { id: 3,  usuario: 'Maria Santos',  acao: 'Movimentou o card "Equipe Girassol" para Crítico',   dataHora: '11/06/2026 17:44' },
  { id: 2,  usuario: 'Carlos Oliveira', acao: 'Gerou relatório semanal de operações',             dataHora: '11/06/2026 14:02' },
  { id: 1,  usuario: 'Admin Motiva',  acao: 'Exportou backup de dados do sistema',                dataHora: '10/06/2026 11:20' },
];

// ─── Helpers de persistência (web) ──────────────────────────────────────────

const STORAGE_KEY = 'motiva_configuracoes';

function carregarDoStorage<T>(chave: string, padrao: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return padrao;
  try {
    const raw = window.localStorage.getItem(chave);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
}

function formatarDataHora(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${aaaa} ${hh}:${mi}`;
}

// ─── Contexto ───────────────────────────────────────────────────────────────

type ConfiguracoesContextType = {
  // Perfil
  nomePerfil: string;
  emailPerfil: string;
  avatarPerfil: string | null;
  setNomePerfil: (v: string) => void;
  setEmailPerfil: (v: string) => void;
  setAvatarPerfil: (v: string | null) => void;

  // Preferências
  temaEscuro: boolean;
  setTemaEscuro: (v: boolean) => void;
  idioma: string;
  setIdioma: (v: string) => void;
  modoCompacto: boolean;
  setModoCompacto: (v: boolean) => void;

  // Notificações
  notifPrefs: NotificacaoPreferencia;
  setNotifPref: (k: keyof NotificacaoPreferencia, v: boolean) => void;

  // Usuários
  usuarios: UsuarioConfig[];
  adicionarUsuario: (dados: Omit<UsuarioConfig, 'id'>) => boolean;
  editarUsuario: (id: number, dados: Omit<UsuarioConfig, 'id'>) => boolean;
  removerUsuario: (id: number) => void;

  // Parâmetros do sistema
  pesoManutencao: number;
  pesoClima: number;
  pesoCrescimento: number;
  setPesoManutencao: (v: number) => void;
  setPesoClima: (v: number) => void;
  setPesoCrescimento: (v: number) => void;
  frequenciaReavaliacao: string;
  setFrequenciaReavaliacao: (v: string) => void;
  limiteCriticidade: string;
  setLimiteCriticidade: (v: string) => void;

  // Integrações
  apiClimaConectada: boolean;
  setApiClimaConectada: (v: boolean) => void;

  // Dados e sistema
  logAtividades: AtividadeLog[];
  registrarAtividade: (acao: string) => void;
};

const ConfiguracoesContext = createContext<ConfiguracoesContextType | null>(null);

export function ConfiguracoesProvider({ children }: { children: ReactNode }) {
  const [nomePerfil, setNomePerfil]        = useState('Admin Motiva');
  const [emailPerfil, setEmailPerfil]      = useState('admin@motiva.com');
  const [avatarPerfil, setAvatarPerfil]    = useState<string | null>(null);

  const [temaEscuro, setTemaEscuro]        = useState(true);
  const [idioma, setIdioma]                = useState('pt-BR');
  const [modoCompacto, setModoCompacto]    = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificacaoPreferencia>(() =>
    carregarDoStorage('motiva_notif_prefs', {
      novaOcorrenciaCritica: true,
      mudancaStatusEquipe:   true,
      prazoTrechoVencendo:   true,
      relatorioSemanal:      false,
      receberPorEmail:       true,
    }),
  );

  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>(MOCK_USUARIOS);

const [pesoManutencao, setPesoManutencao]   = useState(() =>
    carregarDoStorage('motiva_param_peso_manutencao', 40),
  );
  const [pesoClima, setPesoClima]             = useState(() =>
    carregarDoStorage('motiva_param_peso_clima', 30),
  );
  const [pesoCrescimento, setPesoCrescimento] = useState(() =>
    carregarDoStorage('motiva_param_peso_crescimento', 30),
  );
  const [frequenciaReavaliacao, setFrequenciaReavaliacao] = useState(() =>
    String(carregarDoStorage('motiva_param_frequencia', '30')),
  );
  const [limiteCriticidade, setLimiteCriticidade] = useState(() =>
    String(carregarDoStorage('motiva_param_limite', '80')),
  );

  const [apiClimaConectada, setApiClimaConectada] = useState(true);

  const [logAtividades, setLogAtividades] = useState<AtividadeLog[]>(MOCK_LOG);

// Persistência das preferências de notificação
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('motiva_notif_prefs', JSON.stringify(notifPrefs));
    }
  }, [notifPrefs]);

  // Persistência dos parâmetros do sistema (Seção 5)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('motiva_param_peso_manutencao', JSON.stringify(pesoManutencao));
      window.localStorage.setItem('motiva_param_peso_clima', JSON.stringify(pesoClima));
      window.localStorage.setItem('motiva_param_peso_crescimento', JSON.stringify(pesoCrescimento));
      window.localStorage.setItem('motiva_param_frequencia', JSON.stringify(frequenciaReavaliacao));
      window.localStorage.setItem('motiva_param_limite', JSON.stringify(limiteCriticidade));
    }
  }, [pesoManutencao, pesoClima, pesoCrescimento, frequenciaReavaliacao, limiteCriticidade]);

  function setNotifPref(k: keyof NotificacaoPreferencia, v: boolean) {
    setNotifPrefs((prev) => ({ ...prev, [k]: v }));
  }

  function registrarAtividade(acao: string) {
    const nova: AtividadeLog = {
      id: Date.now(),
      usuario: nomePerfil,
      acao,
      dataHora: formatarDataHora(new Date()),
    };
    setLogAtividades((prev) => [nova, ...prev]);
  }

  function adicionarUsuario(dados: Omit<UsuarioConfig, 'id'>): boolean {
    const jaExiste = usuarios.some((u) => u.email.toLowerCase() === dados.email.toLowerCase());
    if (jaExiste) return false;
    const novoId = usuarios.length ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
    setUsuarios((prev) => [...prev, { ...dados, id: novoId }]);
    return true;
  }

  function editarUsuario(id: number, dados: Omit<UsuarioConfig, 'id'>): boolean {
    const duplicado = usuarios.some(
      (u) => u.id !== id && u.email.toLowerCase() === dados.email.toLowerCase(),
    );
    if (duplicado) return false;
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...dados } : u)));
    return true;
  }

  function removerUsuario(id: number) {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <ConfiguracoesContext.Provider
      value={{
        nomePerfil, emailPerfil, avatarPerfil, setNomePerfil, setEmailPerfil, setAvatarPerfil,
        temaEscuro, setTemaEscuro, idioma, setIdioma, modoCompacto, setModoCompacto,
        notifPrefs, setNotifPref,
        usuarios, adicionarUsuario, editarUsuario, removerUsuario,
        pesoManutencao, pesoClima, pesoCrescimento,
        setPesoManutencao, setPesoClima, setPesoCrescimento,
        frequenciaReavaliacao, setFrequenciaReavaliacao,
        limiteCriticidade, setLimiteCriticidade,
        apiClimaConectada, setApiClimaConectada,
        logAtividades, registrarAtividade,
      }}
    >
      {children}
    </ConfiguracoesContext.Provider>
  );
}

export function useConfiguracoes() {
  const ctx = useContext(ConfiguracoesContext);
  if (!ctx) throw new Error('useConfiguracoes deve ser usado dentro de ConfiguracoesProvider');
  return ctx;
}

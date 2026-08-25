import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = '@motiva:configuracoes';

const DEFAULT_PREFS: NotificacaoPreferencia = {
 novaOcorrenciaCritica: true,
 mudancaStatusEquipe: true,
 prazoTrechoVencendo: true,
 relatorioSemanal: false,
 receberPorEmail: true,
};

function formatarDataHora(d: Date): string {
 const dd = String(d.getDate()).padStart(2, '0');
 const mm = String(d.getMonth() + 1).padStart(2, '0');
 const aaaa = d.getFullYear();
 const hh = String(d.getHours()).padStart(2, '0');
 const mi = String(d.getMinutes()).padStart(2, '0');
 return `${dd}/${mm}/${aaaa} ${hh}:${mi}`;
}

type ConfiguracoesContextType = {
 nomePerfil: string;
 emailPerfil: string;
 avatarPerfil: string | null;
 setNomePerfil: (v: string) => void;
 setEmailPerfil: (v: string) => void;
 setAvatarPerfil: (v: string | null) => void;

 temaEscuro: boolean;
 setTemaEscuro: (v: boolean) => void;
 idioma: string;
 setIdioma: (v: string) => void;
 modoCompacto: boolean;
 setModoCompacto: (v: boolean) => void;

 notifPrefs: NotificacaoPreferencia;
 setNotifPref: (k: keyof NotificacaoPreferencia, v: boolean) => void;

 usuarios: UsuarioConfig[];
 adicionarUsuario: (dados: Omit<UsuarioConfig, 'id'>) => boolean;
 editarUsuario: (id: number, dados: Omit<UsuarioConfig, 'id'>) => boolean;
 removerUsuario: (id: number) => void;

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

 apiClimaConectada: boolean;
 setApiClimaConectada: (v: boolean) => void;

 logAtividades: AtividadeLog[];
 registrarAtividade: (acao: string) => void;
};

const ConfiguracoesContext = createContext<ConfiguracoesContextType | null>(null);

export function ConfiguracoesProvider({ children }: { children: ReactNode }) {
 const [nomePerfil, setNomePerfil] = useState('Admin Motiva');
 const [emailPerfil, setEmailPerfil] = useState('admin@motiva.com');
 const [avatarPerfil, setAvatarPerfil] = useState<string | null>(null);

 const [temaEscuro, setTemaEscuro] = useState(true);
 const [idioma, setIdioma] = useState('pt-BR');
 const [modoCompacto, setModoCompacto] = useState(false);

 const [notifPrefs, setNotifPrefs] = useState<NotificacaoPreferencia>(DEFAULT_PREFS);
 const [usuarios, setUsuarios] = useState<UsuarioConfig[]>(MOCK_USUARIOS);
 const [pesoManutencao, setPesoManutencao] = useState(40);
 const [pesoClima, setPesoClima] = useState(30);
 const [pesoCrescimento, setPesoCrescimento] = useState(30);
 const [frequenciaReavaliacao, setFrequenciaReavaliacao] = useState('30');
 const [limiteCriticidade, setLimiteCriticidade] = useState('80');
 const [apiClimaConectada, setApiClimaConectada] = useState(true);
 const [logAtividades, setLogAtividades] = useState<AtividadeLog[]>(MOCK_LOG);
 const [isHydrated, setIsHydrated] = useState(false);

 useEffect(() => {
   let ignore = false;

   async function carregar() {
     try {
       const raw = await AsyncStorage.getItem(STORAGE_KEY);
       if (!raw) {
         if (!ignore) setIsHydrated(true);
         return;
       }

       const parsed = JSON.parse(raw) as Partial<{
         nomePerfil: string;
         emailPerfil: string;
         avatarPerfil: string | null;
         temaEscuro: boolean;
         idioma: string;
         modoCompacto: boolean;
         notifPrefs: NotificacaoPreferencia;
         usuarios: UsuarioConfig[];
         pesoManutencao: number;
         pesoClima: number;
         pesoCrescimento: number;
         frequenciaReavaliacao: string;
         limiteCriticidade: string;
         apiClimaConectada: boolean;
         logAtividades: AtividadeLog[];
       }>;

       if (ignore) return;

       if (parsed.nomePerfil !== undefined) setNomePerfil(parsed.nomePerfil);
       if (parsed.emailPerfil !== undefined) setEmailPerfil(parsed.emailPerfil);
       if (parsed.avatarPerfil !== undefined) setAvatarPerfil(parsed.avatarPerfil);
       if (parsed.temaEscuro !== undefined) setTemaEscuro(parsed.temaEscuro);
       if (parsed.idioma !== undefined) setIdioma(parsed.idioma);
       if (parsed.modoCompacto !== undefined) setModoCompacto(parsed.modoCompacto);
       if (parsed.notifPrefs) setNotifPrefs(parsed.notifPrefs);
       if (parsed.usuarios) setUsuarios(parsed.usuarios);
       if (parsed.pesoManutencao !== undefined) setPesoManutencao(parsed.pesoManutencao);
       if (parsed.pesoClima !== undefined) setPesoClima(parsed.pesoClima);
       if (parsed.pesoCrescimento !== undefined) setPesoCrescimento(parsed.pesoCrescimento);
       if (parsed.frequenciaReavaliacao !== undefined) setFrequenciaReavaliacao(String(parsed.frequenciaReavaliacao));
       if (parsed.limiteCriticidade !== undefined) setLimiteCriticidade(String(parsed.limiteCriticidade));
       if (parsed.apiClimaConectada !== undefined) setApiClimaConectada(parsed.apiClimaConectada);
       if (parsed.logAtividades) setLogAtividades(parsed.logAtividades);
     } catch {
       // ignora erro e mantém os valores padrões
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

   const payload = {
     nomePerfil,
     emailPerfil,
     avatarPerfil,
     temaEscuro,
     idioma,
     modoCompacto,
     notifPrefs,
     usuarios,
     pesoManutencao,
     pesoClima,
     pesoCrescimento,
     frequenciaReavaliacao,
     limiteCriticidade,
     apiClimaConectada,
     logAtividades,
   };

   AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
 }, [isHydrated, nomePerfil, emailPerfil, avatarPerfil, temaEscuro, idioma, modoCompacto, notifPrefs, usuarios, pesoManutencao, pesoClima, pesoCrescimento, frequenciaReavaliacao, limiteCriticidade, apiClimaConectada, logAtividades]);

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

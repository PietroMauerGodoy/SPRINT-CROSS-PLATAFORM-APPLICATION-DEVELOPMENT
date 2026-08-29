import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Alert,
  ImageBackground,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme';
import { KanbanItem, RootStackParamList, SeveridadeVegetacao } from '../types';
import { useNotificacoes } from '../context/NotificacoesContext';
import { useKanban } from '../context/KanbanContext';
import { useEquipes } from '../context/EquipesContext';
import { useAuth } from '../context/AuthContext';
import { getKanbanItemsVisiveis, podeCriarOuExcluirKanbanItem, podeVerItemMenuOperacional, ITENS_MENU_SEM_TELA } from '../utils/permissions';
import AppHeader from '../components/AppHeader';

import bgRoxo     from '../../assets/images/backgroundroxo.png';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUNAS: {
  id: string; label: string; cor: string; severidade: SeveridadeVegetacao | null;
}[] = [
  { id: 'todos',   label: 'Todos os KMs',        cor: '#7C3AED', severidade: null      },
  { id: 'leve',    label: 'Leve — 10 a 19cm',    cor: '#16A34A', severidade: 'leve'    },
  { id: 'grave',   label: 'Grave — 20 a 29cm',   cor: '#D97706', severidade: 'grave'   },
  { id: 'critico', label: 'Crítico — ≥ 30cm',    cor: '#DC2626', severidade: 'critico' },
];

const VEGETACAO_OPTS = [
  'Grama Bermuda (Rasteira)',
  'Grama São Carlos',
  'Capim Colonião',
  'Capim Napiê',
  'Mata Ciliar Densa',
];
const RODOVIAS_FILTRO = ['Todas', 'BR-116', 'BR-381', 'SP-280'];
const RODOVIAS_FORM   = ['BR-116', 'BR-381', 'SP-280'];

const RODOVIA_COR: Record<string, string> = {
  'BR-116': '#3B82F6',
  'BR-381': '#6366F1',
  'SP-280': '#8B5CF6',
};
const VEG_COR: Record<string, string> = {
  'Grama Bermuda (Rasteira)': '#22C55E',
  'Grama São Carlos':          '#86EFAC',
  'Capim Colonião':            '#FBBF24',
  'Capim Napiê':               '#F97316',
  'Mata Ciliar Densa':         '#EF4444',
};

// Faixas alinhadas ao Anexo 06/ARTESP: poda obrigatória a partir de 30cm (regra geral).
// 0–29cm dividido em 3 faixas iguais (10cm cada) para dar visibilidade de progressão.
function calcSeveridade(cm: number): SeveridadeVegetacao {
  if (cm >= 30) return 'critico';
  if (cm >= 20) return 'grave';
  if (cm >= 10) return 'leve';
  return 'sem_ocorrencia';
}
function sevCor(sev: SeveridadeVegetacao): string {
  const m: Record<SeveridadeVegetacao, string> = {
    sem_ocorrencia: '#7C3AED', leve: '#16A34A', grave: '#D97706', critico: '#DC2626',
  };
  return m[sev];
}
function sevBg(sev: SeveridadeVegetacao): string {
  const m: Record<SeveridadeVegetacao, string> = {
    sem_ocorrencia: '#EDE9FE', leve: '#DCFCE7', grave: '#FEF3C7', critico: '#FEE2E2',
  };
  return m[sev];
}
function sevLabel(sev: SeveridadeVegetacao): string {
  const m: Record<SeveridadeVegetacao, string> = {
    sem_ocorrencia: 'Sem Ocorrência', leve: 'Leve', grave: 'Grave', critico: 'Crítico',
  };
  return m[sev];
}
function getIA(item: KanbanItem): { texto: string; cor: string } {
  if (item.alturaAtual >= 25) return { texto: 'Risco imediato',     cor: '#DC2626' };
  if (item.alturaAtual >= 15) return { texto: 'Crítico em ~2 dias', cor: '#D97706' };
  if (item.alturaAtual >= 5)  return { texto: 'Grave em ~4 dias',   cor: '#F97316' };
  return { texto: 'Condição normal', cor: '#16A34A' };
}

type Rect = { left: number; top: number; right: number; bottom: number };

// ─── Card do Kanban (mouse + touch) ────────────────────────────────────────
// PanResponder funciona tanto com mouse (web) quanto com toque (Android/iOS),
// ao contrário da implementação anterior baseada em document.addEventListener.
type KanbanCardProps = {
  item: KanbanItem;
  isDragging: boolean;
  onOpenDetail: (item: KanbanItem) => void;
  onOpenMenu: (item: KanbanItem, pos: { x: number; y: number }) => void;
  onDragStart: (item: KanbanItem, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (item: KanbanItem, pageX: number, pageY: number) => void;
};

function KanbanCard({ item, isDragging, onOpenDetail, onOpenMenu, onDragStart, onDragMove, onDragEnd }: KanbanCardProps) {
  const sc     = sevCor(item.severidade);
  const sb     = sevBg(item.severidade);
  const vegCor = VEG_COR[item.tipoVegetacao] ?? '#94A3B8';
  const rodCor = RODOVIA_COR[item.rodovia] ?? '#6366F1';

  const menuBtnRef = useRef<any>(null);
  const itemRef     = useRef(item);
  itemRef.current    = item;

  // Criado uma única vez: por isso lê sempre o item mais recente via itemRef.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      // Só assume o gesto como "arrastar" quando o movimento é predominantemente
      // horizontal — assim um scroll vertical dentro da coluna continua funcionando.
      onMoveShouldSetPanResponderCapture: (_evt, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (evt) => onDragStart(itemRef.current, evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderMove:  (evt) => onDragMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderRelease: (evt) => onDragEnd(itemRef.current, evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderTerminate: (evt) => onDragEnd(itemRef.current, evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  function abrirMenu() {
    const node = menuBtnRef.current;
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        onOpenMenu(item, { x: x + width - 158, y: y + height + 6 });
      });
    }
  }

  return (
    <View style={[s.card, isDragging && s.cardDragging]} {...panResponder.panHandlers}>
      <Pressable onPress={() => onOpenDetail(item)}>
        {/* Color label strips (Trello-style) */}
        <View style={s.cardLabels}>
          <View style={[s.labelStrip, { backgroundColor: sc }]} />
          <View style={[s.labelStrip, { backgroundColor: rodCor }]} />
          <View style={[s.labelStrip, { backgroundColor: vegCor }]} />
        </View>

        <View style={s.cardBody}>
          <View style={s.cardTopRow}>
            <Text style={s.cardNome} numberOfLines={2}>{item.nomeEquipe}</Text>
            <TouchableOpacity ref={menuBtnRef} style={s.cardMenuBtn} onPress={abrirMenu}>
              <Ionicons name="ellipsis-horizontal" size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={s.cardKm}>{item.rodovia}  ·  KM {item.kmInicio}.0 → {item.kmFim}.0</Text>
          <Text style={s.cardVeg} numberOfLines={1}>{item.tipoVegetacao}</Text>

          {/* Footer */}
          <View style={s.cardFooter}>
            <View style={[s.cardSevPill, { backgroundColor: sb }]}>
              <View style={[s.cardSevDot, { backgroundColor: sc }]} />
              <Text style={[s.cardSevTxt, { color: sc }]}>{sevLabel(item.severidade)}</Text>
            </View>
            <View style={s.cardAlt}>
              <Ionicons name="leaf-outline" size={11} color="#94A3B8" />
              <Text style={s.cardAltTxt}>{item.alturaAtual} cm</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Kanban'>;
  route: RouteProp<RootStackParamList, 'Kanban'>;
};

export default function KanbanScreen({ navigation, route }: Props) {
  const { itens, adicionarItem, atualizarItem, removerItem, limparColuna: limparColunaCtx } = useKanban();
  const { setStatusEquipe } = useEquipes();
  const { usuario, logout } = useAuth();
  const itensVisiveis = usuario ? getKanbanItemsVisiveis(usuario, itens) : itens;
  const podeCriarExcluir = usuario ? podeCriarOuExcluirKanbanItem(usuario) : false;
  const mostrarOperacional = usuario ? podeVerItemMenuOperacional(usuario) : false;
  const [rodoviaFiltro, setRodoviaFiltro] = useState('Todas');
  const [dropRodovia, setDropRodovia] = useState(false);

  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [hoverSide, setHoverSide]         = useState<string | null>(null);
  const [showLogout, setShowLogout]       = useState(false);

  const [menuCard, setMenuCard]           = useState<string | null>(null);
  const [menuCardPos, setMenuCardPos]     = useState<{ x: number; y: number } | null>(null);
  const [menuCol, setMenuCol]             = useState<string | null>(null);
  const [draggingItem, setDraggingItem]   = useState<KanbanItem | null>(null);
  const [dragOverCol, setDragOverCol]     = useState<string | null>(null);

  const [cardDetalhe, setCardDetalhe]     = useState<KanbanItem | null>(null);
  const [detObs, setDetObs]               = useState('');
  const [modalCriar, setModalCriar]       = useState(false);
  const [itemEditando, setItemEditando]   = useState<KanbanItem | null>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState<KanbanItem | null>(null);
  const [cardFotos, setCardFotos]             = useState<Record<string, string>>({});
  const [savedId, setSavedId]                 = useState<string | null>(null);
  const [modalAltura, setModalAltura]         = useState<{ item: KanbanItem; targetSev: SeveridadeVegetacao } | null>(null);
  const [novaAltura, setNovaAltura]           = useState('');
  const [alturaErro, setAlturaErro]           = useState<string | null>(null);
  const colRefs                               = useRef<Record<string, any>>({});
  const colRectsCache                         = useRef<{ col: typeof COLUNAS[0]; rect: Rect | null }[]>([]);
  const pan                                   = useRef(new Animated.ValueXY()).current;
  const { adicionarNotificacao }              = useNotificacoes();

  // quick-add state per column
  const [quickAddCol, setQuickAddCol]     = useState<string | null>(null);
  const [quickNome, setQuickNome]         = useState('');

  // form
  const [fEquipe,      setFEquipe]      = useState('');
  const [fRodovia,     setFRodovia]     = useState('BR-116');
  const [fKmInicio,    setFKmInicio]    = useState('');
  const [fKmFim,       setFKmFim]       = useState('');
  const [fVegetacao,   setFVegetacao]   = useState(VEGETACAO_OPTS[0]);
  const [fAltura,      setFAltura]      = useState('');
  const [fResponsavel, setFResponsavel] = useState('');
  const [fData,        setFData]        = useState('');
  const [fUltResp,     setFUltResp]     = useState('');

  const filtrados = useMemo(
    () => rodoviaFiltro === 'Todas' ? itensVisiveis : itensVisiveis.filter((i) => i.rodovia === rodoviaFiltro),
    [itensVisiveis, rodoviaFiltro],
  );
  function colItens(col: typeof COLUNAS[0]) {
    if (col.severidade === null) return filtrados.filter((i) => i.severidade === 'sem_ocorrencia');
    return filtrados.filter((i) => i.severidade === col.severidade);
  }

  // ── Image upload (web) ────────────────────────────────────────────────────
  function pickImage(itemId: string) {
    const input = (document as any).createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new (window as any).FileReader();
      reader.onload = (ev: any) => {
        const uri: string = ev.target?.result;
        if (uri) setCardFotos((p) => ({ ...p, [itemId]: uri }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ── Drag & Drop (mouse + touch, via PanResponder) ────────────────────────
  const GHOST_W = 264;
  const GHOST_H = 60;

  function measureCol(node: any): Promise<Rect | null> {
    return new Promise((resolve) => {
      if (!node) { resolve(null); return; }
      if (typeof node.getBoundingClientRect === 'function') {
        const r = node.getBoundingClientRect();
        resolve({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        return;
      }
      if (typeof node.measureInWindow === 'function') {
        node.measureInWindow((x: number, y: number, width: number, height: number) => {
          resolve({ left: x, top: y, right: x + width, bottom: y + height });
        });
        return;
      }
      resolve(null);
    });
  }

  async function measureAllCols() {
    colRectsCache.current = await Promise.all(
      COLUNAS.map(async (col) => ({ col, rect: await measureCol(colRefs.current[col.id]) })),
    );
  }

  function hitCol(x: number, y: number) {
    return colRectsCache.current.find(({ rect }) =>
      rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    ) ?? null;
  }

  function handleDragStart(item: KanbanItem, pageX: number, pageY: number) {
    setDraggingItem(item);
    pan.setValue({ x: pageX - GHOST_W / 2, y: pageY - GHOST_H / 2 });
    void measureAllCols();
  }

  function handleDragMove(pageX: number, pageY: number) {
    pan.setValue({ x: pageX - GHOST_W / 2, y: pageY - GHOST_H / 2 });
    setDragOverCol(hitCol(pageX, pageY)?.col.id ?? null);
  }

  function handleDragEnd(item: KanbanItem, pageX: number, pageY: number) {
    const over = hitCol(pageX, pageY);
    setDraggingItem(null);
    setDragOverCol(null);
    if (over) {
      const targetSev: SeveridadeVegetacao = over.col.severidade ?? 'sem_ocorrencia';
      setNovaAltura(String(item.alturaAtual));
      setModalAltura({ item, targetSev });
    }
  }

  // ── Confirmação de altura ao arrastar ─────────────────────────────────────
  const FAIXA_RANGES: Record<SeveridadeVegetacao, { min: number; max: number; label: string }> = {
    sem_ocorrencia: { min: 0,  max: 9,   label: '0 – 9 cm'   },
    leve:           { min: 10, max: 19,  label: '10 – 19 cm' },
    grave:          { min: 20, max: 29,  label: '20 – 29 cm' },
    critico:        { min: 30, max: 999, label: '≥ 30 cm'    },
  };

  function confirmarNovaAltura() {
    if (!modalAltura) return;
    const cm = parseFloat(novaAltura.replace(',', '.'));
    if (isNaN(cm) || cm < 0) {
      setAlturaErro('Digite um valor numérico válido (ex: 12).');
      return;
    }
    const faixa = FAIXA_RANGES[modalAltura.targetSev];
    if (cm < faixa.min || cm > faixa.max) {
      setAlturaErro(`Altura fora da faixa. Para esta coluna, insira entre ${faixa.label}.`);
      return;
    }
    setAlturaErro(null);
    const novaSev = calcSeveridade(cm);
    const colLabel = COLUNAS.find((c) => c.severidade === novaSev || (c.severidade === null && novaSev === 'sem_ocorrencia'))?.label ?? novaSev;
    atualizarItem(modalAltura.item.id, { alturaAtual: cm, severidade: novaSev });
    if (modalAltura.item.equipeId) {
      setStatusEquipe(modalAltura.item.equipeId, novaSev === 'sem_ocorrencia' ? 'ativo' : 'em_campo');
    }
    adicionarNotificacao({
      cor:    '#8B5CF6',
      icone:  'albums-outline',
      titulo: 'Card movido no Kanban',
      desc:   `"${modalAltura.item.nomeEquipe}" foi movido para "${colLabel}" (${cm} cm).`,
    });
    setModalAltura(null);
    setNovaAltura('');
  }
  function cancelarNovaAltura() { setModalAltura(null); setNovaAltura(''); setAlturaErro(null); }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function abrirDetalhe(item: KanbanItem) { setMenuCard(null); setCardDetalhe(item); setDetObs(item.observacao); }

  // Abre o detalhe automaticamente ao chegar do Dashboard (ranking/recomendações)
  // com um trecho específico já escolhido. Só dispara uma vez por navegação.
  const abriuParamRef = useRef<string | null>(null);
  useEffect(() => {
    const alvo = route.params?.abrirDetalheId;
    if (!alvo || abriuParamRef.current === alvo) return;
    // Usa itensVisiveis, não itens: um operário não pode abrir o detalhe de um
    // trecho fora do escopo dele mesmo que o id chegue por um link direto.
    const item = itensVisiveis.find((i) => i.id === alvo);
    if (item) {
      abriuParamRef.current = alvo;
      abrirDetalhe(item);
    }
  }, [route.params?.abrirDetalheId, itensVisiveis]);
  function salvarObs() {
    if (!cardDetalhe) return;
    atualizarItem(cardDetalhe.id, { observacao: detObs });
    setCardDetalhe((c) => c ? { ...c, observacao: detObs } : null);
    setSavedId(cardDetalhe.id);
    setTimeout(() => setSavedId(null), 2000);
  }

  function abrirEditar(item: KanbanItem) {
    setMenuCard(null); setCardDetalhe(null); setItemEditando(item);
    setFEquipe(item.nomeEquipe); setFRodovia(item.rodovia);
    setFKmInicio(String(item.kmInicio)); setFKmFim(String(item.kmFim));
    setFVegetacao(item.tipoVegetacao); setFAltura(String(item.alturaAtual));
    setFResponsavel(item.responsavel);
    setFData(item.ultimoServico?.data ?? ''); setFUltResp(item.ultimoServico?.responsavel ?? '');
    setModalCriar(true);
  }

  function abrirCriar() {
    setItemEditando(null);
    setFEquipe(''); setFRodovia('BR-116'); setFKmInicio(''); setFKmFim('');
    setFVegetacao(VEGETACAO_OPTS[0]); setFAltura(''); setFResponsavel(''); setFData(''); setFUltResp('');
    setModalCriar(true);
  }

  function handleQuickAdd(_sev: SeveridadeVegetacao | null) {
    const nome = quickNome.trim();
    setQuickNome(''); setQuickAddCol(null);
    // Abre o modal de criação com o nome já preenchido
    setItemEditando(null);
    setFEquipe(nome);
    setFRodovia('BR-116'); setFKmInicio(''); setFKmFim('');
    setFVegetacao(VEGETACAO_OPTS[0]); setFAltura(''); setFResponsavel(''); setFData(''); setFUltResp('');
    setModalCriar(true);
  }

  function handleSalvar() {
    if (!fEquipe.trim() || !fKmInicio.trim() || !fKmFim.trim()) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
      return;
    }
    const alt = parseFloat(fAltura) || 0;
    const sev: SeveridadeVegetacao = fAltura.trim() ? calcSeveridade(alt) : 'leve';
    const ult = fData.trim() ? { data: fData.trim(), responsavel: fUltResp.trim() } : null;
    setModalCriar(false);
    if (itemEditando) {
      atualizarItem(itemEditando.id, {
        nomeEquipe: fEquipe.trim(), rodovia: fRodovia,
        kmInicio: parseFloat(fKmInicio) || 0, kmFim: parseFloat(fKmFim) || 0,
        tipoVegetacao: fVegetacao, alturaAtual: alt, severidade: sev,
        responsavel: fResponsavel.trim(), ultimoServico: ult,
      });
      adicionarNotificacao({
        cor: '#3B82F6', icone: 'create-outline',
        titulo: 'Card atualizado',
        desc: `Dados de "${fEquipe.trim()}" foram atualizados no Kanban.`,
      });
    } else {
      adicionarItem({
        equipeId: '', nomeEquipe: fEquipe.trim(), rodovia: fRodovia,
        kmInicio: parseFloat(fKmInicio) || 0, kmFim: parseFloat(fKmFim) || 0,
        tipoVegetacao: fVegetacao, alturaAtual: alt, severidade: sev,
        responsavel: fResponsavel.trim(), observacao: '', ultimoServico: ult,
      });
      adicionarNotificacao({
        cor: '#10B981', icone: 'add-circle-outline',
        titulo: 'Novo card criado',
        desc: `"${fEquipe.trim()}" foi adicionado ao Kanban em ${fRodovia}.`,
      });
    }
  }

  function excluir(item: KanbanItem) { setMenuCard(null); setCardDetalhe(null); setConfirmarExcluir(item); }
  function confirmarDelete() {
    if (confirmarExcluir) {
      adicionarNotificacao({
        cor: '#EF4444', icone: 'trash-outline',
        titulo: 'Card excluído',
        desc: `"${confirmarExcluir.nomeEquipe}" foi removido do Kanban.`,
      });
      removerItem(confirmarExcluir.id);
      setConfirmarExcluir(null);
    }
  }
  function limparColuna(sev: SeveridadeVegetacao | null) {
    setMenuCol(null);
    if (sev !== null) limparColunaCtx(sev);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <AppHeader
        title="Kanban"
        onMenuPress={() => setSidebarAberta((v) => !v)}
        onSettingsPress={() => navigation.navigate('Configuracoes')}
        onLogoutPress={() => setShowLogout(true)}
      />

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <View style={s.body}>

        {/* Sidebar */}
        {sidebarAberta && (
          <View style={s.sidebar}>
            {[
              { icon: 'grid-outline',      label: 'Dashboard',    onPress: () => navigation.navigate('Dashboard'),   ativo: false },
              { icon: 'people-outline',    label: 'Equipes',      onPress: () => navigation.navigate('Equipes'),     ativo: false },
              { icon: 'albums-outline',    label: 'Kanban',       onPress: undefined,                                ativo: true  },
              { icon: 'warning-outline',   label: 'Ocorrências',  onPress: () => navigation.navigate('Ocorrencias'), ativo: false },
              { icon: 'map-outline',       label: 'Trechos',      onPress: undefined,                                ativo: false },
              { icon: 'calendar-outline',  label: 'Planejamento', onPress: undefined,                                ativo: false },
              { icon: 'bar-chart-outline', label: 'Relatórios',   onPress: undefined,                                ativo: false },
              { icon: 'settings-outline',  label: 'Config.',      onPress: () => navigation.navigate('Configuracoes'), ativo: false },
            ].filter((item) => mostrarOperacional || !ITENS_MENU_SEM_TELA.includes(item.label)).map((item) => {
              const hov = hoverSide === item.label && !item.ativo;
              return (
                <Pressable key={item.label}
                  style={[s.sideItem, item.ativo && s.sideItemAtivo, hov && s.sideItemHover]}
                  onPress={item.onPress} onHoverIn={() => setHoverSide(item.label)} onHoverOut={() => setHoverSide(null)}>
                  <View style={s.sideItemIcon}>
                    <Ionicons name={item.icon as any} size={18}
                      color={item.ativo ? '#fff' : hov ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'} />
                  </View>
                  <Text style={[s.sideLabel, item.ativo && s.sideLabelAtivo, hov && s.sideLabelHover]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Kanban área ── */}
        <View
          style={s.kanbanArea}
          onStartShouldSetResponder={() => { setDropRodovia(false); setMenuCard(null); setMenuCol(null); return false; }}
        >

          {/* Sub-header do kanban */}
          <View style={s.subHeader}>
            <View>
              <Text style={s.titulo}>Visibilidade das Equipes</Text>
              <Text style={s.subtitulo}>Acompanhe a viabilidade e o progresso das equipes operacionais</Text>
            </View>
            <View style={s.subHeaderRight}>
              {/* Filtro rodovias */}
              <View style={s.dropWrap}>
                <TouchableOpacity style={[s.dropdown, dropRodovia && s.dropdownOpen]}
                  onPress={() => setDropRodovia((v) => !v)}>
                  <Text style={s.dropLbl}>Rodovias</Text>
                  <Text style={s.dropVal}>{rodoviaFiltro}</Text>
                  <Ionicons name={dropRodovia ? 'chevron-up' : 'chevron-down'} size={11} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                {dropRodovia && (
                  <View style={s.dropMenu}>
                    {RODOVIAS_FILTRO.map((r) => (
                      <TouchableOpacity key={r} style={[s.dropItem, rodoviaFiltro === r && s.dropItemOn]}
                        onPress={() => { setRodoviaFiltro(r); setDropRodovia(false); }}>
                        <Text style={[s.dropItemTxt, rodoviaFiltro === r && s.dropItemTxtOn]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            </View>
          </View>

          {/* Board: columns em horizontal scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={s.boardScroll} contentContainerStyle={s.boardContent}>
            {COLUNAS.map((col) => {
              const cards      = colItens(col);
              const isDragOver = dragOverCol === col.id && draggingItem !== null;
              const isMenuCol  = menuCol === col.id;
              return (
                <View
                  key={col.id}
                  ref={(el: any) => { colRefs.current[col.id] = el; }}
                  style={[s.column, isDragOver && { borderColor: col.cor, borderWidth: 2 }]}
                >
                  {/* Column header */}
                  <View style={s.colHeader}>
                    <View style={[s.colAccent, { backgroundColor: col.cor }]} />
                    <Text style={s.colTitle} numberOfLines={1}>{col.label}</Text>
                    <View style={[s.colCount, { backgroundColor: col.cor + '33' }]}>
                      <Text style={[s.colCountTxt, { color: col.cor }]}>{cards.length}</Text>
                    </View>
                    {podeCriarExcluir && (
                      <View style={{ position: 'relative' }}>
                        <TouchableOpacity style={s.colMenuBtn} onPress={() => setMenuCol(isMenuCol ? null : col.id)}>
                          <Ionicons name="ellipsis-horizontal" size={15} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                        {isMenuCol && (
                          <View style={s.colOptMenu}>
                            <TouchableOpacity style={s.colOptItem}
                              onPress={() => { setMenuCol(null); abrirCriar(); }}>
                              <Ionicons name="add-outline" size={14} color="#334155" />
                              <Text style={s.colOptTxt}>Adicionar cartão</Text>
                            </TouchableOpacity>
                            <View style={s.optDivider} />
                            <TouchableOpacity style={s.colOptItem}
                              onPress={() => limparColuna(col.severidade)}>
                              <Ionicons name="trash-outline" size={14} color={colors.error} />
                              <Text style={[s.colOptTxt, { color: colors.error }]}>Limpar coluna</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Cards list (scrollable) */}
                  <ScrollView style={s.colScroll} showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.colScrollContent}>

                    {cards.length === 0 && (
                      <View style={[s.emptySlot, isDragOver && { borderColor: col.cor, backgroundColor: col.cor + '10' }]}>
                        <Ionicons name="albums-outline" size={22} color={isDragOver ? col.cor : 'rgba(255,255,255,0.2)'} />
                        <Text style={[s.emptySlotTxt, isDragOver && { color: col.cor }]}>
                          {isDragOver ? 'Soltar aqui' : 'Sem registros'}
                        </Text>
                      </View>
                    )}

                    {cards.map((item) => (
                      <KanbanCard
                        key={item.id}
                        item={item}
                        isDragging={draggingItem?.id === item.id}
                        onOpenDetail={abrirDetalhe}
                        onOpenMenu={(it, pos) => { setMenuCard(it.id); setMenuCardPos(pos); }}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </ScrollView>

                  {/* Quick add — só quem pode criar/excluir trecho */}
                  {podeCriarExcluir && (
                    quickAddCol === col.id ? (
                      <View style={s.quickAdd}>
                        <TextInput
                          style={s.quickInput}
                          placeholder="Nome da equipe..."
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={quickNome}
                          onChangeText={setQuickNome}
                          autoFocus
                          onSubmitEditing={() => handleQuickAdd(col.severidade)}
                        />
                        <View style={s.quickBtns}>
                          <TouchableOpacity style={s.quickBtnAdd} onPress={() => handleQuickAdd(col.severidade)}>
                            <Text style={s.quickBtnAddTxt}>Adicionar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { setQuickAddCol(null); setQuickNome(''); }}>
                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={s.colAddBtn}
                        onPress={() => { setQuickAddCol(col.id); setQuickNome(''); }}>
                        <Ionicons name="add" size={15} color="rgba(255,255,255,0.55)" />
                        <Text style={s.colAddTxt}>Adicionar cartão</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── GHOST DE ARRASTE (segue o dedo/mouse; funciona em mouse e touch) ─── */}
      {draggingItem && (
        <Animated.View
          pointerEvents="none"
          style={[s.dragGhost, { transform: [...pan.getTranslateTransform(), { rotate: '2deg' }, { scale: 1.04 }] }]}
        >
          <View style={[s.dragGhostBar, { backgroundColor: sevCor(draggingItem.severidade) }]} />
          <Text style={s.dragGhostNome} numberOfLines={1}>{draggingItem.nomeEquipe}</Text>
          <Text style={s.dragGhostKm}>{draggingItem.rodovia} · KM {draggingItem.kmInicio}.0 → {draggingItem.kmFim}.0</Text>
          <Text style={s.dragGhostVeg} numberOfLines={1}>{draggingItem.tipoVegetacao}</Text>
        </Animated.View>
      )}

      {/* ── MENU FLUTUANTE DO CARD (fora do ScrollView, position fixed) ──────── */}
      {menuCard !== null && menuCardPos !== null && (() => {
        const item = itensVisiveis.find((i) => i.id === menuCard);
        if (!item) return null;
        return (
          <View
            key="card-float-menu"
            {...({
              style: {
                position: 'fixed',
                top: menuCardPos.y,
                left: menuCardPos.x,
                width: 158,
                backgroundColor: '#fff',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 20,
                zIndex: 99999,
              },
            } as any)}
          >
            <TouchableOpacity style={s.colOptItem} onPress={() => { setMenuCard(null); setMenuCardPos(null); abrirDetalhe(item); }}>
              <Ionicons name="eye-outline" size={14} color="#334155" />
              <Text style={s.colOptTxt}>Ver detalhes</Text>
            </TouchableOpacity>
            <View style={s.optDivider} />
            <TouchableOpacity style={s.colOptItem} onPress={() => { setMenuCard(null); setMenuCardPos(null); abrirEditar(item); }}>
              <Ionicons name="create-outline" size={14} color="#334155" />
              <Text style={s.colOptTxt}>Editar</Text>
            </TouchableOpacity>
            {podeCriarExcluir && (
              <>
                <View style={s.optDivider} />
                <TouchableOpacity style={s.colOptItem} onPress={() => { setMenuCard(null); setMenuCardPos(null); excluir(item); }}>
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                  <Text style={[s.colOptTxt, { color: colors.error }]}>Excluir</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );
      })()}

      {/* ── MODAL LOGOUT ────────────────────────────────────────────────────── */}
      <Modal visible={showLogout} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.smallCard}>
            <View style={[s.smallIconBox, { backgroundColor: '#EDE9FE' }]}>
              <MaterialIcons name="logout" size={26} color={colors.primary} />
            </View>
            <Text style={s.smallTitulo}>Encerrar sessão</Text>
            <Text style={s.smallDesc}>Tem certeza que deseja sair?{'\n'}Você será redirecionado para o login.</Text>
            <View style={s.smallBtns}>
              <TouchableOpacity style={s.smallBtnCancel} onPress={() => setShowLogout(false)}>
                <Text style={s.smallBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.smallBtnConfirm, { backgroundColor: colors.primary }]}
                onPress={() => { logout(); navigation.replace('Login'); }}>
                <MaterialIcons name="logout" size={14} color="#fff" />
                <Text style={s.smallBtnConfirmTxt}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL DETALHE ───────────────────────────────────────────────────── */}
      <Modal visible={cardDetalhe !== null} transparent animationType="fade">
        <View style={s.overlay}>
          {cardDetalhe && (() => {
            const ia = getIA(cardDetalhe);
            const sc = sevCor(cardDetalhe.severidade);
            const sb = sevBg(cardDetalhe.severidade);
            return (
              <View style={s.detalheCard}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                  <View style={s.detHeader}>
                    <View style={[s.detIdChip, { backgroundColor: sb }]}>
                      <Text style={[s.detId, { color: sc }]}>{cardDetalhe.equipeId || cardDetalhe.id}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setCardDetalhe(null)}>
                      <Ionicons name="close" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.detNome}>{cardDetalhe.nomeEquipe}</Text>
                  <View style={s.detMetaRow}>
                    <View style={[s.detSevChip, { backgroundColor: sb }]}>
                      <View style={[s.detSevDot, { backgroundColor: sc }]} />
                      <Text style={[s.detSevLabel, { color: sc }]}>{sevLabel(cardDetalhe.severidade)}</Text>
                    </View>
                    <Text style={s.detRodovia}>{cardDetalhe.rodovia}  ·  KM {cardDetalhe.kmInicio}.0 → {cardDetalhe.kmFim}.0</Text>
                  </View>

                  <View style={s.secCard}>
                    <View style={[s.secIconBox, { backgroundColor: '#EDE9FE' }]}>
                      <Ionicons name="camera-outline" size={19} color={colors.primary} />
                    </View>
                    <View style={s.secContent}>
                      <Text style={s.secTitle}>Foto do trecho</Text>
                      <Text style={s.secDesc}>Adicione uma imagem atual para análise.</Text>
                      {cardFotos[cardDetalhe.id] ? (
                        <View style={s.uploadPreviewWrap}>
                          <Image source={{ uri: cardFotos[cardDetalhe.id] }} style={s.uploadPreview} resizeMode="cover" />
                          <TouchableOpacity style={s.uploadTrocarBtn} onPress={() => pickImage(cardDetalhe.id)}>
                            <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                            <Text style={s.uploadTrocarTxt}>Trocar imagem</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={s.uploadArea} onPress={() => pickImage(cardDetalhe.id)}>
                          <Ionicons name="cloud-upload-outline" size={24} color="#CBD5E1" />
                          <Text style={s.uploadLbl}>PNG, JPG ou JPEG</Text>
                          <View style={s.uploadBtn}>
                            <Text style={s.uploadBtnTxt}>Enviar Imagem</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={s.secCard}>
                    <View style={[s.secIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="document-text-outline" size={19} color="#3B82F6" />
                    </View>
                    <View style={s.secContent}>
                      <Text style={s.secTitle}>Observação</Text>
                      <Text style={s.secDesc}>Registre as condições atuais do trecho.</Text>
                      <TextInput style={s.obsInput} placeholder="Digite suas observações..."
                        placeholderTextColor="#CBD5E1" multiline numberOfLines={3}
                        value={detObs} onChangeText={setDetObs} />
                      <Text style={s.obsCount}>{detObs.length}/200</Text>
                    </View>
                  </View>

                  <View style={s.secCard}>
                    <View style={[s.secIconBox, { backgroundColor: '#FFF7ED' }]}>
                      <Ionicons name="construct-outline" size={19} color="#F97316" />
                    </View>
                    <View style={s.secContent}>
                      <Text style={s.secTitle}>Último serviço</Text>
                      <Text style={s.secDesc}>Informações do último serviço realizado.</Text>
                      {cardDetalhe.ultimoServico ? (
                        <View style={s.servicoBox}>
                          <View style={s.servicoRow}>
                            <Text style={s.servicoLbl}>Data</Text>
                            <Text style={s.servicoVal}>{cardDetalhe.ultimoServico.data}</Text>
                          </View>
                          <View style={[s.servicoRow, { marginBottom: 0 }]}>
                            <Text style={s.servicoLbl}>Responsável</Text>
                            <Text style={s.servicoVal}>{cardDetalhe.ultimoServico.responsavel}</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={s.semServico}>Nenhum serviço registrado</Text>
                      )}
                    </View>
                  </View>

                  <View style={s.iaCard}>
                    <View style={s.iaIconBox}>
                      <Ionicons name="sparkles" size={19} color="#fff" />
                    </View>
                    <View style={s.secContent}>
                      <Text style={s.iaTitulo}>Previsão da IA</Text>
                      <Text style={s.iaDesc}>Análise baseada em dados históricos e condição do trecho.</Text>
                      <View style={[s.iaBadge, { borderColor: ia.cor, backgroundColor: ia.cor + '15' }]}>
                        <Ionicons name="warning-outline" size={13} color={ia.cor} />
                        <Text style={[s.iaBadgeTxt, { color: ia.cor }]}>{ia.texto}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                <View style={s.detFooter}>
                  {podeCriarExcluir && (
                    <TouchableOpacity style={s.detBtnDel} onPress={() => excluir(cardDetalhe)}>
                      <Ionicons name="trash-outline" size={14} color={colors.error} />
                      <Text style={s.detBtnDelTxt}>Excluir</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.detBtnEdit} onPress={() => abrirEditar(cardDetalhe)}>
                    <Ionicons name="create-outline" size={14} color={colors.primary} />
                    <Text style={s.detBtnEditTxt}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.detBtnSave, savedId === cardDetalhe.id && { backgroundColor: '#16A34A' }]}
                    onPress={salvarObs}>
                    {savedId === cardDetalhe.id
                      ? <><Ionicons name="checkmark" size={14} color="#fff" /><Text style={s.detBtnSaveTxt}>Salvo!</Text></>
                      : <Text style={s.detBtnSaveTxt}>Salvar Informações</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ── MODAL CRIAR/EDITAR ──────────────────────────────────────────────── */}
      <Modal visible={modalCriar} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={s.modalHead}>
                <Text style={s.modalTitulo}>{itemEditando ? `Editar ${itemEditando.equipeId || itemEditando.id}` : 'Nova Ocorrência'}</Text>
                <TouchableOpacity onPress={() => setModalCriar(false)}>
                  <Ionicons name="close" size={22} color={colors.secondary} />
                </TouchableOpacity>
              </View>
              {([
                { label: 'Nome da Equipe',       val: fEquipe,      set: setFEquipe,      ph: 'Ex: Equipe Alfa'    },
                { label: 'KM Início',            val: fKmInicio,    set: setFKmInicio,    ph: 'Ex: 0'              },
                { label: 'KM Fim',               val: fKmFim,       set: setFKmFim,       ph: 'Ex: 5'              },
                { label: 'Altura Atual (cm)',     val: fAltura,      set: setFAltura,      ph: 'Ex: 12'             },
                { label: 'Responsável',          val: fResponsavel, set: setFResponsavel, ph: 'Ex: Eng. Silva'     },
                { label: 'Data último serviço',  val: fData,        set: setFData,        ph: 'Ex: 15/05/2026'     },
                { label: 'Resp. último serviço', val: fUltResp,     set: setFUltResp,     ph: 'Ex: Eng. Pedro'     },
              ] as const).map((f) => (
                <View key={f.label} style={s.mField}>
                  <Text style={s.mLabel}>{f.label}</Text>
                  <TextInput style={s.mInput} placeholder={f.ph} placeholderTextColor={colors.gray400}
                    value={f.val} onChangeText={f.set as (t: string) => void} />
                </View>
              ))}
              <View style={s.mField}>
                <Text style={s.mLabel}>Rodovia</Text>
                <View style={s.chipRow}>
                  {RODOVIAS_FORM.map((r) => (
                    <TouchableOpacity key={r} style={[s.chip, fRodovia === r && s.chipOn]} onPress={() => setFRodovia(r)}>
                      <Text style={[s.chipTxt, fRodovia === r && s.chipTxtOn]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.mField}>
                <Text style={s.mLabel}>Tipo de Vegetação</Text>
                <View style={s.vegGrid}>
                  {VEGETACAO_OPTS.map((v) => (
                    <TouchableOpacity key={v} style={[s.chip, fVegetacao === v && s.chipOn]} onPress={() => setFVegetacao(v)}>
                      <Text style={[s.chipTxt, fVegetacao === v && s.chipTxtOn]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.mFooter}>
                <TouchableOpacity style={s.mBtnCancel} onPress={() => setModalCriar(false)}>
                  <Text style={s.mBtnCancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.mBtnSave} onPress={handleSalvar}>
                  <Text style={s.mBtnSaveTxt}>{itemEditando ? 'Salvar' : 'Criar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL ATUALIZAR ALTURA ──────────────────────────────────────────── */}
      <Modal visible={modalAltura !== null} transparent animationType="fade">
        <View style={s.overlay}>
          {modalAltura && (() => {
            const col   = COLUNAS.find((c) => c.severidade === modalAltura.targetSev);
            const sc    = sevCor(modalAltura.targetSev);
            const sb    = sevBg(modalAltura.targetSev);
            const faixa = FAIXA_RANGES[modalAltura.targetSev];
            return (
              <View style={s.alturaCard}>
                {/* Ícone + título */}
                <View style={[s.alturaIconBox, { backgroundColor: sb }]}>
                  <Ionicons name="leaf" size={22} color={sc} />
                </View>
                <Text style={s.alturaTitulo}>Atualizar altura da vegetação</Text>
                <Text style={s.alturaSubtitulo}>
                  Movendo para{' '}
                  <Text style={{ color: sc, fontWeight: '700' }}>{col?.label ?? modalAltura.targetSev}</Text>
                </Text>

                {/* Faixa esperada para a coluna */}
                <View style={[s.alturaFaixaBox, { backgroundColor: sb, borderColor: sc + '44' }]}>
                  <Ionicons name="information-circle-outline" size={14} color={sc} style={{ marginRight: 6 }} />
                  <Text style={[s.alturaFaixaTxt, { color: sc }]}>
                    Faixa válida para esta coluna: <Text style={{ fontWeight: '700' }}>{faixa.label}</Text>
                  </Text>
                </View>

                {/* Input */}
                <Text style={s.alturaLabel}>Altura atual medida (cm)</Text>
                <View style={[s.alturaInputRow, alturaErro ? { borderColor: '#EF4444' } : {}]}>
                  <TextInput
                    style={s.alturaInput}
                    value={novaAltura}
                    onChangeText={(v) => { setNovaAltura(v); setAlturaErro(null); }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    autoFocus
                    selectTextOnFocus
                  />
                  <View style={s.alturaSufixo}>
                    <Text style={s.alturaSufixoTxt}>cm</Text>
                  </View>
                </View>

                {alturaErro ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 10 }}>
                    <Ionicons name="alert-circle-outline" size={13} color="#EF4444" style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 12, color: '#EF4444', flex: 1, lineHeight: 16 }}>{alturaErro}</Text>
                  </View>
                ) : null}

                {/* Nota: severidade será recalculada */}
                <Text style={s.alturaNote}>
                  A severidade será recalculada automaticamente com base na altura informada.
                </Text>

                {/* Botões */}
                <View style={s.alturaBtns}>
                  <TouchableOpacity style={[s.alturaBtnCancel, { marginRight: 10 }]} onPress={cancelarNovaAltura}>
                    <Text style={s.alturaBtnCancelTxt}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.alturaBtnOk, { backgroundColor: sc }]} onPress={confirmarNovaAltura}>
                    <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={s.alturaBtnOkTxt}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ── MODAL EXCLUIR ───────────────────────────────────────────────────── */}
      <Modal visible={confirmarExcluir !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.smallCard}>
            <View style={s.smallIconBox}>
              <Ionicons name="trash" size={28} color={colors.error} />
            </View>
            <Text style={s.smallTitulo}>Excluir ocorrência</Text>
            <Text style={s.smallDesc}>
              Tem certeza que deseja excluir{' '}
              <Text style={{ fontWeight: '700' }}>{confirmarExcluir?.equipeId || confirmarExcluir?.id}</Text>?{'\n'}
              Esta ação não pode ser desfeita.
            </Text>
            <View style={s.smallBtns}>
              <TouchableOpacity style={s.smallBtnCancel} onPress={() => setConfirmarExcluir(null)}>
                <Text style={s.smallBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtnConfirm} onPress={confirmarDelete}>
                <Ionicons name="trash-outline" size={14} color="#fff" />
                <Text style={s.smallBtnConfirmTxt}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#3B0FA6' },
  bgFill: { width: '100%', height: '100%' },

  notifDot:     { position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#fff' },

  // Body
  body: { flex: 1, flexDirection: 'row', paddingLeft: 48, paddingRight: 24, paddingBottom: 16 },

  // Sidebar
  sidebar:        { width: 160, marginRight: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  sideItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginVertical: 2 },
  sideItemIcon:   { marginRight: 10 },
  sideItemAtivo:  { backgroundColor: colors.primary },
  sideItemHover:  { backgroundColor: 'rgba(255,255,255,0.1)' },
  sideLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  sideLabelAtivo: { color: '#fff', fontWeight: '700' },
  sideLabelHover: { color: 'rgba(255,255,255,0.9)' },

  // Kanban area (replaces white contentCard)
  kanbanArea: { flex: 1, flexDirection: 'column' },

  // Sub-header (title + filters)
  subHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingRight: 24, zIndex: 999, overflow: 'visible' },
  subHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 999, overflow: 'visible' },
  titulo:         { fontSize: 18, fontWeight: '700', color: '#fff' },
  subtitulo:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  btnCriar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  btnCriarTxt:    { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Dropdown
  dropWrap:      { position: 'relative', zIndex: 999 },
  dropdown:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, minWidth: 140 },
  dropdownOpen:  { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' },
  dropLbl:       { fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.4 },
  dropVal:       { fontSize: 13, color: '#fff', fontWeight: '600', flex: 1 },
  dropMenu:      { position: 'absolute', top: 42, right: 0, minWidth: 160, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 14 },
  dropItem:      { paddingHorizontal: 14, paddingVertical: 10 },
  dropItemOn:    { backgroundColor: '#EDE9FE' },
  dropItemTxt:   { fontSize: 13, color: colors.secondary },
  dropItemTxtOn: { color: colors.primary, fontWeight: '600' },

  // Board
  boardScroll:   { flex: 1 },
  boardContent:  { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 24 },

  // Column (glass effect)
  column: {
    width: 270,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: 520,
    flexDirection: 'column',
  },

  // Column header
  colHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', borderTopLeftRadius: 14, borderTopRightRadius: 14, zIndex: 20 },
  colAccent:   { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  colTitle:    { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  colCount:    { minWidth: 22, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, marginRight: 6 },
  colCountTxt: { fontSize: 11, fontWeight: '800' },
  colMenuBtn:  { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },

  // Column options menu
  colOptMenu: { position: 'absolute', top: 30, right: 0, width: 168, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 50, zIndex: 9999 },
  colOptItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  colOptTxt:  { fontSize: 13, color: '#334155', fontWeight: '500' },
  optDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },

  // Column scroll
  colScroll:        { flex: 1 },
  colScrollContent: { padding: 8, gap: 8 },

  // Empty slot
  emptySlot:    { minHeight: 90, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptySlotTxt: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDragging: { opacity: 0.3 },
  cardLabels:   { flexDirection: 'row', height: 5, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden' },
  labelStrip:   { flex: 1, height: 5 },
  cardBody:     { padding: 10 },
  cardTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardNome:     { flex: 1, fontSize: 13, fontWeight: '700', color: '#1E293B', lineHeight: 18, marginRight: 4 },
  cardMenuBtn:  { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  cardOptMenu:  { position: 'absolute', top: 26, right: 0, width: 155, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 50, zIndex: 9999 },
  cardKm:       { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 3 },
  cardVeg:      { fontSize: 10, color: '#94A3B8', marginBottom: 8 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cardSevPill:  { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3, gap: 4 },
  cardSevDot:   { width: 6, height: 6, borderRadius: 3 },
  cardSevTxt:   { fontSize: 10, fontWeight: '700' },
  cardAlt:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardAltTxt:   { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

  // Ghost de arraste (mouse + touch)
  dragGhost: {
    position: 'absolute', left: 0, top: 0, width: 264, overflow: 'hidden',
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.28, shadowRadius: 56,
    elevation: 24, zIndex: 9999,
  },
  dragGhostBar:  { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  dragGhostNome: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  dragGhostKm:   { fontSize: 11, color: '#64748B' },
  dragGhostVeg:  { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  // Quick-add at bottom of column
  quickAdd:       { padding: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  quickInput:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, fontSize: 12, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', outlineStyle: 'none' } as any,
  quickBtns:      { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  quickBtnAdd:    { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  quickBtnAddTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },
  colAddBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  colAddTxt:      { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },

  // Notifications
  notifPanel:      { position: 'absolute', top: 54, right: 72, width: 280, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#5E22F3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20, zIndex: 200 },
  notifHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifTitulo:     { fontSize: 13, fontWeight: '700', color: colors.secondary },
  notifItem:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  notifCircle:     { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginTop: 1 },
  notifTextoBox:   { flex: 1 },
  notifTitleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  notifTituloPill: { fontSize: 12, fontWeight: '700', color: colors.secondary },
  notifTempo:      { fontSize: 10, color: '#94A3B8' },
  notifDesc:       { fontSize: 11, color: '#64748B', lineHeight: 15 },
  notifVerTodos:   { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  notifVerTodosTxt:{ fontSize: 11, color: colors.primary, fontWeight: '700' },
  allNotifCard:     { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: 520, overflow: 'hidden' },
  allNotifHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  allNotifTitulo:   { fontSize: 16, fontWeight: '700', color: colors.secondary },
  allNotifItem:     { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  allNotifFechar:   { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  allNotifFecharTxt:{ fontSize: 13, color: '#64748B', fontWeight: '600' },

  // Overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Modal atualizar altura (antes do smallCard para evitar quebra de inferência por gap)
  alturaCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 },
  alturaIconBox:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  alturaTitulo:      { fontSize: 17, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  alturaSubtitulo:   { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 14 },
  alturaFaixaBox:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  alturaFaixaTxt:    { fontSize: 12, flex: 1 },
  alturaLabel:       { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  alturaInputRow:    { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 14, backgroundColor: '#F8FAFC', marginBottom: 12, overflow: 'hidden' },
  alturaInput:       { width: 110, fontSize: 36, fontWeight: '800', color: '#1E293B', textAlign: 'center', paddingHorizontal: 16, paddingVertical: 14, outlineStyle: 'none' } as any,
  alturaSufixo:      { paddingRight: 18, paddingLeft: 2, borderLeftWidth: 1.5, borderLeftColor: '#E2E8F0', paddingVertical: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', minWidth: 52 },
  alturaSufixoTxt:   { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
  alturaNote:        { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 20, lineHeight: 16 },
  alturaBtns:        { flexDirection: 'row' },
  alturaBtnCancel:   { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  alturaBtnCancelTxt:{ fontSize: 13, fontWeight: '600', color: '#64748B' },
  alturaBtnOk:       { flex: 1, borderRadius: 10, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  alturaBtnOkTxt:    { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Small confirm card (logout/delete)
  smallCard:         { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', gap: 12 },
  smallIconBox:      { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  smallTitulo:       { fontSize: 18, fontWeight: '700', color: colors.secondary },
  smallDesc:         { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  smallBtns:         { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  smallBtnCancel:    { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  smallBtnCancelTxt: { color: '#64748B', fontWeight: '500', fontSize: 13 },
  smallBtnConfirm:   { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  smallBtnConfirmTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  // Detail modal
  detalheCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, width: '100%', maxWidth: 460, maxHeight: 580 },
  detHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  detIdChip:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  detId:       { fontSize: 12, fontWeight: '800' },
  detNome:     { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  detMetaRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14, gap: 8 },
  detSevChip:  { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 6 },
  detSevDot:   { width: 8, height: 8, borderRadius: 4 },
  detSevLabel: { fontSize: 12, fontWeight: '700' },
  detRodovia:  { fontSize: 12, color: '#94A3B8' },

  secCard:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  secIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  secContent: { flex: 1 },
  secTitle:   { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  secDesc:    { fontSize: 11, color: '#94A3B8', marginBottom: 8 },
  uploadArea:       { borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: '#FAFAFA' },
  uploadLbl:        { fontSize: 10, color: '#CBD5E1', marginTop: 4 },
  uploadBtn:        { marginTop: 8, backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 5 },
  uploadBtnTxt:     { fontSize: 11, color: '#fff', fontWeight: '600' },
  uploadPreviewWrap:{ borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  uploadPreview:    { width: '100%', height: 140 },
  uploadTrocarBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, backgroundColor: '#F5F3FF' },
  uploadTrocarTxt:  { fontSize: 11, color: colors.primary, fontWeight: '600' },
  obsInput:   { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 12, color: colors.secondary, minHeight: 70, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  obsCount:   { fontSize: 10, color: '#CBD5E1', textAlign: 'right', marginTop: 3 },
  servicoBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10 },
  servicoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  servicoLbl: { fontSize: 11, fontWeight: '600', color: '#94A3B8', width: 90 },
  servicoVal: { fontSize: 12, color: '#1E293B', fontWeight: '600' },
  semServico: { fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' },
  iaCard:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primary, borderRadius: 12, padding: 12, marginBottom: 8 },
  iaIconBox:  { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iaTitulo:   { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  iaDesc:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  iaBadge:    { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start', gap: 5 },
  iaBadgeTxt: { fontSize: 12, fontWeight: '700' },

  detFooter:     { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 4, gap: 8 },
  detBtnDel:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF5F5', gap: 5 },
  detBtnDelTxt:  { fontSize: 12, color: colors.error, fontWeight: '600' },
  detBtnEdit:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE', backgroundColor: '#F5F3FF', gap: 5 },
  detBtnEditTxt: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  detBtnSave:    { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  detBtnSaveTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Create/Edit modal
  modalCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, maxHeight: 580 },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitulo:  { fontSize: 17, fontWeight: '700', color: colors.secondary },
  mField:       { gap: 5 },
  mLabel:       { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3 },
  mInput:       { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.secondary, outlineStyle: 'none' } as any,
  chipRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  vegGrid:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  chipOn:       { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt:      { fontSize: 11, color: '#64748B' },
  chipTxtOn:    { color: '#fff', fontWeight: '600' },
  mFooter:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  mBtnCancel:   { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  mBtnCancelTxt:{ color: '#64748B', fontWeight: '500', fontSize: 13 },
  mBtnSave:     { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
  mBtnSaveTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },
});
import { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatusBadge from '../components/StatusBadge';
import AppHeader from '../components/AppHeader';
import { colors } from '../theme';
import { Equipe, RootStackParamList, StatusEquipe } from '../types';

import NotificacoesBell from '../components/NotificacoesBell';
import { useNotificacoes } from '../context/NotificacoesContext';
import { useEquipes } from '../context/EquipesContext';
import { useKanban } from '../context/KanbanContext';
import { useConfiguracoes } from '../context/ConfiguracoesContext';
import bgRoxo     from '../../assets/images/backgroundroxo.png';
import logoNeg    from '../../assets/images/Motiva_Logo-Negativo.png';
import perfilLogo from '../../assets/images/perfil_logo.png';
import perfilEq   from '../../assets/images/perfil_equipe.jpg';

const ITENS_POR_PAGINA = 7;
const RODOVIAS = ['Todas', 'BR-116', 'BR-381', 'SP-280'];

const STATUS_OPTS: { label: string; value: StatusEquipe | 'todas' }[] = [
  { label: 'Todas',    value: 'todas'    },
  { label: 'Ativo',    value: 'ativo'    },
  { label: 'Inativo',  value: 'inativo'  },
  { label: 'Em Campo', value: 'em_campo' },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Equipes'>;
};

export default function EquipesScreen({ navigation }: Props) {
const { equipes, adicionarEquipe, editarEquipe, excluirEquipe, alternarStatus } = useEquipes();
  const { adicionarItem, removerPorEquipeId } = useKanban();
  const { modoCompacto } = useConfiguracoes();
  const [busca, setBusca]                  = useState('');
  const [rodoviaFiltro, setRodoviaFiltro]  = useState('Todas');
  const [statusFiltro, setStatusFiltro]    = useState<StatusEquipe | 'todas'>('todas');
  const [pagina, setPagina]                = useState(1);
  const [dropRodovia, setDropRodovia]      = useState(false);
  const [dropStatus, setDropStatus]        = useState(false);
  const [modalCriar, setModalCriar]        = useState(false);
  const [equipeEditando, setEquipeEditando] = useState<Equipe | null>(null);
  const [sidebarAberta, setSidebarAberta]  = useState(true);
  const [showLogout, setShowLogout]        = useState(false);
  const { adicionarNotificacao } = useNotificacoes();
  const [hoverSide, setHoverSide]          = useState<string | null>(null);

  function handleLogout() { setShowLogout(true); }

  const [novoNome,    setNovoNome]    = useState('');
  const [novoRodovia, setNovoRodovia] = useState('BR-116');
  const [novoKm,      setNovoKm]      = useState('');
  const [novoTrecho,  setNovoTrecho]  = useState('');
  const [novoResp,    setNovoResp]    = useState('');
  const [confirmarExcluir, setConfirmarExcluir] = useState<Equipe | null>(null);

  const filtradas = useMemo(() => {
    const t = busca.toLowerCase();
    return equipes.filter((e) =>
      (e.nome.toLowerCase().includes(t) || e.responsavel.toLowerCase().includes(t) || e.id.toLowerCase().includes(t)) &&
      (rodoviaFiltro === 'Todas' || e.rodovia === rodoviaFiltro) &&
      (statusFiltro  === 'todas' || e.status  === statusFiltro)
    );
  }, [equipes, busca, rodoviaFiltro, statusFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const paginaAtual  = Math.min(pagina, totalPaginas);
  const paginadas    = filtradas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  function resetPagina() { setPagina(1); }

  function abrirModalCriar() {
    setEquipeEditando(null);
    setNovoNome(''); setNovoKm(''); setNovoTrecho(''); setNovoResp(''); setNovoRodovia('BR-116');
    setModalCriar(true);
  }

  function abrirModalEditar(eq: Equipe) {
    setEquipeEditando(eq);
    setNovoNome(eq.nome); setNovoRodovia(eq.rodovia);
    setNovoKm(eq.km.replace('Km ', '')); setNovoTrecho(eq.trechoRodovia); setNovoResp(eq.responsavel);
    setModalCriar(true);
  }

  function handleSalvar() {
    if (!novoNome.trim() || !novoKm.trim() || !novoTrecho.trim() || !novoResp.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setModalCriar(false);
    if (equipeEditando) {
      editarEquipe(equipeEditando.id, {
        nome: novoNome.trim(), rodovia: novoRodovia,
        km: `Km ${novoKm.trim()}`, trechoRodovia: novoTrecho.trim(), responsavel: novoResp.trim(),
      });
      adicionarNotificacao({
        cor: '#3B82F6', icone: 'create-outline',
        titulo: 'Equipe editada',
        desc: `${novoNome.trim()} (${equipeEditando.id}) foi atualizada por ${novoResp.trim()}.`,
      });
    } else {
      const novoId = adicionarEquipe({
        nome: novoNome.trim(), rodovia: novoRodovia,
        km: `Km ${novoKm.trim()}`, trechoRodovia: novoTrecho.trim(), responsavel: novoResp.trim(),
      });
      // Nova equipe (ativo) → entra automaticamente na coluna 1 do Kanban
      const kmNum = parseFloat(novoKm.trim()) || 0;
      adicionarItem({
        equipeId: novoId, nomeEquipe: novoNome.trim(), rodovia: novoRodovia,
        kmInicio: kmNum, kmFim: kmNum + 5,
        tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 2,
        severidade: 'sem_ocorrencia', responsavel: novoResp.trim(),
        observacao: '', ultimoServico: null,
      });
      setPagina(1);
      adicionarNotificacao({
        cor: '#10B981', icone: 'people-outline',
        titulo: 'Nova equipe criada',
        desc: `${novoNome.trim()} (${novoId}) foi cadastrada em ${novoRodovia} e adicionada ao Kanban.`,
      });
    }
  }

  function handleExcluir(eq: Equipe) {
    setConfirmarExcluir(eq);
  }

  function confirmarDelete() {
    if (confirmarExcluir) {
      removerPorEquipeId(confirmarExcluir.id);
      excluirEquipe(confirmarExcluir.id);
      adicionarNotificacao({
        cor: '#EF4444', icone: 'trash-outline',
        titulo: 'Equipe removida',
        desc: `${confirmarExcluir.nome} (${confirmarExcluir.id}) foi excluída do sistema.`,
      });
      setConfirmarExcluir(null);
    }
  }

  const STATUS_LABEL: Record<StatusEquipe, string> = { ativo: 'Ativo', em_campo: 'Em Campo', inativo: 'Inativo' };

  function handleAlternarStatus(id: string) {
    const eq = equipes.find((e) => e.id === id);
    if (!eq) return;
    const novoStatus = alternarStatus(id); // só ativo ↔ inativo
    if (novoStatus === 'inativo') {
      // Remove do Kanban quando vai para inativo
      removerPorEquipeId(id);
    } else {
      // Volta para ativo: adiciona na coluna 1 do Kanban
      const kmNum = parseFloat(eq.km.replace('Km ', '')) || 0;
      adicionarItem({
        equipeId: id, nomeEquipe: eq.nome, rodovia: eq.rodovia,
        kmInicio: kmNum, kmFim: kmNum + 5,
        tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 2,
        severidade: 'sem_ocorrencia', responsavel: eq.responsavel,
        observacao: '', ultimoServico: null,
      });
    }
    adicionarNotificacao({
      cor: novoStatus === 'ativo' ? '#10B981' : '#94A3B8',
      icone: novoStatus === 'ativo' ? 'checkmark-circle-outline' : 'pause-circle-outline',
      titulo: 'Status alterado',
      desc: `${eq.nome} (${eq.id}) mudou de ${STATUS_LABEL[eq.status]} para ${STATUS_LABEL[novoStatus]}.`,
    });
  }

  function paginasBotoes() {
    const pages: (number | '...')[] = [];
    if (totalPaginas <= 5) {
      for (let i = 1; i <= totalPaginas; i++) pages.push(i);
    } else {
      pages.push(1);
      if (paginaAtual > 3) pages.push('...');
      for (let i = Math.max(2, paginaAtual - 1); i <= Math.min(totalPaginas - 1, paginaAtual + 1); i++) pages.push(i);
      if (paginaAtual < totalPaginas - 2) pages.push('...');
      pages.push(totalPaginas);
    }
    return pages;
  }

  return (
    <View style={s.root}>
      {/* ── BACKGROUND ROXO ──────────────────────────────────────────────── */}
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      <AppHeader
        title="Gerenciamento de Equipes"
        onMenuPress={() => setSidebarAberta((v) => !v)}
        onSettingsPress={() => navigation.navigate('Configuracoes')}
        onLogoutPress={handleLogout}
      />

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <View style={s.body}>

        {/* Sidebar — toggle pelo botão menu */}
        {sidebarAberta && (
          <View style={s.sidebar}>
            {[
              { icon: 'grid-outline',      label: 'Dashboard',    onPress: undefined,                                ativo: false },
              { icon: 'people-outline',    label: 'Equipes',      onPress: undefined,                                ativo: true  },
              { icon: 'albums-outline',    label: 'Kanban',       onPress: () => navigation.navigate('Kanban'),      ativo: false },
              { icon: 'warning-outline',   label: 'Ocorrências',  onPress: () => navigation.navigate('Ocorrencias'), ativo: false },
              { icon: 'map-outline',       label: 'Trechos',      onPress: undefined,                                ativo: false },
              { icon: 'calendar-outline',  label: 'Planejamento', onPress: undefined,                                ativo: false },
{ icon: 'bar-chart-outline', label: 'Relatórios',   onPress: undefined,                                ativo: false },
              { icon: 'settings-outline',  label: 'Config.',      onPress: () => navigation.navigate('Configuracoes'), ativo: false },
            ].map((item) => {
              const hovered = hoverSide === item.label && !item.ativo;
              return (
                <Pressable
                  key={item.label}
                  style={[s.sideItem, item.ativo && s.sideItemAtivo, hovered && s.sideItemHover]}
                  onPress={item.onPress}
                  onHoverIn={() => setHoverSide(item.label)}
                  onHoverOut={() => setHoverSide(null)}
                >
                  <View style={s.sideItemIcon}>
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={item.ativo ? '#fff' : hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
                    />
                  </View>
                  <Text style={[s.sideLabel, item.ativo && s.sideLabelAtivo, hovered && s.sideLabelHover]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Conteúdo principal — sem card branco */}
        <View style={s.content}>
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Título + botão */}
            <View style={s.titleRow}>
              <View style={s.titleBlock}>
                <Text style={s.titulo}>Gerenciamento de Equipes</Text>
                <Text style={s.subtitulo}>
                  Controle operacional da malha rodoviária federal e estadual sob concessão
                </Text>
              </View>
              <TouchableOpacity style={s.btnCriar} onPress={abrirModalCriar}>
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={s.btnCriarTxt}>Criar Novas Equipes</Text>
              </TouchableOpacity>
            </View>

            {/* Barra busca + filtros */}
            <View style={s.toolbarRow}>
              <View style={s.searchBox}>
                <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={[s.searchInput, { outlineStyle: 'none' } as any]}
                  placeholder="Buscar equipes..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={busca}
                  onChangeText={(t) => { setBusca(t); resetPagina(); }}
                />
                {busca.length > 0 && (
                  <TouchableOpacity onPress={() => { setBusca(''); resetPagina(); }}>
                    <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Dropdown Rodovias */}
              <View style={s.dropWrap}>
                <TouchableOpacity
                  style={[s.dropdown, dropRodovia && s.dropdownOpen]}
                  onPress={() => { setDropRodovia(!dropRodovia); setDropStatus(false); }}
                >
                  <View>
                    <Text style={s.dropLbl}>Rodovias</Text>
                    <Text style={s.dropVal}>{rodoviaFiltro}</Text>
                  </View>
                  <Ionicons name={dropRodovia ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                {dropRodovia && (
                  <View style={s.dropMenu}>
                    {RODOVIAS.map((r) => (
                      <TouchableOpacity key={r} style={[s.dropItem, rodoviaFiltro === r && s.dropItemOn]}
                        onPress={() => { setRodoviaFiltro(r); setDropRodovia(false); resetPagina(); }}>
                        <Text style={[s.dropItemTxt, rodoviaFiltro === r && s.dropItemTxtOn]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Dropdown Status */}
              <View style={s.dropWrap}>
                <TouchableOpacity
                  style={[s.dropdown, dropStatus && s.dropdownOpen]}
                  onPress={() => { setDropStatus(!dropStatus); setDropRodovia(false); }}
                >
                  <View>
                    <Text style={s.dropLbl}>Status</Text>
                    <Text style={s.dropVal}>{STATUS_OPTS.find((x) => x.value === statusFiltro)?.label}</Text>
                  </View>
                  <Ionicons name={dropStatus ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                {dropStatus && (
                  <View style={s.dropMenu}>
                    {STATUS_OPTS.map((opt) => (
                      <TouchableOpacity key={opt.value} style={[s.dropItem, statusFiltro === opt.value && s.dropItemOn]}
                        onPress={() => { setStatusFiltro(opt.value); setDropStatus(false); resetPagina(); }}>
                        <Text style={[s.dropItemTxt, statusFiltro === opt.value && s.dropItemTxtOn]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

{/* Cabeçalho da tabela */}
            <View style={[s.thead, modoCompacto && s.theadCompact]}>
              <Text style={[s.th, s.cId]}>ID</Text>
              <Text style={[s.th, s.cEq]}>Equipe</Text>
              <Text style={[s.th, s.cSt]}>Status</Text>
              <Text style={[s.th, s.cRd]}>Rodovia</Text>
              <Text style={[s.th, s.cTr]}>Trecho da Rodovia</Text>
              <Text style={[s.th, s.cRs]}>Responsável</Text>
              <Text style={[s.th, s.cAc]}>Ações</Text>
            </View>

            {/* Linhas */}
            {paginadas.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="search-outline" size={36} color="rgba(255,255,255,0.3)" />
                <Text style={s.emptyTxt}>Nenhuma equipe encontrada</Text>
              </View>
            ) : (
paginadas.map((eq, idx) => (
                <TouchableOpacity key={eq.id} style={[s.trow, idx % 2 === 1 && s.trowAlt, modoCompacto && s.trowCompact]} onPress={() => navigation.navigate('Kanban')} activeOpacity={0.8}>
                  <Text style={[s.tdId, s.cId]}>{eq.id}</Text>

                  <View style={[s.cEq, s.cellRow]}>
                    <Image source={perfilEq} style={s.avatarRow} />
                    <Text style={s.tdTxt}>{eq.nome}</Text>
                  </View>

                  <View style={s.cSt}>
                    <StatusBadge status={eq.status} />
                  </View>

                  <View style={s.cRd}>
                    <Text style={s.tdTxt}>{eq.rodovia}</Text>
                    <Text style={s.tdSub}>{eq.km}</Text>
                  </View>

                  <Text style={[s.tdTxt, s.cTr]}>{eq.trechoRodovia}</Text>

                  <View style={[s.cRs, s.cellRow]}>
                    <Image source={perfilEq} style={s.avatarRow} />
                    <Text style={s.tdTxt}>{eq.responsavel}</Text>
                  </View>

                  <View style={[s.cAc, s.cellRow]}>
                    <TouchableOpacity style={s.acBtnEdit} onPress={(e) => { e.stopPropagation?.(); abrirModalEditar(eq); }}>
                      <Ionicons name="create-outline" size={13} color={colors.primary} />
                      <Text style={s.acBtnTxt}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.acBtnStatus} onPress={(e) => { e.stopPropagation?.(); handleAlternarStatus(eq.id); }}>
                      <Ionicons name="swap-horizontal-outline" size={14} color="#0EA5E9" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.acBtnDel} onPress={(e) => { e.stopPropagation?.(); handleExcluir(eq); }}>
                      <Ionicons name="trash-outline" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Paginação */}
            <View style={s.pagination}>
              <TouchableOpacity
                style={[s.pgBtn, paginaAtual === 1 && s.pgBtnOff]}
                onPress={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
              >
                <Ionicons name="chevron-back" size={14} color={paginaAtual === 1 ? 'rgba(255,255,255,0.25)' : '#fff'} />
              </TouchableOpacity>

              {paginasBotoes().map((p, i) =>
                p === '...' ? (
                  <Text key={`d${i}`} style={s.pgDots}>...</Text>
                ) : (
                  <TouchableOpacity
                    key={p}
                    style={[s.pgBtn, paginaAtual === p && s.pgBtnOn]}
                    onPress={() => setPagina(p as number)}
                  >
                    <Text style={[s.pgTxt, paginaAtual === p && s.pgTxtOn]}>{p}</Text>
                  </TouchableOpacity>
                )
              )}

              <TouchableOpacity
                style={[s.pgBtn, paginaAtual === totalPaginas && s.pgBtnOff]}
                onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                <Ionicons name="chevron-forward" size={14} color={paginaAtual === totalPaginas ? 'rgba(255,255,255,0.25)' : '#fff'} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── MODAL ────────────────────────────────────────────────────────── */}
      <Modal visible={modalCriar} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalTitulo}>{equipeEditando ? `Editar ${equipeEditando.id}` : 'Nova Equipe'}</Text>
              <TouchableOpacity onPress={() => setModalCriar(false)}>
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Nome da equipe', val: novoNome,   set: setNovoNome,   ph: 'Ex: Equipe Alfa'       },
              { label: 'Km',            val: novoKm,     set: setNovoKm,     ph: 'Ex: 50'                },
              { label: 'Trecho',        val: novoTrecho, set: setNovoTrecho, ph: 'Ex: Rodoanel Oeste'    },
              { label: 'Responsável',   val: novoResp,   set: setNovoResp,   ph: 'Ex: Eng. Silva'        },
            ].map((f) => (
              <View key={f.label} style={s.mField}>
                <Text style={s.mLabel}>{f.label}</Text>
                <TextInput style={[s.mInput, { outlineStyle: 'none' } as any]} placeholder={f.ph} placeholderTextColor={colors.gray400} value={f.val} onChangeText={f.set} />
              </View>
            ))}

            <View style={s.mField}>
              <Text style={s.mLabel}>Rodovia</Text>
              <View style={s.chipRow}>
                {['BR-116', 'BR-381', 'SP-280'].map((r) => (
                  <TouchableOpacity key={r} style={[s.chip, novoRodovia === r && s.chipOn]} onPress={() => setNovoRodovia(r)}>
                    <Text style={[s.chipTxt, novoRodovia === r && s.chipTxtOn]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.mFooter}>
              <TouchableOpacity style={s.mBtnCancel} onPress={() => setModalCriar(false)}>
                <Text style={s.mBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mBtnSave} onPress={handleSalvar}>
                <Text style={s.mBtnSaveTxt}>{equipeEditando ? 'Salvar' : 'Criar Equipe'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL LOGOUT ─────────────────────────────────────────────────── */}
      <Modal visible={showLogout} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.delCard}>
            <View style={[s.delIconBox, { backgroundColor: '#EDE9FE' }]}>
              <MaterialIcons name="logout" size={26} color={colors.primary} />
            </View>
            <Text style={s.delTitulo}>Encerrar sessão</Text>
            <Text style={s.delDesc}>Tem certeza que deseja sair?{'\n'}Você será redirecionado para o login.</Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={s.delBtnCancel} onPress={() => setShowLogout(false)}>
                <Text style={s.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.delBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => navigation.replace('Login')}>
                <MaterialIcons name="logout" size={14} color="#fff" />
                <Text style={s.delBtnConfirmTxt}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL EXCLUIR ────────────────────────────────────────────────── */}
      <Modal visible={confirmarExcluir !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.delCard}>
            <View style={s.delIconBox}>
              <Ionicons name="trash" size={28} color={colors.error} />
            </View>
            <Text style={s.delTitulo}>Excluir equipe</Text>
            <Text style={s.delDesc}>
              Tem certeza que deseja excluir a{' '}
              <Text style={{ fontWeight: '700' }}>{confirmarExcluir?.nome}</Text>?
              {'\n'}Esta ação não pode ser desfeita.
            </Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={s.delBtnCancel} onPress={() => setConfirmarExcluir(null)}>
                <Text style={s.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtnConfirm} onPress={confirmarDelete}>
                <Ionicons name="trash-outline" size={14} color="#fff" />
                <Text style={s.delBtnConfirmTxt}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#3B0FA6' },
  bgFill:  { width: '100%', height: '100%' },

  // Conteúdo sem card branco (antes do primeiro gap para evitar bug de inferência TS)
  content: { flex: 1 },
  trowAlt: { backgroundColor: '#FAFBFF' },
  notifVazia:    { alignItems: 'center', paddingVertical: 24 },
  notifVaziaTxt: { fontSize: 12, color: '#94A3B8', marginTop: 6 },

  // Header — fundo transparente para mostrar o backgroundroxo
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent', paddingHorizontal: 22, paddingVertical: 10, zIndex: 10 },
  hLeft:       { flexDirection: 'row', alignItems: 'center', gap: 18 },
  hLogo:       { width: 130, height: 36 },
  hRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },

  hIconPill:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  hPillBtn:     { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  hPillDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)' },

  hAvatar:     { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary },
  hAvatarImg:  { width: '100%', height: '100%' },

  // Body layout
  body:    { flex: 1, flexDirection: 'row', paddingHorizontal: 48, paddingVertical: 16 },
  sidebar:       { width: 160, marginRight: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  sideItem:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginVertical: 2 },
  sideItemIcon:  { marginRight: 10 },
  sideItemAtivo: { backgroundColor: colors.primary },
  sideItemHover: { backgroundColor: 'rgba(255,255,255,0.1)' },
  sideLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  sideLabelAtivo:{ color: '#fff', fontWeight: '700' },
  sideLabelHover:{ color: 'rgba(255,255,255,0.9)' },

  // Notificações popup (Motiva white theme)
  notifDot:       { position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#fff' },
  notifPanel:     { position: 'absolute', top: 54, right: 72, width: 280, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#5E22F3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20, zIndex: 200 },
  notifHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  notifCount:       { fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginRight: 8 },
  notifTitulo:      { fontSize: 13, fontWeight: '700', color: colors.secondary },
  notifItem:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  notifCircle:      { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  notifTextoBox:  { flex: 1 },
  notifTitleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  notifTituloPill:{ fontSize: 12, fontWeight: '700', color: colors.secondary },
  notifTempo:     { fontSize: 10, color: '#94A3B8' },
  notifDesc:      { fontSize: 11, color: '#64748B', lineHeight: 15 },
  notifVerTodos:   { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  notifVerTodosTxt:{ fontSize: 11, color: colors.primary, fontWeight: '700' },

  // Modal todas as notificações
  allNotifCard:    { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: 520, overflow: 'hidden' },
  allNotifHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  allNotifTitulo:  { fontSize: 16, fontWeight: '700', color: colors.secondary },
  allNotifItem:    { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  allNotifFechar:  { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  allNotifFecharTxt:{ fontSize: 13, color: '#64748B', fontWeight: '600' },

  // Conteúdo direto no fundo roxo
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 4, paddingVertical: 8, paddingBottom: 20 },

  // Título
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 },
  titleBlock: { flex: 1 },
  titulo:     { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitulo:  { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  btnCriar:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  btnCriarTxt:{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 },

  // Toolbar
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', zIndex: 30, marginBottom: 6 },
  searchBox:  { flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', height: 38, marginRight: 8 },
  searchInput:{ flex: 1, fontSize: 12, color: '#fff' },

  dropWrap:     { position: 'relative', zIndex: 40, marginRight: 8 },
  dropdown:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, minWidth: 130, height: 38 },
  dropdownOpen: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)' },
  dropLbl:      { fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 },
  dropVal:      { fontSize: 13, color: '#fff', fontWeight: '600', marginTop: 1 },
  dropMenu:     { position: 'absolute', top: 46, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 14 },
  dropItem:     { paddingHorizontal: 14, paddingVertical: 10 },
  dropItemOn:   { backgroundColor: '#EDE9FE' },
  dropItemTxt:  { fontSize: 13, color: colors.secondary },
  dropItemTxtOn:{ color: colors.primary, fontWeight: '600' },

// Cabeçalho tabela
  thead:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)', marginBottom: 4 },
  theadCompact: { paddingVertical: 4 },
  th:      { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.7 },

// Linhas — cards brancos flutuantes
  trow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  trowCompact: {
    paddingVertical: 3,
    marginBottom: 3,
  },

  emptyBox: { alignItems: 'center', paddingVertical: 56 },
  emptyTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12 },

  // Colunas
  cId: { width: 52 },
  cEq: { flex: 1.5 },
  cSt: { flex: 1 },
  cRd: { flex: 0.9 },
  cTr: { flex: 1.6 },
  cRs: { flex: 1.5 },
  cAc: { width: 140 },

  tdId:     { fontSize: 11, fontWeight: '700', color: colors.primary },
  tdTxt:    { fontSize: 11, color: '#334155', fontWeight: '500' },
  tdSub:    { fontSize: 10, color: '#94A3B8' },
  cellRow:  { flexDirection: 'row', alignItems: 'center' },
  avatarRow:{ width: 24, height: 24, borderRadius: 12, marginRight: 7 },
  acBtn:       { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  acBtnEdit:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: '#DDD6FE', backgroundColor: '#F5F3FF', marginRight: 4 },
  acBtnTxt:    { fontSize: 11, color: colors.primary, fontWeight: '600', marginLeft: 3 },
  acBtnStatus: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  acBtnDel:    { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center' },

  // Paginação
  pagination: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
  pgBtn:   { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  pgBtnOn: { backgroundColor: '#fff', borderColor: '#fff' },
  pgBtnOff:{ opacity: 0.3 },
  pgTxt:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  pgTxtOn: { color: colors.primary, fontWeight: '700' },
  pgDots:  { fontSize: 13, color: 'rgba(255,255,255,0.35)', paddingHorizontal: 3 },

  // Modal
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, gap: 14 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitulo:{ fontSize: 17, fontWeight: '700', color: colors.secondary },
  mField:    { gap: 5 },
  mLabel:    { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3 },
  mInput:    { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.secondary },
  chipRow:   { flexDirection: 'row', gap: 8 },
  chip:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  chipOn:    { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt:   { fontSize: 12, color: '#64748B' },
  chipTxtOn: { color: '#fff', fontWeight: '600' },
  mFooter:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  mBtnCancel:{ flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  mBtnCancelTxt:{ color: '#64748B', fontWeight: '500', fontSize: 13 },
  mBtnSave:  { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
  mBtnSaveTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  // Modal excluir
  delCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', gap: 12 },
  delIconBox:     { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  delTitulo:      { fontSize: 18, fontWeight: '700', color: colors.secondary },
  delDesc:        { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  delBtns:        { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  delBtnCancel:   { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  delBtnCancelTxt:{ color: '#64748B', fontWeight: '500', fontSize: 13 },
  delBtnConfirm:  { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  delBtnConfirmTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});

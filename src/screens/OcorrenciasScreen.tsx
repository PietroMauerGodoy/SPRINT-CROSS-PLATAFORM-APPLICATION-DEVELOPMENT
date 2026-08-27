import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ImageBackground,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OcorrenciaCard from '../components/OcorrenciaCard';
import AppHeader from '../components/AppHeader';
import NotificacoesBell from '../components/NotificacoesBell';
import { colors } from '../theme';
import { Ocorrencia, RiscoNivel, RootStackParamList } from '../types';
import { useNotificacoes } from '../context/NotificacoesContext';
import { useConfiguracoes } from '../context/ConfiguracoesContext';
import { useOcorrencias } from '../context/OcorrenciasContext';

import bgRoxo    from '../../assets/images/backgroundroxo.png';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Ocorrencias'>;
};

const RISCO_OPTS: { label: string; value: RiscoNivel | 'todos' }[] = [
  { label: 'Todos',  value: 'todos' },
  { label: 'Alto',   value: 'alto'  },
  { label: 'Médio',  value: 'medio' },
  { label: 'Baixo',  value: 'baixo' },
];

const STATUS_OPTS: { label: string; value: Ocorrencia['status'] | 'todos' }[] = [
  { label: 'Todos',        value: 'todos'        },
  { label: 'Aberta',       value: 'aberta'       },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Resolvida',    value: 'resolvida'    },
];

export default function OcorrenciasScreen({ navigation }: Props) {
  const { adicionarNotificacao } = useNotificacoes();
  const { notifPrefs } = useConfiguracoes();
  const { ocorrencias, adicionarOcorrencia } = useOcorrencias();
  const [busca, setBusca]             = useState('');
  const [riscoFiltro, setRiscoFiltro] = useState<RiscoNivel | 'todos'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<Ocorrencia['status'] | 'todos'>('todos');
  const [dropRisco, setDropRisco]     = useState(false);
  const [dropStatus, setDropStatus]   = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  // Cadastro
  const [modalCriar, setModalCriar]   = useState(false);
  const [fTitulo,    setFTitulo]      = useState('');
  const [fDescricao, setFDescricao]   = useState('');
  const [fLocal,     setFLocal]       = useState('');
  const [fCategoria, setFCategoria]   = useState('');
  const [fRisco,     setFRisco]       = useState<RiscoNivel>('medio');
  const [fResponsavel, setFResponsavel] = useState('');

  const filtradas = useMemo(() => {
    const t = busca.toLowerCase();
    return ocorrencias.filter((o) =>
      (o.titulo.toLowerCase().includes(t) ||
       o.local.toLowerCase().includes(t)  ||
       o.categoria.toLowerCase().includes(t)) &&
      (riscoFiltro  === 'todos' || o.risco  === riscoFiltro)  &&
      (statusFiltro === 'todos' || o.status === statusFiltro)
    );
  }, [ocorrencias, busca, riscoFiltro, statusFiltro]);

  const contadores = useMemo(() => ({
    total:        ocorrencias.length,
    abertas:      ocorrencias.filter((o) => o.status === 'aberta').length,
    em_andamento: ocorrencias.filter((o) => o.status === 'em_andamento').length,
    resolvidas:   ocorrencias.filter((o) => o.status === 'resolvida').length,
  }), [ocorrencias]);

  function abrirDetalhe(ocorrencia: Ocorrencia) {
    navigation.navigate('Detalhe', { ocorrencia });
  }

  function abrirCadastro() {
    setFTitulo(''); setFDescricao(''); setFLocal('');
    setFCategoria(''); setFRisco('medio'); setFResponsavel('');
    setModalCriar(true);
  }

 async function handleSalvar() {
    if (!fTitulo.trim() || !fLocal.trim() || !fCategoria.trim()) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios: título, local e categoria.');
      return;
    }

   const novaId = await adicionarOcorrencia({
     titulo: fTitulo.trim(),
     descricao: fDescricao.trim(),
     local: fLocal.trim(),
     categoria: fCategoria.trim(),
     risco: fRisco,
     status: 'aberta',
     data: new Date().toISOString().split('T')[0],
     responsavel: fResponsavel.trim() || undefined,
   });

   const nova: Ocorrencia = {
     id: novaId,
     titulo: fTitulo.trim(),
     descricao: fDescricao.trim(),
     local: fLocal.trim(),
     categoria: fCategoria.trim(),
     risco: fRisco,
     status: 'aberta',
     data: new Date().toISOString().split('T')[0],
     responsavel: fResponsavel.trim() || undefined,
   };
   setModalCriar(false);

   if (nova.risco === 'alto' && notifPrefs.novaOcorrenciaCritica) {
     adicionarNotificacao({
       cor: '#EF4444',
       icone: 'warning-outline',
       titulo: 'Nova ocorrência crítica',
       desc: `${nova.titulo} — ${nova.local}`,
     });
   }
 }

  return (
    <View style={s.root}>
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      <AppHeader
        title="Ocorrências"
        onMenuPress={() => setSidebarAberta((v) => !v)}
        onSettingsPress={() => navigation.navigate('Configuracoes')}
        onLogoutPress={() => setShowLogout(true)}
      />

      {/* Body */}
      <View style={s.body}>

        {/* Sidebar */}
        {sidebarAberta && (
          <View style={s.sidebar}>
            {[
              { icon: 'grid-outline',      label: 'Dashboard',   ativo: false, onPress: () => navigation.navigate('Dashboard') },
              { icon: 'people-outline',    label: 'Equipes',     ativo: false, onPress: () => navigation.navigate('Equipes') },
              { icon: 'albums-outline',    label: 'Kanban',      ativo: false, onPress: () => navigation.navigate('Kanban') },
              { icon: 'warning-outline',   label: 'Ocorrências', ativo: true,  onPress: undefined },
              { icon: 'map-outline',       label: 'Trechos',     ativo: false, onPress: undefined },
              { icon: 'calendar-outline',  label: 'Planejamento',ativo: false, onPress: undefined },
{ icon: 'bar-chart-outline', label: 'Relatórios',  ativo: false, onPress: undefined },
              { icon: 'settings-outline',  label: 'Config.',     ativo: false, onPress: () => navigation.navigate('Configuracoes') },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[s.sideItem, item.ativo && s.sideItemAtivo]}
                onPress={item.onPress}
              >
                <View style={s.sideItemIcon}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={item.ativo ? '#fff' : 'rgba(255,255,255,0.5)'}
                  />
                </View>
                <Text style={[s.sideLabel, item.ativo && s.sideLabelAtivo]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Conteúdo */}
        <View style={s.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

            {/* Título */}
            <View style={s.titleRow}>
              <View>
                <Text style={s.titulo}>Ocorrências</Text>
                <Text style={s.subtitulo}>Registro e acompanhamento de ocorrências operacionais</Text>
              </View>
              <TouchableOpacity style={s.btnNova} onPress={abrirCadastro}>
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={s.btnNovaTxt}>Nova Ocorrência</Text>
              </TouchableOpacity>
            </View>

            {/* Cards de resumo */}
            <View style={s.statsRow}>
              {[
                { label: 'Total',        value: contadores.total,        icon: 'list-outline',        cor: 'rgba(255,255,255,0.2)'  },
                { label: 'Abertas',      value: contadores.abertas,      icon: 'alert-circle-outline', cor: '#EF444440'              },
                { label: 'Em andamento', value: contadores.em_andamento, icon: 'time-outline',         cor: '#F59E0B40'              },
                { label: 'Resolvidas',   value: contadores.resolvidas,   icon: 'checkmark-circle-outline', cor: '#10B98140'          },
              ].map((stat) => (
                <View key={stat.label} style={[s.statCard, { backgroundColor: stat.cor }]}>
                  <Ionicons name={stat.icon as any} size={20} color="#fff" />
                  <Text style={s.statVal}>{stat.value}</Text>
                  <Text style={s.statLbl}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Barra busca + filtros */}
            <View style={s.toolbarRow}>
              <View style={s.searchBox}>
                <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={s.searchInput}
                  placeholder="Buscar por título, local ou categoria..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={busca}
                  onChangeText={setBusca}
                />
                {busca.length > 0 && (
                  <TouchableOpacity onPress={() => setBusca('')}>
                    <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtro Risco */}
              <View style={s.dropWrap}>
                <TouchableOpacity
                  style={[s.dropdown, dropRisco && s.dropdownOpen]}
                  onPress={() => { setDropRisco((v) => !v); setDropStatus(false); }}
                >
                  <View>
                    <Text style={s.dropLbl}>Risco</Text>
                    <Text style={s.dropVal}>{RISCO_OPTS.find((r) => r.value === riscoFiltro)?.label}</Text>
                  </View>
                  <Ionicons name={dropRisco ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                {dropRisco && (
                  <View style={s.dropMenu}>
                    {RISCO_OPTS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[s.dropItem, riscoFiltro === opt.value && s.dropItemOn]}
                        onPress={() => { setRiscoFiltro(opt.value); setDropRisco(false); }}
                      >
                        <Text style={[s.dropItemTxt, riscoFiltro === opt.value && s.dropItemTxtOn]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Filtro Status */}
              <View style={s.dropWrap}>
                <TouchableOpacity
                  style={[s.dropdown, dropStatus && s.dropdownOpen]}
                  onPress={() => { setDropStatus((v) => !v); setDropRisco(false); }}
                >
                  <View>
                    <Text style={s.dropLbl}>Status</Text>
                    <Text style={s.dropVal}>{STATUS_OPTS.find((o) => o.value === statusFiltro)?.label}</Text>
                  </View>
                  <Ionicons name={dropStatus ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                {dropStatus && (
                  <View style={s.dropMenu}>
                    {STATUS_OPTS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[s.dropItem, statusFiltro === opt.value && s.dropItemOn]}
                        onPress={() => { setStatusFiltro(opt.value); setDropStatus(false); }}
                      >
                        <Text style={[s.dropItemTxt, statusFiltro === opt.value && s.dropItemTxtOn]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Contador de resultados */}
            <Text style={s.resultCount}>
              {filtradas.length} {filtradas.length === 1 ? 'ocorrência encontrada' : 'ocorrências encontradas'}
            </Text>

            {/* Lista de cards */}
            {filtradas.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="search-outline" size={40} color="rgba(255,255,255,0.25)" />
                <Text style={s.emptyTxt}>Nenhuma ocorrência encontrada</Text>
                <Text style={s.emptySubTxt}>Tente ajustar os filtros</Text>
              </View>
            ) : (
              filtradas.map((oc) => (
                <OcorrenciaCard key={oc.id} ocorrencia={oc} onPress={abrirDetalhe} />
              ))
            )}

          </ScrollView>
        </View>
      </View>

      {/* ── MODAL CADASTRO ─────────────────────────────────────────────────── */}
      <Modal visible={modalCriar} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>

              {/* Cabeçalho */}
              <View style={s.modalHead}>
                <Text style={s.modalTitulo}>Nova Ocorrência</Text>
                <TouchableOpacity onPress={() => setModalCriar(false)}>
                  <Ionicons name="close" size={22} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              {/* Campos de texto */}
              {([
                { label: 'Título *',      val: fTitulo,     set: setFTitulo,     ph: 'Ex: Vazamento de óleo na pista' },
                { label: 'Local *',       val: fLocal,      set: setFLocal,      ph: 'Ex: BR-116 KM 42 - Setor B'    },
                { label: 'Categoria *',   val: fCategoria,  set: setFCategoria,  ph: 'Ex: Segurança, EPI, Infraestrutura' },
                { label: 'Responsável',   val: fResponsavel,set: setFResponsavel,ph: 'Ex: Eng. Silva'                 },
              ] as { label: string; val: string; set: (v: string) => void; ph: string }[]).map((f) => (
                <View key={f.label} style={s.mField}>
                  <Text style={s.mLabel}>{f.label}</Text>
                  <TextInput
                    style={[s.mInput, { outlineStyle: 'none' } as any]}
                    placeholder={f.ph}
                    placeholderTextColor={colors.gray400}
                    value={f.val}
                    onChangeText={f.set}
                  />
                </View>
              ))}

              {/* Descrição */}
              <View style={s.mField}>
                <Text style={s.mLabel}>Descrição</Text>
                <TextInput
                  style={[s.mInput, s.mInputMulti, { outlineStyle: 'none' } as any]}
                  placeholder="Descreva detalhes da ocorrência..."
                  placeholderTextColor={colors.gray400}
                  value={fDescricao}
                  onChangeText={setFDescricao}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Nível de risco */}
              <View style={s.mField}>
                <Text style={s.mLabel}>Nível de risco *</Text>
                <View style={s.chipRow}>
                  {([
                    { value: 'alto',  label: 'Alto',  cor: '#EF4444' },
                    { value: 'medio', label: 'Médio', cor: '#F59E0B' },
                    { value: 'baixo', label: 'Baixo', cor: '#10B981' },
                  ] as { value: RiscoNivel; label: string; cor: string }[]).map((r) => (
                    <TouchableOpacity
                      key={r.value}
                      style={[s.chip, fRisco === r.value && { backgroundColor: r.cor, borderColor: r.cor }]}
                      onPress={() => setFRisco(r.value)}
                    >
                      <Text style={[s.chipTxt, fRisco === r.value && s.chipTxtOn]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Botões */}
              <View style={s.mFooter}>
                <TouchableOpacity style={s.mBtnCancel} onPress={() => setModalCriar(false)}>
                  <Text style={s.mBtnCancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.mBtnSave} onPress={handleSalvar}>
                  <Ionicons name="checkmark" size={15} color="#fff" style={{ marginRight: 5 }} />
                  <Text style={s.mBtnSaveTxt}>Registrar</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showLogout} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.delCard}>
            <View style={[s.delIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="log-out-outline" size={26} color={colors.primary} />
            </View>
            <Text style={s.delTitulo}>Encerrar sessão</Text>
            <Text style={s.delDesc}>{'Tem certeza que deseja sair?\nVocê será redirecionado para o login.'}</Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={s.delBtnCancel} onPress={() => setShowLogout(false)}>
                <Text style={s.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.delBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => {
                setShowLogout(false);
                navigation.replace('Login');
              }}>
                <Ionicons name="log-out-outline" size={14} color="#fff" />
                <Text style={s.delBtnConfirmTxt}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#3B0FA6' },
  bgFill: { width: '100%', height: '100%' },

  // Botão nova ocorrência + modal (antes do primeiro gap para evitar bug de inferência TS)
  btnNova:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  btnNovaTxt: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 },

  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:      { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, maxHeight: '85%' },
  modalHead:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitulo:    { fontSize: 17, fontWeight: '700', color: colors.secondary },
  mField:         { marginBottom: 2 },
  mLabel:         { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 5 },
  mInput:         { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.secondary },
  mInputMulti:    { minHeight: 72, textAlignVertical: 'top' },
  chipRow:        { flexDirection: 'row' },
  chip:           { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', marginRight: 8 },
  chipTxt:        { fontSize: 12, color: '#64748B', fontWeight: '600' },
  chipTxtOn:      { color: '#fff', fontWeight: '700' },
  mFooter:        { flexDirection: 'row', marginTop: 4 },
  mBtnCancel:     { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginRight: 10 },
  mBtnCancelTxt:  { color: '#64748B', fontWeight: '500', fontSize: 13 },
  mBtnSave:       { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mBtnSaveTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },

  delCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 370, alignItems: 'center' },
  delIconBox:     { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  delTitulo:      { fontSize: 18, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  delDesc:        { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  delBtns:        { flexDirection: 'row', width: '100%' },
  delBtnCancel:   { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 11, alignItems: 'center', marginRight: 10 },
  delBtnCancelTxt:{ color: '#475569', fontWeight: '600', fontSize: 13 },
  delBtnConfirm:  { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  delBtnConfirmTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 10, zIndex: 10 },
  hLeft:        { flexDirection: 'row', alignItems: 'center', gap: 18 },
  hLogo:        { width: 130, height: 36 },
  hRight:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hIconPill:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  hPillBtn:     { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  hPillDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)' },
  hAvatar:      { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary },
  hAvatarImg:   { width: '100%', height: '100%' },

  // Body
  body:    { flex: 1, flexDirection: 'row', paddingHorizontal: 48, paddingBottom: 16 },
  sidebar: { width: 160, marginRight: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  sideItem:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginVertical: 2 },
  sideItemIcon:  { marginRight: 10 },
  sideItemAtivo: { backgroundColor: colors.primary },
  sideLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  sideLabelAtivo:{ color: '#fff', fontWeight: '700' },

  // Conteúdo
  content:       { flex: 1 },
  scrollContent: { paddingVertical: 8, paddingBottom: 24 },

  // Título
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titulo:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  // Cards de resumo
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginRight: 8 },
  statVal:  { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 6 },
  statLbl:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '600' },

  // Toolbar
  toolbarRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', zIndex: 30, marginBottom: 10 },
  searchBox:   { flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', height: 38, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 12, color: '#fff', outlineStyle: 'none' } as any,
  dropWrap:    { position: 'relative', zIndex: 40, marginRight: 8 },
  dropdown:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, minWidth: 130, height: 38 },
  dropdownOpen:{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)' },
  dropLbl:     { fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 },
  dropVal:     { fontSize: 13, color: '#fff', fontWeight: '600', marginTop: 1 },
  dropMenu:    { position: 'absolute', top: 46, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 14 },
  dropItem:    { paddingHorizontal: 14, paddingVertical: 10 },
  dropItemOn:  { backgroundColor: '#EDE9FE' },
  dropItemTxt: { fontSize: 13, color: colors.secondary },
  dropItemTxtOn:{ color: colors.primary, fontWeight: '600' },

  resultCount: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10, fontWeight: '500' },

  // Empty
  emptyBox:    { alignItems: 'center', paddingVertical: 60 },
  emptyTxt:    { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600', marginTop: 14 },
  emptySubTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 },
});

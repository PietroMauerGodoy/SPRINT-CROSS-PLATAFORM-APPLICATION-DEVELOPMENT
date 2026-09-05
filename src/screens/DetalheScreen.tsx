import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme';
import { useOcorrencias } from '../context/OcorrenciasContext';
import { useKanban } from '../context/KanbanContext';
import { useAuth } from '../context/AuthContext';
import { podeCriarOuExcluirOcorrencia } from '../utils/permissions';
import { Ocorrencia, RiscoNivel, RootStackParamList } from '../types';

import bgRoxo from '../../assets/images/backgroundroxo.png';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Detalhe'>;
  route:      RouteProp<RootStackParamList, 'Detalhe'>;
};

function riscoCor(risco: RiscoNivel) {
  if (risco === 'alto')  return { text: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
  if (risco === 'medio') return { text: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' };
  return                        { text: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' };
}

function riscoLabel(risco: RiscoNivel) {
  if (risco === 'alto')  return 'Alto';
  if (risco === 'medio') return 'Médio';
  return 'Baixo';
}

const STATUS_CICLO: Ocorrencia['status'][] = ['aberta', 'em_andamento', 'resolvida'];

function statusCor(status: Ocorrencia['status']) {
  if (status === 'aberta')       return { text: '#EF4444', bg: '#EF444420' };
  if (status === 'em_andamento') return { text: '#F59E0B', bg: '#F59E0B20' };
  return                                { text: '#10B981', bg: '#10B98120' };
}

function statusLabel(status: Ocorrencia['status']) {
  if (status === 'aberta')       return 'Aberta';
  if (status === 'em_andamento') return 'Em andamento';
  return 'Resolvida';
}

function statusIcone(status: Ocorrencia['status']): any {
  if (status === 'aberta')       return 'alert-circle-outline';
  if (status === 'em_andamento') return 'time-outline';
  return 'checkmark-circle-outline';
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function DetalheScreen({ navigation, route }: Props) {
  const { buscarPorId, atualizarOcorrencia, removerOcorrencia } = useOcorrencias();
  const { itens: trechos } = useKanban();
  const { usuario } = useAuth();
  const ocorrencia = buscarPorId(route.params.ocorrencia.id) ?? route.params.ocorrencia;
  const trecho = trechos.find((t) => t.id === ocorrencia.kanbanItemId);
  const podeEditar = usuario ? podeCriarOuExcluirOcorrencia(usuario) : false;
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);

  // Edição
  const [modalEditar, setModalEditar] = useState(false);
  const [fTitulo, setFTitulo]         = useState('');
  const [fDescricao, setFDescricao]   = useState('');
  const [fKanbanItemId, setFKanbanItemId] = useState('');
  const [fCategoria, setFCategoria]   = useState('');
  const [fRisco, setFRisco]           = useState<RiscoNivel>('medio');
  const [fResponsavel, setFResponsavel] = useState('');

  const risco  = riscoCor(ocorrencia.risco);
  const status = statusCor(ocorrencia.status);

  async function avancarStatus() {
    const idx = STATUS_CICLO.indexOf(ocorrencia.status);
    const proximo = STATUS_CICLO[(idx + 1) % STATUS_CICLO.length];
    await atualizarOcorrencia(ocorrencia.id, { status: proximo });
  }

  async function confirmarRemocao() {
    await removerOcorrencia(ocorrencia.id);
    setConfirmarExcluir(false);
    navigation.goBack();
  }

  function abrirEdicao() {
    setFTitulo(ocorrencia.titulo);
    setFDescricao(ocorrencia.descricao);
    setFKanbanItemId(ocorrencia.kanbanItemId);
    setFCategoria(ocorrencia.categoria);
    setFRisco(ocorrencia.risco);
    setFResponsavel(ocorrencia.responsavel ?? '');
    setModalEditar(true);
  }

  async function salvarEdicao() {
    if (!fTitulo.trim() || !fKanbanItemId || !fCategoria.trim()) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios: título, trecho e categoria.');
      return;
    }

    await atualizarOcorrencia(ocorrencia.id, {
      titulo: fTitulo.trim(),
      descricao: fDescricao.trim(),
      kanbanItemId: fKanbanItemId,
      categoria: fCategoria.trim(),
      risco: fRisco,
      responsavel: fResponsavel.trim() || undefined,
    });
    setModalEditar(false);
  }

  return (
    <View style={s.root}>
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      {/* Topbar */}
      <View style={s.topbar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={s.backTxt}>Voltar</Text>
        </TouchableOpacity>
        <Text style={s.topbarTitulo}>Detalhe da Ocorrência</Text>
        {podeEditar ? (
          <View style={s.topActions}>
            <TouchableOpacity style={s.editTopBtn} onPress={abrirEdicao}>
              <Ionicons name="create-outline" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.delTopBtn} onPress={() => setConfirmarExcluir(true)}>
              <Ionicons name="trash-outline" size={16} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Card principal */}
        <View style={s.card}>

          {/* Header do card: ID + categoria + data */}
          <View style={s.cardHeader}>
            <View style={s.idPill}>
              <Text style={s.idTxt}>#{String(ocorrencia.id).padStart(3, '0')}</Text>
            </View>
            <View style={s.catPill}>
              <Ionicons name="folder-outline" size={11} color={colors.primary} />
              <Text style={s.catTxt}>{ocorrencia.categoria}</Text>
            </View>
            <View style={s.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
              <Text style={s.dateTxt}>{formatarData(ocorrencia.data)}</Text>
            </View>
          </View>

          {/* Título */}
          <Text style={s.titulo}>{ocorrencia.titulo}</Text>

          {/* Badges risco + status */}
          <View style={s.badgesRow}>
            <View style={[s.riscoBadge, { backgroundColor: risco.bg, borderColor: risco.border }]}>
              <Ionicons name="warning-outline" size={13} color={risco.text} />
              <Text style={[s.riscoBadgeTxt, { color: risco.text }]}>
                Risco {riscoLabel(ocorrencia.risco)}
              </Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={statusIcone(ocorrencia.status)} size={13} color={status.text} />
              <Text style={[s.statusBadgeTxt, { color: status.text }]}>
                {statusLabel(ocorrencia.status)}
              </Text>
            </View>
          </View>

          {/* Divisor */}
          <View style={s.divider} />

          {/* Campos de detalhe */}
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLbl}>Trecho</Text>
              <View style={s.infoValRow}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={s.infoVal}>
                  {trecho ? `${trecho.rodovia} · Km ${trecho.kmInicio}-${trecho.kmFim} · ${trecho.nomeEquipe}` : 'Trecho não encontrado'}
                </Text>
              </View>
            </View>

            {ocorrencia.responsavel ? (
              <View style={s.infoItem}>
                <Text style={s.infoLbl}>Responsável</Text>
                <View style={s.infoValRow}>
                  <Ionicons name="person-outline" size={14} color={colors.primary} />
                  <Text style={s.infoVal}>{ocorrencia.responsavel}</Text>
                </View>
              </View>
            ) : null}

            <View style={s.infoItem}>
              <Text style={s.infoLbl}>Data de Registro</Text>
              <View style={s.infoValRow}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={s.infoVal}>{formatarData(ocorrencia.data)}</Text>
              </View>
            </View>
          </View>

          {/* Descrição */}
          {ocorrencia.descricao ? (
            <>
              <View style={s.divider} />
              <Text style={s.descLbl}>Descrição</Text>
              <Text style={s.descTxt}>{ocorrencia.descricao}</Text>
            </>
          ) : null}

          {/* Divisor */}
          <View style={s.divider} />

          {/* Ação: avançar status */}
          <View style={s.actionBox}>
            <View>
              <Text style={s.actionLbl}>Status atual</Text>
              <Text style={[s.actionStatus, { color: status.text }]}>
                {statusLabel(ocorrencia.status)}
              </Text>
            </View>
            {ocorrencia.status !== 'resolvida' ? (
              <TouchableOpacity style={s.avancarBtn} onPress={avancarStatus}>
                <Ionicons name="arrow-forward-circle-outline" size={15} color="#fff" />
                <Text style={s.avancarBtnTxt}>
                  {ocorrencia.status === 'aberta' ? 'Iniciar atendimento' : 'Marcar como resolvida'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={s.resolvidaBox}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={s.resolvidaTxt}>Resolvida</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botão voltar */}
        <TouchableOpacity style={s.btnVoltar} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={15} color="rgba(255,255,255,0.8)" />
          <Text style={s.btnVoltarTxt}>Voltar para a lista</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal edição */}
      <Modal visible={modalEditar} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>

              <View style={s.modalHead}>
                <Text style={s.modalTitulo}>Editar Ocorrência</Text>
                <TouchableOpacity onPress={() => setModalEditar(false)}>
                  <Ionicons name="close" size={22} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              {([
                { label: 'Título *',    val: fTitulo,      set: setFTitulo,      ph: 'Ex: Galho caído sobre o acostamento' },
                { label: 'Categoria *', val: fCategoria,   set: setFCategoria,   ph: 'Ex: Sinalização, Obstrução, Manutenção' },
                { label: 'Responsável', val: fResponsavel, set: setFResponsavel, ph: 'Ex: Eng. Silva'                 },
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

              <View style={s.mField}>
                <Text style={s.mLabel}>Trecho *</Text>
                <View style={s.chipRow}>
                  {trechos.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[s.trechoChip, fKanbanItemId === t.id && s.trechoChipOn]}
                      onPress={() => setFKanbanItemId(t.id)}
                    >
                      <Text style={[s.trechoChipTxt, fKanbanItemId === t.id && s.chipTxtOn]}>
                        {t.rodovia} · Km {t.kmInicio}-{t.kmFim} · {t.nomeEquipe}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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

              <View style={s.mFooter}>
                <TouchableOpacity style={s.mBtnCancel} onPress={() => setModalEditar(false)}>
                  <Text style={s.mBtnCancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.mBtnSave} onPress={salvarEdicao}>
                  <Ionicons name="checkmark" size={15} color="#fff" style={{ marginRight: 5 }} />
                  <Text style={s.mBtnSaveTxt}>Salvar</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal confirmação de exclusão */}
      <Modal visible={confirmarExcluir} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.delCard}>
            <View style={s.delIconBox}>
              <Ionicons name="trash" size={26} color={colors.error} />
            </View>
            <Text style={s.delTitulo}>Excluir ocorrência</Text>
            <Text style={s.delDesc}>
              Tem certeza que deseja excluir "{ocorrencia.titulo}"?{'\n'}Esta ação não pode ser desfeita.
            </Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={s.delBtnCancel} onPress={() => setConfirmarExcluir(false)}>
                <Text style={s.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtnConfirm} onPress={confirmarRemocao}>
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

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#3B0FA6' },
  bgFill: { width: '100%', height: '100%' },

  // Topbar
  topbar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14 },
  backBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  backTxt:     { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  topbarTitulo:{ fontSize: 15, fontWeight: '700', color: '#fff' },
  topActions:  { flexDirection: 'row', gap: 8 },
  editTopBtn:  { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  delTopBtn:   { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },

  // Scroll
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },

  // Card
  card:       { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  idPill:     { backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  idTxt:      { fontSize: 11, fontWeight: '700', color: colors.primary },
  catPill:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginRight: 8 },
  catTxt:     { fontSize: 11, color: colors.primary, fontWeight: '600', marginLeft: 4 },
  dateRow:    { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  dateTxt:    { fontSize: 11, color: '#94A3B8', marginLeft: 4 },

  titulo: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 14, lineHeight: 28 },

  badgesRow:      { flexDirection: 'row', marginBottom: 20 },
  riscoBadge:     { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, marginRight: 8 },
  riscoBadgeTxt:  { fontSize: 12, fontWeight: '700', marginLeft: 5 },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeTxt: { fontSize: 12, fontWeight: '700', marginLeft: 5 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 18 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', marginBottom: 16 },
  infoLbl:  { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValRow:{ flexDirection: 'row', alignItems: 'center' },
  infoVal:  { fontSize: 13, fontWeight: '600', color: '#334155', marginLeft: 5, flex: 1 },

  descLbl: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  descTxt: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Ação de status
  actionBox:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14 },
  actionLbl:     { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  actionStatus:  { fontSize: 14, fontWeight: '700' },
  avancarBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  avancarBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  resolvidaBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  resolvidaTxt:  { color: '#10B981', fontSize: 13, fontWeight: '700', marginLeft: 5 },

  // Botão voltar
  btnVoltar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 12 },
  btnVoltarTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginLeft: 6 },

  // Modal edição
  modalCard:      { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, maxHeight: '85%' },
  modalHead:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitulo:    { fontSize: 17, fontWeight: '700', color: colors.secondary },
  mField:         { marginBottom: 2 },
  mLabel:         { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 5 },
  mInput:         { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.secondary },
  mInputMulti:    { minHeight: 72, textAlignVertical: 'top' },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipTxt:        { fontSize: 12, color: '#64748B', fontWeight: '600' },
  chipTxtOn:      { color: '#fff', fontWeight: '700' },
  trechoChip:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0' },
  trechoChipOn:   { backgroundColor: colors.primary, borderColor: colors.primary },
  trechoChipTxt:  { fontSize: 11, color: '#64748B', fontWeight: '600' },
  mFooter:        { flexDirection: 'row', marginTop: 4 },
  mBtnCancel:     { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginRight: 10 },
  mBtnCancelTxt:  { color: '#64748B', fontWeight: '500', fontSize: 13 },
  mBtnSave:       { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mBtnSaveTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Modal exclusão
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  delCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 370, alignItems: 'center', gap: 12 },
  delIconBox:     { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  delTitulo:      { fontSize: 18, fontWeight: '700', color: colors.secondary },
  delDesc:        { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  delBtns:        { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  delBtnCancel:   { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 11, alignItems: 'center' },
  delBtnCancelTxt:{ color: '#475569', fontWeight: '600', fontSize: 13 },
  delBtnConfirm:  { flex: 1, borderRadius: 10, backgroundColor: colors.error, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  delBtnConfirmTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});

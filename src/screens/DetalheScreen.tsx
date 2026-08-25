import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../theme';
import { useOcorrencias } from '../context/OcorrenciasContext';
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
  const { buscarPorId, atualizarOcorrencia } = useOcorrencias();
  const ocorrencia = buscarPorId(route.params.ocorrencia.id) ?? route.params.ocorrencia;

  const risco  = riscoCor(ocorrencia.risco);
  const status = statusCor(ocorrencia.status);

  async function avancarStatus() {
    const idx = STATUS_CICLO.indexOf(ocorrencia.status);
    const proximo = STATUS_CICLO[(idx + 1) % STATUS_CICLO.length];
    await atualizarOcorrencia(ocorrencia.id, { status: proximo });
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
        <View style={{ width: 80 }} />
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
              <Text style={s.infoLbl}>Local</Text>
              <View style={s.infoValRow}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={s.infoVal}>{ocorrencia.local}</Text>
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
});

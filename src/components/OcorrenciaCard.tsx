import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ocorrencia, RiscoNivel } from '../types';
import { colors } from '../theme';
import { useKanban } from '../context/KanbanContext';

type Props = {
  ocorrencia: Ocorrencia;
  onPress: (ocorrencia: Ocorrencia) => void;
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

function statusCor(status: Ocorrencia['status']) {
  if (status === 'aberta')       return { text: '#EF4444', bg: '#FEF2F2' };
  if (status === 'em_andamento') return { text: '#F59E0B', bg: '#FFFBEB' };
  return                                { text: '#10B981', bg: '#ECFDF5' };
}

function statusLabel(status: Ocorrencia['status']) {
  if (status === 'aberta')       return 'Aberta';
  if (status === 'em_andamento') return 'Em andamento';
  return 'Resolvida';
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function OcorrenciaCard({ ocorrencia, onPress }: Props) {
  const { itens } = useKanban();
  const trecho = itens.find((i) => i.id === ocorrencia.kanbanItemId);
  const risco  = riscoCor(ocorrencia.risco);
  const status = statusCor(ocorrencia.status);

  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(ocorrencia)} activeOpacity={0.75}>
      {/* Barra lateral colorida pelo risco */}
      <View style={[s.riskBar, { backgroundColor: risco.text }]} />

      <View style={s.body}>
        {/* Linha superior: categoria + data */}
        <View style={s.topRow}>
          <View style={s.catPill}>
            <Ionicons name="folder-outline" size={11} color={colors.primary} />
            <Text style={s.catTxt}>{ocorrencia.categoria}</Text>
          </View>
          <View style={s.dateRow}>
            <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
            <Text style={s.dateTxt}>{formatarData(ocorrencia.data)}</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={s.titulo} numberOfLines={2}>{ocorrencia.titulo}</Text>

        {/* Descrição resumida */}
        <Text style={s.descricao} numberOfLines={2}>{ocorrencia.descricao}</Text>

        {/* Linha inferior: local + risco + status */}
        <View style={s.bottomRow}>
          <View style={s.localRow}>
            <Ionicons name="location-outline" size={11} color="#94A3B8" />
            <Text style={s.localTxt} numberOfLines={1}>
              {trecho ? `${trecho.rodovia} · Km ${trecho.kmInicio}-${trecho.kmFim} · ${trecho.nomeEquipe}` : 'Trecho não encontrado'}
            </Text>
          </View>

          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: risco.bg, borderColor: risco.border }]}>
              <Text style={[s.badgeTxt, { color: risco.text }]}>{riscoLabel(ocorrencia.risco)}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: status.bg }]}>
              <Text style={[s.badgeTxt, { color: status.text }]}>{statusLabel(ocorrencia.status)}</Text>
            </View>
          </View>
        </View>

        {/* Responsável (se houver) */}
        {ocorrencia.responsavel ? (
          <View style={s.respRow}>
            <Ionicons name="person-outline" size={11} color="#94A3B8" />
            <Text style={s.respTxt}>{ocorrencia.responsavel}</Text>
          </View>
        ) : null}
      </View>

      {/* Seta */}
      <View style={s.arrow}>
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  riskBar: { width: 4 },
  body:    { flex: 1, padding: 14, paddingLeft: 12 },
  arrow:   { justifyContent: 'center', paddingRight: 12 },

  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  catTxt:  { fontSize: 10, color: colors.primary, fontWeight: '600', marginLeft: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateTxt: { fontSize: 10, color: '#94A3B8', marginLeft: 3 },

  titulo:    { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4, lineHeight: 20 },
  descricao: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 10 },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  localRow:  { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  localTxt:  { fontSize: 11, color: '#94A3B8', marginLeft: 3, flex: 1 },

  badges:   { flexDirection: 'row' },
  badge:    { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 5, borderWidth: 1, borderColor: 'transparent' },
  badgeTxt: { fontSize: 10, fontWeight: '700' },

  respRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  respTxt: { fontSize: 11, color: '#64748B', marginLeft: 4, fontWeight: '500' },
});

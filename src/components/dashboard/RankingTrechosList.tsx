import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrechoRanking, SEVERIDADE_LABEL, DIAS_SEM_SERVICO_FALLBACK } from '../../utils/dashboardMetrics';
import { KanbanItem, SeveridadeVegetacao } from '../../types';

// Mesmas cores dos badges de severidade do Kanban (ver achado de acessibilidade
// já reportado — ΔE insuficiente entre Crítico/Leve sob daltonismo; por isso o
// texto do label nunca depende só da cor aqui).
const SEVERIDADE_COR: Record<SeveridadeVegetacao, string> = {
  sem_ocorrencia: '#7C3AED',
  leve: '#16A34A',
  grave: '#D97706',
  critico: '#DC2626',
};

type Props = {
  ranking: TrechoRanking[];
  onPressItem: (item: KanbanItem) => void;
};

export default function RankingTrechosList({ ranking, onPressItem }: Props) {
  if (ranking.length === 0) {
    return <Text style={s.vazioTxt}>Nenhum trecho cadastrado no Kanban ainda.</Text>;
  }

  const maiorScore = Math.max(...ranking.map((r) => r.score), 1);

  return (
    <View style={s.lista}>
      {ranking.map((r, i) => {
        const cor = SEVERIDADE_COR[r.item.severidade];
        const larguraBarra = `${Math.max(6, (r.score / maiorScore) * 100)}%` as const;
        const semServico = r.diasSemServico >= DIAS_SEM_SERVICO_FALLBACK;

        return (
          <TouchableOpacity
            key={r.item.id}
            style={s.linha}
            onPress={() => onPressItem(r.item)}
            activeOpacity={0.75}
          >
            <Text style={s.posicao}>{i + 1}º</Text>

            <View style={s.info}>
              <View style={s.infoTopo}>
                <Text style={s.nome} numberOfLines={1}>{r.item.nomeEquipe}</Text>
                <View style={[s.badge, { backgroundColor: cor + '22' }]}>
                  <View style={[s.badgeDot, { backgroundColor: cor }]} />
                  <Text style={[s.badgeTxt, { color: cor }]}>{SEVERIDADE_LABEL[r.item.severidade]}</Text>
                </View>
              </View>

              <Text style={s.local} numberOfLines={1}>
                {r.item.rodovia} · KM {r.item.kmInicio}.0 → {r.item.kmFim}.0
              </Text>

              <View style={s.barraTrilha}>
                <View style={[s.barraFill, { width: larguraBarra, backgroundColor: cor }]} />
              </View>
            </View>

            <View style={s.scoreCol}>
              <Text style={s.scoreValor}>{r.score}</Text>
              <Text style={s.scoreLabel}>{semServico ? 'sem serviço' : `${r.diasSemServico}d sem serviço`}</Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  vazioTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  lista: { gap: 8 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  posicao: { width: 26, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },

  info: { flex: 1, minWidth: 0 },
  infoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nome: { flex: 1, fontSize: 13, fontWeight: '700', color: '#fff' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  local: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  barraTrilha: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8, overflow: 'hidden' },
  barraFill: { height: 4, borderRadius: 2 },

  scoreCol: { alignItems: 'flex-end', minWidth: 78 },
  scoreValor: { fontSize: 16, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
});

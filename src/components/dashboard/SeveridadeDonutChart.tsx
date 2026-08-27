import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { DistribuicaoSeveridade, SEVERIDADE_LABEL } from '../../utils/dashboardMetrics';
import { SeveridadeVegetacao } from '../../types';

// Mesmas cores usadas nos badges de severidade do Kanban (sevCor() em KanbanScreen.tsx),
// repetidas aqui para manter a consistência visual sem acoplar um componente de tela a outro.
const SEVERIDADE_COR: Record<SeveridadeVegetacao, string> = {
  sem_ocorrencia: '#7C3AED',
  leve: '#16A34A',
  grave: '#D97706',
  critico: '#DC2626',
};

type Props = {
  distribuicao: DistribuicaoSeveridade[];
  size?: number;
};

const STROKE = 18;

export default function SeveridadeDonutChart({ distribuicao, size = 150 }: Props) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = distribuicao.reduce((acc, d) => acc + d.quantidade, 0);

  let acumulado = 0;

  return (
    <View style={s.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {total === 0 ? (
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE} fill="none" />
            ) : (
              distribuicao
                .filter((d) => d.quantidade > 0)
                .map((d) => {
                  const segmento = (d.quantidade / total) * circumference;
                  const offset = -acumulado;
                  acumulado += segmento;
                  return (
                    <Circle
                      key={d.severidade}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={SEVERIDADE_COR[d.severidade]}
                      strokeWidth={STROKE}
                      strokeDasharray={`${segmento} ${circumference - segmento}`}
                      strokeDashoffset={offset}
                      fill="none"
                    />
                  );
                })
            )}
          </G>
        </Svg>
        <View style={s.centerLabel} pointerEvents="none">
          <Text style={s.centerValor}>{total}</Text>
          <Text style={s.centerSub}>trechos</Text>
        </View>
      </View>

      <View style={s.legend}>
        {distribuicao.map((d) => (
          <View key={d.severidade} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: SEVERIDADE_COR[d.severidade] }]} />
            <Text style={s.legendTxt}>{SEVERIDADE_LABEL[d.severidade]}</Text>
            <Text style={s.legendPct}>{d.quantidade} · {Math.round(d.percentual)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  centerLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  centerValor: { fontSize: 22, fontWeight: '800', color: '#fff' },
  centerSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  legend: { gap: 8, flex: 1, minWidth: 140 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendTxt: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  legendPct: { fontSize: 12, color: '#fff', fontWeight: '700' },
});

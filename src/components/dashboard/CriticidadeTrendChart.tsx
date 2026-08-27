import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { PontoTendencia } from '../../utils/dashboardMetrics';

// Mesma cor do "crítico" no Kanban (sevCor() em KanbanScreen.tsx) — a linha
// representa grave + crítico, então usamos a cor do nível mais grave dos dois.
const COR_LINHA = '#DC2626';
const COR_SUPERFICIE = '#3B0FA6'; // mesma cor de fundo do root da tela (anel dos marcadores)

type Props = {
  pontos: PontoTendencia[];
  height?: number;
};

function formatarDataCurta(dataISO: string): string {
  const [, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}`;
}

function formatarDataLonga(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function CriticidadeTrendChart({ pontos, height = 160 }: Props) {
  const [selecionado, setSelecionado] = useState<number | null>(null);

  if (pontos.length === 0) {
    return (
      <View style={[s.empty, { height }]}>
        <Text style={s.emptyTxt}>Sem histórico suficiente para este período ainda.</Text>
      </View>
    );
  }

  const paddingV = 28; // espaço extra no topo pro rótulo do último ponto não cortar
  const width = Math.max(260, pontos.length * 28);
  const valores = pontos.map((p) => p.gravesCriticos);
  const max = Math.max(1, ...valores);

  const pontosSvg = pontos.map((p, i) => {
    const x = pontos.length === 1 ? width / 2 : (i / (pontos.length - 1)) * width;
    const y = height - paddingV - (p.gravesCriticos / max) * (height - paddingV * 2);
    return { x, y, valor: p.gravesCriticos, data: p.data };
  });

  const linha = pontosSvg.map((p) => `${p.x},${p.y}`).join(' ');
  const baseY = height - paddingV;
  const ultimo = pontosSvg[pontosSvg.length - 1];
  const ativo = selecionado !== null ? pontosSvg[selecionado] : null;

  return (
    <View>
      {ativo && (
        <View style={s.tooltip}>
          <Text style={s.tooltipData}>{formatarDataLonga(ativo.data)}</Text>
          <Text style={s.tooltipValor}>{ativo.valor} trecho{ativo.valor === 1 ? '' : 's'} grave/crítico</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={width} height={height}>
            <Line x1={0} y1={baseY} x2={width} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            <Polyline points={linha} fill="none" stroke={COR_LINHA} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Rótulo direto só no ponto de hoje (o extremo) — nada de número em cada ponto */}
            <SvgText
              x={ultimo.x}
              y={Math.max(12, ultimo.y - 12)}
              fill="#fff"
              fontSize={11}
              fontWeight="700"
              textAnchor={pontosSvg.length > 1 ? 'end' : 'middle'}
            >
              {ultimo.valor}
            </SvgText>

            {pontosSvg.map((p, i) => (
              <Circle
                key={p.data}
                cx={p.x}
                cy={p.y}
                r={selecionado === i ? 6 : 4}
                fill={COR_LINHA}
                stroke={COR_SUPERFICIE}
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* Alvos de toque maiores que o marcador visual, cobrindo cada ponto */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {pontosSvg.map((p, i) => (
              <Pressable
                key={p.data}
                onPress={() => setSelecionado((atual) => (atual === i ? null : i))}
                hitSlop={8}
                style={{ position: 'absolute', left: p.x - 12, top: p.y - 12, width: 24, height: 24 }}
              />
            ))}
          </View>

          <View style={[s.eixoX, { width }]}>
            <Text style={s.eixoTxt}>{formatarDataCurta(pontos[0].data)}</Text>
            <Text style={s.eixoTxt}>{formatarDataCurta(pontos[pontos.length - 1].data)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  eixoX: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  eixoTxt: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  tooltip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  tooltipData: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tooltipValor: { fontSize: 12, color: '#fff', fontWeight: '700', marginTop: 1 },
});

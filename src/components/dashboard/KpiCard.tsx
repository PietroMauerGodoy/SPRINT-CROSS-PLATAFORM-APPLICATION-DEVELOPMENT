import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

type Delta = {
  valor: number;
  /** Se um valor MAIOR desse delta é uma coisa boa (ex: SLA) ou ruim (ex: nº de críticos). */
  maiorEhMelhor: boolean;
  /** Texto do período de comparação, ex: "vs. 30 dias atrás". */
  periodoLabel: string;
};

type Props = {
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  valor: string;
  label: string;
  sublabel?: string;
  delta?: Delta;
};

export default function KpiCard({ icone, cor, valor, label, sublabel, delta }: Props) {
  const deltaInfo = delta ? formatarDelta(delta) : null;

  return (
    <View style={s.card}>
      <View style={[s.iconBox, { backgroundColor: cor + '22' }]}>
        <Ionicons name={icone} size={18} color={cor} />
      </View>
      <Text style={s.valor}>{valor}</Text>
      <Text style={s.label}>{label}</Text>
      {sublabel ? <Text style={s.sublabel}>{sublabel}</Text> : null}
      {deltaInfo && (
        <View style={s.deltaRow}>
          <Ionicons name={deltaInfo.icone} size={11} color={deltaInfo.cor} />
          <Text style={[s.deltaTxt, { color: deltaInfo.cor }]}>{deltaInfo.texto}</Text>
        </View>
      )}
    </View>
  );
}

function formatarDelta(delta: Delta): { texto: string; cor: string; icone: keyof typeof Ionicons.glyphMap } {
  const { valor, maiorEhMelhor, periodoLabel } = delta;

  if (valor === 0) {
    return { texto: `Sem variação ${periodoLabel}`, cor: 'rgba(255,255,255,0.5)', icone: 'remove-outline' };
  }

  const subiu = valor > 0;
  const bom = subiu === maiorEhMelhor;
  const sinal = subiu ? '+' : '';

  return {
    texto: `${sinal}${valor} ${periodoLabel}`,
    cor: bom ? colors.success : colors.error,
    icone: subiu ? 'arrow-up' : 'arrow-down',
  };
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  valor: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginTop: 3,
  },
  sublabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  deltaTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
});

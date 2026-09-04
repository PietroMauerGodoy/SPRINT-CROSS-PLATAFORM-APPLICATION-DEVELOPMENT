import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';

type Props = {
  label: string;
  descricao?: string;
  valor: boolean;
  onValor: (v: boolean) => void;
};

// Componente próprio em vez do <Switch> nativo: o Switch do React Native não
// respeita `trackColor`/`thumbColor` de forma confiável no react-native-web
// (cai no estilo padrão do navegador, geralmente verde) — isso fazia o toggle
// aparecer verde mesmo com o código pedindo a cor roxa da marca.
export default function Toggle({ label, descricao, valor, onValor }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textoBox}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {descricao ? <Text style={styles.desc}>{descricao}</Text> : null}
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onValor(!valor)}
        style={[styles.track, { backgroundColor: valor ? colors.primary : '#CBD5E1' }]}
        accessibilityRole="switch"
        accessibilityState={{ checked: valor }}
      >
        <View style={[styles.thumb, valor && styles.thumbOn]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  textoBox: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  desc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});

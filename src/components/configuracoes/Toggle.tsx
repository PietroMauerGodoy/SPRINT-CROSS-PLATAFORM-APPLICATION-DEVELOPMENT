import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../../theme';

type Props = {
  label: string;
  descricao?: string;
  valor: boolean;
  onValor: (v: boolean) => void;
};

export default function Toggle({ label, descricao, valor, onValor }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textoBox}>
        <Text style={styles.label}>{label}</Text>
        {descricao ? <Text style={styles.desc}>{descricao}</Text> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onValor}
        trackColor={{ false: '#CBD5E1', true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor="#CBD5E1"
      />
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
});

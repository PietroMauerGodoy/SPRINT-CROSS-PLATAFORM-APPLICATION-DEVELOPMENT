import { View, Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

type Props = {
  icone: string;
  titulo: string;
  cor: string;
  children: ReactNode;
};

export default function SectionCard({ icone, titulo, cor, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: cor + '1A' }]}>
          <Ionicons name={icone as any} size={18} color={cor} />
        </View>
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary,
  },
  body: {
    gap: 12,
  },
});

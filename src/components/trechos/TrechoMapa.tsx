import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KanbanItem } from '../../types';

type Props = {
  trechos: KanbanItem[];
  selecionadoId: string | null;
  onSelecionar: (item: KanbanItem) => void;
};

// O mapa (Leaflet) só existe na build web hoje — ver TrechoMapa.web.tsx. Em
// mobile ainda não temos uma lib de mapa nativa integrada, então mostramos
// um aviso em vez de quebrar a tela.
export default function TrechoMapa(_props: Props) {
  return (
    <View style={s.box}>
      <Ionicons name="map-outline" size={32} color="rgba(255,255,255,0.3)" />
      <Text style={s.txt}>Mapa disponível na versão web por enquanto.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  txt: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', maxWidth: 220 },
});

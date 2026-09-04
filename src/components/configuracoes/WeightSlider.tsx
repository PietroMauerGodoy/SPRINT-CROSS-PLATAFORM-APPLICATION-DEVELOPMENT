import { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Platform } from 'react-native';
import { colors } from '../../theme';

type Props = {
  label: string;
  valor: number;
  cor: string;
  onChange: (v: number) => void;
};

const MIN = 0;
const MAX = 100;
const ALTURA_TRILHA = 8;
const DIAMETRO_THUMB = 20;

export default function WeightSlider({ label, valor, cor, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);

  function valorFromX(x: number) {
    if (trackWidth <= 0) return valor;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    return Math.round(ratio * MAX);
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        onChange(valorFromX(x));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        onChange(valorFromX(x));
      },
    }),
  ).current;

  // No web: mantém o <input type="range"> nativo (acessível, drag/teclado de
  // graça) só que invisível, sobreposto a uma trilha/preenchimento/thumb
  // desenhados à mão — o input do navegador sozinho fica fino e sem graça
  // mesmo com `accentColor`, destoando do resto da UI.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: cor }]} />
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.valuePill, { backgroundColor: cor + '1A' }]}>
            <Text style={[styles.value, { color: cor }]}>{valor}%</Text>
          </View>
        </View>

        <View style={styles.trackWrap}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${valor}%`, backgroundColor: cor }]} />
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              { left: `${valor}%`, borderColor: cor } as any,
            ]}
          />
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={1}
            value={valor}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              margin: 0,
              opacity: 0,
              cursor: 'pointer',
            } as any}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: cor }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.valuePill, { backgroundColor: cor + '1A' }]}>
          <Text style={[styles.value, { color: cor }]}>{valor}%</Text>
        </View>
      </View>

      <View
        ref={trackRef}
        style={styles.trackWrap}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <View style={styles.track} {...pan.panHandlers}>
          <View
            style={[
              styles.fill,
              { width: `${valor}%`, backgroundColor: cor },
            ]}
          />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: `${valor}%`, borderColor: cor } as any]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  valuePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
  },
  trackWrap: {
    height: DIAMETRO_THUMB + 6,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: ALTURA_TRILHA,
    borderRadius: ALTURA_TRILHA / 2,
    backgroundColor: '#EEF1F6',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: ALTURA_TRILHA,
    borderRadius: ALTURA_TRILHA / 2,
  },
  thumb: {
    position: 'absolute',
    width: DIAMETRO_THUMB,
    height: DIAMETRO_THUMB,
    borderRadius: DIAMETRO_THUMB / 2,
    marginLeft: -DIAMETRO_THUMB / 2,
    backgroundColor: '#fff',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
});

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

  // No web, usa um input range real (mais acessível e confiável)
  if (Platform.OS === 'web') {
    return (
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: cor }]} />
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color: cor }]}>{valor}%</Text>
        </View>
        <View style={styles.trackWrap}>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={1}
            value={valor}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: cor, height: 8, cursor: 'pointer' }}
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
        <Text style={[styles.value, { color: cor }]}>{valor}%</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
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
  value: {
    fontSize: 14,
    fontWeight: '800',
  },
  trackWrap: {
    height: 24,
    justifyContent: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});

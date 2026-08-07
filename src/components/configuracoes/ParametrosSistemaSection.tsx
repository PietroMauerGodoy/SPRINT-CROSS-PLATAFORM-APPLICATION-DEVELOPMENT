import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import { useToast } from '../toast/ToastContext';
import SectionCard from './SectionCard';
import WeightSlider from './WeightSlider';

export default function ParametrosSistemaSection() {
  const {
    pesoManutencao, setPesoManutencao,
    pesoClima, setPesoClima,
    pesoCrescimento, setPesoCrescimento,
    frequenciaReavaliacao, setFrequenciaReavaliacao,
    limiteCriticidade, setLimiteCriticidade,
    registrarAtividade,
  } = useConfiguracoes();
  const { showToast } = useToast();

  const [erroFreq, setErroFreq] = useState<string | null>(null);
  const [erroLimite, setErroLimite] = useState<string | null>(null);

  const soma = pesoManutencao + pesoClima + pesoCrescimento;
  const totalOk = soma === 100;

  // Ajusta mantendo os demais proporcionais para fechar 100%
  function ajustarPeso(tipo: 'manutencao' | 'clima' | 'crescimento', novo: number) {
    const v = Math.max(0, Math.min(100, novo));
    const resto = 100 - v;

    // Referências atuais dos dois outros pesos
    const t1 = tipo === 'manutencao' ? pesoClima : pesoManutencao;
    const t2 = tipo === 'crescimento' ? pesoClima : pesoCrescimento;
    const somaOutros = t1 + t2 || 1;

    const p1 = Math.round((resto * t1) / somaOutros);
    const p2 = resto - p1;

    if (tipo === 'manutencao') {
      setPesoManutencao(v);
      setPesoClima(p1);
      setPesoCrescimento(p2);
    } else if (tipo === 'clima') {
      setPesoClima(v);
      setPesoManutencao(p1);
      setPesoCrescimento(p2);
    } else {
      setPesoCrescimento(v);
      setPesoManutencao(p1);
      setPesoClima(p2);
    }
  }

  function validarFrequencia(texto: string) {
    if (texto === '') { setErroFreq('Informe um valor.'); return; }
    const num = Number(texto);
    if (isNaN(num) || num < 0) { setErroFreq('Informe um número válido (≥ 0).'); return; }
    setErroFreq(null);
  }

  function validarLimite(texto: string) {
    if (texto === '') { setErroLimite('Informe um valor.'); return; }
    const num = Number(texto);
    if (isNaN(num) || num < 0 || num > 100) { setErroLimite('Informe um valor entre 0 e 100.'); return; }
    setErroLimite(null);
  }

  function handleFreq(texto: string) {
    const somenteNumeros = texto.replace(/[^0-9]/g, '');
    setFrequenciaReavaliacao(somenteNumeros);
    validarFrequencia(somenteNumeros);
  }

  function handleLimite(texto: string) {
    const somenteNumeros = texto.replace(/[^0-9]/g, '');
    setLimiteCriticidade(somenteNumeros);
    validarLimite(somenteNumeros);
  }

  function salvar() {
    validarFrequencia(frequenciaReavaliacao);
    validarLimite(limiteCriticidade);
    if (erroFreq || erroLimite || !totalOk) {
      showToast('Corrija os valores antes de salvar.', 'error');
      return;
    }
    registrarAtividade(
      `Atualizou parâmetros de criticidade (pesos ${pesoManutencao}/${pesoClima}/${pesoCrescimento}, frequência ${frequenciaReavaliacao}d, limite ${limiteCriticidade}%)`,
    );
    showToast('Parâmetros salvos com sucesso!');
  }

  return (
    <SectionCard icone="options-outline" titulo="Parâmetros do Sistema" cor="#16A34A">
      <Text style={styles.desc}>
        Configure os pesos usados no cálculo de criticidade da vegetação. Os três devem somar 100%.
      </Text>

      {/* Indicador de soma (reativo) */}
      <View style={[styles.somaBox, { backgroundColor: totalOk ? '#DCFCE7' : '#FEE2E2' }]}>
        <Ionicons
          name={totalOk ? 'checkmark-circle' : 'alert-circle'}
          size={16}
          color={totalOk ? '#15803D' : '#B91C1C'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.somaTxt, { color: totalOk ? '#15803D' : '#B91C1C' }]}>
          Soma total: {soma}% {totalOk ? '✓' : '— ajuste para 100%'}
        </Text>
      </View>

      {/* Sliders de peso */}
      <WeightSlider
        label="Peso: Tempo desde última manutenção"
        valor={pesoManutencao}
        cor="#5E22F3"
        onChange={(v) => ajustarPeso('manutencao', v)}
      />
      <WeightSlider
        label="Peso: Condições climáticas"
        valor={pesoClima}
        cor="#3B82F6"
        onChange={(v) => ajustarPeso('clima', v)}
      />
      <WeightSlider
        label="Peso: Taxa de crescimento estimado"
        valor={pesoCrescimento}
        cor="#F59E0B"
        onChange={(v) => ajustarPeso('crescimento', v)}
      />

      <View style={styles.divider} />

      {/* Inputs numéricos */}
      <View style={styles.fieldRow}>
        <View style={styles.field}>
          <Text style={styles.label}>Frequência padrão de reavaliação (dias)</Text>
          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              value={frequenciaReavaliacao}
              onChangeText={handleFreq}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={colors.gray400}
            />
            <Text style={styles.sufixo}>dias</Text>
          </View>
          {erroFreq ? <Text style={styles.erro}>{erroFreq}</Text> : null}
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.field}>
          <Text style={styles.label}>Limite de criticidade para alerta automático</Text>
          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              value={limiteCriticidade}
              onChangeText={handleLimite}
              keyboardType="numeric"
              placeholder="80"
              placeholderTextColor={colors.gray400}
            />
            <Text style={styles.sufixo}>%</Text>
          </View>
          {erroLimite ? <Text style={styles.erro}>{erroLimite}</Text> : null}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Botão salvar */}
      <TouchableOpacity style={styles.btnSalvar} onPress={salvar} activeOpacity={0.85}>
        <Ionicons name="save-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.btnSalvarTxt}>Salvar parâmetros</Text>
      </TouchableOpacity>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  desc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  somaBox: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  somaTxt: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    minWidth: 200,
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.secondary,
    outlineStyle: 'none',
  } as any,
  sufixo: {
    paddingRight: 14,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  erro: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  btnSalvar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  btnSalvarTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

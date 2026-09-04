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
    const freqAtual = frequenciaReavaliacao;
    const limiteAtual = limiteCriticidade;
    const erroFreqAtual = (() => {
      if (freqAtual === '') return 'Informe um valor.';
      const num = Number(freqAtual);
      if (isNaN(num) || num < 0) return 'Informe um número válido (≥ 0).';
      return null;
    })();
    const erroLimiteAtual = (() => {
      if (limiteAtual === '') return 'Informe um valor.';
      const num = Number(limiteAtual);
      if (isNaN(num) || num < 0 || num > 100) return 'Informe um valor entre 0 e 100.';
      return null;
    })();

    setErroFreq(erroFreqAtual);
    setErroLimite(erroLimiteAtual);

    if (erroFreqAtual || erroLimiteAtual || !totalOk) {
      showToast('Corrija os valores antes de salvar.', 'error');
      return;
    }
    registrarAtividade(
      `Atualizou parâmetros de criticidade (pesos ${pesoManutencao}/${pesoClima}/${pesoCrescimento}, frequência ${freqAtual}d, limite ${limiteAtual}%)`,
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
      <View style={styles.slidersBox}>
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
      </View>

      <View style={styles.divider} />

      {/* Inputs numéricos */}
      <View style={styles.fieldRow}>
        <View style={styles.field}>
          <Text style={styles.label}>Frequência de reavaliação</Text>
          <View style={[styles.inputShell, erroFreq && styles.inputShellErro]}>
            <Ionicons name="calendar-outline" size={15} color={colors.gray400} style={styles.inputIcone} />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
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

        <View style={styles.field}>
          <Text style={styles.label}>Limite p/ alerta automático</Text>
          <View style={[styles.inputShell, erroLimite && styles.inputShellErro]}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.gray400} style={styles.inputIcone} />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  slidersBox: {
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    flex: 1,
    minWidth: 180,
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
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  inputShellErro: {
    borderColor: '#FCA5A5',
  },
  inputIcone: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 11,
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
    paddingVertical: 11,
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
    paddingVertical: 13,
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnSalvarTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

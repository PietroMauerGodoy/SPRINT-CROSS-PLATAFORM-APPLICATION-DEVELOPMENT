import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import SectionCard from './SectionCard';
import Toggle from './Toggle';

// Estrutura de opções pronta para receber mais idiomas no futuro
const IDIOMAS: { value: string; label: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es',    label: 'Español' },
];

export default function PreferenciasSection() {
  const {
    // temaEscuro e setTemaEscuro NÃO são usados (item bloqueado por instrução)
    idioma, setIdioma,
    modoCompacto, setModoCompacto,
  } = useConfiguracoes();

  const [dropIdioma, setDropIdioma] = useState(false);
  const idiomaAtual = IDIOMAS.find((i) => i.value === idioma) ?? IDIOMAS[0];

  return (
    <SectionCard icone="color-palette-outline" titulo="Preferências de Interface" cor="#3B82F6">
      {/* Tema (BLoqueado — NÃO MEXER) */}
      <View style={styles.temaRow}>
        <View style={[styles.temaIconBox, { backgroundColor: '#312E81' }]}>
          <Ionicons name="moon" size={16} color="#C7D2FE" />
        </View>
        <View style={styles.temaTexto}>
          <Text style={styles.temaLabel}>Tema</Text>
          <Text style={styles.temaDesc}>Escuro (padrão do sistema)</Text>
        </View>
        <Toggle label="" valor={true} onValor={() => {}} />
      </View>

      {/* Seletor de idioma (dropdown funcional) */}
      <View>
        <Text style={styles.label}>Idioma</Text>
        <TouchableOpacity
          style={styles.selectRow}
          activeOpacity={0.8}
          onPress={() => setDropIdioma((v) => !v)}
        >
          <Ionicons name="language-outline" size={16} color={colors.primary} />
          <Text style={styles.selectVal}>{idiomaAtual.label}</Text>
          <Ionicons name={dropIdioma ? 'chevron-up' : 'chevron-down'} size={14} color={colors.gray400} />
        </TouchableOpacity>
        {dropIdioma && (
          <View style={styles.dropMenu}>
            {IDIOMAS.map((opcao) => (
              <TouchableOpacity
                key={opcao.value}
                style={[styles.dropItem, idioma === opcao.value && styles.dropItemOn]}
                onPress={() => { setIdioma(opcao.value); setDropIdioma(false); }}
              >
                <Text style={[styles.dropItemTxt, idioma === opcao.value && styles.dropItemTxtOn]}>
                  {opcao.label}
                </Text>
                {idioma === opcao.value ? (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Modo compacto */}
      <Toggle
        label="Modo compacto"
        descricao="Reduz a densidade das tabelas para caber mais informações"
        valor={modoCompacto}
        onValor={setModoCompacto}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  temaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  temaIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  temaTexto: {
    flex: 1,
  },
  temaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  temaDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  selectVal: {
    flex: 1,
    fontSize: 14,
    color: colors.secondary,
  },
  dropMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  dropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropItemOn: {
    backgroundColor: '#F5F3FF',
  },
  dropItemTxt: {
    fontSize: 13,
    color: colors.secondary,
  },
  dropItemTxtOn: {
    color: colors.primary,
    fontWeight: '600',
  },
});

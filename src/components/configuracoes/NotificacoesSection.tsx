import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import SectionCard from './SectionCard';
import Toggle from './Toggle';

// "Prazo de trecho vencendo", "Relatório semanal disponível" e "Receber
// também por e-mail" foram escondidos: nenhum dos três tem uma feature real
// por trás (não existe sistema de prazo de trecho, geração de relatório
// semanal, nem envio de e-mail no app hoje) — eram toggles decorativos que
// salvavam um valor sem nunca serem lidos em lugar nenhum.
export default function NotificacoesSection() {
  const { notifPrefs, setNotifPref } = useConfiguracoes();

  return (
    <SectionCard icone="notifications-outline" titulo="Notificações" cor="#F59E0B">
      <Toggle
        label="Nova ocorrência crítica"
        descricao="Alerta quando uma ocorrência de alto risco é registrada"
        valor={notifPrefs.novaOcorrenciaCritica}
        onValor={(v) => setNotifPref('novaOcorrenciaCritica', v)}
      />
      <Toggle
        label="Mudança de status de equipe"
        descricao="Avise quando uma equipe muda de status (ativo, inativo, em campo)"
        valor={notifPrefs.mudancaStatusEquipe}
        onValor={(v) => setNotifPref('mudancaStatusEquipe', v)}
      />
    </SectionCard>
  );
}

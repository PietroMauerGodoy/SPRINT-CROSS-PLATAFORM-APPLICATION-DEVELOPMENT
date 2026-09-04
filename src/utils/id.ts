// Relógio monotônico simples: sempre retorna um valor estritamente maior que
// o anterior. Baseado no timestamp (então os IDs continuam correlacionados
// com o momento de criação), mas cai para incremento por 1 quando várias
// chamadas acontecem no mesmo milissegundo — o que um sufixo aleatório ou um
// contador com módulo não garantem sob chamadas síncronas em sequência.
let ultimoId = 0;

/** Gera um ID numérico único dentro da sessão atual do app. */
export function gerarId(): number {
  const agora = Date.now();
  ultimoId = agora > ultimoId ? agora : ultimoId + 1;
  return ultimoId;
}

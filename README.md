# Motiva — Sprint 3

Aplicativo cross-platform desenvolvido com Expo + React Native + TypeScript para gestão operacional de ocorrências, equipes e acompanhamento de campo.

## Integrantes
- Aluno 1 — RM XXXXX
- Aluno 2 — RM XXXXX

## Repositório
- GitHub: <inserir-link-do-repositorio>

## Descrição do projeto
O Motiva centraliza o registro e acompanhamento de ocorrências operacionais que podem impactar a rotina de campo. A aplicação permite criar, listar, detalhar e atualizar ocorrências, com persistência local via AsyncStorage para manter os dados mesmo após fechar e reabrir o app.

## Funcionalidades da Sprint 3
- Cadastro de ocorrência com título, descrição, local, categoria, risco e responsável;
- Listagem com busca e filtros por risco e status;
- Detalhamento da ocorrência com atualização de status;
- Persistência local em armazenamento assíncrono;
- Estrutura organizada em telas, serviços, tipos e componentes.

## Modelo principal
```ts
export type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  local: string;
  risco: 'baixo' | 'medio' | 'alto';
  data: string;
  categoria: string;
  status: 'aberta' | 'em_andamento' | 'resolvida';
  responsavel?: string;
};
```

## Persistência
A camada de persistência fica em `src/services/ocorrenciasService.ts` e usa `@react-native-async-storage/async-storage` para salvar os dados na chave `@motiva:ocorrencias`.

## Fluxo de uso
1. Acesse a tela de ocorrências;
2. Clique em "Nova Ocorrência";
3. Preencha os campos obrigatórios e salve;
4. A ocorrência aparece na lista;
5. Toque na ocorrência para abrir o detalhe;
6. Atualize o status conforme o atendimento.

## Como executar
### Requisitos
- Node.js 18+
- Expo CLI

### Instalação
```bash
npm install
```

### Execução
```bash
npx expo start --web
```

## Estrutura do projeto
```text
src/
├── components/
├── context/
├── data/
├── navigation/
├── screens/
├── services/
├── theme/
├── types/
└── ...
```

## Observações
A persistência é local e não depende de backend externo, seguindo o escopo do MVP da Sprint 3.

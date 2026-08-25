# Motiva — Aplicativo de Gestão de Rodovias

Aplicativo cross-platform desenvolvido com **Expo + React Native + TypeScript** para a gestão operacional de equipes e ocorrências em malhas rodoviárias federais e estaduais sob concessão.

---

## Como rodar o projeto

### Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go instalado no celular **ou** navegador web

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd SPRINT02-CROSS-PLATAFORM-APPLICATION-DEVELOPMENT

# Instale as dependências
npm install
```

### Executando

```bash
# Web (recomendado para desenvolvimento)
npx expo start --web

# Dispositivo físico via Expo Go
npx expo start
# Escaneie o QR code com o Expo Go (Android) ou a câmera (iOS)
```

### Credenciais de acesso (dados mockados)

| Usuário | Senha    | Cargo         |
|---------|----------|---------------|
| `admin` | `123456` | Administrador |

---

## O que o app faz

O **Motiva** é um sistema de controle operacional rodoviário. Nesta sprint as funcionalidades principais foram implementadas nas telas de **Equipes** e **Kanban**, com as demais telas (Ocorrências e Detalhe) estruturadas na navegação, mas ainda não desenvolvidas.

### 1. Autenticação
Tela de login com validação de credenciais contra dados mockados, toggle de visibilidade de senha e feedback de erro em tempo real.

### 2. Gerenciamento de Equipes
Tabela paginada (7 itens/página) com:
- Busca por nome, responsável ou ID
- Filtros por rodovia (BR-116, BR-381, SP-280) e status
- CRUD completo: criar, editar, excluir equipes
- Alternância de status **Ativo ↔ Inativo** (o status *Em Campo* é definido exclusivamente pelo Kanban)
- Estado persistido via `EquipesContext` — dados não se perdem ao navegar entre telas
- Toda ação (criar, editar, excluir, mudar status) gera uma notificação em tempo real

### 3. Kanban de Vegetação
Quadro Kanban com quatro colunas baseadas na severidade da vegetação medida em campo:

| Coluna         | Faixa de altura |
|----------------|-----------------|
| Sem Ocorrência | 0 – 4 cm        |
| Leve           | 5 – 14 cm       |
| Grave          | 15 – 24 cm      |
| Crítico        | ≥ 25 cm         |

Funcionalidades:
- Arrastar e soltar cards entre colunas; ao soltar, um modal pede a altura medida e valida a faixa da coluna de destino
- A coluna de destino é determinada automaticamente pela altura informada
- CRUD completo de registros de vegetação com modal de formulário
- Observações e registro do último serviço por card
- Estado persistido via `KanbanContext` — dados não se perdem ao navegar
- Cada ação (criar, editar, mover, excluir) gera uma notificação em tempo real

### 4. Sincronização Equipes ↔ Kanban

As duas telas compartilham estado e se mantêm sincronizadas automaticamente:

| Ação em Equipes                | Efeito no Kanban                          |
|-------------------------------|-------------------------------------------|
| Criar equipe (ativo)          | Card adicionado automaticamente na col. 1 |
| Inativar equipe               | Card removido do Kanban                   |
| Reativar equipe (inativo → ativo) | Card reinserido na col. 1             |
| Excluir equipe                | Card removido do Kanban                   |

| Ação no Kanban                      | Efeito em Equipes                      |
|------------------------------------|----------------------------------------|
| Mover card para col. 2, 3 ou 4     | Status da equipe → **Em Campo**        |
| Mover card de volta para col. 1    | Status da equipe → **Ativo**           |

### 5. Notificações Globais
Sistema de notificações compartilhado entre todas as telas via `NotificacoesContext`:
- Sino no header com badge vermelho mostrando o número de não lidas
- Abrir o painel zera o contador automaticamente
- Painel flutuante scrollável com as últimas notificações
- Modal "Ver todas" com histórico completo e botão "Limpar tudo"
- Notificações geradas automaticamente por todas as ações de CRUD nas duas telas

---

## Estrutura do projeto

```
src/
├── screens/
│   ├── LoginScreen.tsx          # Autenticação
│   ├── EquipesScreen.tsx        # Gerenciamento de equipes (CRUD + sync Kanban)
│   ├── KanbanScreen.tsx         # Kanban de vegetação (drag & drop + sync Equipes)
│   ├── OcorrenciasScreen.tsx    # Lista de ocorrências (estrutura base)
│   └── DetalheScreen.tsx        # Detalhe de ocorrência (estrutura base)
│
├── components/
│   ├── NotificacoesBell.tsx     # Sino + badge + painel flutuante + modal
│   ├── StatusBadge.tsx          # Badge de status reutilizável
│   └── OcorrenciaCard.tsx       # Card reutilizável de ocorrência
│
├── context/
│   ├── NotificacoesContext.tsx  # Estado global de notificações + contador não lidas
│   ├── EquipesContext.tsx       # Estado global de equipes (persiste entre telas)
│   └── KanbanContext.tsx        # Estado global do Kanban (persiste entre telas)
│
├── types/
│   └── index.ts                 # Tipagem TypeScript centralizada
│
├── data/
│   └── mockData.ts              # Dados mockados (sem API externa)
│
├── navigation/
│   └── AppNavigator.tsx         # React Navigation (Stack)
│
└── theme/
    └── index.ts                 # Cores e tokens de design
```

---

## Modelagem TypeScript

Os tipos principais estão em `src/types/index.ts`:

```typescript
export type StatusEquipe = 'ativo' | 'inativo' | 'em_campo';

export type SeveridadeVegetacao = 'sem_ocorrencia' | 'leve' | 'grave' | 'critico';

export type Equipe = {
  id: string;
  nome: string;
  status: StatusEquipe;
  rodovia: string;
  km: string;
  trechoRodovia: string;
  responsavel: string;
};

export type KanbanItem = {
  id: string;
  equipeId: string;
  nomeEquipe: string;
  rodovia: string;
  kmInicio: number;
  kmFim: number;
  tipoVegetacao: string;
  alturaAtual: number;
  severidade: SeveridadeVegetacao;
  responsavel: string;
  observacao: string;
  ultimoServico: { data: string; responsavel: string } | null;
};

export type RiscoNivel = 'baixo' | 'medio' | 'alto';

export type Ocorrencia = {
  id: number;
  titulo: string;
  descricao: string;
  local: string;
  risco: RiscoNivel;
  data: string;
  categoria: string;
  status: 'aberta' | 'em_andamento' | 'resolvida';
  responsavel?: string;
};
```

O tipo `Notificacao` é definido em `src/context/NotificacoesContext.tsx`:

```typescript
export type Notificacao = {
  id: number;
  cor: string;
  icone: string;
  titulo: string;
  desc: string;
  criadaEm: Date;
};
```

---

## Gerenciamento de estado

O app usa **React Context** para todo o estado compartilhado entre telas. Três providers envolvem a aplicação em `App.tsx`:

```typescript
// App.tsx
<NotificacoesProvider>
  <EquipesProvider>
    <KanbanProvider>
      <AppNavigator />
    </KanbanProvider>
  </EquipesProvider>
</NotificacoesProvider>
```

### EquipesContext

```typescript
type EquipesContextType = {
  equipes:         Equipe[];
  adicionarEquipe: (e: Omit<Equipe, 'id' | 'status'>) => string;
  editarEquipe:    (id: string, dados: Omit<Equipe, 'id' | 'status'>) => void;
  excluirEquipe:   (id: string) => void;
  alternarStatus:  (id: string) => StatusEquipe; // só ativo ↔ inativo
  setStatusEquipe: (id: string, status: StatusEquipe); // usado pelo Kanban
};
```

### KanbanContext

```typescript
type KanbanContextType = {
  itens:              KanbanItem[];
  adicionarItem:      (item: Omit<KanbanItem, 'id'>) => string;
  atualizarItem:      (id: string, updates: Partial<KanbanItem>) => void;
  removerItem:        (id: string) => void;
  removerPorEquipeId: (equipeId: string) => void;
  limparColuna:       (sev: SeveridadeVegetacao) => void;
  temEquipeNoKanban:  (equipeId: string) => boolean;
};
```

### NotificacoesContext

```typescript
type NotificacoesContextType = {
  notificacoes:        Notificacao[];
  naoLidas:            number;
  adicionarNotificacao:(n: Omit<Notificacao, 'id' | 'criadaEm'>) => void;
  marcarTodasLidas:    () => void;  // chamado ao abrir o painel
  limparTodas:         () => void;
};
```

Exemplo de uso em qualquer tela:

```typescript
const { adicionarNotificacao } = useNotificacoes();

adicionarNotificacao({
  cor: '#10B981',
  icone: 'people-outline',
  titulo: 'Nova equipe criada',
  desc: 'Equipe Alfa (#11) foi cadastrada em BR-116 e adicionada ao Kanban.',
});
```

---

## Como os dados estão mockados

Todos os dados ficam em `src/data/mockData.ts`. Não há chamadas a APIs externas — o app funciona 100% offline.

### Usuários (`mockUsuarios`)
1 usuário de teste com credenciais fixas para validação no login.

### Equipes (`mockEquipes`)
10 equipes distribuídas nas rodovias BR-116, BR-381 e SP-280 com responsáveis, trechos e status variados (ativo, inativo, em_campo).

### Kanban (`mockKanban`)
10 registros de vegetação com alturas entre 3 cm e 28 cm. A severidade é calculada automaticamente:

```typescript
function calcSeveridade(cm: number): SeveridadeVegetacao {
  if (cm >= 25) return 'critico';
  if (cm >= 15) return 'grave';
  if (cm >= 5)  return 'leve';
  return 'sem_ocorrencia';
}
```

### Ocorrências (`mockOcorrencias`)
5 ocorrências pré-cadastradas cobrindo cenários reais: vazamento de óleo, falta de EPI, iluminação deficiente, manutenção pendente e sinalização apagada.

---

## Navegação

Utiliza **React Navigation** (`@react-navigation/native-stack`) com rota inicial no Login:

```
Login
  └── Equipes
        ├── Kanban
        └── Ocorrencias
              └── Detalhe
```

---

## Tecnologias utilizadas

| Tecnologia        | Versão | Uso                                          |
|-------------------|--------|----------------------------------------------|
| Expo SDK          | 56     | Plataforma base                              |
| React Native      | 0.79   | Framework UI                                 |
| TypeScript        | 5.x    | Tipagem estática                             |
| React Navigation  | 7.x    | Navegação entre telas (Stack)                |
| React Context API | —      | Estado global (equipes, kanban, notificações)|
| Expo Vector Icons | —      | Ícones (Ionicons, MaterialIcons)             |
| React Native Web  | —      | Suporte a navegador                          |

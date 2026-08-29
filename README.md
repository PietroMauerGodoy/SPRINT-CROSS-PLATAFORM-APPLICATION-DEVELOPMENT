# Motiva — Sistema de Priorização de Manutenção de Vegetação Rodoviária

Aplicativo cross-platform (**Expo + React Native + TypeScript**, base de código única para Web e Mobile via `react-native-web`) desenvolvido como parte do Challenge FIAP (2º ano — Ciência da Computação) em parceria com a **CCR Motiva**.

---

## Contexto de negócio

Hoje a manutenção de vegetação nas margens de rodovias (roçada, poda, capina) segue um **cronograma fixo** (ex: a cada 30 dias), independente da real necessidade de intervenção em cada trecho. Isso gera dois problemas:

- **Custo desnecessário** — equipes deslocadas para trechos sem necessidade real de corte.
- **Risco operacional** — trechos que cresceram mais rápido que o previsto ficam sem manutenção até a próxima janela fixa, comprometendo visibilidade e segurança viária.

A proposta do projeto é substituir esse cronograma fixo por um **score de criticidade por trecho**, calculado a partir de:

- dados climáticos (chuva, temperatura) — afetam a taxa de crescimento da vegetação;
- histórico de manutenção — tempo desde a última intervenção no trecho;
- taxa de crescimento estimada por tipo de vegetação/trecho.

O fluxo demonstrado pelo app é: **entrada de dados → processamento (cálculo de criticidade) → saída (priorização de equipes / Kanban)**.

A lógica de severidade do Kanban é inspirada em parâmetros operacionais reais do setor:
- **PER BR-381/MG/SP** (Programa de Exploração da Rodovia) — parâmetros de desempenho para conservação de faixa de domínio e vegetação.
- **Anexo 06 — Lote Rota Sorocabana (ARTESP)** — padrões operacionais de conservação de vegetação (ex: poda ao atingir 30cm em geral / 10cm perto de instalações, prazos de resposta de 24h a 1 semana conforme criticidade, capina mínima de 4x/ano, aceiros 1x/ano).

> Os parâmetros numéricos usados no app (faixas de altura, pesos) são valores de demonstração inspirados nesses documentos — não são os parâmetros contratuais exatos da concessão.

---

## Contexto acadêmico

- **Instituição:** FIAP
- **Metodologia:** Design Thinking, entregas por sprint (board no Miro + PDF espelhando o Miro)
- **Sprint atual:** Sprint 2 — foco em MVP funcional
- **Equipe:**
  - Fernando Melo — RM 564297
  - Patrick Mansour — RM 562970
  - Pedro Henrique Ribeiro — RM 565090
  - Pietro Mauer — RM 564345
  - Ryan Santos — RM 565102
  - Samir Assad — RM 561562
- **Repositório:** https://github.com/PietroMauerGodoy/SPRINT-CROSS-PLATAFORM-APPLICATION-DEVELOPMENT

---

## Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go instalado no celular **ou** navegador web

### Instalação
```bash
git clone <url-do-repositorio>
cd SPRINT-CROSS-PLATAFORM-APPLICATION-DEVELOPMENT
npm install
```

### Executando
```bash
# Web (recomendado para desenvolvimento)
npx expo start --web

# Dispositivo físico via Expo Go
npx expo start
```

### Credenciais de acesso (dados mockados)
| Login | Senha | Papel | Escopo |
|---|---|---|---|
| `admin` | `123456` | Admin | Acesso total + Parâmetros do Sistema + Gestão de Usuários |
| `gestor` | `123456` | Gestor | Acesso operacional total (equipes, Kanban, ocorrências, dashboard) — sem acesso a Parâmetros/Usuários |
| `operador1` | `123456` | Operador de Campo | Só a Equipe Alfa (`#01`) e os trechos dela |
| `operador2` | `123456` | Operador de Campo | Só a Equipe Beta (`#02`) e os trechos dela |

Contas podem ser criadas/editadas de verdade em **Configurações → Gestão de Usuários** (só visível para Admin) — o que for cadastrado ali passa a valer como login imediatamente.

---

## Arquitetura técnica

- **Stack:** TypeScript, Expo SDK 56, React Native 0.85, React Navigation 7 (native-stack), React Context API para estado global, Expo Vector Icons.
- **Projeto unificado:** mesma base de código serve Web (`react-native-web`) e Mobile — não há dois projetos separados. Diferenças de plataforma são tratadas via `Platform.OS` pontualmente (ex: upload de avatar em `PerfilSection.tsx`).
- **Dados 100% mockados** em `src/data/mockData.ts`, sem API externa. Estado persistido localmente via `@react-native-async-storage/async-storage` (funciona offline).

### Estrutura de pastas
```
src/
├── screens/         # Login, Dashboard, Equipes, Kanban, Ocorrencias, Detalhe, Configuracoes
├── components/
│   ├── dashboard/   # KpiCard, SeveridadeDonutChart, CriticidadeTrendChart, RankingTrechosList
│   └── configuracoes/ # PerfilSection, UsuariosSection, ParametrosSistemaSection, etc.
├── context/         # AuthContext, UsuariosContext, EquipesContext, KanbanContext,
│                    # HistoricoContext, NotificacoesContext, ConfiguracoesContext, OcorrenciasContext
├── utils/           # permissions.ts (autorização), dashboardMetrics.ts (cálculo puro dos KPIs)
├── hooks/           # useDashboardMetrics.ts
├── services/        # ocorrenciasService.ts (persistência em AsyncStorage)
├── types/           # Tipagem centralizada
├── data/            # mockData.ts
├── navigation/      # AppNavigator.tsx (Stack)
└── theme/           # Cores e tokens de design
```

### Gerenciamento de estado
Nove providers envolvem a aplicação em `App.tsx`: `ToastProvider`, `UsuariosProvider`, `AuthProvider`, `ConfiguracoesProvider`, `NotificacoesProvider`, `EquipesProvider`, `KanbanProvider`, `HistoricoProvider`, `OcorrenciasProvider`. Todos com estado persistido em `AsyncStorage`.

### Controle de acesso por papel (RBAC)

O app tem 3 papéis de usuário, cada um com um escopo de dados diferente:

| Papel | Pode ver | Pode gerenciar |
|---|---|---|
| **Admin** | Tudo | Tudo + Parâmetros do Sistema + Gestão de Usuários |
| **Gestor** | Tudo | Equipes, Kanban, Ocorrências (sem Parâmetros/Usuários) |
| **Operador de Campo** | Só a própria equipe e os trechos dela (via `equipeId`) | Só edição/registro de serviço nos trechos da própria equipe |

A autorização é centralizada em `src/utils/permissions.ts` — funções puras (`getEquipesVisiveis`, `getKanbanItemsVisiveis`, `podeGerenciarEquipes`, `podeAcessarParametrosSistema`, etc.) que recebem o `Usuario` logado e devolvem o que ele pode ver/fazer. **Nenhuma tela decide isso sozinha com `if (papel === ...)` espalhado no JSX** — a tela só renderiza o que a função de permissão já filtrou.

Esse desenho é intencionalmente "RLS-ready": o projeto não tem banco de dados hoje (é Context API + AsyncStorage), mas cada função em `permissions.ts` foi pensada para virar uma política de RLS real no Postgres/Supabase na Fase 2, sem redesenhar a lógica de autorização — só trocar "onde" ela roda. A documentação de como cada regra se traduziria em SQL/RLS (`docs/rls-supabase.md`) ainda está pendente.

**Status da integração por tela:** `Equipes` e `Kanban` já filtram dados e escondem ações conforme o papel. Dashboard reduzido para Operador de Campo, e o gating de Parâmetros do Sistema/Gestão de Usuários (só Admin), estão em implementação.

---

## O que está pronto

| Área | Status |
|---|---|
| **Login** | Validação contra `UsuariosContext` (real, com CRUD — não mais um array estático) |
| **Controle de acesso (RBAC)** | 3 papéis (Admin/Gestor/Operador de Campo); Equipes e Kanban já filtram dados e ações por papel; demais telas em implementação |
| **Equipes** | CRUD completo, filtros, paginação (7/página), sincronizado com Kanban, visível conforme papel |
| **Kanban de vegetação** | 4 colunas por severidade (Sem Ocorrência 0–9cm, Leve 10–19cm, Grave 20–29cm, Crítico ≥30cm — faixas calibradas para que "Crítico" comece no limite geral de poda do Anexo 06/ARTESP), drag-and-drop (mouse e toque, via `PanResponder`), CRUD de itens, sincronizado com Equipes, visível conforme papel |
| **Ocorrências** | Fluxo completo fechado: criar → salvar → listar → ver detalhe → avançar status (persistido via `OcorrenciasContext`) |
| **Dashboard operacional** | KPIs (trechos críticos, equipes em campo, % SLA, tempo médio de resposta), gráfico de tendência e donut de severidade (`react-native-svg`), ranking de priorização por score, histórico com seed de demonstração + gravação real diária (`HistoricoContext`) |
| **Notificações** | Sino global, badge, painel, histórico, geradas por CRUD |
| **Configurações** | Perfil, Preferências, Notificações, Gestão de Usuários (CRUD real, ligado ao login), Parâmetros do Sistema (pesos de criticidade), Integrações, Dados do Sistema — com persistência e toasts |

## O que está incompleto / é a próxima prioridade

- **RBAC nas telas restantes:** Dashboard ainda não tem a versão reduzida para Operador de Campo; "Parâmetros do Sistema" e "Gestão de Usuários" ainda não estão restritas só a Admin; criação de Ocorrência ainda não está restrita a Admin/Gestor; itens de sidebar sem tela real (Trechos, Planejamento, Relatórios) ainda não são escondidos por papel.
- **"Tempo médio de resposta" (KPI do Dashboard):** sempre mostra "—" hoje — o cálculo exige saber quando um trecho *entrou* na severidade atual, e o modelo de dados só guarda snapshots diários agregados, não um log de transição por trecho. Documentado em `utils/dashboardMetrics.ts`.
- **Drag-and-drop do Kanban em touch:** já foi reescrito para usar `PanResponder` (compatível com mouse e toque) em vez das APIs de mouse do DOM — pendente apenas de confirmação de teste manual em dispositivo real via Expo Go.
- **Dados mockados de Ocorrências** descrevem cenários de fábrica (vazamento de óleo, EPI, prensa hidráulica) em vez de cenários rodoviários/vegetação — desalinhados com o domínio do projeto.
- **Achado de acessibilidade (paleta de severidade):** as cores de severidade do Kanban (reaproveitadas no Dashboard) falham no validador de contraste para daltonismo — Crítico (vermelho) e Leve (verde) são difíceis de distinguir sob deuteranopia. Mitigado com texto/número sempre visível junto da cor, mas a paleta em si não foi alterada (decisão de identidade visual do app, fora do escopo até agora).

---

## Fluxo de persistência (Ocorrências)

A persistência de Ocorrências é ponta a ponta e sobrevive a fechar/reabrir o app:

1. **Criar** — na tela Ocorrências, botão "Nova Ocorrência" abre um modal de cadastro. Ao salvar, `OcorrenciasScreen` chama `adicionarOcorrencia()` do `OcorrenciasContext`, que delega para `adicionarOcorrenciaService()` em `src/services/ocorrenciasService.ts`. O service gera o `id`, grava a lista inteira no `AsyncStorage` (chave `@motiva:ocorrencias`) e retorna o `id` novo.
2. **Listar** — depois de salvar, o Context recarrega a lista com `listarOcorrencias()` (lida do `AsyncStorage`) e atualiza o estado (`useState<Ocorrencia[]>`) — a tela de lista re-renderiza automaticamente com o item novo, sem precisar reiniciar o app.
3. **Ver detalhe** — ao tocar em um card, `OcorrenciasScreen` navega para `DetalheScreen` passando a ocorrência; a tela também busca a versão mais atual via `buscarPorId()` do Context, garantindo que o detalhe reflita qualquer atualização já persistida.
4. **Reabrir o app** — no boot, `OcorrenciasProvider` roda `carregarOcorrencias()` em um `useEffect`, que lê do `AsyncStorage` e usa isso (não o mock) como fonte de dados sempre que já existir algo salvo. O mock (`mockOcorrencias`) só é usado como seed na primeira execução, quando ainda não há nada gravado.

O mesmo padrão (Context + service/`AsyncStorage`, mock só como seed inicial) é usado também em `EquipesContext` e `KanbanContext`.

---

## Bugs conhecidos

1. ~~Botão de configurações morto no Kanban~~ — **corrigido.** `KanbanScreen.tsx` agora usa o mesmo `AppHeader` das outras telas, com a engrenagem navegando para Configurações.
2. **Dados mockados de Ocorrências fora do domínio** — cenários de fábrica em vez de rodovia/vegetação.
3. *(A validar)* possível bug de validação assíncrona em `ParametrosSistemaSection.salvar()` e duplicação de wrapper no ícone de câmera de `PerfilSection` — reportados pela equipe, ainda não reproduzidos na leitura estática do código atual.

---

## Navegação

```
Login
  └── Dashboard ──┬── Equipes ──┬── Kanban
                  ├── Kanban    └── Ocorrencias ── Detalhe
                  └── Ocorrencias
       (Dashboard, Equipes, Kanban e Ocorrencias também acessam Configuracoes)
```

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Expo SDK | 56 | Plataforma base |
| React Native | 0.85 | Framework UI |
| React | 19.2 | Runtime |
| TypeScript | 6.x | Tipagem estática |
| React Navigation | 7.x | Navegação (Stack) |
| React Context API | — | Estado global |
| AsyncStorage | — | Persistência local |
| Expo Vector Icons | — | Ícones (Ionicons, MaterialIcons) |
| React Native Web | — | Suporte a navegador |
| react-native-svg | 15.x | Gráficos do Dashboard (donut, tendência) — sem lib de charting externa |

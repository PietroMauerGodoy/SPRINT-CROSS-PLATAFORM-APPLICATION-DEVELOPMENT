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
- **Sprint atual:** Sprint 3 — foco em MVP funcional
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
| Login | Senha | Nome | Papel | Escopo de acesso |
|---|---|---|---|---|
| `admin` | `123456` | Admin Motiva | Admin | Acesso total ao app, incluindo **Parâmetros do Sistema** e **Gestão de Usuários** |
| `joao` | `123456` | João Silva | Gestor | Acesso operacional completo — todas as equipes, todos os trechos do Kanban, todas as Ocorrências, Dashboard completo, **Gestão de Usuários** (pode atribuir/trocar a equipe de um Operador de Campo). Sem acesso a Parâmetros do Sistema (só Admin) |
| `maria` | `123456` | Maria Santos | Operador de Campo | Só enxerga a **Equipe Alfa** (`#01`) e os trechos do Kanban vinculados a ela (`equipeId: '#01'`) |
| `carlos` | `123456` | Carlos Oliveira | Operador de Campo | Só enxerga a **Equipe Beta** (`#02`) e os trechos do Kanban vinculados a ela (`equipeId: '#02'`) |

Contas ficam definidas em `src/data/mockData.ts` (`mockUsuarios`) e podem ser criadas/editadas de verdade em **Configurações → Gestão de Usuários** (seção visível para Admin e Gestor) — o que for cadastrado ali passa a valer como login imediatamente, porque a tela opera sobre o `UsuariosContext` real (não é mock decorativo).

> Se você alterar `mockUsuarios` no código e um login antigo continuar "colado", é porque já existe uma lista salva em `AsyncStorage` no seu navegador/dispositivo (a mesma lógica de seed usada em `EquipesContext`/`KanbanContext`: só usa o mock se não houver nada salvo ainda). As chaves de armazenamento (`@motiva:usuarios:v2`, `@motiva:usuarioLogado:v2`) já foram versionadas uma vez por esse motivo — se voltar a acontecer, suba a versão da chave de novo em `UsuariosContext.tsx`/`AuthContext.tsx`.

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

| Recurso | Admin | Gestor | Operador de Campo |
|---|---|---|---|
| Equipes — visualizar | Todas | Todas | Só a própria (`equipeId`) |
| Equipes — criar/editar/excluir | Sim | Sim | Não |
| Kanban — visualizar | Todos os trechos | Todos os trechos | Só trechos da própria equipe |
| Kanban — mover card / registrar serviço | Qualquer trecho | Qualquer trecho | Só trechos da própria equipe |
| Kanban — criar/excluir item | Sim | Sim | Não |
| Ocorrências — visualizar | Todas | Todas | Todas (sem filtro por equipe ainda — ver limitações) |
| Ocorrências — criar | Sim | Sim | Não |
| Dashboard | Completo (todas as equipes/trechos + tendência histórica) | Completo | Reduzido — só dados da própria equipe; sem gráfico de tendência (histórico é agregado da malha toda, não por equipe) |
| Config → Parâmetros do Sistema | Sim | Não | Não |
| Config → Gestão de Usuários | Sim | Sim (pode atribuir/trocar a equipe de um Operador de Campo) | Não |
| Sidebar — Trechos | Visível (sem tela própria ainda) | Visível | Visível |
| Sidebar — Planejamento / Relatórios | Visível (sem tela própria ainda) | Visível | Oculto |

A autorização é centralizada em `src/utils/permissions.ts` — funções puras (`getEquipesVisiveis`, `getKanbanItemsVisiveis`, `podeGerenciarEquipes`, `podeAcessarParametrosSistema`, `podeGerenciarUsuarios`, `podeVerDashboardCompleto`, etc.) que recebem o `Usuario` logado e devolvem o que ele pode ver/fazer. **Nenhuma tela decide isso sozinha com `if (papel === ...)` espalhado no JSX** — a tela só renderiza o que a função de permissão já filtrou.

Esse desenho é intencionalmente "RLS-ready": o projeto não tem banco de dados hoje (é Context API + AsyncStorage), mas cada função em `permissions.ts` foi pensada para virar uma política de RLS real no Postgres/Supabase na Fase 2, sem redesenhar a lógica de autorização — só trocar "onde" ela roda. Ver [`docs/rls-supabase.md`](docs/rls-supabase.md) para o SQL comentado de cada regra (referência, não executável ainda).

**Limitação conhecida:** Ocorrências não têm vínculo com equipe/trecho no modelo de dados hoje (só `local: string` livre), então não são filtradas por papel — todo mundo com acesso à tela vê todas.

---

## O que está pronto

| Área | Status |
|---|---|
| **Login** | Validação contra `UsuariosContext` (real, com CRUD — não mais um array estático); `AppNavigator` só monta a pilha autenticada quando há sessão — sem guard solto por tela |
| **Controle de acesso (RBAC)** | 3 papéis (Admin/Gestor/Operador de Campo); Equipes, Kanban, Dashboard, Ocorrências, Configurações e a sidebar das 5 telas filtram dados/ações/menu por papel; documentação de RLS futura em [`docs/rls-supabase.md`](docs/rls-supabase.md) |
| **Equipes** | CRUD completo, filtros, paginação (7/página), sincronizado com Kanban, visível conforme papel |
| **Kanban de vegetação** | 4 colunas por severidade (Sem Ocorrência 0–9cm, Leve 10–19cm, Grave 20–29cm, Crítico ≥30cm — faixas calibradas para que "Crítico" comece no limite geral de poda do Anexo 06/ARTESP), drag-and-drop (mouse e toque, via `PanResponder`), CRUD de itens, sincronizado com Equipes, visível conforme papel |
| **Ocorrências** | Fluxo completo fechado: criar → salvar → listar → ver detalhe → avançar status (persistido via `OcorrenciasContext`) |
| **Dashboard operacional** | KPIs (trechos críticos, equipes em campo, % SLA, tempo médio de resposta), gráfico de tendência e donut de severidade (`react-native-svg`), ranking de priorização por score, histórico com seed de demonstração + gravação real diária (`HistoricoContext`) |
| **Notificações** | Sino global, badge, painel, histórico, geradas por CRUD |
| **Configurações** | Perfil (nome/e-mail/senha/foto — foto por usuário via `Usuario.avatar`), Preferências, Notificações (2 toggles reais), Gestão de Usuários (CRUD real, ligado ao login — testado criando conta de cada papel e validando o RBAC), Parâmetros do Sistema (pesos de criticidade), Integrações, Dados do Sistema — com persistência e toasts |

## O que está incompleto / é a próxima prioridade

- **"Tempo médio de resposta" (KPI do Dashboard):** sempre mostra "—" hoje — o cálculo exige saber quando um trecho *entrou* na severidade atual, e o modelo de dados só guarda snapshots diários agregados, não um log de transição por trecho. Documentado em `utils/dashboardMetrics.ts`.
- **Drag-and-drop do Kanban em touch:** já foi reescrito para usar `PanResponder` (compatível com mouse e toque) em vez das APIs de mouse do DOM — pendente apenas de confirmação de teste manual em dispositivo real via Expo Go.
- **Dados mockados de Ocorrências** descrevem cenários de fábrica (vazamento de óleo, EPI, prensa hidráulica) em vez de cenários rodoviários/vegetação — desalinhados com o domínio do projeto.
- **Achado de acessibilidade (paleta de severidade):** as cores de severidade do Kanban (reaproveitadas no Dashboard) falham no validador de contraste para daltonismo — Crítico (vermelho) e Leve (verde) são difíceis de distinguir sob deuteranopia. Mitigado com texto/número sempre visível junto da cor, mas a paleta em si não foi alterada (decisão de identidade visual do app, fora do escopo até agora).
- **Seletor de idioma decorativo:** `Configurações → Preferências → Idioma` salva o valor escolhido, mas não existe nenhuma lib de i18n no projeto — nada na tela é traduzido de fato.
- **"Modo compacto" só afeta a tabela de Equipes** — Kanban, Ocorrências e outras listas ainda não reagem a essa preferência.
- **`ocorrenciasService` não tem exclusão** — CRUD hoje é só criar/listar/atualizar.

De 5 toggles que existiam em `Configurações → Notificações`, só 2 tinham função real (`Nova ocorrência crítica` e, após correção nesta sessão, `Mudança de status de equipe`); os outros 3 (`Prazo de trecho vencendo`, `Relatório semanal disponível`, `Receber também por e-mail`) foram escondidos por não terem nenhuma feature real por trás (não existe sistema de prazo de trecho, geração de relatório semanal, nem envio de e-mail no app hoje).

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
2. ~~Sem guard de autenticação no navigator~~ — **corrigido.** `AppNavigator.tsx` só registra as rotas autenticadas quando existe um `usuario` logado; sem sessão, só a rota `Login` existe na pilha (nem por navegação programática dá pra alcançar as outras). Antes, todas as telas ficavam sempre registradas e cada tela fazia `navigation.replace('Login')` manualmente no logout.
3. ~~Colisão de ID em criações rápidas~~ — **corrigido.** `ocorrenciasService`, `ConfiguracoesContext` (log de atividades) e `NotificacoesContext` geravam IDs só com `Date.now()`, que colide sob chamadas síncronas rápidas. Agora usam `gerarId()` (`src/utils/id.ts`), um contador monotônico — testado com 500 mil chamadas em loop apertado, zero colisões.
4. ~~Foto de perfil compartilhada entre contas~~ — **corrigido.** A foto ficava num estado global (`ConfiguracoesContext`), então trocar a foto de um usuário trocava a de todo mundo logado naquele navegador. Movida para `Usuario.avatar`, por conta.
5. ~~Toggle verde em vez de roxo~~ — **corrigido.** O `Switch` nativo do React Native não respeita `trackColor` de forma confiável no `react-native-web` (cai no estilo padrão do navegador). `Toggle.tsx` foi reescrito como componente próprio.
6. **Dados mockados de Ocorrências fora do domínio** — cenários de fábrica em vez de rodovia/vegetação; o tipo `Ocorrencia` também usa vocabulário genérico (`local`/`categoria`/`risco`) em vez de `trecho`/`km`/`severidade` como `Equipe`/`KanbanItem`.
7. *(Validado, não reproduzido)* possível bug de validação assíncrona em `ParametrosSistemaSection.salvar()` — testado ao vivo (campo vazio → bloqueia salvar com toast de erro; corrigido → salva com sucesso). A função é inteiramente síncrona, sem `async`/`await`. Não reproduzido.

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

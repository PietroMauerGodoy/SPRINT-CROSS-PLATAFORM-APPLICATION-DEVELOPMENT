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

Os trechos mockados usam rodovias **realmente administradas pela Motiva** (não inventadas): **BR-116** (Via Dutra, concessão RioSP), **BR-381** (Fernão Dias) e **SP-330** (Anhanguera, Sistema Motiva Autoban) — ver [Rodovias representadas](#rodovias-representadas).

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
# Web (recomendado para desenvolvimento — é onde o mapa da aba Trechos funciona)
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
- **Projeto unificado:** mesma base de código serve Web (`react-native-web`) e Mobile — não há dois projetos separados. Diferenças de plataforma são tratadas via `Platform.OS` pontualmente (ex: upload de avatar em `PerfilSection.tsx`) e via resolução de arquivo por plataforma do Metro/Expo (`Componente.web.tsx` vs `Componente.tsx`, usado no mapa da aba Trechos — ver [APIs externas](#apis-externas-integradas)).
- **Dados de cadastro (equipes, kanban, ocorrências, usuários) são mockados** em `src/data/mockData.ts`, sem backend próprio. **Clima e geolocalização, porém, vêm de APIs públicas reais** (ver seção abaixo) — não são mais mockados. Estado persistido localmente via `@react-native-async-storage/async-storage` (funciona offline; o clima e o mapa exigem internet).

### Estrutura de pastas
```
src/
├── screens/         # Login, Dashboard, Equipes, Kanban, Ocorrencias, Detalhe, Trechos, Configuracoes
├── components/
│   ├── dashboard/   # KpiCard, SeveridadeDonutChart, CriticidadeTrendChart, RankingTrechosList
│   ├── configuracoes/ # PerfilSection, UsuariosSection, ParametrosSistemaSection, WeightSlider, Toggle, etc.
│   └── trechos/     # TrechoMapa.web.tsx (Leaflet) / TrechoMapa.tsx (fallback nativo)
├── context/         # AuthContext, UsuariosContext, EquipesContext, KanbanContext,
│                    # HistoricoContext, NotificacoesContext, ConfiguracoesContext, OcorrenciasContext
├── utils/           # permissions.ts (autorização), dashboardMetrics.ts (score de criticidade),
│                    # geo.ts (coordenadas dos trechos), id.ts (geração de ID sem colisão)
├── hooks/           # useDashboardMetrics.ts
├── services/        # ocorrenciasService.ts (persistência), geocodingService.ts (Nominatim),
│                    # climaService.ts (Open-Meteo)
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
| Ocorrências — criar/editar/excluir | Sim | Sim | Não |
| Dashboard | Completo (todas as equipes/trechos + tendência histórica) | Completo | Reduzido — só dados da própria equipe; sem gráfico de tendência (histórico é agregado da malha toda, não por equipe) |
| Trechos (mapa + clima) | Todos os trechos | Todos os trechos | Todos os trechos (ainda sem filtro por equipe — mesma limitação do Kanban/Ocorrências) |
| Config → Parâmetros do Sistema | Sim | Não | Não |
| Config → Gestão de Usuários | Sim | Sim (pode atribuir/trocar a equipe de um Operador de Campo) | Não |
| Sidebar — Planejamento / Relatórios | Visível (sem tela própria ainda) | Visível | Oculto |

A autorização é centralizada em `src/utils/permissions.ts` — funções puras (`getEquipesVisiveis`, `getKanbanItemsVisiveis`, `podeGerenciarEquipes`, `podeAcessarParametrosSistema`, `podeGerenciarUsuarios`, `podeVerDashboardCompleto`, `podeCriarOuExcluirOcorrencia`, etc.) que recebem o `Usuario` logado e devolvem o que ele pode ver/fazer. **Nenhuma tela decide isso sozinha com `if (papel === ...)` espalhado no JSX** — a tela só renderiza o que a função de permissão já filtrou.

Esse desenho é intencionalmente "RLS-ready": o projeto não tem banco de dados hoje (é Context API + AsyncStorage), mas cada função em `permissions.ts` foi pensada para virar uma política de RLS real no Postgres/Supabase na Fase 2, sem redesenhar a lógica de autorização — só trocar "onde" ela roda. Ver [`docs/rls-supabase.md`](docs/rls-supabase.md) para o SQL comentado de cada regra (referência, não executável ainda).

**Limitação conhecida:** Ocorrências têm vínculo real com um trecho do Kanban (`kanbanItemId`, ver seção de domínio abaixo), mas não são filtradas por papel/equipe ainda — todo mundo com acesso à tela vê todas as ocorrências, independente da equipe dona do trecho.

---

## APIs externas integradas

Duas APIs públicas e gratuitas (sem necessidade de credencial/chave) foram integradas para tornar os dados de localização e clima da aba **Trechos** reais, em vez de coordenadas inventadas:

### 1. Open-Meteo (clima em tempo real)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Uso no app:** `src/services/climaService.ts` — `buscarClimaAtual(lat, lon)` busca temperatura, precipitação, vento, umidade e código de condição climática (padrão WMO) para a coordenada de cada trecho; `descreverTempo(codigo)` traduz o código WMO para um rótulo em português ("Céu limpo", "Chuva moderada" etc.).
- **Onde aparece:** painel lateral da tela **Trechos**, ao selecionar um trecho no mapa ou na lista — seção "Clima agora".
- Sem chave de API, sem custo, sem limite de uso agressivo — por isso foi escolhida no lugar de serviços pagos (ex: OpenWeather com plano gratuito limitado).

### 2. Nominatim / OpenStreetMap (geocodificação)
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Uso no app:** `src/services/geocodingService.ts` — `geocodificarRodovia(rodovia)` resolve o nome de uma rodovia para uma coordenada real (lat/lon), com cache em memória para não repetir requisições.
- **Onde aparece:** `src/utils/geo.ts` usa essas coordenadas como ponto-base de cada rodovia (`BASE_ROTA`) e desloca cada trecho a partir dela conforme o km inicial (`coordenadasAproximadas`). As 3 rodovias do mock (BR-116, BR-381, SP-330) já têm coordenadas reais fixas, geocodificadas uma vez; `corrigirComGeocodingSeNecessario()` existe para geocodificar **rodovias novas** que ainda não estão no `BASE_ROTA`, de forma assíncrona, sem travar a criação do item — hoje é chamado a partir do fluxo de criar/editar item em `EquipesScreen.tsx`/`KanbanScreen.tsx`.
- **Limitação real da API:** Nominatim resolve **nome de lugar**, não "rodovia + km exato" — uma rodovia de centenas de km retorna um único ponto onde o OpenStreetMap identificou aquele nome (por isso as buscas usam qualificadores de cidade, ex: `"Rodovia Anhanguera, Jundiaí, São Paulo, Brazil"`, para cair perto da região metropolitana de SP em vez de um ponto aleatório ao longo da rodovia). Para precisão de "km exato do trecho" seria necessário uma base de dados rodoviária real como o **SNV do DNIT**, fora do escopo atual.
- Respeita a política de uso da Nominatim (User-Agent identificando o projeto, sem paralelizar requisições agressivamente).

### Mapa (Leaflet + OpenStreetMap, sem API paga)
A visualização de mapa da aba Trechos usa **Leaflet** (`react-leaflet`) com tiles do **OpenStreetMap**, ambos gratuitos e sem chave — em vez de Google Maps Platform (que exige cartão de crédito e cobra acima do free tier). Como Leaflet depende do DOM do navegador, o componente só existe na versão Web: `src/components/trechos/TrechoMapa.web.tsx` (mapa real, com um marcador colorido por severidade em cada trecho) e `src/components/trechos/TrechoMapa.tsx` (fallback nativo, mostra uma mensagem já que a versão mobile do mapa ainda não foi implementada). O Metro/Expo escolhe automaticamente o arquivo certo por plataforma (convenção `.web.tsx`).

---

## Score de criticidade (Dashboard e ranking de priorização)

O score que prioriza trechos no Dashboard (`utils/dashboardMetrics.ts` → `scorePriorizacao`) é uma **média ponderada real**, não mais decorativa:

```
score = pesoManutencao   × fatorManutencao(dias desde o último serviço)
      + pesoClima        × FATOR_CLIMA_NEUTRO (placeholder fixo, ver limitação abaixo)
      + pesoCrescimento  × FATOR_CRESCIMENTO_SEVERIDADE (0–100, conforme severidade atual do trecho)
```

Os três pesos (`pesoManutencao`, `pesoClima`, `pesoCrescimento`) vêm dos **sliders de Parâmetros do Sistema** (`Configurações → Parâmetros do Sistema`, só Admin) — antes eram puramente visuais, agora alimentam de verdade o cálculo via `useDashboardMetrics.ts` → `useConfiguracoes()`. Mudar um peso e voltar ao Dashboard reordena o ranking de priorização na hora.

**Limitação atual:** o fator de clima (`FATOR_CLIMA_NEUTRO`) ainda é um valor neutro fixo (50), documentado no código — o app já busca clima real via Open-Meteo (ver acima) para exibição na aba Trechos, mas essa leitura **ainda não foi conectada** ao cálculo do score. Ligar as duas coisas (chuva/temperatura real influenciando o score de criticidade do trecho) é a evolução natural, mas não foi pedida/feita ainda.

---

## Domínio: Ocorrências ↔ Trechos (Kanban)

Cada `Ocorrencia` tem `kanbanItemId`, uma referência real para um `KanbanItem` (`trecho`) — não mais um campo de texto livre (`local: string`). Isso significa que:

- Ao criar/editar uma ocorrência, o formulário mostra os trechos reais como opções (chips com rodovia + km + equipe), em vez de um campo de texto digitado à mão.
- O card de ocorrência (`OcorrenciaCard.tsx`) e a tela de detalhe (`DetalheScreen.tsx`) resolvem o trecho vinculado (`useKanban()` + `find`) para mostrar rodovia, km e equipe responsável.
- A exportação CSV (`IntegracoesSection.tsx`) deriva a coluna de local a partir do trecho vinculado, não de um campo solto.

Os dados mockados de Ocorrências também foram realinhados ao domínio do projeto — cenários de vegetação/rodovia (ex: "Vegetação encobrindo placa de sinalização", "Galho caído sobre o acostamento", "Erosão na margem próxima à drenagem") em vez dos cenários de fábrica que existiam antes (vazamento de óleo, EPI, prensa hidráulica).

### Rodovias representadas
Os 10 trechos mockados (`K01`–`K10`) usam 3 rodovias **confirmadas como administradas pela Motiva**:
- **BR-116** (Via Dutra — concessão RioSP)
- **BR-381** (Fernão Dias)
- **SP-330** (Anhanguera — Sistema Motiva Autoban)

> Uma versão anterior usava `SP-280` (Rodovia Castelo Branco) por engano — essa rodovia pertence a outra concessionária (ViaOeste), não à Motiva, e foi substituída por SP-330.

---

## O que está pronto

| Área | Status |
|---|---|
| **Login** | Validação contra `UsuariosContext` (real, com CRUD — não mais um array estático); `AppNavigator` só monta a pilha autenticada quando há sessão — sem guard solto por tela |
| **Controle de acesso (RBAC)** | 3 papéis (Admin/Gestor/Operador de Campo); Equipes, Kanban, Dashboard, Ocorrências, Trechos, Configurações e a sidebar de todas as telas filtram dados/ações/menu por papel; documentação de RLS futura em [`docs/rls-supabase.md`](docs/rls-supabase.md) |
| **Equipes** | CRUD completo, filtros, paginação (7/página), sincronizado com Kanban, visível conforme papel |
| **Kanban de vegetação** | 4 colunas por severidade (Sem Ocorrência 0–9cm, Leve 10–19cm, Grave 20–29cm, Crítico ≥30cm — faixas calibradas para que "Crítico" comece no limite geral de poda do Anexo 06/ARTESP), drag-and-drop (mouse e toque, via `PanResponder`), CRUD de itens, sincronizado com Equipes, visível conforme papel |
| **Ocorrências** | CRUD completo (criar, listar, ver detalhe, **editar**, **excluir**), paginação (7/página), vínculo real com trecho (`kanbanItemId`), tudo persistido via `OcorrenciasContext` |
| **Trechos (novo)** | Aba com mapa real (Leaflet/OpenStreetMap) mostrando todos os trechos coloridos por severidade, busca/filtro por rodovia, painel lateral com clima em tempo real (Open-Meteo) do trecho selecionado, coordenadas geocodificadas de verdade (Nominatim) |
| **Dashboard operacional** | KPIs (trechos críticos, equipes em campo, % SLA, tempo médio de resposta), gráfico de tendência e donut de severidade (`react-native-svg`), **ranking de priorização com score de criticidade real** (ponderado pelos sliders de Parâmetros do Sistema), histórico com seed de demonstração + gravação real diária (`HistoricoContext`) |
| **Notificações** | Sino global, badge, painel, histórico, geradas por CRUD |
| **Configurações** | Perfil (nome/e-mail/senha/foto — foto por usuário via `Usuario.avatar`), Preferências, Notificações (2 toggles reais), Gestão de Usuários (CRUD real, ligado ao login — testado criando conta de cada papel e validando o RBAC), **Parâmetros do Sistema (pesos de criticidade conectados de verdade ao score do Dashboard)**, Integrações, Dados do Sistema — com persistência e toasts |

## O que está incompleto / é a próxima prioridade

- **Fator de clima do score de criticidade ainda é neutro/fixo** (`FATOR_CLIMA_NEUTRO = 50`) — o app já busca clima real via Open-Meteo (aba Trechos), mas essa leitura ainda não influencia o cálculo do score no Dashboard. Ver [Score de criticidade](#score-de-criticidade-dashboard-e-ranking-de-priorização).
- **"Tempo médio de resposta" (KPI do Dashboard):** sempre mostra "—" hoje — o cálculo exige saber quando um trecho *entrou* na severidade atual, e o modelo de dados só guarda snapshots diários agregados, não um log de transição por trecho. Documentado em `utils/dashboardMetrics.ts`.
- **Drag-and-drop do Kanban em touch:** já foi reescrito para usar `PanResponder` (compatível com mouse e toque) em vez das APIs de mouse do DOM — pendente apenas de confirmação de teste manual em dispositivo real via Expo Go.
- **Mapa da aba Trechos só existe na versão Web** — na versão mobile (Expo Go/build nativo) aparece uma mensagem informativa em vez do mapa, já que o Leaflet depende do DOM do navegador; um mapa nativo (ex: `react-native-maps`) ainda não foi implementado.
- **Geocodificação de rodovia nova não é alcançável pela UI hoje:** `corrigirComGeocodingSeNecessario()` (Nominatim) já existe e funciona, mas tanto `EquipesScreen` quanto `KanbanScreen` só oferecem uma lista fixa de rodovias (chips) na criação/edição — não há campo de texto livre para digitar uma rodovia nova, então esse caminho fica pronto mas não é testável pela interface ainda.
- **Achado de acessibilidade (paleta de severidade):** as cores de severidade do Kanban (reaproveitadas no Dashboard) falham no validador de contraste para daltonismo — Crítico (vermelho) e Leve (verde) são difíceis de distinguir sob deuteranopia. Mitigado com texto/número sempre visível junto da cor, mas a paleta em si não foi alterada (decisão de identidade visual do app, fora do escopo até agora).
- **Seletor de idioma decorativo:** `Configurações → Preferências → Idioma` salva o valor escolhido, mas não existe nenhuma lib de i18n no projeto — nada na tela é traduzido de fato.
- **"Modo compacto" só afeta a tabela de Equipes** — Kanban, Ocorrências e outras listas ainda não reagem a essa preferência.
- **Ocorrências não são filtradas por equipe/papel** — mesmo com o vínculo real a um trecho (`kanbanItemId`), a tela ainda mostra todas as ocorrências para qualquer papel com acesso, sem restringir por equipe como já acontece em Equipes/Kanban.

De 5 toggles que existiam em `Configurações → Notificações`, só 2 tinham função real (`Nova ocorrência crítica` e `Mudança de status de equipe`); os outros 3 (`Prazo de trecho vencendo`, `Relatório semanal disponível`, `Receber também por e-mail`) foram escondidos por não terem nenhuma feature real por trás (não existe sistema de prazo de trecho, geração de relatório semanal, nem envio de e-mail no app hoje).

---

## Fluxo de persistência (Ocorrências)

A persistência de Ocorrências é ponta a ponta e sobrevive a fechar/reabrir o app:

1. **Criar** — na tela Ocorrências, botão "Nova Ocorrência" abre um modal de cadastro (com chips de trecho real em vez de texto livre). Ao salvar, `OcorrenciasScreen` chama `adicionarOcorrencia()` do `OcorrenciasContext`, que delega para `adicionarOcorrenciaService()` em `src/services/ocorrenciasService.ts`. O service gera o `id` (via `gerarId()`, contador monotônico — ver Bugs conhecidos), grava a lista inteira no `AsyncStorage` (chave `@motiva:ocorrencias`) e retorna o `id` novo.
2. **Listar** — depois de salvar, o Context recarrega a lista com `listarOcorrencias()` (lida do `AsyncStorage`) e atualiza o estado (`useState<Ocorrencia[]>`) — a tela de lista re-renderiza automaticamente com o item novo, sem precisar reiniciar o app. A lista é paginada (7 itens/página).
3. **Ver detalhe** — ao tocar em um card, `OcorrenciasScreen` navega para `DetalheScreen` passando a ocorrência; a tela também busca a versão mais atual via `buscarPorId()` do Context, garantindo que o detalhe reflita qualquer atualização já persistida. A partir daqui dá pra **editar** (reabre o mesmo formulário de criação, pré-preenchido) ou **excluir** (com modal de confirmação, restrito a quem tem permissão via `podeCriarOuExcluirOcorrencia`).
4. **Reabrir o app** — no boot, `OcorrenciasProvider` roda `carregarOcorrencias()` em um `useEffect`, que lê do `AsyncStorage` e usa isso (não o mock) como fonte de dados sempre que já existir algo salvo. O mock (`mockOcorrencias`) só é usado como seed na primeira execução, quando ainda não há nada gravado.

O mesmo padrão (Context + service/`AsyncStorage`, mock só como seed inicial) é usado também em `EquipesContext` e `KanbanContext`. O `KanbanContext` tem uma camada extra de proteção: uma função de migração (`comCoordenadas()`) roda no carregamento e corrige/completa `lat`/`lon` ausentes ou inválidos em dados salvos antes da introdução das coordenadas geográficas — sem isso, dados antigos no `AsyncStorage` quebrariam o mapa da aba Trechos (ver Bugs conhecidos).

---

## Bugs conhecidos

1. ~~Botão de configurações morto no Kanban~~ — **corrigido.** `KanbanScreen.tsx` agora usa o mesmo `AppHeader` das outras telas, com a engrenagem navegando para Configurações.
2. ~~Sem guard de autenticação no navigator~~ — **corrigido.** `AppNavigator.tsx` só registra as rotas autenticadas quando existe um `usuario` logado; sem sessão, só a rota `Login` existe na pilha (nem por navegação programática dá pra alcançar as outras). Antes, todas as telas ficavam sempre registradas e cada tela fazia `navigation.replace('Login')` manualmente no logout.
3. ~~Colisão de ID em criações rápidas~~ — **corrigido.** `ocorrenciasService`, `ConfiguracoesContext` (log de atividades) e `NotificacoesContext` geravam IDs só com `Date.now()`, que colide sob chamadas síncronas rápidas. Agora usam `gerarId()` (`src/utils/id.ts`), um contador monotônico — testado com 500 mil chamadas em loop apertado, zero colisões.
4. ~~Foto de perfil compartilhada entre contas~~ — **corrigido.** A foto ficava num estado global (`ConfiguracoesContext`), então trocar a foto de um usuário trocava a de todo mundo logado naquele navegador. Movida para `Usuario.avatar`, por conta.
5. ~~Toggle verde em vez de roxo~~ — **corrigido.** O `Switch` nativo do React Native não respeita `trackColor` de forma confiável no `react-native-web` (cai no estilo padrão do navegador). `Toggle.tsx` foi reescrito como componente próprio.
6. ~~Dados mockados de Ocorrências fora do domínio~~ — **corrigido.** Cenários reescritos para vegetação/rodovia, e o vínculo de local passou de texto livre (`local`) para referência real a um trecho (`kanbanItemId`) — ver [Domínio: Ocorrências ↔ Trechos](#domínio-ocorrências--trechos-kanban).
7. ~~Erro de console no gráfico donut do Dashboard (`transform-origin` inválido)~~ — **corrigido.** Bug real da lib `react-native-svg` (15.x) no `react-native-web`: o componente `<G rotation origin>` gera a propriedade DOM `transform-origin` (kebab-case) em vez de `transformOrigin`, disparando warning do React DOM. Removido o uso de `<G rotation>` em `SeveridadeDonutChart.tsx`; a rotação agora é calculada diretamente no `strokeDashoffset` de cada `Circle`. Verificado visualmente que o resultado é idêntico ao anterior, sem erros no console.
8. ~~Crash "Invalid LatLng object: (NaN, NaN)" ao abrir a aba Trechos~~ — **corrigido.** Dados de Kanban salvos no `AsyncStorage` antes da introdução dos campos `lat`/`lon` não tinham essas coordenadas, e o mapa quebrava ao tentar centralizar em `NaN`. Corrigido em duas camadas: migração automática no carregamento (`comCoordenadas()` em `KanbanContext.tsx`, que recalcula coordenadas ausentes/inválidas) e um filtro defensivo no próprio mapa (`TrechoMapa.web.tsx`) que ignora qualquer marcador sem coordenada válida em vez de quebrar a tela toda.
9. ~~Rodovia mockada `SP-280` não pertence à Motiva~~ — **corrigido.** `SP-280` (Castelo Branco) é uma concessão da ViaOeste, não da Motiva. Substituída por `SP-330` (Anhanguera, Sistema Motiva Autoban) em todos os trechos, filtros e coordenadas.
10. *(Validado, não reproduzido)* possível bug de validação assíncrona em `ParametrosSistemaSection.salvar()` — testado ao vivo (campo vazio → bloqueia salvar com toast de erro; corrigido → salva com sucesso). A função é inteiramente síncrona, sem `async`/`await`. Não reproduzido.

---

## Navegação

```
Login
  └── Dashboard ──┬── Equipes ──┬── Kanban
                  ├── Kanban    ├── Ocorrencias ── Detalhe
                  ├── Ocorrencias
                  └── Trechos
       (Dashboard, Equipes, Kanban, Ocorrencias e Trechos também acessam Configuracoes)
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
| Leaflet / react-leaflet | 5.x | Mapa interativo da aba Trechos (só Web), tiles do OpenStreetMap |
| Open-Meteo API | — | Clima em tempo real por trecho (gratuita, sem chave) |
| Nominatim (OpenStreetMap) | — | Geocodificação de rodovia → coordenada real (gratuita, sem chave) |

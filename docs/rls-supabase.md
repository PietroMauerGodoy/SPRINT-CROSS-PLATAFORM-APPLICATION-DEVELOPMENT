# RLS futura (Supabase/Postgres) — referência, não executável

Este documento **não é código a rodar agora**. O projeto hoje não tem banco de
dados — é Context API + `AsyncStorage`, 100% local (ver README). Este arquivo
existe só para registrar, enquanto a decisão ainda está fresca, como cada
regra de autorização em `src/utils/permissions.ts` se traduziria em uma
política de **Row Level Security** real no Postgres/Supabase quando a Fase 2
(backend/IoT) for implementada.

Cada bloco de SQL abaixo é comentado com o nome da função TypeScript
equivalente em `permissions.ts`, para rastreabilidade 1:1 — a ideia é que
migrar para banco de verdade não exija reprojetar a lógica de acesso, só
"mudar onde ela roda".

## Schema assumido (mínimo, pra dar contexto às policies)

```sql
-- Tipo do papel — mesmos 3 valores de PapelUsuario em types/index.ts
create type papel_usuario as enum ('admin', 'gestor', 'operador_campo');

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique not null,
  nome text not null,
  email text,
  papel papel_usuario not null,
  equipe_id uuid references equipes(id), -- obrigatório na prática só p/ operador_campo
  cargo text
);

create table equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  status text not null, -- 'ativo' | 'inativo' | 'em_campo'
  rodovia text not null,
  km text,
  trecho_rodovia text,
  responsavel text
);

create table kanban_itens (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid references equipes(id),
  rodovia text not null,
  km_inicio numeric,
  km_fim numeric,
  tipo_vegetacao text,
  altura_atual numeric,
  severidade text not null, -- 'sem_ocorrencia' | 'leve' | 'grave' | 'critico'
  responsavel text,
  observacao text,
  ultimo_servico_data date,
  ultimo_servico_responsavel text
);

create table ocorrencias (
  id bigint generated always as identity primary key,
  titulo text not null,
  descricao text,
  local text not null,
  risco text not null, -- 'baixo' | 'medio' | 'alto'
  categoria text not null,
  status text not null, -- 'aberta' | 'em_andamento' | 'resolvida'
  responsavel text,
  data date not null
  -- NOTA: sem equipe_id hoje (mesma limitação documentada no README) —
  -- por isso não há policy de SELECT restrita por equipe pra esta tabela
  -- ainda. Se o campo for adicionado no futuro, replicar o padrão de
  -- kanban_itens abaixo.
);

create table parametros_sistema (
  id int primary key default 1,
  peso_manutencao numeric,
  peso_clima numeric,
  peso_crescimento numeric,
  frequencia_reavaliacao int,
  limite_criticidade numeric,
  check (id = 1) -- singleton
);
```

## Funções auxiliares (equivalente a "ler o usuário logado" no app)

No app hoje, toda função de `permissions.ts` recebe `usuario: Usuario` como
parâmetro explícito (vem do `AuthContext`). No Postgres, o equivalente é
resolver o usuário a partir de `auth.uid()` (o usuário autenticado da sessão
atual do Supabase):

```sql
-- Equivalente a "usuario.papel" em permissions.ts
create or replace function current_papel() returns papel_usuario as $$
  select papel from usuarios where auth_user_id = auth.uid();
$$ language sql stable security definer;

-- Equivalente a "usuario.equipeId" em permissions.ts
create or replace function current_equipe_id() returns uuid as $$
  select equipe_id from usuarios where auth_user_id = auth.uid();
$$ language sql stable security definer;

-- Equivalente a temAcessoTotal(usuario) — admin ou gestor
create or replace function tem_acesso_total() returns boolean as $$
  select current_papel() in ('admin', 'gestor');
$$ language sql stable;
```

---

## `equipes`

```sql
alter table equipes enable row level security;

-- getEquipesVisiveis(usuario, equipes) / podeVerEquipe(usuario, equipe)
create policy "select_equipes_por_papel" on equipes
  for select
  using (
    tem_acesso_total()
    or id = current_equipe_id()
  );

-- podeGerenciarEquipes(usuario) — admin/gestor criam, editam, excluem
create policy "gerenciar_equipes_admin_gestor" on equipes
  for insert with check (tem_acesso_total());

create policy "editar_equipes_admin_gestor" on equipes
  for update using (tem_acesso_total());

create policy "excluir_equipes_admin_gestor" on equipes
  for delete using (tem_acesso_total());
```

## `kanban_itens`

```sql
alter table kanban_itens enable row level security;

-- getKanbanItemsVisiveis(usuario, itens) / podeVerKanbanItem(usuario, item)
create policy "select_kanban_por_papel" on kanban_itens
  for select
  using (
    tem_acesso_total()
    or equipe_id = current_equipe_id()
  );

-- podeEditarKanbanItem(usuario, item) — admin/gestor qualquer trecho;
-- operador_campo só o da própria equipe (mover card / registrar serviço)
create policy "editar_kanban_por_papel" on kanban_itens
  for update
  using (
    tem_acesso_total()
    or equipe_id = current_equipe_id()
  );

-- podeCriarOuExcluirKanbanItem(usuario) — só admin/gestor
create policy "criar_kanban_admin_gestor" on kanban_itens
  for insert with check (tem_acesso_total());

create policy "excluir_kanban_admin_gestor" on kanban_itens
  for delete using (tem_acesso_total());
```

## `ocorrencias`

```sql
alter table ocorrencias enable row level security;

-- Ocorrências não têm equipe_id hoje (limitação já documentada no README) —
-- por isso todo mundo com login válido pode listar todas. Isso corresponde
-- a não existir um getOcorrenciasVisiveis() em permissions.ts hoje.
create policy "select_ocorrencias_qualquer_logado" on ocorrencias
  for select using (auth.uid() is not null);

-- podeCriarOcorrencia(usuario) — só admin/gestor
create policy "criar_ocorrencias_admin_gestor" on ocorrencias
  for insert with check (tem_acesso_total());
```

## `parametros_sistema`

```sql
alter table parametros_sistema enable row level security;

-- podeAcessarParametrosSistema(usuario) — só admin, leitura e escrita
create policy "select_parametros_admin" on parametros_sistema
  for select using (current_papel() = 'admin');

create policy "editar_parametros_admin" on parametros_sistema
  for update using (current_papel() = 'admin');
```

## `usuarios`

```sql
alter table usuarios enable row level security;

-- Todo usuário autenticado lê a própria linha (equivalente a AuthContext.usuario)
create policy "select_propria_linha" on usuarios
  for select using (auth_user_id = auth.uid());

-- podeGerenciarUsuarios(usuario) — admin e gestor veem/gerenciam a lista toda
-- (ex: Gestor atribuindo equipe a um Operador de Campo)
create policy "select_usuarios_admin_gestor" on usuarios
  for select using (tem_acesso_total());

create policy "criar_usuarios_admin_gestor" on usuarios
  for insert with check (tem_acesso_total());

create policy "editar_usuarios_admin_gestor" on usuarios
  for update using (tem_acesso_total());

create policy "excluir_usuarios_admin_gestor" on usuarios
  for delete using (tem_acesso_total());
```

> **Cuidado ao implementar de verdade:** a policy `editar_usuarios_admin_gestor`
> acima, do jeito que está, deixaria um Gestor promover qualquer usuário
> (inclusive a si mesmo) a Admin — o app hoje não tem essa trava porque tudo
> roda no cliente sem essa possibilidade de escalonamento malicioso. Numa
> implementação real, adicione uma checagem extra (`with check`) impedindo
> que um Gestor grave `papel = 'admin'`, e/ou um trigger de auditoria.

---

## Dashboard — nota sobre agregações

O Dashboard não é uma tabela, é uma composição de queries sobre `equipes` e
`kanban_itens` — como essas duas tabelas já têm RLS por papel, qualquer query
de agregação (contagem de críticos, % de SLA, ranking) feita por um Operador
de Campo autenticado **automaticamente** só enxerga as linhas da própria
equipe, sem precisar de uma policy própria. Isso corresponde a
`podeVerDashboardCompleto()` no app: hoje ela existe como uma checagem
explícita porque o app filtra em memória (JS), mas com RLS de banco ela vira
redundante — o banco já filtra sozinho antes da query chegar no app.

A exceção é o histórico de tendência (`HistoricoContext`/snapshots diários),
que hoje é agregado de toda a malha, não por equipe — a mesma limitação
documentada no README se aplica igual em uma tabela `historico_snapshots`
real: seria necessário reprojetar esse snapshot para ser por equipe antes de
uma policy de RLS conseguir filtrá-lo corretamente.

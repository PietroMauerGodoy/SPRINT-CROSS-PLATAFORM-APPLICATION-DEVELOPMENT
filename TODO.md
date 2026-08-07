# TODO — Tela de Configurações (Dar vida / estado)

## Base (já concluída)
- [x] 1. Analisar a estrutura do projeto (layout, tema, componentes, padrões)
- [x] 2. Confirmar plano com o usuário
- [x] 3. Criar `src/context/ConfiguracoesContext.tsx` (estado mock de configurações)
- [x] 4–10. Criar as 7 seções visuais
- [x] 11–12. Criar tela + rota + provider
- [x] 13. Validar TypeScript

## Fase 0 — Seção 5 (Parâmetros do Sistema) — mais crítica
- [x] 14. Persistir parâmetros (pesos, frequência, limite) em localStorage no `ConfiguracoesContext`
- [x] 15. Validar lógica de reajuste proporcional dos sliders + soma reativa + toast

## Fase 1 — Seção 1 (Perfil e Conta)
- [x] 16. Validação inline (nome vazio, email regex) + erros abaixo do campo
- [x] 17. Botão "Salvar" para persistir perfil
- [x] 18. Modal real de alterar senha (min 6 chars, confirmação igual) + toast
- [x] 19. Upload de avatar com preview local (FileReader)

## Fase 2 — Seção 2 (Preferências de Interface)
- [x] 20. Dropdown de idioma funcional (array de opções)
- [x] 21. Aplicar `.compact-mode` globalmente nas tabelas das outras telas

## Fase 3 — Seção 3 (Notificações)
- [x] 22. Conectar `notifPrefs.novaOcorrenciaCritica` ao sininho (Ocorrências)

## Fase 4 — Seção 4 (Usuários e Permissões)
- [x] 23. Modal real de adicionar/editar usuário
- [x] 24. Ações Editar/Remover por linha + confirmação de remoção
- [x] 25. Validação de email duplicado

## Fase 5 — Seções 6 e 7 (Integrações + Dados/Sistema)
- [x] 26. Exportar relatório → download CSV real (Blob)
- [x] 27. Exportar backup → download JSON real (Blob)
- [x] 28. Auto-log de atividades nas ações relevantes

## Fase 6 — Validação
- [ ] 29. `npx tsc --noEmit` final

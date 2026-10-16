# Módulo de Tarefas e Ações (`modules/tasks`)

## Responsabilidade
Gerencia compromissos, tarefas acadêmicas, itens de ação e sugestões extraídas automaticamente pelo motor de inteligência artificial do SynapseNotes.

## Estrutura Interna
- `tasks.routes.ts`: Endpoints HTTP REST (`GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `POST /tasks/:id/approve`, `DELETE /tasks/:id`).
- `tasks.controller.ts`: Tratamento de requisições e respostas de tarefas.
- `tasks.service.ts`: Gestão de buckets de prioridade (`focus_today`, `upcoming`, `someday`), vinculação a notas e aprovação de sugestões.
- `tasks.repository.ts`: Operações de persistência na tabela de tarefas.
- `tasks.types.ts`: Tipagens e DTOs de criação, atualização e filtros de tarefas.
- `index.ts`: Ponto único de exportação da API pública do módulo.

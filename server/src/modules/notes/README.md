# Módulo de Notas (`modules/notes`)

## Responsabilidade
Gerencia o armazenamento, indexação, edição e categorização de anotações textuais, links e sínteses analíticas do SynapseNotes.

## Estrutura Interna
- `notes.routes.ts`: Camada HTTP pura com endpoints REST (`GET /notes`, `GET /notes/:id`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id`).
- `notes.controller.ts`: Orquestração de entrada/saída HTTP e códigos de resposta.
- `notes.service.ts`: Regras de negócio, geração de síntese via Gemini, extração de tarefas e correlação sináptica assíncrona.
- `notes.repository.ts`: Persistência das notas, tags associadas e conexões no banco de dados.
- `notes.types.ts`: Tipos, interfaces de criação/edição e contratos de dados.
- `index.ts`: Ponto único de exportação da API pública do módulo.

# Módulo de Categorias e Tags (`modules/categories`)

## Responsabilidade
Gerencia a taxonomia, categorias conceituais e tags que organizam o acervo de notas e estudos.

## Estrutura Interna
- `categories.routes.ts`: Endpoints HTTP REST (`GET /categories`, `POST /categories`, `GET /tags`, `POST /tags`).
- `categories.controller.ts`: Tratamento de requisições e respostas de categorias.
- `categories.service.ts`: Sanitização de nomes de categorias (remoção de '#' e espaços) e contagem dinâmica de notas associadas.
- `categories.repository.ts`: Persistência das tags e relacionamento com os cadernos/workspaces.
- `categories.types.ts`: Tipagens e DTOs de categorias.
- `index.ts`: Ponto único de exportação da API pública do módulo.

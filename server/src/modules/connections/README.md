# Módulo de Conexões e Ideias Relacionadas (`modules/connections`)

## Responsabilidade
Gerencia a rede sináptica de ideias, similaridade conceitual e conexões automáticas/manuais entre notas do acervo.

## Estrutura Interna
- `connections.routes.ts`: Endpoints HTTP REST (`GET /connections`, `GET /connections/graph`, `GET /connections/note/:noteId`, `POST /connections`, `POST /connections/discover/:noteId`).
- `connections.controller.ts`: Orquestração das conexões e grafo sináptico.
- `connections.service.ts`: Cálculo de similaridade conceitual, geração de grafos e descoberta orientada por Gemini.
- `connections.repository.ts`: Persistência de arestas do grafo sináptico e consultas cruzadas.
- `connections.types.ts`: Tipos do grafo, nós, arestas e DTOs de criação.
- `index.ts`: Ponto único de exportação da API pública do módulo.

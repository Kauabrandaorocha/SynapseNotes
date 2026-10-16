# Guia da API REST — SynapseNotes (`docs/api-guide.md`)

Este documento descreve detalhadamente todos os endpoints REST, contratos de entrada (payload/schemas), parâmetros de consulta (query params) e estruturas de resposta padronizadas da nova arquitetura modular do servidor.

---

## 1. Padrões Globais e Convenções

### 1.1 Base URL e Headers
- **Prefixo da API**: `/api`
- **Cabeçalhos Comuns**:
  - `Content-Type: application/json`
  - `X-Request-Id`: Identificador único de correlação gerado automaticamente pelo middleware se não fornecido pelo cliente.

### 1.2 Formato Padrão de Resposta com Sucesso
```json
{
  "success": true,
  "data": { ... }
}
```

### 1.3 Formato Padrão de Erro (`AppError`)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | RATE_LIMIT_EXCEEDED | INTERNAL_SERVER_ERROR",
    "message": "Descrição amigável e legível do erro",
    "status": 400,
    "correlationId": "req-98838ef2-...",
    "timestamp": "2026-10-15T17:30:00.000Z",
    "details": []
  }
}
```

### 1.4 Rate Limiting
- **Global**: 300 requisições / minuto por IP (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).
- **Upload de Áudio**: 30 uploads / minuto.
- **Processamento de IA**: 45 requisições analíticas / minuto.

---

## 2. Módulo de Autenticação (`/api/auth`)

### 2.1 Cadastrar Novo Usuário
- **Rota**: `POST /api/auth/register`
- **Request Body**:
```json
{
  "email": "estudante@universidade.edu.br",
  "fullName": "Alice Pesquisadora",
  "password": "senhaSegura123!"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "email": "estudante@universidade.edu.br",
      "fullName": "Alice Pesquisadora",
      "isActive": true,
      "createdAt": "2026-10-15T17:30:00.000Z"
    },
    "tokens": {
      "accessToken": "mock-token-...",
      "refreshToken": "mock-refresh-...",
      "expiresIn": "7d"
    }
  }
}
```

### 2.2 Autenticar / Login
- **Rota**: `POST /api/auth/login`
- **Request Body**:
```json
{
  "email": "estudante@universidade.edu.br",
  "password": "senhaSegura123!"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "email": "estudante@universidade.edu.br",
      "fullName": "Alice Pesquisadora",
      "isActive": true
    },
    "tokens": {
      "accessToken": "mock-token-...",
      "refreshToken": "mock-refresh-...",
      "expiresIn": "7d"
    }
  }
}
```

### 2.3 Obter Usuário Atual
- **Rota**: `GET /api/auth/me`
- **Response (200 OK)**: Retorna o objeto `user` autenticado.

---

## 3. Módulo de Notas (`/api/notes`)

### 3.1 Listar Notas
- **Rota**: `GET /api/notes`
- **Query Params**:
  - `workspaceId` (opcional): UUID do caderno/workspace (padrão: workspace do usuário).
  - `search` (opcional): Busca textual por título, conteúdo, transcrição ou síntese.
  - `tag` (opcional): Filtro por nome de tag/categoria (ex: `Genética`).
  - `sourceType` (opcional): `text` | `audio` | `link`.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "note-mock-01",
      "workspaceId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "userId": "11111111-1111-1111-1111-111111111111",
      "title": "Seminário sobre Novos Primers e Eficiência de Corte Cas9",
      "rawContent": "Gravação da reunião de alinhamento com a equipe do laboratório sobre PCR e enzimas.",
      "summary": "A reunião abordou os novos protocolos de sequenciamento Illumina...",
      "transcription": "Prof. orientador sugeriu revisar o protocolo...",
      "sourceType": "audio",
      "sourceUrl": null,
      "hasAudio": true,
      "mediaDurationSeconds": 1680,
      "complexityLevel": "high",
      "isProtected": false,
      "processingStatus": "done",
      "tags": [
        { "id": "tag-1", "name": "Genética", "notesCount": 2 }
      ],
      "tasksCount": 1,
      "createdAt": "2026-10-15T15:30:00.000Z",
      "updatedAt": "2026-10-15T17:30:00.000Z"
    }
  ]
}
```

### 3.2 Detalhes da Nota com Conexões Sinápticas
- **Rota**: `GET /api/notes/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "note": { ... },
    "relations": [
      {
        "id": "rel-mock-01",
        "targetNoteId": "note-mock-02",
        "targetNoteTitle": "Artigo Nature: Avanços em edição genética CRISPR",
        "similarityScore": 0.88,
        "reason": "Ambas as notas analisam metodologias de edição e corte com variantes de alta fidelidade Cas9.",
        "createdAt": "2026-10-15T17:30:00.000Z"
      }
    ]
  }
}
```

### 3.3 Criar Nova Nota (Texto / Link)
- **Rota**: `POST /api/notes`
- **Request Body**:
```json
{
  "title": "Fichamento: Teoria do Fato Jurídico",
  "content": "Anotações do capítulo introdutório sobre planos de existência, validade e eficácia.",
  "sourceType": "text",
  "sourceUrl": null,
  "isProtected": false,
  "tagNames": ["Direito", "Doutrina"]
}
```
- **Response (201 Created)**: Retorna a nota criada em estado inicial otimista (`processingStatus: "processing"`). A síntese, extração de tarefas e correlação conceitual ocorrem em background.

### 3.4 Atualizar Nota
- **Rota**: `PATCH /api/notes/:id`
- **Request Body** (campos opcionais):
```json
{
  "title": "Novo Título",
  "rawContent": "Novo conteúdo",
  "summary": "Síntese ajustada manualmente",
  "isProtected": true,
  "tagNames": ["Biotecnologia", "Pesquisa"]
}
```
- **Response (200 OK)**: Retorna a nota atualizada.

### 3.5 Excluir Nota
- **Rota**: `DELETE /api/notes/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Nota excluída com sucesso."
  }
}
```

---

## 4. Módulo de Áudio (`/api/audio` & `/api/notes/audio`)

### 4.1 Processar Gravação de Voz
- **Rotas**: `POST /api/notes/audio` ou `POST /api/audio/process`
- **Request Body**:
```json
{
  "title": "Gravação de Voz",
  "audioData": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8...",
  "mimeType": "audio/webm",
  "durationSeconds": 142
}
```
- **Regra de Título Limpo**: Se o campo `title` for omitido ou enviado vazio, o sistema adota estritamente `"Gravação de Voz"`, evitando datas redundantes no título (a data já consta nativamente nos metadados de criação do cabeçalho).
- **Processamento Assíncrono**:
  1. Armazena o arquivo de áudio através de `infra/storage` (`S3` ou disco local).
  2. Cria a nota com `processingStatus: "processing"`.
  3. Envia o buffer sonoro para o transcrevedor fonético (`infra/transcription`).
  4. Extrai síntese analítica, nível de complexidade e tarefas sugeridas.
  5. Atualiza a nota para `processingStatus: "done"`.
- **Response (201 Created)**: Retorna a nota recém-criada imediatamente com o identificador UUID.

---

## 5. Módulo de Tarefas e Compromissos (`/api/tasks`)

### 5.1 Listar Tarefas
- **Rota**: `GET /api/tasks`
- **Query Params**:
  - `bucket` (opcional): Filtra por bucket de prioridade: `focus_today` | `upcoming` | `someday`.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "task-mock-01",
      "noteId": "note-mock-01",
      "noteTitle": "Seminário sobre Novos Primers e Eficiência de Corte Cas9",
      "content": "Ajustar parâmetros do termociclador para novo primer",
      "isCompleted": false,
      "isSuggested": false,
      "priorityBucket": "focus_today",
      "dueDate": "2026-10-16T17:30:00.000Z",
      "createdAt": "2026-10-15T17:30:00.000Z"
    }
  ]
}
```

### 5.2 Criar Tarefa Manual
- **Rota**: `POST /api/tasks`
- **Request Body**:
```json
{
  "content": "Revisar introdução do artigo para envio à revista",
  "priorityBucket": "focus_today",
  "noteId": "note-mock-01",
  "dueDate": "2026-10-18T23:59:00.000Z"
}
```
- **Response (201 Created)**: Retorna a tarefa criada.

### 5.3 Atualizar Tarefa
- **Rota**: `PATCH /api/tasks/:id`
- **Request Body**:
```json
{
  "isCompleted": true,
  "priorityBucket": "upcoming",
  "content": "Texto editado"
}
```
- **Response (200 OK)**: Retorna a tarefa atualizada.

### 5.4 Aprovar Sugestão de Tarefa da IA
- **Rota**: `POST /api/tasks/:id/approve`
- **Descrição**: Converte uma tarefa com `isSuggested: true` (gerada por transcrição ou análise de texto) em uma tarefa regular ativa (`isSuggested: false`).
- **Response (200 OK)**: Retorna a tarefa aprovada.

### 5.5 Excluir Tarefa
- **Rota**: `DELETE /api/tasks/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Tarefa excluída com sucesso."
  }
}
```

---

## 6. Módulo de Categorias e Tags (`/api/categories` & `/api/tags`)

### 6.1 Listar Categorias / Tags
- **Rotas**: `GET /api/categories` ou `GET /api/tags`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-1",
      "workspaceId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "name": "Genética",
      "notesCount": 2,
      "createdAt": "2026-10-15T17:30:00.000Z"
    }
  ]
}
```

### 6.2 Criar Categoria / Tag
- **Rotas**: `POST /api/categories` ou `POST /api/tags`
- **Request Body**:
```json
{
  "name": "Inteligência Artificial"
}
```
- **Response (201 Created)**: Retorna a tag criada ou existente com nome limpo (sem `#`).

---

## 7. Módulo de Conexões e Grafo Sináptico (`/api/connections` & `/api/relations`)

### 7.1 Listar Conexões
- **Rotas**: `GET /api/connections` ou `GET /api/relations`
- **Response (200 OK)**: Array com todas as arestas de conexões sinápticas do workspace.

### 7.2 Obter Grafo Conceitual Completo
- **Rota**: `GET /api/connections/graph`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "note-mock-01", "title": "Seminário Novos Primers", "tags": ["Genética"] },
      { "id": "note-mock-02", "title": "Artigo Nature CRISPR", "tags": ["Artigos", "Genética"] }
    ],
    "edges": [
      {
        "id": "rel-mock-01",
        "source": "note-mock-01",
        "target": "note-mock-02",
        "score": 0.88,
        "reason": "Ambas as notas analisam metodologias de edição e corte Cas9."
      }
    ]
  }
}
```

### 7.3 Conectar Duas Notas Manualmente
- **Rota**: `POST /api/connections`
- **Request Body**:
```json
{
  "sourceNoteId": "note-mock-01",
  "targetNoteId": "note-mock-03",
  "similarityScore": 0.90,
  "reason": "Complementaridade teórica entre ensaios biológicos e implicações de responsabilidade."
}
```
- **Response (201 Created)**: Retorna a nova conexão estabelecida.

### 7.4 Disparar Descoberta Automática de Conexões por IA
- **Rota**: `POST /api/connections/discover/:noteId`
- **Descrição**: Avalia a nota indicada contra todo o acervo via Google Gemini e registra conexões conceituais com score >= 0.70.
- **Response (200 OK)**: Retorna a lista de novas conexões geradas.

---

## 8. Endpoints do Sistema e Privacidade LGPD

### 8.1 Health-Check
- **Rota**: `GET /api/health`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-15T17:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### 8.2 Workspaces
- `GET /api/workspaces`: Lista todos os cadernos de anotações.
- `GET /api/workspaces/current`: Retorna o caderno ativo atual.

### 8.3 Exportação e Privacidade de Dados (LGPD)
- `GET /api/privacy/export`: Faz download de um arquivo JSON estruturado contendo todos os dados, notas, tarefas e consentimentos do usuário.
- `POST /api/privacy/consent`: Registra aceite explícito das diretrizes de processamento por IA.
- `DELETE /api/privacy/hard-delete`: Destruição definitiva e irreversível de todas as notas, tarefas, mídias e vetores do usuário mediante confirmação do e-mail.

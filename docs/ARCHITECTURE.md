# Arquitetura do Sistema — SynapseNotes

## Mapa Geral da Estrutura

```
projeto/
├── web/                      ← Front-end React + Tailwind CSS
│   └── src/
│       ├── components/ui/    ← Componentes visuais atômicos
│       ├── hooks/            ← Custom hooks (áudio recorder, estado)
│       ├── services/api.ts   ← Camada de consumo da API REST
│       ├── App.tsx           ← Aplicação SPA e abas principais
│       └── main.tsx          ← Ponto de montagem React DOM
├── server/                   ← Back-end Node.js / Express
│   └── src/
│       ├── main/             ← Ponto de entrada, inicialização e montagem da API
│       │   ├── app.ts        ← Factory Express, middlewares globais e rotas
│       │   └── index.ts      ← Inicializador standalone
│       ├── worker/           ← Processo worker assíncrono para filas pesadas
│       │   ├── worker.service.ts
│       │   └── index.ts
│       ├── shared/           ← Utilidades compartilhadas no backend
│       │   ├── config/env.ts ← Variáveis de ambiente validadas com Zod
│       │   ├── errors/       ← Hierarquia de AppError (400, 401, 404, 429, 500)
│       │   ├── logger/       ← Logger estruturado JSON
│       │   └── middlewares/  ← Rate-limit, CORS, Helmet, RequestId, Validate
│       ├── infra/            ← Adapters de infraestrutura e serviços externos
│       │   ├── database/     ← Banco de dados / DatabaseStore
│       │   ├── llm/          ← Google Gemini API Adapter
│       │   ├── transcription/← Transcrição fonética de áudio
│       │   ├── storage/      ← Armazenamento de arquivos (S3 / Local)
│       │   └── queue/        ← Fila de mensageria assíncrona (SQS / InMemory)
│       └── modules/          ← Módulos de domínio independentes
│           ├── auth/         ← Usuários, sessões e credenciais
│           ├── notes/        ← Anotações, links e sínteses analíticas
│           ├── audio/        ← Gravação, upload e transcrição de voz
│           ├── tasks/        ← Tarefas, buckets de prioridade e sugestões
│           ├── categories/   ← Categorias, taxonomia e tags
│           └── connections/  ← Grafo sináptico e ideias correlatas
├── shared/contracts/         ← Tipagens e schemas compartilhados (Fullstack)
└── docs/                     ← Documentação de contexto, arquitetura e ADRs
```

## Padrão Interno dos Módulos

Cada módulo em `server/src/modules/<nome>/` segue rigorosamente o isolamento:

```
modules/<nome>/
├── <nome>.routes.ts       ← Rotas HTTP express
├── <nome>.controller.ts   ← Orquestração de I/O HTTP
├── <nome>.service.ts      ← Lógica de negócio e regras de domínio
├── <module>.repository.ts   ← Acesso a dados e persistência
├── <module>.types.ts        ← Tipagens, DTOs e entidades
├── index.ts               ← API pública do módulo
└── README.md              ← Documentação descritiva do módulo
```

## Fluxos Principais
1. **Captura e Análise de Notas**:
   `Frontend (web)` → `POST /api/notes` → `notes.controller` → `notes.service` → `notes.repository`. Em seguida, a análise é orquestrada assincronamente através de `infra/llm/gemini-adapter`, gerando tarefas automáticas e conexões sinápticas.
2. **Gravação e Transcrição de Voz**:
   `Frontend (web)` captura via `MediaRecorder` → envia base64 para `POST /api/notes/audio` → `audio.service` salva arquivo via `infra/storage` e agenda transcrição com `infra/transcription` → gera tags, resumo e tarefas sugeridas.

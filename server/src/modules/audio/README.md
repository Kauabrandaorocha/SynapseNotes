# Módulo de Áudio (`modules/audio`)

## Responsabilidade
Gerencia a recepção de gravações de voz, armazenamento de mídias, transcrição fonética e extração de síntese analítica por IA para notas de áudio.

## Estrutura Interna
- `audio.routes.ts`: Endpoints HTTP dedicados (`POST /notes/audio`, `POST /audio/process`).
- `audio.controller.ts`: Recepção do payload de áudio em base64 e retorno otimista para o cliente.
- `audio.service.ts`: Validação de mídia, pipeline de transcrição assíncrona e extração de tarefas e correlações conceituais.
- `audio.repository.ts`: Persistência das anotações de áudio e tags vinculadas no acervo.
- `audio.types.ts`: Tipagens e DTOs específicos do processamento de áudio.
- `index.ts`: Ponto único de exportação da API pública do módulo.

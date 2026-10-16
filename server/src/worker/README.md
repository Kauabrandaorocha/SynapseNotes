# Processo Worker Assíncrono (`server/src/worker`)

## Responsabilidade
Ponto de entrada e orquestração do processo de background worker independente. Processa filas assíncronas (SQS/in-memory) para:
- Transcrição e extração de áudios longos.
- Indexação e correlação sináptica de notas com Gemini LLM.
- Processamento em lote de tarefas sugeridas.

## Execução
```bash
npx tsx server/src/worker/index.ts
```

# Registros de Decisões de Arquitetura (ADRs)

## ADR 001: Separação Estrutural de Frontend (`web/`) e Backend (`server/`)
- **Status**: Aceito.
- **Contexto**: A inclusão do backend dentro de `src/` (misturado com componentes de interface, hooks e estilos) gerava acoplamento visual e dificuldade de navegação.
- **Decisão**: Isolar o frontend em `web/src/`, o backend em `server/src/`, contratos comuns em `shared/contracts/` e documentação técnica em `docs/`.
- **Consequências**: Clareza arquitetural imediata, facilidade para escalar o backend em microsserviços ou workers independentes, e frontend desacoplado.

## ADR 002: Arquitetura Modular por Domínio no Backend
- **Status**: Aceito.
- **Contexto**: Controladores monolíticos e rotas extensas dificultam a manutenção e a rastreabilidade de regras de negócio.
- **Decisão**: Cada módulo em `server/src/modules/<nome>/` segue o padrão estrito de 6 camadas:
  1. `<modulo>.routes.ts`: Definição puramente HTTP.
  2. `<modulo>.controller.ts`: Orquestração de I/O, status HTTP e DTOs.
  3. `<modulo>.service.ts`: Regras de negócio e integração de domínios.
  4. `<modulo>.repository.ts`: Persistência e acesso a dados.
  5. `<modulo>.types.ts`: Tipagens e interfaces do domínio.
  6. `index.ts`: Ponto único de entrada (API pública do módulo).
- **Consequências**: Encapsulamento forte, testabilidade unitária e independência entre módulos.

## ADR 003: Processamento Assíncrono com Background Worker
- **Status**: Aceito.
- **Contexto**: Transcrições de arquivos de áudio e chamadas de LLM (Gemini) podem demorar vários segundos e não devem bloquear a resposta HTTP síncrona do usuário.
- **Decisão**: Resposta otimista na API (`status: processing`), delegando o processamento pesado para filas assíncronas no `worker/`.
- **Consequências**: Experiência fluida para o usuário (UX sem congelamento), retenção garantida e resiliência com fallback.

## ADR 004: Eliminação de Redundância Temporal em Títulos de Áudio
- **Status**: Aceito.
- **Contexto**: Notas geradas a partir de gravações de voz sem título explícito incluíam a data no próprio título, duplicando a informação do cabeçalho da nota.
- **Decisão**: Adotar o título limpo "Gravação de Voz" como padrão, deixando a data exclusivamente no timestamp de criação do cabeçalho.
- **Consequências**: Interface mais limpa e títulos sem ruído redundante.

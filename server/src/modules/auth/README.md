# Módulo de Autenticação (`modules/auth`)

## Responsabilidade
Gerencia o ciclo de vida de usuários, sessões e credenciais de acesso para a plataforma SynapseNotes.

## Estrutura Interna
- `auth.routes.ts`: Definição dos endpoints REST HTTP (`/auth/register`, `/auth/login`, `/auth/me`).
- `auth.controller.ts`: Tratamento de requisições e respostas HTTP, validação de payload e status codes.
- `auth.service.ts`: Regras de negócio, geração de tokens e verificação de contas.
- `auth.repository.ts`: Acesso e persistência aos registros de usuário no banco de dados.
- `auth.types.ts`: Tipagens e DTOs específicos do domínio de autenticação.
- `index.ts`: Ponto único de exportação da API pública do módulo.

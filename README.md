# Condomínio 1154 — Sistema de Gestão

Aplicação web para gestão transparente de contribuições, despesas, multas, dívidas, recibos e relatórios financeiros do Condomínio 1154.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL** + **Prisma 7** (adapter pg)
- **NextAuth.js v5** (credentials)
- **Docker Compose** (base de dados local)

## Execução Local

### 1. Pré-requisitos

- Node.js 18+
- Docker e Docker Compose

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# A configuração padrão funciona com Docker sem alterações
```

### 4. Iniciar a base de dados

```bash
docker-compose up -d
```

### 5. Criar tabelas e dados de teste

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Aceder em: http://localhost:3000

## Credenciais de Teste

| Perfil        | Email                    | Password      |
|---------------|--------------------------|---------------|
| Administrador | admin@condo1154.mz       | admin1154     |
| Morador 1     | joao@condo1154.mz        | morador1154   |
| Morador 2     | maria@condo1154.mz       | morador1154   |
| Auditor       | auditor@condo1154.mz     | auditor1154   |

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
npm run db:seed      # Seed de dados de teste
npm run db:studio    # Prisma Studio (interface da BD)
npm run db:start     # Iniciar PostgreSQL via Docker
npm run db:stop      # Parar PostgreSQL via Docker
```

## Funcionalidades MVP

- Autenticação com roles (admin / resident / auditor)
- CRUD Apartamentos com contribuições por apartamento
- CRUD Moradores com associação a apartamentos
- Geração de mensalidades mensais (sem duplicados)
- Multas por atraso (fixo ou percentagem)
- Pagamentos totais e parciais
- Cálculo automático de dívida
- CRUD Despesas com controlo de visibilidade
- Gestão de salários de seguranças
- Dashboard financeiro
- Relatórios mensais com publicação para moradores
- Recibos automáticos
- Auditoria de eventos financeiros
- Área do morador (read-only)
- Interface responsiva (mobile + desktop)

## Valores Monetários

Todos os valores são apresentados em **MZN** (Metical Moçambicano).

## Deploy (Vercel + Supabase)

1. Criar projecto PostgreSQL no Supabase
2. Configurar `DATABASE_URL` e `NEXTAUTH_SECRET` nas variáveis de ambiente do Vercel
3. Executar `npx prisma migrate deploy` em produção

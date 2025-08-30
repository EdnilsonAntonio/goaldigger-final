# Configuração do Reset de Tarefas em Background

Este documento explica como configurar o sistema de reset de tarefas repetitivas para funcionar em background, sem necessidade de abrir o app.

## 🎯 Problema Resolvido

Anteriormente, a verificação do `resetDay` só era feita quando o usuário abria o app (no `useEffect` do componente `TasksLists`). Agora o sistema pode funcionar automaticamente em background.

## 🔧 Componentes Implementados

### 1. API Endpoint (`/api/reset-tasks`)
- **POST**: Executa o reset de tarefas
- **GET**: Verifica status e quantas tarefas precisam ser resetadas
- Suporta autenticação via token para segurança

### 2. Serviço de Background (`lib/background-reset.ts`)
- Função `executeTasksReset()`: Lógica centralizada do reset
- Função `logResetExecution()`: Registra execuções para evitar duplicatas
- Tratamento de erros robusto

### 3. Endpoint Cron (`/api/cron/reset-tasks`)
- Endpoint específico para cron jobs
- Chama internamente o endpoint de reset
- Configurado para Vercel Cron

### 4. Script Standalone (`scripts/reset-tasks-cron.js`)
- Script Node.js que pode ser executado independentemente
- Útil para cron jobs do sistema ou outros agendadores

## 🚀 Opções de Configuração

### Opção 1: Vercel Cron (Recomendado para Vercel)

O arquivo `vercel.json` já está configurado para executar diariamente à meia-noite:

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-tasks",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Opção 2: Cron Job do Sistema (Linux/macOS)

```bash
# Editar crontab
crontab -e

# Adicionar linha para executar diariamente à meia-noite
0 0 * * * cd /path/to/your/project && node scripts/reset-tasks-cron.js
```

### Opção 3: GitHub Actions

Criar `.github/workflows/reset-tasks.yml`:

```yaml
name: Reset Tasks Daily
on:
  schedule:
    - cron: '0 0 * * *'  # Diariamente à meia-noite UTC
  workflow_dispatch:  # Permite execução manual

jobs:
  reset-tasks:
    runs-on: ubuntu-latest
    steps:
      - name: Call reset endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.APP_URL }}/api/reset-tasks"
```

### Opção 4: Outros Serviços de Cron

Serviços como **EasyCron**, **cron-job.org**, ou **Zapier** podem fazer requisições HTTP para:
```
POST https://seu-app.vercel.app/api/reset-tasks
```

## 🔐 Configuração de Segurança

Para proteger o endpoint, configure uma das seguintes variáveis de ambiente:

```bash
CRON_SECRET=seu_token_secreto_aqui
# ou
CRON_SECRET_TOKEN=seu_token_secreto_aqui
# ou
VERCEL_CRON_SECRET=seu_token_secreto_aqui
```

## 🧪 Testando a Configuração

### Teste Manual do Endpoint
```bash
# Sem autenticação
curl -X POST http://localhost:3000/api/reset-tasks

# Com autenticação
curl -X POST \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/reset-tasks
```

### Verificar Status
```bash
curl http://localhost:3000/api/reset-tasks
```

### Testar Script Local
```bash
node scripts/reset-tasks-cron.js
```

## 📊 Logs e Monitoramento

O sistema registra logs no console e pode opcionalmente salvar em uma tabela `task_reset_logs` (se criada no banco).

### Criação da Tabela de Logs (Opcional)

Adicione ao seu schema Prisma:

```prisma
model TaskResetLog {
  id           String   @id @default(cuid())
  executedAt   DateTime @default(now())
  updatedCount Int
  success      Boolean
  message      String
  createdAt    DateTime @default(now())

  @@map("task_reset_logs")
}
```

## 🔄 Migração do Código Existente

O código no `useEffect` do `TasksLists.tsx` continua funcionando como fallback. Para otimizar, você pode:

1. **Manter ambos**: Background + fallback no useEffect
2. **Remover do useEffect**: Confiar apenas no background (recomendado após testar)

## ⚡ Vantagens da Nova Implementação

- ✅ **Execução automática**: Não depende do usuário abrir o app
- ✅ **Confiável**: Funciona mesmo se o app não for usado por dias
- ✅ **Flexível**: Múltiplas opções de agendamento
- ✅ **Seguro**: Autenticação opcional via token
- ✅ **Monitorável**: Logs de execução
- ✅ **Testável**: Endpoints para verificação manual

## 🚨 Considerações Importantes

1. **Fuso Horário**: O reset usa horário local do servidor
2. **Fallback**: Mantenha o código do useEffect como backup inicial
3. **Monitoramento**: Verifique logs regularmente
4. **Testes**: Teste em ambiente de desenvolvimento primeiro
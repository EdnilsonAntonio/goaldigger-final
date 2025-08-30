# 🚀 Passos para Ativar o Reset Automático de Tarefas

## ✅ O que já está pronto:
- ✅ Código implementado
- ✅ Endpoints API criados
- ✅ Scripts de automação
- ✅ Configurações de exemplo

## 🔧 O que você PRECISA fazer:

### 1. **Configurar Variável de Ambiente (Opcional mas Recomendado)**

Adicione ao seu arquivo `.env`:
```bash
CRON_SECRET=meu_token_super_secreto_123
```

### 2. **Escolher UMA das opções de automação:**

#### **Opção A: Vercel Cron (Mais Fácil se usar Vercel)**
- ✅ Já configurado no `vercel.json`
- Só fazer deploy na Vercel
- Funciona automaticamente

#### **Opção B: GitHub Actions**
- ✅ Já configurado em `.github/workflows/reset-tasks.yml`
- Adicionar secrets no GitHub:
  - `CRON_SECRET`: seu token secreto
  - `APP_URL`: URL do seu app (ex: https://meuapp.vercel.app)

#### **Opção C: Cron Job Local (Linux/macOS)**
```bash
# Abrir crontab
crontab -e

# Adicionar linha (ajustar o caminho):
0 0 * * * cd /workspace && node scripts/reset-tasks-cron.js
```

#### **Opção D: Serviço de Cron Online**
- Use sites como cron-job.org ou EasyCron
- Configure para fazer POST em: `https://seu-app.com/api/cron/reset-tasks`
- Adicione header: `Authorization: Bearer seu_token`

### 3. **Testar se está funcionando:**

```bash
# Iniciar o servidor (se não estiver rodando)
npm run dev

# Em outro terminal, testar:
node scripts/test-reset.js
```

## 🎯 **Resumo - O que você precisa fazer AGORA:**

1. **Se usar Vercel**: Apenas fazer deploy → funciona automaticamente
2. **Se usar GitHub**: Configurar secrets `CRON_SECRET` e `APP_URL`
3. **Se quiser local**: Configurar cron job no sistema
4. **Testar**: Rodar `node scripts/test-reset.js` com servidor ativo

## ⚡ **Resultado:**
- Tarefas repetitivas serão resetadas automaticamente todo dia à meia-noite
- Não precisa mais abrir o app para isso acontecer
- Sistema tem fallback caso algo falhe

**Qual opção você quer usar? Posso ajudar a configurar!**
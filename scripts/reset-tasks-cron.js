#!/usr/bin/env node

/**
 * Script para executar o reset de tarefas repetitivas em background
 * Pode ser usado com cron jobs do sistema ou agendadores de tarefas
 * 
 * Uso:
 * node scripts/reset-tasks-cron.js
 * 
 * Para configurar um cron job no sistema (Linux/macOS):
 * crontab -e
 * Adicionar linha: 0 0 * * * cd /path/to/your/project && node scripts/reset-tasks-cron.js
 */

const https = require('https');
const http = require('http');

async function resetTasks() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  
  console.log(`[${new Date().toISOString()}] Iniciando reset de tarefas...`);
  
  try {
    const url = new URL('/api/reset-tasks', baseUrl);
    const isHttps = url.protocol === 'https:';
    const requestModule = isHttps ? https : http;
    
    const postData = JSON.stringify({});
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(cronSecret && { 'Authorization': `Bearer ${cronSecret}` })
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = requestModule.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (response.statusCode === 200) {
      const result = JSON.parse(response.data);
      console.log(`[${new Date().toISOString()}] Reset concluído com sucesso:`, result.message);
      console.log(`Tarefas atualizadas: ${result.updatedCount || 0}`);
    } else {
      console.error(`[${new Date().toISOString()}] Erro no reset:`, response.data);
      process.exit(1);
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao executar reset:`, error.message);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  resetTasks();
}

module.exports = { resetTasks };
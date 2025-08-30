#!/usr/bin/env node

/**
 * Script para testar o sistema de reset de tarefas
 */

const https = require('https');
const http = require('http');

async function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const requestModule = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = requestModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testResetSystem() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
  
  console.log('🧪 Testando sistema de reset de tarefas...\n');
  
  // Teste 1: Verificar status
  console.log('1️⃣ Verificando status do endpoint...');
  try {
    const statusResponse = await makeRequest(`${baseUrl}/api/reset-tasks`);
    console.log(`   Status: ${statusResponse.statusCode}`);
    console.log(`   Resposta:`, statusResponse.data);
    console.log('   ✅ Endpoint de status funcionando\n');
  } catch (error) {
    console.log('   ❌ Erro no endpoint de status:', error.message);
    console.log('   💡 Certifique-se de que o servidor está rodando\n');
  }

  // Teste 2: Executar reset
  console.log('2️⃣ Executando reset de tarefas...');
  try {
    const headers = cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {};
    const resetResponse = await makeRequest(`${baseUrl}/api/reset-tasks`, 'POST', headers);
    
    console.log(`   Status: ${resetResponse.statusCode}`);
    console.log(`   Resposta:`, resetResponse.data);
    
    if (resetResponse.statusCode === 200) {
      console.log('   ✅ Reset executado com sucesso');
      console.log(`   📊 Tarefas atualizadas: ${resetResponse.data.updatedCount || 0}\n`);
    } else {
      console.log('   ⚠️ Reset retornou erro\n');
    }
  } catch (error) {
    console.log('   ❌ Erro ao executar reset:', error.message, '\n');
  }

  // Teste 3: Testar endpoint de cron
  console.log('3️⃣ Testando endpoint de cron...');
  try {
    const headers = cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {};
    const cronResponse = await makeRequest(`${baseUrl}/api/cron/reset-tasks`, 'GET', headers);
    
    console.log(`   Status: ${cronResponse.statusCode}`);
    console.log(`   Resposta:`, cronResponse.data);
    
    if (cronResponse.statusCode === 200) {
      console.log('   ✅ Endpoint de cron funcionando\n');
    } else {
      console.log('   ⚠️ Endpoint de cron com problema\n');
    }
  } catch (error) {
    console.log('   ❌ Erro no endpoint de cron:', error.message, '\n');
  }

  console.log('🎉 Teste concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Configure um cron job para chamar /api/cron/reset-tasks diariamente');
  console.log('   2. Defina CRON_SECRET nas variáveis de ambiente para segurança');
  console.log('   3. Monitore os logs para verificar execuções');
}

if (require.main === module) {
  testResetSystem().catch(console.error);
}

module.exports = { testResetSystem };
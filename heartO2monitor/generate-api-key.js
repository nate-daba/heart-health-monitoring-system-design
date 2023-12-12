const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

function generateApiKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function appendApiKeyToEnvFile(newKey) {
  const envFile = '.env';
  const envVars = fs.readFileSync(envFile, 'utf8');
  const lines = envVars.split('\n');

  let validApiKeys = [];
  lines.forEach(line => {
    if (line.startsWith('VALID_API_KEYS=')) {
      validApiKeys = line.substring(15).split(',');
    }
  });

  validApiKeys.push(newKey);
  const updatedValidApiKeys = `VALID_API_KEYS=${validApiKeys.join(',')}`;

  const updatedLines = lines.map(line => line.startsWith('VALID_API_KEYS=') ? updatedValidApiKeys : line);
  fs.writeFileSync(envFile, updatedLines.join('\n'));

  console.log(`API Key added: ${newKey}`);
}

const newApiKey = generateApiKey();
appendApiKeyToEnvFile(newApiKey);

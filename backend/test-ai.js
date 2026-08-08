import dotenv from 'dotenv';
dotenv.config();

import aiService from './src/services/ai.service.js';

async function testGemini() {
  try {
    const res = await aiService.diagnoseFailure({
      errorType: 'CI/CD Pipeline Failure',
      errorMessage: 'Workflow Failed to Start (Possible YAML Syntax Error)',
      logs: 'No specific logs could be extracted. The workflow might have failed to start due to a YAML syntax error or invalid configuration.'
    });
    console.log('Diagnosis Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}

testGemini();

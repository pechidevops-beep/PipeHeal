import dotenv from 'dotenv';
dotenv.config();

import aiService from './src/services/ai.service.js';

async function testGeminiRaw() {
  try {
    const prompt = `Please diagnose the following error:\n\n{ "errorType": "CI/CD Pipeline Failure", "errorMessage": "Workflow Failed to Start (Possible YAML Syntax Error)", "logs": "No specific logs could be extracted." }`;
    const res = await aiService.callGemini(prompt, aiService.getSystemPrompt());
    console.log('RAW GEMINI RESPONSE:');
    console.log(res);
  } catch (err) {
    console.error('Error:', err);
  }
}

testGeminiRaw();

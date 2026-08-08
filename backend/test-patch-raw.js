import dotenv from 'dotenv';
dotenv.config();

import aiService from './src/services/ai.service.js';

async function testGeneratePatchRaw() {
  try {
    const prompt = `Based on the following diagnosis, generate a patch for the code.
Diagnosis: Workflow Failed to Start (Possible YAML Syntax Error)
File Path: .github/workflows/pipeheal-test.yml
Original Code:
name: PipeHeal Test
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Run script
        run: echo "Hello World`;
    
    const systemPrompt = `You are an expert DevOps engineer fixing a CI/CD failure.
You MUST return ONLY a raw JSON object with the following schema, and absolutely NO markdown formatting:
{
  "patchedCode": "string (The complete fixed code)",
  "diff": "string (A unified diff string showing what changed)",
  "description": "string (Brief explanation of the fix)"
}`;

    const res = await aiService.callGemini(prompt, systemPrompt);
    console.log('RAW GEMINI PATCH RESPONSE:');
    console.log(res);
  } catch (err) {
    console.error('Error:', err);
  }
}

testGeneratePatchRaw();

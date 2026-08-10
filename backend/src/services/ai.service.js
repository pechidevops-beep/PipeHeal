import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const aiService = {
  getProvider() {
    return (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  },

  getSystemPrompt() {
    return `You are a senior DevOps and Full-Stack debugging AI.
You will be provided with parsed logs of a failed CI/CD pipeline step, including the error message, file, and stack trace.
Your task is to diagnose the root cause and provide a structured JSON response.

You MUST return ONLY a raw JSON object with the following schema, and absolutely NO markdown formatting or surrounding text:
{
  "failure_type": "string (e.g. Dependency Error, Network Error, Syntax Error, Test Failure)",
  "confidence": "number (0.0 to 1.0)",
  "root_cause": "string (Detailed explanation of why it failed)",
  "summary": "string (1-2 sentence summary)",
  "suggested_fix": "string (Actionable steps or code patch to fix it)",
  "auto_fixable": "boolean (true if a simple code patch or command can fix it)"
}`;
  },

  async diagnoseFailure(parsedLogData) {
    logger.info(`[AI Service] Diagnosing failure using ${this.getProvider()}...`);
    
    const prompt = `Please diagnose the following error:\n\n${JSON.stringify(parsedLogData, null, 2)}`;
    
    let diagnosisJSON = null;

    try {
      if (this.getProvider() === 'claude') {
        diagnosisJSON = await this.callClaude(prompt);
      } else {
        diagnosisJSON = await this.callGemini(prompt);
      }
      
      let firstBrace = diagnosisJSON.indexOf('{');
      if (firstBrace !== -1) {
        let braceCount = 0;
        let lastBrace = -1;
        for (let i = firstBrace; i < diagnosisJSON.length; i++) {
          if (diagnosisJSON[i] === '{') braceCount++;
          else if (diagnosisJSON[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastBrace = i;
              break;
            }
          }
        }
        if (lastBrace !== -1) {
          diagnosisJSON = diagnosisJSON.substring(firstBrace, lastBrace + 1);
        }
      }
      return JSON.parse(diagnosisJSON);
    } catch (err) {
      logger.error(`[AI Service] AI diagnosis failed: ${err.message}`);
      return this.fallbackDiagnosis(parsedLogData);
    }
  },

  async callGemini(prompt, systemPrompt, retries = 3) {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const body = {
      system_instruction: { parts: [{ text: systemPrompt || this.getSystemPrompt() }] },
      contents: [{ parts: [{ text: prompt }] }]
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`[AI Service] Gemini call attempt ${attempt}/${retries} using model: ${model}`);
        const res = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Invalid Gemini response: no text returned');
        logger.info(`[AI Service] Gemini call succeeded on attempt ${attempt}`);
        return text;
      } catch (err) {
        const status = err.response?.status;
        const isRateLimit = status === 429;
        const isTransient = status >= 500 || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

        logger.warn(`[AI Service] Gemini attempt ${attempt} failed — HTTP ${status || 'N/A'}: ${err.message}`);

        if (isRateLimit) {
          if (attempt < retries) {
            const waitMs = attempt * 5000; // 5s, 10s, 15s backoff
            logger.warn(`[AI Service] Gemini rate limited (429). Waiting ${waitMs}ms before retry...`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }
          throw new Error('AI is temporarily rate limited. Please try again in a minute.');
        }

        if (isTransient && attempt < retries) {
          const waitMs = attempt * 2000;
          logger.warn(`[AI Service] Gemini transient error. Waiting ${waitMs}ms before retry...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }

        throw err;
      }
    }
  },

  async callClaude(prompt, systemPrompt) {
    if (!env.CLAUDE_API_KEY) throw new Error('CLAUDE_API_KEY not configured');
    const url = 'https://api.anthropic.com/v1/messages';
    
    const body = {
      model: env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: systemPrompt || this.getSystemPrompt(),
      messages: [{ role: 'user', content: prompt }]
    };

    const res = await axios.post(url, body, {
      headers: {
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const text = res.data?.content?.[0]?.text;
    if (!text) throw new Error('Invalid Claude response');
    return text;
  },

  fallbackDiagnosis(parsedLogData) {
    logger.warn('[AI Service] Using rule-based fallback diagnosis');
    const type = parsedLogData?.errorType || 'Unknown Error';
    return {
      failure_type: type,
      confidence: 0.4,
      root_cause: parsedLogData?.errorMessage || 'An unknown error occurred during execution.',
      summary: `Automated fallback diagnosis for ${type}`,
      suggested_fix: 'Review the provided stack trace and error message manually.',
      auto_fixable: false
    };
  },

  async generatePatch(diagnosisText, filePath, originalCode, similarFixes = []) {
    logger.info(`[AI Service] Generating patch using ${this.getProvider()}...`);
    
    const systemPrompt = `You are an expert DevOps engineer fixing a CI/CD failure.
You MUST return ONLY a raw JSON object with the following schema, and absolutely NO markdown formatting:
{
  "patchedCode": "string (The complete fixed code)",
  "diff": "string (A unified diff string showing what changed)",
  "description": "string (Brief explanation of the fix)"
}`;

    const ragContext = similarFixes.length > 0 ? `
---
KNOWLEDGE BASE (Past Successful Fixes for Similar Errors):
${similarFixes.map(fix => `Root Cause: ${fix.rootCause}\nPatch Diff:\n${fix.patchDiff}`).join('\n\n')}
---
` : '';
    
    const prompt = `Based on the following diagnosis, generate a patch for the code.
Diagnosis: ${diagnosisText}
File Path: ${filePath}
${ragContext}
Original Code:
${originalCode}`;

    let textResponse = null;
    try {
      if (this.getProvider() === 'claude') {
        textResponse = await this.callClaude(prompt, systemPrompt);
      } else {
        textResponse = await this.callGemini(prompt, systemPrompt);
      }
      
      let cleanResponse = textResponse.trim();
      let firstBrace = cleanResponse.indexOf('{');
      if (firstBrace !== -1) {
        let braceCount = 0;
        let lastBrace = -1;
        for (let i = firstBrace; i < cleanResponse.length; i++) {
          if (cleanResponse[i] === '{') braceCount++;
          else if (cleanResponse[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastBrace = i;
              break;
            }
          }
        }
        if (lastBrace !== -1) {
          cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
        }
      }

      return JSON.parse(cleanResponse);
    } catch (err) {
      logger.error(`[AI Service] Patch generation failed: ${err.message}`);
      return {
        patchedCode: originalCode,
        diff: '',
        description: `Automatic patch generation unavailable (${err.message}). Please follow the manual resolution steps in the Suggested Fix section above.`
      };
    }
  }
};

export default aiService;

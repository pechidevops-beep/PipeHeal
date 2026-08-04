import { logger } from '../utils/logger.js';

export const parserService = {
  /**
   * Parses raw GitHub workflow logs and extracts error details.
   */
  parseLogs(rawLogs) {
    if (!rawLogs) return null;

    logger.debug('[Parser] Starting log parsing for errors');

    const errorPatterns = [
      { type: 'AssertionError', regex: /AssertionError.*?\n(.*?)\n/is, category: 'Test Failure' },
      { type: 'npm ERR', regex: /npm\s+ERR!\s+(.*)/i, category: 'Package/Build Error' },
      { type: 'ModuleNotFound', regex: /(?:Error: )?Cannot find module '([^']+)'/i, category: 'Dependency Error' },
      { type: 'Timeout', regex: /Timeout of \d+ms exceeded/i, category: 'Execution Timeout' },
      { type: 'ECONNREFUSED', regex: /ECONNREFUSED (.*?)\n/i, category: 'Network Error' },
      { type: 'TypeError', regex: /TypeError: (.*)/i, category: 'Runtime Error' },
      { type: 'ReferenceError', regex: /ReferenceError: (.*)/i, category: 'Runtime Error' },
      { type: 'SyntaxError', regex: /SyntaxError: (.*)/i, category: 'Syntax Error' },
    ];

    let detectedError = null;

    // Scan for errors based on known patterns
    for (const pattern of errorPatterns) {
      const match = rawLogs.match(pattern.regex);
      if (match) {
        detectedError = {
          errorType: pattern.type,
          category: pattern.category,
          errorMessage: match[1] ? match[1].trim() : match[0].trim(),
          rawMatch: match[0],
        };
        break; // Stop at first match, could be enhanced to find most relevant
      }
    }

    if (!detectedError) {
      return null;
    }

    // Attempt to extract File Path and Line Number (common stack trace format: "at Object.<anonymous> (/path/to/file.js:10:15)")
    const fileLineRegex = /at .*?\((.*?):(\d+):(\d+)\)/;
    const fileMatch = rawLogs.match(fileLineRegex);
    let filePath = null;
    let lineNumber = null;

    if (fileMatch) {
      filePath = fileMatch[1];
      lineNumber = parseInt(fileMatch[2], 10);
    }

    // Attempt to extract Failed Command (npm ERR! command failed)
    const cmdRegex = /npm ERR! command (.*)/i;
    const cmdMatch = rawLogs.match(cmdRegex);
    let failedCommand = null;
    if (cmdMatch) {
      failedCommand = cmdMatch[1].trim();
    }

    // Attempt to extract Exit Code
    const exitCodeRegex = /exit code (\d+)/i;
    const exitMatch = rawLogs.match(exitCodeRegex);
    let exitCode = null;
    if (exitMatch) {
      exitCode = parseInt(exitMatch[1], 10);
    }

    // Extract a small snippet around the error as stack trace
    const errorIndex = rawLogs.indexOf(detectedError.rawMatch);
    const start = Math.max(0, errorIndex - 200);
    const end = Math.min(rawLogs.length, errorIndex + 1000);
    const stackTrace = rawLogs.substring(start, end).trim();

    return {
      errorType: detectedError.errorType,
      category: detectedError.category,
      errorMessage: detectedError.errorMessage,
      filePath,
      lineNumber,
      failedCommand,
      exitCode,
      stackTrace,
    };
  }
};

export default parserService;

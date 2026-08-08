export function parseFailedLogs(rawLogs, jobsData) {
  let failedStep = null;
  let failedJobName = null;

  // Find the exact step that failed from the API metadata
  if (jobsData && jobsData.length > 0) {
    for (const job of jobsData) {
      if (job.conclusion === 'failure') {
        failedJobName = job.name;
        for (const step of (job.steps || [])) {
          if (step.conclusion === 'failure') {
            failedStep = step;
            break;
          }
        }
        break;
      }
    }
  }

  // Find the corresponding log file from the raw logs string
  let extractedLogs = '';
  
  if (failedStep) {
    // rawLogs look like: "--- Log: 1_Set up job.txt ---\ncontent..."
    const stepNumber = failedStep.number;
    
    // Use regex to extract the section for this step
    const regex = new RegExp(`--- Log: ${stepNumber}_[^\\n]+\\n([\\s\\S]*?)(?=\\n--- Log:|$)`, 'i');
    const match = rawLogs.match(regex);
    
    if (match && match[1]) {
      extractedLogs = match[1];
    }
  }

  // If we couldn't isolate the step using jobs data, scan the whole log for errors
  if (!extractedLogs && rawLogs) {
    const lines = rawLogs.split('\n');
    const errorLines = lines.filter(line => line.toLowerCase().includes('error') || line.toLowerCase().includes('fail'));
    extractedLogs = errorLines.slice(-50).join('\n'); // Last 50 error lines
  }

  // Truncate to avoid blowing up LLM context (e.g. max 500 lines)
  const lines = extractedLogs.split('\n');
  if (lines.length > 500) {
    extractedLogs = lines.slice(-500).join('\n') + '\n... [TRUNCATED]';
  }

  let finalErrorMessage = `Job: ${failedJobName || 'Unknown'}, Step: ${failedStep ? failedStep.name : 'Unknown'}`;
  if (!failedJobName) {
    if (extractedLogs) {
      finalErrorMessage = extractedLogs.split('\n').find(l => l.trim().length > 0)?.substring(0, 100) || 'Workflow Failed to Start (YAML Syntax Error)';
    } else {
      finalErrorMessage = 'Workflow Failed to Start (Possible YAML Syntax Error)';
    }
  }

  return {
    errorType: 'CI/CD Pipeline Failure',
    errorMessage: finalErrorMessage,
    logs: extractedLogs || 'No specific logs could be extracted. The workflow might have failed to start due to a YAML syntax error or invalid configuration.'
  };
}

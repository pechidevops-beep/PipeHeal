import githubService from './src/services/github.service.js';
import { db } from './src/config/prisma.js';

async function test() {
  try {
    const user = await db.user.findFirst();
    const token = user.accessToken;
    
    console.log('Testing GitHub API...');
    const originalFile = await githubService.getFile('pechidevops-beep', 'Portfolio', 'README.md', token);
    console.log('File fetched successfully. SHA:', originalFile.sha);
    
    const branchName = `test-branch-${Date.now()}`;
    await githubService.createBranch('pechidevops-beep', 'Portfolio', branchName, 'main', token);
    console.log('Branch created:', branchName);
    
    try {
      await githubService.commitFile(
        'pechidevops-beep', 'Portfolio', 'README.md', 
        'Test commit', 
        originalFile.content + '\n# test', 
        branchName, token, originalFile.sha
      );
      console.log('Commit successful!');
    } catch (err) {
      console.error('Commit failed:', err.message);
    }
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    process.exit(0);
  }
}

test();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Create a dummy user
  const user = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      githubId: '1001',
      login: 'admin',
      name: 'PipeHeal Admin',
      email: 'admin@pipeheal.local',
      role: 'ADMIN',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1001?v=4',
    },
  });
  console.log(`User created: ${user.login}`);

  // 2. Track a repository
  const repo = await prisma.repository.upsert({
    where: { fullName: 'pipeheal/demo-app' },
    update: {},
    create: {
      githubId: 99999,
      owner: 'pipeheal',
      name: 'demo-app',
      fullName: 'pipeheal/demo-app',
      description: 'A demo application with intentional failing pipelines for PipeHeal testing.',
      private: false,
      userId: user.id,
    },
  });
  console.log(`Repository created: ${repo.fullName}`);

  // 3. Create a workflow run
  const run = await prisma.workflowRun.upsert({
    where: { githubRunId: 10000001 },
    update: {},
    create: {
      githubRunId: 10000001,
      workflowId: 101,
      workflowName: 'CI Pipeline',
      headBranch: 'main',
      headSha: 'a1b2c3d4e5f6',
      event: 'push',
      status: 'COMPLETED',
      conclusion: 'failure',
      repositoryId: repo.id,
    },
  });
  console.log(`Workflow Run created for ${run.workflowName}`);

  // 4. Create an incident
  const incident = await prisma.incident.create({
    data: {
      title: 'OOM Error during Jest tests',
      description: 'The CI pipeline failed during the test phase because the container ran out of memory.',
      severity: 'HIGH',
      status: 'OPEN',
      repositoryId: repo.id,
      workflowRunId: run.id,
      errorCategory: 'OOM Killed',
      errorMessage: 'Exit Code 137',
      errorFile: 'src/processors/batch.test.ts',
      
      // Nested relations: add a diagnosis
      diagnoses: {
        create: {
          rootCause: 'The transaction batch processor is loading all events into memory at once.',
          explanation: 'When processing large batches > 50MB, Node.js exceeds container memory limits.',
          confidence: 0.95,
          rawResponse: { mock: true },
          patches: {
            create: {
              filePath: 'src/processors/batch.ts',
              patchedCode: '// Streaming implementation',
              diff: '--- a\n+++ b\n- loadAll()\n+ streamAll()',
              description: 'Refactored to stream events',
            }
          }
        }
      }
    },
  });
  console.log(`Incident created: ${incident.title}`);

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

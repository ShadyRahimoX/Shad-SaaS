import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const children = [];

function startProcess(name, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  });

  child.on('error', (err) => {
    console.error(`[${name}] error:`, err);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.log(`[${name}] exited with code ${code} (${signal})`);
    }
  });

  children.push(child);
  return child;
}

// 1. Start API server (port 3000)
const apiChild = startProcess(
  'API',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'apps/api')
);

// 2. Start Store Vite dev server (port 5173)
const storeChild = startProcess(
  'STORE',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'apps/store')
);

// 3. Start Admin Vite dev server (port 5174)
const adminChild = startProcess(
  'ADMIN',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'apps/admin')
);

const shutdown = () => {
  console.log('Shutting down dev processes...');
  children.forEach((c) => {
    try {
      c.kill('SIGTERM');
    } catch {}
  });
  setTimeout(() => {
    children.forEach((c) => {
      try {
        c.kill('SIGKILL');
      } catch {}
    });
    process.exit(0);
  }, 2000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

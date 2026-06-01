import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve path to actual optimization script inside /app
const actualScript = path.resolve(__dirname, '../app/scripts/optimize-assets.js');
console.log(`[PROXY] Forwarding build step execution to actual script: ${actualScript}`);

// Spawn node subprocess inside /app where sharp and other node_modules reside
const child = spawn('node', [actualScript], {
  cwd: path.resolve(__dirname, '../app'),
  stdio: 'inherit',
  shell: true // Safe shell execution compatibility for cross-platform environments
});

child.on('close', (code) => {
  process.exit(code || 0);
});

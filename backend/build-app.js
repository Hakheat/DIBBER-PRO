import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, '../frontend');
const backendDistFrontend = path.resolve(__dirname, './frontend-dist');

console.log('Building Frontend...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('Copying Frontend build to Backend...');
if (fs.existsSync(backendDistFrontend)) {
  fs.rmSync(backendDistFrontend, { recursive: true, force: true });
}
fs.copySync(path.resolve(frontendDir, 'dist'), backendDistFrontend);

console.log('Building Backend...');
execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });

console.log('Build completed successfully!');

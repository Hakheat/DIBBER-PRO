import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

function waitForServer(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', (err) => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Timeout waiting for server'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "DAI Dubber PRO",
    icon: path.join(__dirname, '../frontend/public/favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  // Start the Express Server
  const serverPath = path.join(__dirname, 'dist', 'server.js');
  
  serverProcess = spawn('node', [serverPath], {
    cwd: __dirname,
    env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  console.log('Waiting for Express server to start on port 3000...');
  
  try {
    await waitForServer('http://localhost:3000', 15000);
    console.log('Server is running. Loading UI...');
    mainWindow.loadURL('http://localhost:3000');
  } catch (err) {
    console.error('Failed to connect to server:', err);
    mainWindow.loadFile(path.join(__dirname, 'frontend-dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

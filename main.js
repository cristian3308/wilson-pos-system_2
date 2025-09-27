const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'frontend/public/favicon.ico'),
    title: 'Wilson POS System'
  });

  // En desarrollo, cargar desde localhost:3000
  // En producción, cargar archivos estáticos
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'frontend/out/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  if (app.isPackaged) {
    // En producción, iniciar el servidor backend empaquetado
    const backendPath = path.join(__dirname, 'backend/dist/server.js');
    backendProcess = spawn('node', [backendPath], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });
  } else {
    // En desarrollo, asumir que el backend ya está corriendo
    console.log('En modo desarrollo - asumiendo backend corriendo en puerto 5000');
  }
}

app.whenReady().then(() => {
  startBackend();
  
  // Esperar un poco para que el backend inicie
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
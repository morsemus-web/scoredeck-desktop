import { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray;

// Auto-update: check silently on launch, silent-install on quit if a new
// version is available. Reads the feed URL from package.json build.publish.
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('error', (err) => {
  console.error('[auto-update]', err?.message ?? err);
});
autoUpdater.on('update-available', (info) => {
  console.log('[auto-update] new version available:', info?.version);
});
autoUpdater.on('update-downloaded', (info) => {
  console.log('[auto-update] downloaded — will install on quit:', info?.version);
});

// Bar plus the sponsor strip beneath it. The collapse path used to assume a
// different height than the initial resize, which left a gap after expanding
// and re-collapsing — one constant now drives both.
const WIDGET_HEIGHT = 64;

function createTrayIcon() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Scoredeck - Live Sports Scores');
  
  rebuildTrayMenu();
  
  // Single click on tray icon toggles widget visibility
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

function rebuildTrayMenu() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  
  const displayItems = displays.map((d, i) => ({
    label: `Move to Display ${i + 1} (${d.bounds.width}x${d.bounds.height})${d.id === primary.id ? ' - Primary' : ''}`,
    click: () => {
      if (mainWindow) {
        const { workArea } = d;
        const bounds = mainWindow.getBounds();
        mainWindow.setPosition(
          workArea.x + workArea.width - bounds.width - 5,
          workArea.y + workArea.height - bounds.height - 5
        );
      }
    }
  }));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Widget', click: () => { if (mainWindow) mainWindow.show(); } },
    { label: 'Hide Widget', click: () => { if (mainWindow) mainWindow.hide(); } },
    { type: 'separator' },
    ...displayItems,
    { type: 'separator' },
    { label: 'Open Settings', click: () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.setSize(600, 500);
        mainWindow.center();
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setSkipTaskbar(false);
        mainWindow.webContents.send('open-setup');
      }
    }},
    { type: 'separator' },
    { label: 'Quit Scoredeck', click: () => { app.quit(); } }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    center: true,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    backgroundColor: '#121212',
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.show();
  mainWindow.focus();
}

app.whenReady().then(() => {
  createWindow();
  createTrayIcon();

  // Only attempt updates in production
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[auto-update] initial check failed:', err?.message ?? err);
    });
  }

  ipcMain.on('resize-to-setup', () => {
    if (mainWindow) {
      mainWindow.setSize(600, 500);
      mainWindow.center();
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setSkipTaskbar(true); // Keep out of taskbar, it's in the tray
    }
  });

  ipcMain.on('resize-to-widget', (event, config) => {
    if (mainWindow) {
      const displays = screen.getAllDisplays();
      let targetDisplay = screen.getPrimaryDisplay();
      
      if (config && config.displayId) {
        const targetId = config.displayId.toString();
        const found = displays.find(d => d.id.toString() === targetId);
        if (found) targetDisplay = found;
      }

      const { workArea } = targetDisplay;
      const width = 360;

      mainWindow.setBounds({
        x: workArea.x + workArea.width - width - 5,
        y: workArea.y + workArea.height - WIDGET_HEIGHT - 5,
        width: width,
        height: WIDGET_HEIGHT
      });
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setSkipTaskbar(true);
    }
  });

  ipcMain.on('resize-to-expanded', (event) => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      const expandedHeight = 250;
      
      if (bounds.height === expandedHeight) {
         mainWindow.setBounds({
            x: bounds.x,
            y: bounds.y + (expandedHeight - WIDGET_HEIGHT),
            width: bounds.width,
            height: WIDGET_HEIGHT
         });
      } else {
         mainWindow.setBounds({
            x: bounds.x,
            y: bounds.y - (expandedHeight - bounds.height),
            width: bounds.width,
            height: expandedHeight
         });
      }
    }
  });

  ipcMain.on('set-startup', (event, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe')
    });
  });

  ipcMain.on('open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle('get-displays', () => {
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      label: `Display ${i + 1} (${d.bounds.width}x${d.bounds.height})${d.id === primary.id ? ' - Primary' : ''}`,
      bounds: d.bounds,
      isPrimary: d.id === primary.id
    }));
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

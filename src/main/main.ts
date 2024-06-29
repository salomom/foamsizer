/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, dialog, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import fs from 'fs';
const spawn = require("child_process").spawn;


class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

async function handleFolderOpen () {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!canceled) {
    return filePaths[0]
  }
}

async function handleFileExists (event:any, filePath: string) {
  try {
    const exists = await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}

// Open properties.txt from folder path
async function handleReadFile (event:any, filePath: string) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8')
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

async function handleWriteFile (event:any, filePath: string, data: string) {
  try {
    await fs.promises.writeFile(filePath, data, 'utf-8')
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

async function handleDeleteFile(event:any, filePath: string) {
  try {
    await fs.promises.unlink(filePath)
    console.log('File deleted')
    console.log(filePath)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

async function handleOpenImage (event:any, imgPath: string) {
  try {
    const base64img = fs.readFileSync(imgPath).toString('base64')
    return base64img
  } catch (error) {
    console.error(error)
    return false
  }
}

async function handleAnalyzeImage (event:any, imgPath: string) {
  return new Promise((resolve, reject) => {
    const pyProg = spawn('python', ['./opencv/test.py', imgPath]);
    var pointString = ''
    pyProg.stdout.on('data', function(data:any) {
      // Points are in the format x,y
      pointString += data.toString()
    });

    pyProg.on('close', function(code:any) {
      console.log('Process terminated with code:', code);
      var points = pointString.split('\n').map((point:any) => {
        const [x, y] = point.split(',')
        if (x === '' || y === '') {
          return null
        }
        return [parseInt(x), parseInt(y)]
      })
      points = points.filter((point:any) => point !== null)
      resolve(points);
    });
  });
}

async function scanImage(event: any, filePath: string) {
  // Uses flatbed scanner to scan image to file
  return new Promise((resolve, reject) => {
    console.log(filePath)
    const scanProg = require('child_process').exec('wia-cmd-scanner.exe /w 215 /h 296 /dpi 300 /color RGB /format PNG /output ' + filePath);
    scanProg.on('close', function(code: any) {
      console.log('Process terminated with code:', code);
      resolve(true);
    });
  });
}

async function handleCropImage(event: any, imgPath: string, outPath: string, x: number, y: number, width: number, height: number) {
  const sharp = require('sharp')
  sharp(imgPath)
    .extract({ left: x, top: y, width: width, height: height })
    .toFile(outPath, function (err: any) {
        if (err) console.log(err);
    })
}

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions:any = [];

  return installer
    .default(
      extensions.map((name:any) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  //mainWindow.loadURL('http://localhost:3000/index.html');

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    ipcMain.handle('dialog:openFolder', handleFolderOpen)
    ipcMain.handle('dialog:readFile', handleReadFile)
    ipcMain.handle('dialog:writeFile', handleWriteFile)
    ipcMain.handle('dialog:deleteFile', handleDeleteFile)
    ipcMain.handle('dialog:openImage', handleOpenImage)
    ipcMain.handle('dialog:fileExists', handleFileExists)
    ipcMain.handle('execute:analyzeImage', handleAnalyzeImage)
    ipcMain.handle('execute:scanImage', scanImage)
    ipcMain.handle('execute:cropImage', handleCropImage)
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath: string) => ipcRenderer.invoke('dialog:readFile', filePath),
  writeFile: (filePath: string, data: string) => ipcRenderer.invoke('dialog:writeFile', filePath, data),
  deleteFile: (filePath: string) => ipcRenderer.invoke('dialog:deleteFile', filePath),
  copyFile: (srcPath: string, destPath: string) => ipcRenderer.invoke('dialog:copyFile', srcPath, destPath),
  fileExists: (filePath: string) => ipcRenderer.invoke('dialog:fileExists', filePath),
  downloadFile: (url: string, destPath: string) => ipcRenderer.invoke('dialog:downloadFile', url, destPath),
  openImage: (imgPath: string) => ipcRenderer.invoke('dialog:openImage', imgPath),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('dialog:createDirectory', dirPath),
  analyzeImage: (imgPath: string) => ipcRenderer.invoke('execute:analyzeImage', imgPath),
  scanImage: (imgPath: string) => ipcRenderer.invoke('execute:scanImage', imgPath),
  cropImage: (imgPath: string, outPath: string, x: number, y: number, width: number, height: number, rotation: number) => ipcRenderer.invoke('execute:cropImage', imgPath, outPath, x, y, width, height, rotation),
  resizeImage: (imgPath: string, outPath: string, width: number, height: number, rotation: number) => ipcRenderer.invoke('execute:resizeImage', imgPath, outPath, width, height, rotation),
  convertCoverImage: (imgPath: string, outPath: string, size: any, extend:any, crop:any) => ipcRenderer.invoke('execute:convertCoverImage', imgPath, outPath, size, extend, crop),
  contourFitting: (filePath: string) => ipcRenderer.invoke('execute:contourFitting', filePath),
  findSymmetryLine: (filePath: string) => ipcRenderer.invoke('execute:findSymmetryLine', filePath),
  dbFindOne: (query: object) => ipcRenderer.invoke('db:findOne', query),
  dbInsertOne: (data: object) => ipcRenderer.invoke('db:insertOne', data),
  dbReplaceOne: (query: object, data: object) => ipcRenderer.invoke('db:replaceOne', query, data),
  uploadImage: (filePath: string) => ipcRenderer.invoke('aws:uploadImage', filePath),
  removeBackground: (inputPath: string, outputPath: string) => ipcRenderer.invoke('execute:removeBackground', inputPath, outputPath),
})

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;

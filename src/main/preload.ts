// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { create } from 'domain';
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
  readFile: (filePath: string) => ipcRenderer.invoke('dialog:readFile', filePath),
  writeFile: (filePath: string, data: string) => ipcRenderer.invoke('dialog:writeFile', filePath, data),
  deleteFile: (filePath: string) => ipcRenderer.invoke('dialog:deleteFile', filePath),
  fileExists: (filePath: string) => ipcRenderer.invoke('dialog:fileExists', filePath),
  openImage: (imgPath: string) => ipcRenderer.invoke('dialog:openImage', imgPath),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('dialog:createDirectory', dirPath),
  analyzeImage: (imgPath: string) => ipcRenderer.invoke('execute:analyzeImage', imgPath),
  scanImage: (imgPath: string) => ipcRenderer.invoke('execute:scanImage', imgPath),
  cropImage: (imgPath: string, outPath: string, x: number, y: number, width: number, height: number, rotation: number) => ipcRenderer.invoke('execute:cropImage', imgPath, outPath, x, y, width, height, rotation),
  contourFitting: (filePath: string) => ipcRenderer.invoke('execute:contourFitting', filePath),
})

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;

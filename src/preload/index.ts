import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  connect: (natsUrl: string) => ipcRenderer.invoke('connect', natsUrl),
  disconnect: (natsUrl: string) => ipcRenderer.invoke('disconnect', natsUrl),
  request: (subject: string, data: unknown) => ipcRenderer.invoke('request', subject, data),
  onDisconnected: (callback) =>
    ipcRenderer.on('nats-disconnected', (_event, value) => callback(value)),
  onReconnected: (callback) =>
    ipcRenderer.on('nats-reconnected', (_event, value) => callback(value))
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

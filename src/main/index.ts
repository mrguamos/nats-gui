import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { connect } from '@nats-io/transport-node'
import * as nats from '@nats-io/nats-core'

let nc: nats.NatsConnection | null = null
const codec = nats.JSONCodec()
let mainWindow: BrowserWindow
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (nc) {
      nc.close()
    }
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('connect', async (_, natsUrl) => {
    nc = await connect({
      servers: natsUrl,
      reconnect: true
    })
    natsStatus()
  })

  async function natsStatus() {
    if (nc) {
      for await (const s of nc.status()) {
        switch (s.type) {
          case nats.Events.Disconnect:
            mainWindow.webContents.send('nats-disconnected')
            break
          case nats.Events.Reconnect:
            mainWindow.webContents.send('nats-reconnected')
            break
        }
      }
    }
  }

  ipcMain.handle('disconnect', () => {
    if (nc) {
      nc.close()
      nc = null
    }
  })

  type Error = {
    code: string
    message?: string
    description: string
  }

  ipcMain.handle('request', async (_, subject, data) => {
    if (nc) {
      const res = await nc.request(subject, codec.encode(data))
      if (res.headers?.get('Nats-Service-Error-Code')) {
        return {
          code: res.headers?.get('Nats-Service-Error-Code'),
          description: res.headers?.get('Nats-Service-Error'),
          error: res.data?.length > 0 ? codec.decode(res.data) : ''
        } as Error
      }
      const json = codec.decode(res.data)
      return json
    }
    throw new Error('NATS connection is not established.')
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

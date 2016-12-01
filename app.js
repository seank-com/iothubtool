const electron = require('electron');
const {app, BrowserWindow, ipcMain, dialog} = electron;
const dataService = require('./services/iotData.js');
const configService = require('./services/config.js');

let mainWindow;
let initialized;
let messages = [];

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    'min-width': 800,
    'min-height': 600,
    'accept-first-mouse': true,
    'titleBarStyle': 'hidden'
  });

  mainWindow.loadURL(`file://${__dirname}/views/main.html`);
  //mainWindow.openDevTools();
  mainWindow.center();

  mainWindow.on('closed', function () {
    messageSubscriptions = {};
    mainWindow = null;
  })
}

app.on('ready', createMainWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createMainWindow();
  }
});

ipcMain.on('config-get', (e) => {
  configService.get((err, data) => {
    if (!err && !initialized) {
      dataService.initConnection(data.connectionString, data.nowon);
      initialized = true;
    }
    e.sender.send('config-result-get', err, data);
  });
});

ipcMain.on('config-set', (e, data) => {
  messages = [];
  dataService.initConnection(data.connectionString, data.nowon);
  configService.set(data, (err) => {
    e.sender.send('config-result-set', err);
  });
});

ipcMain.on('data-get-devices', (e) => {
  dataService.getDevices((err, devices) => {
    if (err) {
      devices = [];
    }
    e.sender.send('data-result-get-devices', devices);
  });
});

ipcMain.on('data-create-device', (e, id) => {
  dataService.createDevice(id, (err) => {
    if (err) {
      e.sender.send('data-result-create-device', err);
    } else {
      e.sender.send('data-result-create-device');
    }
  })
});

ipcMain.on('data-remove-device', (e, id) => {
  var options = {
    type: 'warning',
    title: "Remove Device",
    message: "Are you sure you want to remove " + id + "?",
    buttons: ['No', 'Yes']
  };

  dialog.showMessageBox(options, (index) => {
    if (index === 1) {
      dataService.removeDevice(id, (err) => {
        if (err) {
          e.sender.send('data-result-remove-device', err);
        } else {
          e.sender.send('data-result-remove-device');
        }
      });
    }
  });
});

ipcMain.on('data-send-to-device', (e, id, msg) => {
  dataService.sendToDevice(id, msg, (err) => {
    var options = {
      type: 'info',
      title: 'Send To Device',
      message: "Message sent!",
      buttons: []
    };

    if (err) {
      options.type = 'error';
      options.message = "Failed to send Message! " + JSON.stringify(err);
    }

    dialog.showMessageBox(options);
  });
})

ipcMain.on('data-clear-messages', (e) => {
  messages = [];
});

dataService.on('message', (msg) => {
  messages.push(msg);
  if (messages.length > 1000) {
    messages.shift();
  }

  if (mainWindow) {
    mainWindow.webContents.send('data-result-messages', messages);
  }
});

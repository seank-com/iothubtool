
const electron = require('electron');
const ipc = electron.ipcRenderer;
const clipboard = electron.clipboard;
var messageData = null;

// Helper functions

function sortData(data, key, ascending) {
  if (key) {
    return data.sort((a,b) => {
        if (a[key] < b[key]) {
          return (!!ascending) ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return (!!ascending) ? 1 : -1;
        }
        return 0;
      });
  }
  return data;
};

//
// renderNavTree
//
// Renders NavTree down the left side of the window.
//
function renderNavTree(data) {
  'use strict';

  var pane = document.getElementById('nav-tree'),
    navtree = Object.keys(data).map((item) => {
      var items = Object.keys(data[item]).map((subitem) => {
          return '' +
            `<span id="${data[item][subitem].id}" class="nav-group-item">` +
              `<span class="icon ${data[item][subitem].icon}"></span>` +
              subitem +
            '</span>';
        }).join('');
      return `<h5 class="nav-group-title">${item}</h5>${items}`;
    }).join('');

  if (pane) {
    pane.innerHTML = navtree;
  }
};

//
// renderToolbar
//
// Renders toolbar across the top of the window.
//
function renderToolbar(data) {
  var pane = document.getElementById('tool-bar'),
    toolbar = data.map((group) => {
      var buttons = group.map((button) => {
        var text = button.text || '';
        return '' +
          `<button id="${button.id}" class="btn btn-mini btn-default">` +
            `<span class="icon ${button.icon}"></span>` + text +
          `</button>`;
      }).join('');
      return `<div class="btn-group">${buttons}</div>`;
    }).join('');
  if (pane) {
    pane.innerHTML = toolbar;
  }
};

//
// renderDeviceDetail
//
// Renders the detail view of a device along with forms to
// update status and send cloud to device messages.
//
function renderDeviceDetail(device) {
  var pane = document.getElementById('display-pane'),
    properties = '' +
      '<table class="table-striped padded">' +
        '<thead>' +
          '<tr><th>Name</th><th>Value</th></tr>' +
        '</thead>' +
        '<tbody>' +
          '<tr><td>Device Id</td><td>' + device.deviceId + '</td></tr>' +
          '<tr><td>Connection String</td><td>' + device.connectionString + '</td></tr>' +
          '<tr><td>Connection State</td><td>' + device.connectionState + '</td></tr>' +
          '<tr><td>Cloud to Device Message Count</td><td>' + device.cloudToDeviceMessageCount + '</td></tr>' +
          '<tr><td>Generation Id</td><td>' + device.generationId + '</td></tr>' +
          '<tr><td>Connection State Updated Time</td><td>' + device.connectionStateUpdatedTime + '</td></tr>' +
          '<tr><td>Last Activity Time</td><td>' + device.lastActivityTime + '</td></tr>' +
          '<tr><td>Status Updated Time</td><td>' + device.statusUpdatedTime + '</td></tr>' +
          '<tr><td>Status</td><td>' + device.status + '</td></tr>' +
          '<tr><td>Status Reason</td><td>' + device.statusReason + '</td></tr>' +
        '</tbody>' +
      '</table>',
    forms = '' +
      '<form class="padded">' +
        '<br clear=all/><hr>' +
        '<div class="form-group">' +
          '<label>Status</label>' +
          '<select id="new-status" class="form-control">' +
          ((device.status === 'enabled') ? (
            '<option>enabled</option>' +
            '<option selected>disabled</option>'
          ) : (
            '<option selected>enabled</option>' +
            '<option>disabled</option>'
          )) +
          '</select>' +
        '</div>'+
        '<div class="form-group">' +
          '<label>Status Reason</label>' +
          '<input id="status-reason" type="text" class="form-control" placeholder="reason for changing status">' +
        '</div>' +
        '<div class="form-actions pull-right">' +
          '<button id="update-status" type="button" class="btn btn-form btn-default">Update Status</button>' +
        '</div>' +
        '<br clear=all/><hr>' +
        '<div class="form-group">' +
          '<label>Send Cloud to Device message</label>' +
          '<textarea id="message-payload" class="form-control" rows="7"></textarea>' +
        '</div>' +
        '<div class="form-actions pull-right padded-bottom">' +
          '<button id="send-message" type="button" class="btn btn-form btn-default">Send Message</button>' +
        '</div>' +
      '</form>';
  if (pane) {
    pane.innerHTML = properties + forms;
  }
};

//
// displayDeviceDetail
//
// Handles rendering UI and wiring up event handlers for
// the detail view of a device.
//
function displayDeviceDetail(device) {
    renderDeviceDetail(device);
    renderToolbar([[
      { id: "copy-connection-string", icon: "icon-logout", text: "Copy Connection String" }
    ],[
      { id: "remove-device", icon: "icon-trash", text: "Delete Device"}
    ]]);

    document.getElementById('nav-tree').querySelectorAll('.active').forEach((el) => {
      el.classList.remove('active');
    });

    document.getElementById('copy-connection-string').addEventListener('click', (e) => {
      clipboard.writeText(device.connectionString);
    });

    document.getElementById('remove-device').addEventListener('click', (e) => {
      ipc.send('data-remove-device', device.deviceId);
    });

    document.getElementById('update-status').addEventListener('click', (e) => {
      var newStatus = document.getElementById('new-status').value,
        statusReason = document.getElementById('status-reason').value;
      alert("NOTIMPL" + device.deviceId + " = " + newStatus + " = " + statusReason);
    });

    document.getElementById('send-message').addEventListener('click', (e) => {
      var messagePayload = document.getElementById('message-payload').value;
      try {
        messagePayload = JSON.parse(messagePayload);
      } catch (e) {
        messagePayload = null;
        alert(e.message);
      }

      if (messagePayload) {
        ipc.send('data-send-to-device', device.deviceId, messagePayload);
      }
    });
};


function renderDeviceTable(data, headings, order, ascending) {
  "use strict";

  var pane = document.querySelector("#display-pane"),
    header = headings.map((column, i) => {
        var icon = (order === column.key) ? (ascending) ? "icon-up-dir" : "icon-down-dir" : "";
        return `<th id="column-${i}">${column.name}<span class="icon ${icon} pull-right"></span></th>`;
      }).join(''),
    rows = sortData(data, order, ascending).map((row, i) => {
        var cells = headings.map((column, j) => {
            return `<td>${row[column.key]}</td>`;
          }).join("");
        return `<tr id="row-${i}">${cells}</tr>`;
      }).join('');

  if (pane) {
    pane.innerHTML =
      '<table class="table-striped">' +
        `<thead><tr>${header}</tr></thead>` +
        `<tbody>${rows}</tbody>` +
      '</table>' +
      '<form class="padded">' +
        '<br clear=all/><hr>' +
        '<div class="form-group">' +
          '<label>New Device Name</label>' +
          '<input id="new-device-name" type="text" class="form-control" placeholder="new device name">' +
        '</div>' +
        '<div class="form-actions pull-right">' +
          '<button id="create-device" type="button" class="btn btn-form btn-default">Create Device</button>' +
        '</div>' +
      '</form>';
  }
};

function sortColumn(id, ascending, data, headings) {
  return (e) => {
    refreshDeviceTable(data, headings, id, ascending);
  };
};

function selectRow(i, data) {
  return (e) => {
    displayDeviceDetail(data);
  };
};

function refreshDeviceTable(data, headings, order, ascending) {
  var elem = {},
    i = 0;

  renderDeviceTable(data, headings, order, ascending);
  renderToolbar([]);

  for (i = 0; i < headings.length; i += 1) {
    elem = document.getElementById(`column-${i}`);
    elem.addEventListener('click', sortColumn(headings[i].key, !ascending, data, headings));
  };

  for (i = 0; i < data.length; i += 1) {
    elem = document.getElementById(`row-${i}`);
    elem.addEventListener('click', selectRow(i, data[i]));
  }

  document.getElementById('create-device').addEventListener('click', (e) => {
    var newDeviceName = document.getElementById('new-device-name').value;
    ipc.send('data-create-device', newDeviceName);
  });
};

var view = '';

function UpdateDevices() {
  view = 'Devices';

  document.getElementById('nav-tree').querySelectorAll('.active').forEach((el) => {
    el.classList.remove('active');
  });
  document.getElementById('devices-view').classList.add('active');

  ipc.send('data-get-devices');
}

function renderMessageList(data) {
  var pane = document.getElementById('display-pane'),
    messageItems = data.map((message) => {
        var msg = JSON.stringify(message, null, "  ");
        return `<li class="list-group-item"><code class="message">${msg}</code></li>`;
      }).join(''),
    messageList = `<ul class="list-group">${messageItems}</ul>`;

    if (pane) {
      pane.innerHTML = messageList;
    }
};

function refreshMessageList(data) {
  renderMessageList(data);
  renderToolbar([[
    { id: "clear-messages", icon: "icon-cancel-circled", text: `Clear Messages (${data.length})` }
  ]]);

  document.getElementById('clear-messages').addEventListener('click', (e) => {
    ipc.send('data-clear-messages');
  });
};

function UpdateMessages() {
  view = 'Messages';

  document.getElementById('nav-tree').querySelectorAll('.active').forEach((el) => {
    el.classList.remove('active');
  });
  document.getElementById('messages-view').classList.add('active');

  if (messageData) {
    process.nextTick(function () {
      refreshMessageList(messageData);
    });
  }
};

function renderSettings(data) {
  var pane = document.getElementById('display-pane'),
    settings = ''+
      '<form class="padded">' +
        '<div class="form-group">' +
          '<label>iothubowner Connection string</label>' +
          `<input id="connection-string" type="text" class="form-control" placeholder="iothubowner Connection string" value="${data.connectionString}">` +
        '</div>' +
        '<div class="form-group">' +
        '<label>Start Receiving Messages From</label>' +
          '<div class="radio">' +
            '<label>' +
              '<input type="radio" name="receive-time" value="nowon" checked>' +
              'Now On' +
            '</label>' +
          '</div>' +
          '<div class="radio">' +
            '<label>' +
              '<input type="radio" name="receive-time" value="beginning">' +
              'As Far Back As Possible' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="form-actions pull-right">' +
          '<button id="connect-iothub" type="button" class="btn btn-form btn-primary">Connect</button>' +
        '</div>' +
      '</form>';
  if (pane) {
    pane.innerHTML = settings;
  }
};

function refreshSettings(data) {
  renderSettings(data);
  renderToolbar([]);

  document.getElementById('connect-iothub').addEventListener('click', (e) => {
    var connectionString = document.getElementById('connection-string').value,
      receiveTime = document.querySelector('input[name="receive-time"]:checked').value;

    alert(connectionString + " = " + receiveTime);
    ipc.send('config-set', {
      'connectionString': connectionString,
      'nowon': receiveTime === 'nowon'
    });
  });
};

function UpdateSettings() {
  view = 'Settings';

  document.getElementById('nav-tree').querySelectorAll('.active').forEach((el) => {
    el.classList.remove('active');
  });
  document.getElementById('settings-view').classList.add('active');

  ipc.send('config-get');
};

ipc.on("data-result-get-devices", (event, data) => {
  if (view === 'Devices') {
    refreshDeviceTable(data, [
        { name: "Device Id", key: "deviceId" },
        { name: "Status", key: "connectionState" },
        { name: "Last Update", key: "lastActivityTime" },
        { name: "Message Count", key: "cloudToDeviceMessageCount" }
      ]);
  }
});

ipc.on('data-result-messages', (event, data) => {
  messageData = data;
  if (view === 'Messages') {
    refreshMessageList(data);
  }
});

ipc.on('data-result-create-device', (event, err) => {
  if (!err) {
    ipc.send('data-get-devices');
  }
});

ipc.on('data-result-remove-device', (event, err) => {
  if (!err) {
    ipc.send('data-get-devices');
  }
});

ipc.on('config-result-get', (event, err, data) => {
  if (view === 'Settings') {
    if (err) {
      data = {
        connectionString: "",
        nowon: true
      };
    }
    refreshSettings(data);
  } else {
    if (err) {
      UpdateSettings();
    } else {
      UpdateDevices();
    }
  }
});

ipc.on('config-result-set', (event) => {
  UpdateDevices();
});

document.addEventListener("DOMContentLoaded", () => {
  renderNavTree({
    "Views": {
      "Devices": {
        id: "devices-view",
        icon: "icon-mobile"
      },
      "Messages": {
        id: "messages-view",
        icon: "icon-chat"
      }
    },
    "Config": {
      "Settings": {
        id: "settings-view",
        icon: "icon-cog"
      }
    }
  });

  document.getElementById('devices-view').addEventListener('click', (e) => {
    UpdateDevices();
  });

  document.getElementById('messages-view').addEventListener('click', (e) => {
    UpdateMessages();
  });

  document.getElementById('settings-view').addEventListener('click', (e) => {
    UpdateSettings();
  });

  ipc.send('config-get');
});

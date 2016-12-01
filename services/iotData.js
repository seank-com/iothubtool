const util = require('util');
const EventEmitter = require('events');

const iothub = require('./iothub.js');

function IoTData() {
  var self = this;
};
util.inherits(IoTData, EventEmitter);

IoTData.prototype.initConnection = function (connectionString, receiveFromNowOn) {
  var self = this;

  iothub.initConnection(connectionString, receiveFromNowOn);
  iothub.removeAllListeners('message');
  iothub.on('message', (msg) => {
    self.emit('message', msg);
  });
};

IoTData.prototype.getDevices = function (callback) {
  iothub.listDevices((err, deviceList) => {
    var i = 0;

    if (err) {
      callback(err);
    } else {
      for(i = 0; i < deviceList.length; i += 1) {
        deviceList[i].connectionString = iothub.getDeviceConnectionString(deviceList[i]);
      }

      callback(null, deviceList);
    }
  });
};

IoTData.prototype.createDevice = function (id, callback) {
  iothub.createDevice(id, callback)
};

IoTData.prototype.removeDevice = function (id, callback) {
  iothub.deleteDevice(id, callback);
};

IoTData.prototype.sendToDevice = function (id, msg, callback) {
  iothub.sendToDevice(id, msg, callback);
}

if (global.iotdata_instance === undefined) {
  global.iotdata_instance = new IoTData();
}
module.exports = global.iotdata_instance;

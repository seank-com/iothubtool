const util = require('util');
const EventEmitter = require('events');

const timers = require('timers');

function FormatNumber(value, length) {
  var result = "" + value;
  while (result.length < length) {
      result = "0" + result;
  }
  return result;
};

function MockData() {
  var self = this;

};
util.inherits(MockData, EventEmitter);

MockData.prototype.initConnection = function (connectionString, receiveFromNowOn) {
  var self = this;

  timers.setInterval(() => {
    self.emit("message", {
      "response":	"environment",
      "temperature":	25 + Math.random(),
      "humidity":	0.2 + (Math.random() / 10),
      "pressure":	100000 + (Math.random() * 1000)
    });
  }, 1000);
};

MockData.prototype.getDevices = function (callback) {
  process.nextTick(() => {
    var devices = [], i = 0;

    for(i = 0; i < 1000; i += 1) {
      devices.push({
        "connectionStateUpdatedTime":	"2016-10-23T15:57:27.1156664",
        "cloudToDeviceMessageCount":	Math.floor(Math.random() * 100),
        "connectionState": (i % 3 === 0) ? "Connected" : "Disconnected",
        "lastActivityTime":	"2016-10-23T16:26:48.8158709",
        "etag":	"Mg==",
        "statusUpdatedTime":	"2016-10-23T15:57:06.0688578",
        "deviceId":	"lab-pi2-" + FormatNumber(i, 3),
        "authentication" : { "crap": "for real" },
        "generationId":	"635973932684645682",
        "status":	(i % 2 === 0) ? "enabled" : "disabled"
      });
    }

    callback(null, devices);
  });
};

if (global.mockdata_instance === undefined) {
  global.mockdata_instance = new MockData();
}
module.exports = global.mockdata_instance;

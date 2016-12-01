const electron = require('electron');
const fs = require('fs');
const path = require('path');

const dir = electron.app.getPath('userData');

var filename = path.resolve(dir, 'iothubtool.cfg');

function Config() {
  var self = this;

};

Config.prototype.get = function (callback) {
  fs.readFile(filename, { 'encoding': 'utf8' }, (err, data) => {
    var str = '';
    if (err) {
      callback(err);
    } else {
      try {
        str = JSON.parse(data);
        callback(null, str);
      } catch (e) {
        callback(e);
      }
    }
  })
};

Config.prototype.set = function(data, callback) {
  fs.writeFile(filename, JSON.stringify(data), (err) => {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  })
};

if (global.config_instance === undefined) {
  global.config_instance = new Config();
}

module.exports = global.config_instance;

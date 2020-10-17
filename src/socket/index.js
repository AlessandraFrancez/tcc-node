const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');

class EventsSockets {
  initialize() {
    const isDirectory = (source) => lstatSync(source).isDirectory();
    const getDirectories = (source) => readdirSync(source).filter((name) => isDirectory(join(source, name)));
    getDirectories(join(__dirname, 'modules')).forEach((route) => {
      const module = require(`./modules/${route}`);
      if (!module.disabled && typeof module.app === 'function') {
        module.app();
      }
    });
  }
}

module.exports = new EventsSockets();

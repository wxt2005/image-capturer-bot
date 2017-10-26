'use strict';

const _ = require('lodash');
const util = require('util');
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const appendFilePromise = util.promisify(fs.appendFile);
const writeFilePromise = util.promisify(fs.writeFile);

class Store {
  constructor({ directory } = {}) {
    this.directory = directory;
    fse.ensureDirSync(this.directory);

    let snapshot = {};
    const snapshotPath = path.resolve(directory, 'store.json');
    const snapshotExist = fse.pathExistsSync(snapshotPath);
    if (snapshotExist) {
      try {
        snapshot = fse.readJsonSync(snapshotPath);
      } catch (e) {
        // noop
      }
    }
    this.store = snapshot;

    this.snapshotFilePath = path.resolve(this.directory, 'store.json');
    fse.ensureFileSync(this.snapshotFilePath);

    this.logFilePath = path.resolve(this.directory, 'log');
    fse.ensureFileSync(this.logFilePath);

    this.operationId = 0;

    this.lastSnapshotVersionPath = path.resolve(this.directory, 'last');
    fse.ensureFileSync(this.lastSnapshotVersionPath);

    this.replayLog();
  }

  * set(path, value) {
    this.setWithoutLog(path, value);
    yield this.writeLog('set', path, value);
  }

  setWithoutLog(path, value) {
    _.set(this.store, path, value);
  }

  * unset(path) {
    this.unsetWithoutLog(path);
    yield this.writeLog('unset', path);
  }

  unsetWithoutLog(path) {
    _.unset(this.store, path);
  }

  get(path) {
    return _.get(this.store, path);
  }

  getAll() {
    return this.store;
  }

  * saveSnapshot() {
    yield writeFilePromise(this.lastSnapshotVersionPath, this.operationId);
    yield fse.writeJson(this.snapshotFilePath, this.store);
  }

  * writeLog(type, path, value) {
    let logText = '';

    switch (type) {
      case 'set':
        logText = `${type} ${path} ${JSON.stringify(value)}`;
        break;

      case 'unset':
        logText = `${type} ${path}`;
        break;

      default:
        // noop
    }

    if (logText) {
      this.operationId++;
      yield appendFilePromise(this.logFilePath, `${this.operationId} ${logText}\n`);
      this.lastSnapshotVersion = this.operationId;
    }
  }

  replayLog() {
    const lastSnapshotVersionExist = fse.pathExistsSync(this.lastSnapshotVersionPath);
    this.lastSnapshotVersion = 0;
    if (lastSnapshotVersionExist) {
      try {
        const lastSnapshotVersionContent = fs.readFileSync(this.lastSnapshotVersionPath, { encoding: 'utf8' });
        if (lastSnapshotVersionContent) {
          this.lastSnapshotVersion = parseInt(lastSnapshotVersionContent, 10);
        }
      } catch (e) {
        // empty file
        fs.writeFileSync(this.lastSnapshotVersionPath, '');
      }
    }

    const logFile = fs.readFileSync(this.logFilePath, { encoding: 'utf8' });
    const logs = logFile.split(/\n/);

    for (const log of logs) {
      if (!log) {
        continue;
      }

      const [ version, type, path, value ] = log.split(/\s/);
      const versionNum = parseInt(version, 10);

      if (versionNum <= this.lastSnapshotVersion) {
        continue;
      }

      switch (type) {
        case 'set':
          this.setWithoutLog(path, JSON.parse(value));
          this.operationId = versionNum;
          break;

        case 'unset':
          this.unsetWithoutLog(path);
          this.operationId = versionNum;
          break;

        default:
          // noop
      }
    }
  }
}

module.exports = Store;

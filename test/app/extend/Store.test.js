'use strict';
const mm = require('egg-mock');
const assert = require('assert');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

describe('test/app/extend/Store.test.js', () => {
  let app;
  let lastVersionFilePath = '';
  let logFilePath = '';
  let storeFilePath = '';

  before(() => {
    app = mm.app();
    return app.ready();
  });

  afterEach(mm.restore);
  after(() => app.close());

  it('should get snapshot correctly', function* () {
    const directory = app.config.memStore.directory;
    lastVersionFilePath = path.resolve(directory, 'last');
    logFilePath = path.resolve(directory, 'log');
    storeFilePath = path.resolve(directory, 'store.json');

    fse.ensureFileSync(lastVersionFilePath);
    fse.ensureFileSync(logFilePath);
    fse.ensureFileSync(storeFilePath);
    fs.writeFileSync(lastVersionFilePath, 2);
    fs.writeFileSync(logFilePath,
// eslint-disable-next-line
`1 set a "a"
2 set b "b"
3 set c {"cc":"cc"}
4 set d.dd "dd"
5 unset b
`
    );
    fs.writeFileSync(storeFilePath, '{"a":"a"}');


    const data = app.memStore.getAll();

    assert.equal(data.a, 'a');
  });

  it('should replay correctly', function* () {
    const data = app.memStore.getAll();

    assert.strictEqual(data.b, undefined);
    assert.equal(data.c.cc, 'cc');
    assert.equal(data.d.dd, 'dd');
  });

  it('should get same value as set', function* () {
    yield app.memStore.set('x', 1);
    assert.equal(app.memStore.get('x'), 1);

    yield app.memStore.set('y.z', 'y.z');
    assert.equal(app.memStore.get('y.z'), 'y.z');
  });

  it('should unset value properly', function* () {
    yield app.memStore.unset('x');
    assert.strictEqual(app.memStore.get('x'), undefined);
  });


  it('should properly update operation log', function* () {
    const logFile = fs.readFileSync(logFilePath, { encoding: 'utf8' });
    const logs = logFile.split(/\n/);

    // with addition empty line, 8 + 1
    assert.equal(logs.length, 9);
    assert.equal(logs[logs.length - 2].split(/\s/)[0], 8);
  });

  it('should correctly save snapshot', function* () {
    yield app.memStore.saveSnapshot();
    const storeFile = fs.readFileSync(storeFilePath, { encoding: 'utf8' });
    const storeJSON = JSON.parse(storeFile);

    assert.equal(storeJSON.y.z, 'y.z');

    const lastVersion = fs.readFileSync(lastVersionFilePath, { encoding: 'utf8' });
    assert.equal(lastVersion, 8);
  });
});

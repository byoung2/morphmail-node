const DB = require('../../lib/db');
const assert = require('assert');
const fs = require('fs');

describe('DB', function() {
    describe('initialize', function() {
        it('should throw an error for non JSON DB type', function() {
            assert.throws(() => {
                const db = DB.instance('randomDB', 'mysql');
            });
        });
    });

    describe('CRUD', function() {
        const db = DB.instance('db/testDB', 'json');
        it('should write to the DB', function() {
            db.add('test/path', 'hello');
            const get = db.get('test/path');
            assert.equal(get, 'hello');
        });

        it('should write nested object', function() {
            db.add('employees/123/job/title', 'manager');
            const get = db.get('employees/123/job/title');
            assert.equal(get, 'manager');
        });

        it('should append array element', function() {
            db.add('peers/local', ['1.1.1.1']);
            db.add('peers/local[]', ['2.2.2.2']);
            const get = db.get('peers/local[1]');
            assert.equal(get, '2.2.2.2');
        });

        it('should overwrite array', function() {
            db.add('peers/local', ['4.4.4.4'], true);
            const get = db.get('peers/local');
            assert.equal(get.length, 1);
            assert.equal(get[0], '4.4.4.4');
        });

        it('should delete from the DB', function() {
            db.delete('test/path');
            assert.throws(() => db.get('test/path'));
        });

        after(async function(){
            return fs.promises.unlink('db/testDB.json');
        });
    });
});
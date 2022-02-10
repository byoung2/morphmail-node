const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

class DB {
    constructor(name, type="json") {
        if(type === 'json') {
            this.db = new JsonDB(new Config(name, true, true, '/'));
        } else {
            throw new Error("Only json databases are supported at this time");
        }
    }

    add(path, value, overwrite) {
        return this.db.push(path, value, overwrite);
    }

    get(path) {
        return this.db.getData(path);
    }

    delete(path) {
        return this.db.delete(path);
    }
}

module.exports.instance = (name, type) => {
    return new DB(name, type);
};
module.exports.model = DB;
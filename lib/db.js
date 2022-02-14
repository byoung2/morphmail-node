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

    /**
     * Add a value to the database, optionally overwriting
     *
     * @public
     * @param {string} path Path with leading slash.
     * @param {*} value Value of any type to save.
     * @param {boolean=} overwrite Overwrite or merge recursively, default overwrite.
     * @returns {boolean} true on success
     */
    add(path, value, overwrite) {
        return this.db.push(path, value, overwrite);
    }

    /**
     * Get a value from the database
     *
     * @public
     * @param {string} path Path with leading slash.
     * @returns {*} the data or null
     * @throws {Error} Throws error on invalid path
     */
    get(path) {
        return this.db.getData(path);
    }

    /**
     * Delete a value from the database
     *
     * @public
     * @param {string} path Path with leading slash.
     * @returns {boolean} true on success
     */
    delete(path) {
        return this.db.delete(path);
    }
}

module.exports.instance = (name, type) => {
    return new DB(name, type);
};
module.exports.model = DB;
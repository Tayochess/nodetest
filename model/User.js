const database = require('../database');

class User {
    constructor() {
        this.db = database;
        this.tableName = "users";
    }

    get(prop) {
        return this.db.select()
            .from(this.tableName)
            .where(prop)
            .then((data) => data[0]);
    }

    create(name, email, password) {
        return this.db(this.tableName).insert({
            'name': name,
            'email': email,
            'password': password
        })
        .then((data) => data[0]);
    }
}

module.exports = new User();
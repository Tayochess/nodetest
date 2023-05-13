const database = require('../database');

class News {
    constructor() {
        this.db = database;
        this.tableName = "news";
    }

    getNews(id) {
        return this.db.select()
            .from(this.tableName)
            .where({ id })
            .then((data) => data[0]);
    }

    getPage(page) {
        const limit = 20;
        let offset = (page - 1) * limit;

        return this.db.select('*', this.db.raw(`(SELECT name FROM users WHERE users.id = ${this.tableName}.author LIMIT 1) AS username`))
            .from(this.tableName)
            .orderBy('id', 'desc')
            .limit(limit)
            .offset(offset);
    }

    getPageByUser(page, author) {
        const limit = 10;
        let offset = (page - 1) * limit;

        return this.db.select()
            .from(this.tableName)
            .where({ author })
            .orderBy('id', 'desc')
            .limit(limit)
            .offset(offset);
    }

    getAuthor(id) {
        return this.db.select('author')
            .from(this.tableName)
            .where({ id })
            .then((data) => data[0]);
    }

    create(text, files, author) {
        return this.db(this.tableName).insert({
            'text': text,
            'files': files,
            'date': this.db.fn.now(),
            'author': author,
        })
        .then((data) => data[0]);
    }

    update(id, text, files) {
        return this.db(this.tableName).update({
            'text': text,
            'files': files,
        })
        .where({ id })
        .then((data) => data[0]);
    }

    delete(id) {
        return this.db(this.tableName)
        .where({ id })
        .del()
        .returning('id');
    }
}

module.exports = new News();
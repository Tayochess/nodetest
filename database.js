const config = require('./config');

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: config.DB_HOST,
        port: config.DB_PORT || 5432,
        database: config.DB_NAME,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
    }
});

module.exports = knex;
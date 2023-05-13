const express = require('express');
const nunjucks = require('nunjucks');
const cookieParser = require("cookie-parser");

const routes = require('./routes/index');
const config = require('./config');

const app = new express();

nunjucks.configure('views', {
    autoescape: true,
    express: app,
});

app.set('view engine', 'njk');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', routes);
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({ error: err });
});

app.listen(config.PORT);
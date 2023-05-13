const jwt = require("jsonwebtoken");

const config = require('../config');

const verifyToken = (req, res, next) => {
    if (!req.cookies['secretToken']) {
        return next();
    }

    try {
        const decoded = jwt.verify(req.cookies['secretToken'], config.TOKEN_SECRET);
        req.user = decoded;
    } catch (err) {
        console.log(err);
    }

    return next();
};

module.exports = verifyToken;
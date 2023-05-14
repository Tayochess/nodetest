const express = require('express');
const jwt = require('jsonwebtoken');
const pick = require('lodash/pick');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const config = require('../config');
const auth = require('../middleware/auth');
const User = require('../model/User');
const News = require('../model/News');

const router = express.Router();
const uploadDir = config.ROOT("public/upload");

const fileFilter = (req, file, cb) => {
    cb(null, file.mimetype.match(/^image\//))
};

const upload = multer({
    dest: uploadDir,
    fileFilter,
    limits: {
        fileSize: 100485760,
    },
});

const checkUploadAuthCreate = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/create/?authFailed=true');
    }

    return next();
};

const checkUploadAuthEdit = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send('You need to log in');
    }

    return next();
};

router.use(express.json());

router
    .route('/')
    .get((req, res) => {
        return res.redirect('/feed/1');
    });

router
    .route('/feed/:page')
    .get(auth, async (req, res) => {
        try {
            const page = parseInt(req.params.page);

            if (isNaN(page)) {
                return res.redirect('/feed/1')
            }

            const news = await News.getPage(page);
            
            let newsFormatted = news.map((item) => {
                let date = new Date(item.date);
                let dateFormatted = date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear();

                return {
                    ...item,
                    dateFormatted: dateFormatted,
                }
            });

            return res.render('nodes/index', {
                page: page,
                news: newsFormatted,
                user: req.user
            });
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/posts/:page')
    .get(auth, async (req, res) => {
        try {
            const page = parseInt(req.params.page);

            if (!req.user || isNaN(page)) {
                return res.redirect('/feed/1')
            }

            const news = await News.getPageByUser(page, req.user.user_id);

            return res.render('nodes/posts', {
                page: page,
                news: news,
                user: req.user
            });
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/login')
    .get((req, res) => {   
        return res.render('nodes/login', {
            authFailed: req.query.authFailed === "true"
        });
    });

router
    .route('/signup')
    .get((req, res) => {   
        return res.render('nodes/signup', {
            signupFailed: req.query.signupFailed === "true"
        });
    });

router
    .route('/create')
    .get((req, res) => {
        return res.render('nodes/addNews', {
            success: req.query.success === "true",
            authFailed: req.query.authFailed === "true"
        });
    });

router
    .route('/edit/:postId')
    .get(auth, async (req, res) => {
        try {
            const postId = parseInt(req.params.postId);

            if (!req.user || isNaN(postId)) {
                return res.redirect('/feed/1')
            }

            const news = await News.getNews(postId);

            return res.render('nodes/editNews', {
                news: news,
                user: req.user
            });
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/logout')
    .get(async (req, res) => {
        try {
            return res.clearCookie("secretToken").redirect('/feed/1');
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/signup')
    .post(async (req, res) => {
        try {
            const { username, email, password } = pick(req.body, 'username', 'email', 'password');

            if (!(email && password && username)) {
                return res.redirect('/signup/?signupFailed=true');
            }

            const userExists = await User.get({ email });

            if (userExists) {
                return res.redirect('/signup/?signupFailed=true');
            }

            encryptedPassword = await bcrypt.hash(password, 10);

            await User.create(
                username,
                email.toLowerCase(),
                encryptedPassword,
            );

            return res.redirect('/login');
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/login')
    .post(async (req, res) => {
        try {
            const { email, password } = pick(req.body, 'email', 'password');

            if (!(email && password)) {
                return res.redirect('/login/?authFailed=true');
            }

            const user = await User.get({ email });

            if (user && (await bcrypt.compare(password, user.password))) {
                const token = jwt.sign(
                    { user_id: user.id, email },
                    config.TOKEN_SECRET,
                    {
                        expiresIn: "1h",
                    }
                );

                return res.cookie("secretToken", token, { httpOnly: true }).redirect('/feed/1');
            } else {
                return res.redirect('/login/?authFailed=true');
            }
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/create')
    .post(auth, checkUploadAuthCreate, upload.array("media"), async (req, res) => {  
        try {
            const { text } = pick(req.body, 'text');

            if (!text) {
                return res.redirect('/create/?authFailed=true');
            }

            const files = req.files.map((item) => item.filename);

            let news = await News.create(text, files, req.user.user_id);

            return res.redirect('/create/?success=true');
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/edit')
    .post(auth, checkUploadAuthEdit, upload.array("media"), async (req, res) => {  
        try {
            const { postId, text, oldFiles, deletedFiles } = pick(req.body, 'postId', 'text', 'oldFiles', 'deletedFiles');

            if (isNaN(postId)) {
                return res.status(400).send('Incorrect query');
            }

            let files = req.files.map((item) => item.filename);
            if (oldFiles.length > 0) {
                files = files.concat(oldFiles.split(','));
            }

            if (deletedFiles.length > 0) {
                let filesToDelete = deletedFiles.split(',');

                filesToDelete.forEach((file) => {
                    fs.rm(`${uploadDir}/${file}`, (err) => { console.log(err); });
                });
            }
            
            let news = await News.update(postId, text, files);

            return res.status(200).send('Post updated');
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/delete/:id')
    .delete(auth, upload.array("media"), async (req, res) => {  
        try {
            if (!req.user) {
                return res.status(401).send('You need to log in');
            }

            const postId = parseInt(req.params.id);
            
            if (isNaN(postId)) {
                return res.status(400).send('Incorrect query');
            }

            let news = await News.getNews(postId);

            if (req.user.user_id != news.author) {
                return res.status(400).send('Incorrect query');
            }

            news.files.forEach((file) => {
                fs.rm(`${uploadDir}/${file}`, (err) => { console.log(err); });
            });

            await News.delete(postId);

            return res.status(200).send('Post deleted');
        } catch (err) {
            console.log(err);
            return res.status(400).send('Error');
        }
    });

module.exports = router;
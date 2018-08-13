let authController = require('../controllers/authcontroller.js');
let express = require('express');
let passport = require('passport');
let router = express.Router();

router.get('/signup', authController.signup);

router.get('/signin', authController.signin);

router.post('/signup', passport.authenticate('local-signup', {failureRedirect: '/signup'}),
    function(req, res) {
        let isAuth = res.req.session.passport.user; //session user id
        let nickname = res.req.user.nickname;

        res.render('pages/game/index', {
            title: "Выбор режима",
            isAuth: isAuth,
            nickname: nickname
        });
    }
);

router.get('/logout', authController.logout);

router.post('/signin', passport.authenticate('local-signin', {failureRedirect: '/signin'}),
    function(req, res) {
        let isAuth = res.req.session.passport.user; //session user id
        let nickname = res.req.user.nickname;

        res.render('pages/game/index', {
            title: "Выбор режима",
            isAuth: isAuth,
            nickname: nickname
        });
    }
);

router.get('/signguest', passport.authenticate('local-signguest', {
        failureRedirect: '/signup'
    }
),
    function(req, res) {
        res.redirect('/game');
    }
);

module.exports = router;

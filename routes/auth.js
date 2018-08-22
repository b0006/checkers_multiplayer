let authController = require('../controllers/authcontroller.js');
let express = require('express');
let passport = require('passport');
let router = express.Router();

router.get("/verify", authController.verify);

router.get('/signup', authController.signup);

router.get('/signin', authController.signin);

// router.post('/signup', passport.authenticate('local-signup', {
//     failureRedirect: '/signup'
// }),
//     function(req, res) {
//         res.redirect('/game');
//     }
// );

router.post('/signup', function(req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            // *** Display message without using flash option
            // re-render the login form with a message
            return res.render('pages/auth/signup', { errorRegisterMessage: info.message })
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/game');
        });
    })(req, res, next);
});

router.get('/logout', authController.logout);

// router.post('/signin', passport.authenticate('local-signin', {failureRedirect: '/signin'}),
//     function(req, res) {
//         res.redirect('/game');
//     }
// );

router.post('/signin', function(req, res, next) {

    passport.authenticate('local-signin', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            // *** Display message without using flash option
            // re-render the login form with a message
            return res.render('pages/auth/signin', { errorAuthMessage: info.message })
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/game');
        });
    })(req, res, next);
});

router.get('/signguest', passport.authenticate('local-signguest', {failureRedirect: '/signup'}),
    function(req, res) {
        res.redirect('/game');
    }
);

module.exports = router;

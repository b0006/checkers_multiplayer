let authController = require('../controllers/authcontroller.js');
let express = require('express');
let passport = require('passport');
let router = express.Router();

router.get('/signup', authController.signup);

router.get('/signin', authController.signin);

router.post('/signup', passport.authenticate('local-signup', {failureRedirect: '/signup'}),
    function(req, res) {
        res.redirect('/game');
    }
);

router.get('/logout', authController.logout);

router.post('/signin', passport.authenticate('local-signin', {failureRedirect: '/signin'}),
    function(req, res) {
        res.redirect('/game');
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

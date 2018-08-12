let authController = require('../controllers/authcontroller.js');
let express = require('express');
let passport = require('passport');
let router = express.Router();

router.get('/signup', authController.signup);

router.get('/signin', authController.signin);

router.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/game',
        failureRedirect: '/signup'
    }
));

router.get('/logout', authController.logout);

router.post('/signin', passport.authenticate('local-signin', {
        successRedirect: '/game',
        failureRedirect: '/signin'
    }
));

router.get('/signguest', passport.authenticate('local-signguest', {
        failureRedirect: '/signup'
    }
),
    function(req, res) {
    let new_guest_id = res.req.user.dataValues.id;
        res.render('pages/game/index', {
            title: "Выбор режима",
            temp_user_id: new_guest_id
        });
    }
);

module.exports = router;

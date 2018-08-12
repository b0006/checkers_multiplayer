let express = require('express');
let router = express.Router();

let date = new Date().getDate() + "." + (new Date().getMonth() + 1) + "." + new Date().getFullYear();

let sess;

/* GET start main page. */
router.get('/', function(req, res, next) {
    res.render('pages/auth/main', {
        title: 'Шашки',
        current_date: date
    });
});


/* GET start main page. */
router.get('/game', isLoggedIn, function(req, res, next) {
    res.render('pages/game/index', {
        title: 'Шашки',
        current_date: date
    });
});

router.post('/game/ai', isLoggedIn, function(req, res, next) {
    console.log(req.body);

    res.render('pages/game/index', {
        title: 'Шашки',
        level: req.body.level,
        game_mode: req.body.game_mode,
        color_potencial_step: req.body.color_potencial_step,
        time_check_checkbox: req.body.time_check_checkbox,
        time_check_text: req.body.time_check_text,
        multiattack: req.body.multiattack,
        fuchs: req.body.fuchs,
        simple_back_attack: req.body.simple_back_attack,
        color_potencial_fuchs: req.body.color_potencial_fuchs,
        type_game: req.body.type_game,
        current_date: date
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/signin');
}

module.exports = router;
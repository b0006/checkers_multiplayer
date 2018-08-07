let express = require('express');
let router = express.Router();

let date = new Date().getDate() + "." + (new Date().getMonth() + 1) + "." + new Date().getFullYear();

/* GET start main page. */
router.get('/', function(req, res, next) {
    res.render('index.jade', {
        title: 'Шашки',
        current_date: date
    });
});

router.post('/ai', function(req, res, next) {
    console.log(req.body);

    res.render('index.jade', {
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

router.get('/good', function(req, res, next) {
    res.render('good.jade', {
        title: 'Шашки',
        current_date: date
    });
});

module.exports = router;
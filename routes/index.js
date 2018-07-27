let express = require('express');
let router = express.Router();

/* GET start main page. */
router.get('/', function(req, res, next) {
    res.render('index.jade', {
        title: 'Шашки',
    });
});

router.post('/game', function(req, res, next) {
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
        simple_back_attack: req.body.simple_back_attack
    });
});

module.exports = router;
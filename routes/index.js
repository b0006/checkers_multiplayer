let express = require('express');
let router = express.Router();
let date = new Date().getDate() + "." + (new Date().getMonth() + 1) + "." + new Date().getFullYear();
let path = require("path");
let env = process.env.NODE_ENV || "development";
let Sequelize = require("sequelize");
let config = require(path.join(__dirname, '..', './app/config', 'config.json'))[env];
let sequelize = new Sequelize(config.database, config.username, config.password, config);


/* GET start main page. */
router.get('/', function(req, res, next) {
    let isAuth = false;
    let nickname = null;

    try {
        isAuth = res.req.session.passport.user; //session user id
        nickname = res.req.user.nickname;

    }
    catch (e) {

    }

    res.render('pages/auth/main', {
        title: 'Шашки',
        current_date: date,
        isAuth: isAuth,
        nickname: nickname
    });
});


/* GET start main page. */
router.get('/game', isLoggedIn, function(req, res, next) {
    let isAuth = res.req.session.passport.user; //session user id
    let nickname = res.req.user.nickname;

    sequelize.query("SELECT * FROM users WHERE id = " + isAuth).spread((results, metadata) => {
        let isActive = false;
        results.forEach(function (value) {
            if(value.active === 1) {
                isActive = true;
            }
        });

        if(isActive) {
            res.render('pages/game/index', {
                title: 'Шашки',
                current_date: date,
                isAuth: isAuth,
                nickname: nickname
            });
        }
        else {
            res.render('pages/auth/main', {
                title: 'Шашки',
                activeMessage: "На ваш Email пришло сообщение. Пожалуйста, прочтите его",
                isAuth: isAuth,
                nickname: nickname
            });
        }
    })
});

router.post('/game/ai', isLoggedIn, function(req, res, next) {
    console.log(req.body);
    let isAuth = res.req.session.passport.user; //session user id
    let nickname = res.req.user.nickname;

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
        current_date: date,
        isAuth: isAuth,
        nickname: nickname
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/signin');
}

function isActiveUser(req, res, next) {
    let user_id = res.req.session.passport.user; //session user id

    sequelize.query("SELECT * FROM users WHERE id = " + user_id).spread((results, metadata) => {
        let isActive = false;
        results.forEach(function (value) {
            if(value.active === 1) {
                isActive = true;
            }
        });

        if(isActive) {
            return next;
        }
        else {
            return next;
        }
    })

}

module.exports = router;
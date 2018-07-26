let express = require('express');
let router = express.Router();

/* GET start main page. */
router.get('/', function(req, res, next) {
    res.render('index.jade', {
        title: 'Шашки',
    });
});

router.post('/', function(req, res, next) {

    let level = req.body.level;

    res.render('index.jade', {
        title: 'Шашки',
        level: level
    });
});

module.exports = router;
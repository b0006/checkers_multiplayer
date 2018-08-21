let express = require('express');
let router = express.Router();

/**
 * @param ratingA рейтинг игрока
 * @param ratingB рейтинг соперника
 * @param result результат игры (относительно игрока A)
 * 0 - победил
 * 1 - проиграл
 * 2 - ничья
 * @param noob новичок (0 нет/1 да)
 * @returns {string} если игрок сыграл меньше или ровно 30 партий - он является новичком
 */

function getRatingElo(ratingA, ratingB, result, noob){
    // Ea - математическое ожидание
    // ratingA - рейтинг игрока
    // ratingB - рейтинг соперника
    let Ea = 1 / (1 + Math.pow(10,(ratingB - ratingA) / 400));
    // K - коэффициент силы игрока
    let K = 0;
    let Sa = 0;
    (noob === 1 ? K = 30 : (ratingA < 2400 ? K = 15 : K = 10));
    // Sa - начисление очков в соответствии с результатом
    (result === 0 ? Sa = 1 : (result === 2 ? Sa = 0.5 : Sa = 0));
    // Новый рейтинг
    return (ratingA + K * (Sa - Ea)).toFixed();
}

router.get('/rating_users', function(req, res, next) {
    res.render('pages/another/rating_users', {
        title: 'Рейтинг игроков',
    });
});

module.exports = router;
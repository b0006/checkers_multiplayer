let path = require("path");
let env = process.env.NODE_ENV || "development";
let Sequelize = require("sequelize");
let config = require(path.join(__dirname, '..', './app/config', 'config.json'))[env];
let sequelize = new Sequelize(config.database, config.username, config.password, config);
let md5 = require("../md5");

module.exports.signup = function(req,res){
    res.render('./pages/auth/signup');
};

module.exports.signin = function(req,res){
    res.render('./pages/auth/signin');
};

module.exports.signguest = function(req,res){
    console.log(req);
};

module.exports.logout = function(req,res){
    req.session.destroy(function(err) {
        res.redirect('/');
    });
};

module.exports.verify = function (req, res) {
    let user_id = req.query.id;
    let hash_from_email = req.query.hash;
    let hash_from_db = "";

    sequelize.query("SELECT * FROM users WHERE id = " + user_id).spread((results, metadata) => {
        results.forEach(function (value) {
            hash_from_db = md5.getMD5fromString(value.email);

            if(hash_from_email === hash_from_db) { //значит все ок
                sequelize.query("UPDATE users SET active = 1 WHERE id = " + user_id).spread((results, metadata) => {
                    if(results.changedRows) {
                        // пользователь активирован
                        res.redirect("/game");
                    }
                    else {
                        // ошибка активации
                        res.redirect("/");
                    }
                })
            }
        })
    })
};
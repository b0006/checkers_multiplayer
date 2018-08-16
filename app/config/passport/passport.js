let path = require("path");
let env = process.env.NODE_ENV || "development";
let Sequelize = require("sequelize");
let config = require(path.join(__dirname, '..', '', 'config.json'))[env];
let sequelize = new Sequelize(config.database, config.username, config.password, config);
let nodemailer = require("nodemailer");
let bCrypt = require('bcrypt-nodejs');
let md5 = require("../../../md5");

let smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "qsefthuken@gmail.com",
        pass: "13820004"
    }
});

module.exports = function(passport, user) {

    // инициализируем локальную стратегию паспорта и модель пользователя
    let User = user;
    let LocalStrategy = require('passport-local').Strategy;
    let CustomStrategy = require('passport-custom').Strategy;

    // определяем нашу пользовательскую стратегию с нашим экземпляром LocalStrategy
    passport.use('local-signup', new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'hash',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },

        function(req, email, hash, done) {
            let generateHash = function(hash) {
                return bCrypt.hashSync(hash, bCrypt.genSaltSync(8), null);
            };

            User.findOne({
                where: {
                    email: email
                }
            }).then(function(user) {

                if (user)
                {
                    return done(null, false, {
                        message: 'That email is already taken'
                    });

                }
                else
                {
                    let userPassword = generateHash(hash);
                    let data =
                        {
                            email: email,
                            hash: userPassword,
                            nickname: req.body.nickname,
                            active: 0
                        };

                    User.create(data).then(function(newUser, created) {

                        if (!newUser) {
                            return done(null, false);
                        }

                        if (newUser) {

                            //send to email for verify
                            let new_user_id = newUser.dataValues.id;

                            let rand = md5.getMD5fromString(email);
                            console.log(rand);

                            let host = req.get('host');
                            let link="http://"+host+"/verify?id="+new_user_id+"&hash="+rand;
                            let mailOptions={
                                to : email,
                                subject : "Здравствуйте! Пожалуйста, подтвержите ваш Email",
                                html : "Здравствуйте, "+req.body.nickname+".<br> Пожалуйста, кликните по данной ссылке, чтобы подтвердить Ваш email.<br><a href="+link+">Подтвердить</a>"
                            }

                            smtpTransport.sendMail(mailOptions, function(error, response) {
                                if (error) {
                                    console.log("Message not send");
                                    console.log(error);
                                } else {
                                    console.log("Message send");
                                }
                            });

                            return done(null, newUser);
                        }
                    });
                }
            });
        }
    ));

    //serialize
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // deserialize user
    passport.deserializeUser(function(id, done) {
        User.findById(id).then(function(user) {
            if (user) {
                done(null, user.get());
            } else {
                done(user.errors, null);
            }
        });
    });

    //LOCAL SIGNIN
    passport.use('local-signin', new LocalStrategy(
        {
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback

        },

        function(req, email, password, done) {

            let User = user;

            let isValidPassword = function(userpass, password) {

                return bCrypt.compareSync(password, userpass);

            }

            User.findOne({
                where: {
                    email: email
                }
            }).then(function(user) {

                if (!user) {
                    console.log("Email does not exist")

                    return done(null, false, {
                        message: 'Email does not exist'
                    });

                }

                if (!isValidPassword(user.hash, password)) {
                    console.log("Incorrect password")
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });

                }

                let userinfo = user.get();
                return done(null, userinfo);

            }).catch(function(err) {

                console.log("Error:", err);

                return done(null, false, {
                    message: 'Something went wrong with your Signin'
                });

            });


        }

    ));


    passport.use('local-signguest', new CustomStrategy(

        function(req, done) {
            let User = user;

            let data = { nickname: "anonymus"};

            User.create(data).then(function(newUser, created) {
                if (!newUser) {
                    return done(null, false);
                }
                if (newUser) {
                    return done(null, newUser);
                }
            });
        }
    ));


};
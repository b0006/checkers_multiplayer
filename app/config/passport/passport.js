let path = require("path");
let env = process.env.NODE_ENV || "development";
let Sequelize = require("sequelize");
let config = require(path.join(__dirname, '..', '', 'config.json'))[env];
let sequelize = new Sequelize(config.database, config.username, config.password, config);

let bCrypt = require('bcrypt-nodejs');

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
                        };

                    User.create(data).then(function(newUser, created) {

                        if (!newUser) {
                            return done(null, false);
                        }

                        if (newUser) {
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


                var userinfo = user.get();
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
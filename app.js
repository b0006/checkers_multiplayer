let express = require('express');
let app = express();
let path = require ('path');
let fs = require("fs");
let passport   = require('passport');
let session = require('express-session');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3015;
let logic_db = require('./logic_database');

let env = require('dotenv').load();

//Routes
// let authRoute = require('./routes/auth.js')(app, passport);
let authRoute = require('./routes/auth.js');

//Models
let models = require("./app/models");

//Sync Database
models.sequelize.sync().then(function() {
    console.log('Nice! Database looks fine')
}).catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!")
});

//load passport strategies
require('./app/config/passport/passport.js')(passport, models.user);

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let parserRouter = require('./routes/parser');
let anotherRouter = require('./routes/another');

app.use(express.static('public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// For Passport
app.use(session({
    secret: 'punks not dead',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 24*60*60*1000,
        expires:  24*60*60*1000
    }
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use('/', indexRouter);
app.use('/', parserRouter);
app.use('/', usersRouter);
app.use('/', authRoute);
app.use('/', anotherRouter);

let lobbyUsers = {};
let users = {};
let activeGames = {};

io.on('connection', function(socket) {
    console.log('new connection ');
    // console.log(socket);

    socket.on('login', function(userId) {
        doLogin(socket, userId);
    });

    function doLogin(socket, userId) {
        socket.userId = userId;

        if (!users[userId]) {
            console.log('creating new user');
            users[userId] = {userId: socket.userId, games:{}};
        } else {

            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
                console.log('gameid - ' + gameId);
            });
        }

        socket.emit('login', {users: Object.keys(lobbyUsers),
            games: Object.keys(users[userId].games)});
        lobbyUsers[userId] = socket;

        socket.broadcast.emit('joinlobby', socket.userId);
    }

    socket.on('set_setting',  function (msg){
        socket.broadcast.emit('set_setting', msg);
    });

    socket.on('invite', function(msg) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + msg.user);

        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', msg.user);

        //return id_game
        let msg_db = Object.assign(msg, {white: socket.userId, black: msg.user});
        let id_game = logic_db.create_game_db(msg_db);

        id_game.then(result => {
            let game = {
                id: result,
                users: {white: socket.userId, black: msg.user}
            };

            socket.gameId = game.id;
            activeGames[game.id] = game;

            users[game.users.white].games[game.id] = game.id;
            users[game.users.black].games[game.id] = game.id;

            console.log('starting game: ' + game.id);

            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white', settings: msg.settings_game});
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black', settings: msg.settings_game});

            delete lobbyUsers[game.users.white];
            delete lobbyUsers[game.users.black];

            socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game, settings: msg.settings_game});
        });


    });

    socket.on('resumegame', function(msg) {
        console.log('ready to resume game: ' + msg.gameId);

        socket.gameId = msg.gameId;
        let game = activeGames[msg.gameId];

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log('resuming game: ' + game.id);
        if (lobbyUsers[game.users.white]) {
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white', settings: msg.settings_game});
            delete lobbyUsers[game.users.white];
        }

        if (lobbyUsers[game.users.black]) {
            lobbyUsers[game.users.black] &&
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black', settings: msg.settings_game});
            delete lobbyUsers[game.users.black];
        }
    });

    socket.on('log', function (msg) {
        let id_game = msg.id_game;
        let level_game = msg.level_game;
        fs.appendFileSync("./log/CP/"+ level_game +"/" + id_game + ".txt", msg.text);
    });

    socket.on('fuch', function (msg) {
        socket.broadcast.emit('fuch', msg);
    });

    socket.on('step', function (msg) {
        logic_db.add_move_db(msg, false);
        socket.broadcast.emit('step', msg);
    });

    socket.on('attack', function (msg) {
        logic_db.add_move_db(msg, true);
        socket.broadcast.emit('attack', msg);
    });

    socket.on('gameover', function (msg) {
        logic_db.set_end_game(msg);
        socket.broadcast.emit('gameover', msg);
    });

    socket.on('choose_game', function (msg) {
        socket.broadcast.emit('choose_game', msg);
    });

    socket.on('chat', function (msg) {
        logic_db.add_chat_db(msg);
        socket.broadcast.emit('chat', msg);
    });

    socket.on('get_my_games', function (msg) {
        let games = logic_db.get_my_games(msg);
        games.then(result => {
            let arTypes = result[1];
            let arGames = result[0];

            arGames.forEach(function (value_game, index_game) {
                arTypes.forEach(function (value_type) {
                    if(arGames[index_game].type_game === value_type.id) {
                        arGames[index_game].type_game = value_type.type_game;
                    }
                });
            });

            lobbyUsers[msg.nickname].emit('get_array_my_games', {
                games: arGames
            });

        });
    });

    socket.on('invite_to_resume_game', function (msg) {
        try {
            lobbyUsers[msg.who_invited].emit('invite_to_resume_game', msg)
        }
        catch (e) {
            lobbyUsers[msg.who_invite].emit('invite_to_resume_game', {
                error: true,
                message: "Игрок '" + msg.who_invited + "' не онлайн"
            })
        }
    });

    socket.on('invite_to_resume_game_confirm', function (msg) {
        let moves = logic_db.get_moves_game(msg);
        moves.then(result => {
            let who_next_step = null;
            if(result[0][0].white_step === null) {
                who_next_step = "white";
            }
            else {
                who_next_step = "black";
            }
            let arMoves = result[0][0].state_board;

            lobbyUsers[msg.who_invite].emit('invite_to_resume_game_confirm', {
                who_next_step: who_next_step,
                ar_moves: arMoves,
                settings: msg
            })
            lobbyUsers[msg.who_invited].emit('invite_to_resume_game_confirm', {
                who_next_step: who_next_step,
                ar_moves: arMoves,
                settings: msg
            })
        });

    });

    socket.on('invite_to_resume_game_unconfirmed', function (msg) {
        lobbyUsers[msg.who_invite].emit('invite_to_resume_game_unconfirmed', msg)
    });

    socket.on('resign', function(msg) {
        console.log("resign: " + msg);
        console.log(msg);

        delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
        delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
        delete activeGames[msg.gameId];

        socket.broadcast.emit('resign', msg);
    });


    socket.on('disconnect', function(msg) {

        console.log(msg);

        if (socket && socket.userId && socket.gameId) {
            console.log(socket.userId + ' disconnected');
            console.log(socket.gameId + ' disconnected');
        }

        delete lobbyUsers[socket.userId];

        socket.broadcast.emit('logout', {
            userId: socket.userId,
            gameId: socket.gameId
        });
    });

    //////////////////////////////
    // DataBase
    //////////////////////////////

    socket.on('create_game_db', function (msg) {
       logic_db.create_game_db(msg);
    });


});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
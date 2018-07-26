let express = require('express');
let app = express();
var path = require ('path');
app.use(express.static('public'));

let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3015;

let indexRouter = require('./routes/index.js');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);

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

    socket.on('invite', function(opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);

        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', opponentId);


        let game = {
            id: Math.floor((Math.random() * 100) + 1),
            board: null,
            users: {white: socket.userId, black: opponentId}
        };

        socket.gameId = game.id;
        activeGames[game.id] = game;

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log('starting game: ' + game.id);
        lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
        lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});

        delete lobbyUsers[game.users.white];
        delete lobbyUsers[game.users.black];

        socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game});
    });

    socket.on('resumegame', function(gameId) {
        console.log('ready to resume game: ' + gameId);

        socket.gameId = gameId;
        let game = activeGames[gameId];

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log('resuming game: ' + game.id);
        if (lobbyUsers[game.users.white]) {
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
            delete lobbyUsers[game.users.white];
        }

        if (lobbyUsers[game.users.black]) {
            lobbyUsers[game.users.black] &&
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
            delete lobbyUsers[game.users.black];
        }
    });

    socket.on('step', function (msg) {
        socket.broadcast.emit('step', msg);
    });

    socket.on('attack', function (msg) {
        socket.broadcast.emit('attack', msg);
    });

    // socket.on('resign', function(msg) {
    //     console.log("resign: " + msg);
    //
    //     delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
    //     delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
    //     delete activeGames[msg.gameId];
    //
    //     socket.broadcast.emit('resign', msg);
    // });


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

});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});
/**
 * TO DO LIST
 *
 * - убрать "насильный" выбор рубить (сделать свободный выбор хода). Если включен режим "Обязательно рубить", то при не "рублении" шашка "съедалась"
 * - Если все-таки "насильрный режим" нужен, то нужно сделать так, чтобы был возможность выбора нескольких вариантов "рубления"
 * Тип есть нужно сделать ход и имеется возможность выбрать срубить одного или другого, сделать так, чтобы можно было выбрать (сейчас "насильно" выбирается только одни)
 * - рубить несколько шашек подряд
 */

$( document ).ready(function() {

    let settings_game = [];

    // подсвечивать шаги
    let OVER_STEPS = null;

    //учитывать время
    let TIME_CHECK = null;
    //если учитывать, то сколько
    let TIME_VALUE = null;

    //возможность рубить несколько шашек за один ход
    let MULTYATTACK = null;

    //фуки
    let FUCHS = null;
    //подсвечивать возможные фуки
    let COLOR_FUCHS = null;

    //можно обычным шашка аттаковать назад
    let SIMPLE_BACK_ATTACK = null;

    let NICKNAME = null;
    let ID_NICKNAME = null;

    // click on player vs player
    addDynamicEventListener(document.body, 'click', '#PP', function (e) {
        if(NICKNAME == "anonymus") {
            socket.emit('login', NICKNAME + "_" + ID_NICKNAME);
        }
        else {
            socket.emit('login', NICKNAME);
        }

        // $('#page-start').hide();
        // $('#page-login').show();
        $('#page-start').hide();
        $('#page-lobby').show();
    });

    // click on player vs player
    addDynamicEventListener(document.body, 'click', '#CP', function (e) {
        $('#page-start').hide();
        $('#page-computer').show();
    });

    // click on setting
    let flip = 0;
    addDynamicEventListener(document.body, 'click', '.button-setting', function (e) {
        $( "#page-setting" ).toggle( flip++ % 2 === 0 );
    });

    let socket, serverGame;
    let username, playerColor;
    let usersOnline = [];
    let myGames = [];
    let player = "white"; //the first player
    socket = io();

    let potencialStepsWhiteQueenGlobal = [];
    let potencialStepsSimpleGlobal = [];

    let potencialAttackWhiteQueenGlobal = [];

    //////////////////////////////
    // Socket.io handlers
    //////////////////////////////

    socket.on('login', function(msg) {
        usersOnline = msg.users;
        updateUserList();

        myGames = msg.games;
        updateGamesList();
    });

    socket.on('joinlobby', function (msg) {
        addUser(msg);
    });

    socket.on('leavelobby', function (msg) {
        removeUser(msg);
    });

    socket.on('gameadd', function(msg) {
        // console.log("Игры: "+ msg.gameId + ")\tBlack: " + msg.gameState.users.black + " - White: " + msg.gameState.users.white);
    });

    // socket.on('resign', function(msg) {
    //     if (msg.gameId === serverGame.id) {
    //         socket.emit('login', username);
    //
    //         $('#page-lobby').show();
    //         $('#page-game').hide();
    //     }
    // });


    socket.on('joingame', function(msg) {
        //get setting games
        msg.settings.forEach(function (value) {
            settings_game[value.name] = value.value;
        });

        OVER_STEPS = settings_game.color_potencial_step;
        TIME_CHECK = settings_game.time_check_checkbox;
        TIME_VALUE = settings_game.time_check_text;
        FUCHS = settings_game.fuchs;
        SIMPLE_BACK_ATTACK = settings_game.simple_back_attack;
        COLOR_FUCHS = settings_game.color_potencial_fuchs;

        console.log("joined as game id: " + msg.game.id );
        playerColor = msg.color;
        initGame(msg.game);

        $('#page-start').hide();
        $('#page-lobby').hide();
        $('#page-game').show();
    });

    // фук
    socket.on('fuch', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {

            let target = $(".rank__check[x="+ msg.target_x +"][y="+ msg.target_y +"]"); // кого нужно "фукнуть"
            target[0].firstElementChild.remove();

            // меняем игрока
            if (msg.currentPlayer === "black") {
                player = "white";
            }
            else if (msg.currentPlayer === "white") {
                player = "black";
            }
        }
    });

    // шаг
    socket.on('step', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {

            console.log(msg)

            let next = $(".rank__check[x="+ msg.next.x +"][y="+ msg.next.y +"]"); // куда был сделан ход
            let prev = $(".rank__check[x="+ msg.prev.x +"][y="+ msg.prev.y +"]"); // предыдущее место, которое нужно "очистить"

            if(msg.isQueen) {
                if (msg.currentPlayer === "white") {
                    next.append('<div class="piece white queen">&#9813;</div>');
                    prev[0].firstElementChild.remove();
                }
                else if (msg.currentPlayer === "black") {
                    next.append('<div class="piece black queen">&#9819;</div>');
                    prev[0].firstElementChild.remove();
                }
            }
            else {
                if (playerColor === "black") {
                    next.append('<div class="piece white">&#9814;</div>');
                    prev[0].firstElementChild.remove();
                }
                else if (playerColor === "white") {
                    next.append('<div class="piece black">&#9820;</div>');
                    prev[0].firstElementChild.remove();
                }
            }

            // меняем игрока
            if (msg.currentPlayer === "black") {
                player = "white";
            }
            else if (msg.currentPlayer === "white") {
                player = "black";
            }
        }
    });

    //рубить
    socket.on('attack', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {

            let next = $(".rank__check[x="+ msg.next.x +"][y="+ msg.next.y +"]"); // куда был сделан ход
            let prev = $(".rank__check[x="+ msg.prev.x +"][y="+ msg.prev.y +"]"); // предыдущее место, которое нужно "очистить"
            let target = $(".rank__check[x="+ msg.target.x +"][y="+ msg.target.y +"]"); // цель, которую нужно "очистить"

            if(msg.isQueen) {
                if (msg.currentPlayer === "white") {
                    next.append('<div class="piece white queen">&#9813;</div>');
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
                else if (msg.currentPlayer === "black") {
                    next.append('<div class="piece black queen">&#9819;</div>');
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
            }
            else {

                if (playerColor === "black") {
                    next.append('<div class="piece white">&#9814;</div>');
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
                else if (playerColor === "white") {
                    next.append('<div class="piece black">&#9820;</div>');
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
            }

            if(!msg.hasEnemy) {
                // меняем игрока
                if (msg.currentPlayer === "black") {
                    player = "white";
                }
                else if (msg.currentPlayer === "white") {
                    player = "black";
                }
            }
        }
    });

    socket.on('logout', function (msg) {
        removeUser(msg.username);
    });


    //////////////////////////////
    // Menus
    //////////////////////////////
    $('#login').on('click', function() {
        username = $('#username').val();

        if (username.length > 0) {
            $('#userLabel').text(username);
            socket.emit('login', username);

            $('#page-login').hide();
            $('#page-lobby').show();
        }
    });

    $('#game-back').on('click', function() {
        socket.emit('login', username);

        $('#page-game').hide();
        $('#page-lobby').show();
    });

    // $('#game-resign').on('click', function() {
    //     socket.emit('resign', {userId: username, gameId: serverGame.id});
    //
    //     socket.emit('login', username);
    //     $('#page-game').hide();
    //     $('#page-lobby').show();
    // });

    let addUser = function(userId) {
        usersOnline.push(userId);
        updateUserList();
    };

    let removeUser = function(userId) {
        for (let i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
        }
        updateUserList();
    };

    let updateGamesList = function() {
        document.getElementById('gamesList').innerHTML = '';
        myGames.forEach(function(game) {
            $('#gamesList').append($('<button>')
                .text('#'+ game)
                .on('click', function() {
                    socket.emit('resumegame',  game);
            }));
        });
    };

    let updateUserList = function() {

        document.getElementById('userList').innerHTML = '';
        usersOnline.forEach(function(user) {
            $('#userList').append($('<button>')
                .attr("id", user)
                .text(user)
                .on('click', function() {
                    //get settings of game
                    let data_form_settings = $("#settings").serializeArray();

                    socket.emit('invite',  {
                        user: user,
                        settings_game: data_form_settings // передать настройки на сервер
                    });
            }));
        });
    };

    //////////////////////////////
    // Checkers Game
    //////////////////////////////

    let initGame = function (serverGameState) {
        serverGame = serverGameState;

        let checkers_board = $("#game-board");
        let content = document.createElement("div");
        content.className = "content";
        checkers_board.append(content);

        let board = document.createElement("div");
        board.className = "board";
        content.append(board);

        let rank = null;
        let rank__check = null;

        let piece = null;

        for(let i = 0; i < 8; i++) {
            rank = document.createElement("div");
            rank.className = "rank";
            board.append(rank);

            for(let t = 0; t < 8; t++){
                rank__check = document.createElement("div");
                rank__check.className = "rank__check";

                // расставляем координаты
                if(i % 2 === 0) {
                    if (t % 2 !== 0) {

                        if(i === 0) {
                            rank__check.setAttribute("queen", "white");
                        }
                        else if(i === 7) {
                            rank__check.setAttribute("queen", "black");
                        }

                        rank__check.setAttribute("x", t);
                        rank__check.setAttribute("y", i);
                    }
                }

                if(i % 2 !== 0) {
                    if (t % 2 === 0) {

                        if(i === 0) {
                            rank__check.setAttribute("queen", "white");
                        }
                        else if(i === 7) {
                            rank__check.setAttribute("queen", "black");
                        }

                        rank__check.setAttribute("x", t);
                        rank__check.setAttribute("y", i);
                    }
                }

                rank.append(rank__check);

                // формируем черных
                if(i <= 2) { // первые три поля
                    if (i % 2 === 0) {
                        if ((t % 2 !== 0)) {
                            piece = document.createElement("div");
                            piece.className = "piece black";
                            piece.innerHTML = "&#9820;";
                            rank__check.append(piece);
                        }
                    }
                    else {
                        if ((t % 2 === 0)) {
                            piece = document.createElement("div");
                            piece.className = "piece black";
                            piece.innerHTML = "&#9820;";
                            rank__check.append(piece);

                            // piece = document.createElement("div");
                            // piece.className = "piece black queen";
                            // piece.innerHTML = "&#9819;";
                            // rank__check.append(piece);
                        }
                    }
                }

                // формируем белых
                if((i + 3) >= 8) // последние три поля
                {
                    if (i % 2 === 0) {
                        if ((t % 2 !== 0)) {
                            piece = document.createElement("div");
                            piece.className = "piece white";
                            piece.innerHTML = "&#9814;";
                            rank__check.append(piece);

                            // piece = document.createElement("div");
                            // piece.className = "piece white queen";
                            // piece.innerHTML = "&#9813;";
                            // rank__check.append(piece);
                        }
                    }
                    else {
                        if ((t % 2 === 0)) {
                            piece = document.createElement("div");
                            piece.className = "piece white";
                            piece.innerHTML = "&#9814;";
                            rank__check.append(piece);
                        }

                    }
                }
            }

        }

        // разворачиваем доску
        if(playerColor === "black") {
            $('.board').addClass("rotate_board");
            $('.rank__check').addClass("rotate_board");
        }

        $( "#page-setting" ).hide();
    };

    let current_piece = null; // global last click piece

    function checkPlayer(object) {
        if(object.classList.contains("black")) {
            return "black";
        }
        else if(object.classList.contains("white"))
        {
            return "white";
        }
    }

    // rotate a board
    addDynamicEventListener(document.body, 'click', '#rotate-board', function (e) {
        $('.board').toggleClass("rotate_board");
        $('.rank__check').toggleClass("rotate_board");
    });

    let pieceForFuch = [];

    function randomInteger(min, max) {
        var rand = min - 0.5 + Math.random() * (max - min + 1)
        rand = Math.round(rand);
        return rand;
    }

    function getAllQueenCells(color) {

        let result = [];

        let all_pieces = document.querySelectorAll('.queen.' + color);

        let needEat = [];

        for(let i = 0; i < all_pieces.length; i++) {
            let piece_x = all_pieces[i].parentElement.getAttribute("x");
            let piece_y = all_pieces[i].parentElement.getAttribute("y");

            let currentPiece = $('.rank__check[x=' + piece_x + '][y=' + piece_y + ']')[0];
            let potencialStepsWhiteQueenUpRigth = [];
            let potencialStepsWhiteQueenUpLeft = [];
            let potencialStepsWhiteQueenBottomRigth = [];
            let potencialStepsWhiteQueenBottomLeft = [];


            let potencialAttackWhiteQueenUpRigth = [];
            let potencialAttackWhiteQueenUpLeft = [];
            let potencialAttackWhiteQueenBottomRigth = [];
            let potencialAttackWhiteQueenBottomLeft = [];

            let potencial_up_right_x = null;
            let potencial_up_right_y = null;
            let potencial_up_left_x = null;
            let potencial_up_left_y = null;

            let potencial_bottom_right_x = null;
            let potencial_bottom_right_y = null;
            let potencial_bottom_left_x = null;
            let potencial_bottom_left_y = null;

            let nextPotencial_up_right_x = null;
            let nextPotencial_up_right_y = null;
            let nextPotencial_up_left_x = null;
            let nextPotencial_up_left_y = null;

            let nextPotencial_bottom_right_x = null;
            let nextPotencial_bottom_right_y = null;
            let nextPotencial_bottom_left_x = null;
            let nextPotencial_bottom_left_y = null;

            let potencialWhiteQueenCell = null;
            let nextPotencialWhiteQueenCell = null;

            let needStepUpRight = [];
            let needStepUpLeft = [];
            let needStepBottomRight = [];
            let needStepBottomLeft = [];

            let hasQueenEnemy = false;
            let needStep = [];

            let count = 0;
            for (let q = 1; q < 8; q++) {

                potencial_up_right_x = parseInt(piece_x) + q;
                potencial_up_right_y = parseInt(piece_y) - q;

                nextPotencial_up_right_x = (parseInt(piece_x) + q) + 1;
                nextPotencial_up_right_y = (parseInt(piece_y) - q) - 1;

                if ((potencial_up_right_x < 8) && (potencial_up_right_y < 8) && (potencial_up_right_x >= 0) && (potencial_up_right_y >= 0)) {

                    potencialWhiteQueenCell = $('.rank__check[x=' + potencial_up_right_x + '][y=' + potencial_up_right_y + ']');
                    nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_up_right_x + '][y=' + nextPotencial_up_right_y + ']');

                    try {
                        if (potencialWhiteQueenCell[0].firstElementChild) {

                            if (currentPiece.firstElementChild.classList.contains("white")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                    break;
                                }
                            }
                            else if (currentPiece.firstElementChild.classList.contains("black")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
                                    break;
                                }
                            }

                            if (count === 0) {

                                if (currentPiece.firstElementChild.classList.contains("white")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                                needEat.push(currentPiece);
                                            }
                                        }
                                        catch (exp) {
                                        }
                                    }
                                }
                                else if (currentPiece.firstElementChild.classList.contains("black")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                            }
                                        }
                                        catch (exp) {
                                        }
                                    }
                                }
                            }
                            else {
                                break;
                            }
                            count++;

                        }
                        else {
                            if (hasQueenEnemy) {
                                needStep.push(potencialWhiteQueenCell);
                                needStepUpRight.push(potencialWhiteQueenCell);

                                pieceForFuch.push(current_piece);
                            }
                            else {
                                potencialStepsWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                    catch(exu) {}

                    try {
                        if (potencialWhiteQueenCell[0].firstElementChild && nextPotencialWhiteQueenCell[0].firstElementChild) {
                            break;
                        }
                    }
                    catch (exp){}
                }
            }

            hasQueenEnemy = false;
            count = 0;
            for (let q = 1; q < 8; q++) {

                potencial_up_left_x = parseInt(piece_x) - q;
                potencial_up_left_y = parseInt(piece_y) - q;

                nextPotencial_up_left_x = (parseInt(piece_x) - q) - 1;
                nextPotencial_up_left_y = (parseInt(piece_y) - q) - 1;

                if ((potencial_up_left_x < 8) && (potencial_up_left_y < 8) && (potencial_up_left_x >= 0) && (potencial_up_left_y >= 0)) {

                    potencialWhiteQueenCell = $('.rank__check[x=' + potencial_up_left_x + '][y=' + potencial_up_left_y + ']');
                    nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_up_left_x + '][y=' + nextPotencial_up_left_y + ']');

                    try {

                        if (potencialWhiteQueenCell[0].firstElementChild) {

                            if (currentPiece.firstElementChild.classList.contains("white")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                    break;
                                }
                            }
                            else if (currentPiece.firstElementChild.classList.contains("black")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
                                    break;
                                }
                            }

                            if (count === 0) {

                                if (currentPiece.firstElementChild.classList.contains("white")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                                needEat.push(currentPiece);
                                            }
                                        }
                                        catch (exp) {
                                        }
                                    }
                                }
                                else if (currentPiece.firstElementChild.classList.contains("black")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                            }
                                        }
                                        catch (exp) {
                                        }
                                    }
                                }
                            }
                            else {
                                break;
                            }
                            count++;

                        }
                        else {
                            if (hasQueenEnemy) {
                                needStep.push(potencialWhiteQueenCell);
                                needStepUpLeft.push(potencialWhiteQueenCell);

                                pieceForFuch.push(current_piece);
                            }
                            else {
                                potencialStepsWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                    catch(exu) {}

                    try {
                        if (potencialWhiteQueenCell[0].firstElementChild && nextPotencialWhiteQueenCell[0].firstElementChild) {
                            break;
                        }
                    }
                    catch (exp) {
                    }

                }
            }

            hasQueenEnemy = false;
            count = 0;
            for (let q = 1; q < 8; q++) {

                potencial_bottom_right_x = parseInt(piece_x) + q;
                potencial_bottom_right_y = parseInt(piece_y) + q;

                nextPotencial_bottom_right_x = (parseInt(piece_x) + q) + 1;
                nextPotencial_bottom_right_y = (parseInt(piece_y) + q) + 1;

                if ((potencial_bottom_right_x < 8) && (potencial_bottom_right_y < 8) && (potencial_bottom_right_x >= 0) && (potencial_bottom_right_y >= 0)) {

                    potencialWhiteQueenCell = $('.rank__check[x=' + potencial_bottom_right_x + '][y=' + potencial_bottom_right_y + ']');
                    nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_bottom_right_x + '][y=' + nextPotencial_bottom_right_y + ']');

                    try {

                        if (potencialWhiteQueenCell[0].firstElementChild) {

                            if (currentPiece.firstElementChild.classList.contains("white")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                    break;
                                }
                            }
                            else if (currentPiece.firstElementChild.classList.contains("black")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
                                    break;
                                }
                            }

                            if (count === 0) {

                                if (currentPiece.firstElementChild.classList.contains("white")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                                needEat.push(currentPiece);
                                            }
                                        }
                                        catch (exp) {
                                        }

                                    }
                                }
                                else if (currentPiece.firstElementChild.classList.contains("black")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                            }
                                        }
                                        catch (exp) {
                                        }

                                    }
                                }
                            }
                            else {
                                break;
                            }
                            count++;

                        }
                        else {
                            if (hasQueenEnemy) {
                                needStep.push(potencialWhiteQueenCell);
                                needStepBottomRight.push(potencialWhiteQueenCell);

                                pieceForFuch.push(current_piece);
                            }
                            else {
                                potencialStepsWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                    catch(exb) {}

                    try {
                        if (potencialWhiteQueenCell[0].firstElementChild && nextPotencialWhiteQueenCell[0].firstElementChild) {
                            break;
                        }
                    }
                    catch (exp) {
                    }

                }
            }

            hasQueenEnemy = false;
            count = 0;
            for (let q = 1; q < 8; q++) {

                potencial_bottom_left_x = parseInt(piece_x) - q;
                potencial_bottom_left_y = parseInt(piece_y) + q;

                nextPotencial_bottom_left_x = (parseInt(piece_x) - q) - 1;
                nextPotencial_bottom_left_y = (parseInt(piece_y) + q) + 1;

                if ((potencial_bottom_left_x < 8) && (potencial_bottom_left_y < 8) && (potencial_bottom_left_x >= 0) && (potencial_bottom_left_y >= 0)) {

                    potencialWhiteQueenCell = $('.rank__check[x=' + potencial_bottom_left_x + '][y=' + potencial_bottom_left_y + ']');
                    nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_bottom_left_x + '][y=' + nextPotencial_bottom_left_y + ']');

                    try {

                        if (potencialWhiteQueenCell[0].firstElementChild) {

                            if (currentPiece.firstElementChild.classList.contains("white")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                    break;
                                }
                            }
                            else if (currentPiece.firstElementChild.classList.contains("black")) {
                                if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
                                    break;
                                }
                            }

                            if (count === 0) {

                                if (currentPiece.firstElementChild.classList.contains("white")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                                needEat.push(currentPiece);
                                            }
                                        }
                                        catch (exp) {
                                        }

                                    }
                                }
                                else if (currentPiece.firstElementChild.classList.contains("black")) {
                                    // if this is enemy
                                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                                        try {
                                            if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                                //get next target fot attack
                                                potencialAttackWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                                                hasQueenEnemy = true;
                                            }
                                        }
                                        catch (exp) {
                                        }

                                    }
                                }
                            }
                            else {
                                break;
                            }
                            count++;

                        }
                        else {
                            if (hasQueenEnemy) {
                                needStep.push(potencialWhiteQueenCell);
                                needStepBottomLeft.push(potencialWhiteQueenCell);

                                pieceForFuch.push(current_piece);
                            }
                            else {
                                potencialStepsWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                    catch(exb) {}

                    try {
                        if (potencialWhiteQueenCell[0].firstElementChild && nextPotencialWhiteQueenCell[0].firstElementChild) {
                            break;
                        }
                    }
                    catch (exp) {
                    }

                }
            }

            let queen = [{
                currentpiece : currentPiece,
                needeat : needEat,
                upright: {
                    needStep : needStepUpRight,
                    empty : potencialStepsWhiteQueenUpRigth,
                    enemy : potencialAttackWhiteQueenUpRigth
                },
                upleft: {
                    needStep : needStepUpLeft,
                    empty : potencialStepsWhiteQueenUpLeft,
                    enemy : potencialAttackWhiteQueenUpLeft
                },
                bottomright: {
                    needStep : needStepBottomRight,
                    empty : potencialStepsWhiteQueenBottomRigth,
                    enemy : potencialAttackWhiteQueenBottomRigth
                },
                bottomleft: {
                    needStep : needStepBottomLeft,
                    empty : potencialStepsWhiteQueenBottomLeft,
                    enemy : potencialAttackWhiteQueenBottomLeft
                }
            }];

            result.push(queen);
        }

        return result;
    }

    function getAllSimpleCells(color) {
        let result = [];

        let all_pieces = document.querySelectorAll('.' + color);

        let needEat = [];

        for(let i = 0; i < all_pieces.length; i++) {
            if(!all_pieces[i].classList.contains('queen')) {

                let piece_x = all_pieces[i].parentElement.getAttribute("x");
                let piece_y = all_pieces[i].parentElement.getAttribute("y");

                let currentPiece = $('.rank__check[x=' + piece_x + '][y=' + piece_y + ']')[0];
                let potencialStepsWhiteQueenUpRigth = [];
                let potencialStepsWhiteQueenUpLeft = [];
                let potencialStepsWhiteQueenBottomRigth = [];
                let potencialStepsWhiteQueenBottomLeft = [];


                let potencialAttackWhiteQueenUpRigth = [];
                let potencialAttackWhiteQueenUpLeft = [];
                let potencialAttackWhiteQueenBottomRigth = [];
                let potencialAttackWhiteQueenBottomLeft = [];

                let potencial_up_right_x = null;
                let potencial_up_right_y = null;
                let potencial_up_left_x = null;
                let potencial_up_left_y = null;

                let potencial_bottom_right_x = null;
                let potencial_bottom_right_y = null;
                let potencial_bottom_left_x = null;
                let potencial_bottom_left_y = null;

                let nextPotencial_up_right_x = null;
                let nextPotencial_up_right_y = null;
                let nextPotencial_up_left_x = null;
                let nextPotencial_up_left_y = null;

                let nextPotencial_bottom_right_x = null;
                let nextPotencial_bottom_right_y = null;
                let nextPotencial_bottom_left_x = null;
                let nextPotencial_bottom_left_y = null;

                let potencialWhiteQueenCell = null;
                let nextPotencialWhiteQueenCell = null;

                let needStepUpRight = [];
                let needStepUpLeft = [];
                let needStepBottomRight = [];
                let needStepBottomLeft = [];

                let hasQueenEnemy = false;
                let needStep = [];

                /**
                 *
                 * up_right
                 */

                potencial_up_right_x = parseInt(piece_x) + 1;
                potencial_up_right_y = parseInt(piece_y) - 1;

                nextPotencial_up_right_x = (parseInt(piece_x) + 1) + 1;
                nextPotencial_up_right_y = (parseInt(piece_y) - 1) - 1;

                potencialWhiteQueenCell = $('.rank__check[x=' + potencial_up_right_x + '][y=' + potencial_up_right_y + ']');
                nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_up_right_x + '][y=' + nextPotencial_up_right_y + ']');

                if(potencialWhiteQueenCell.length !== 0) {
                    if (potencialWhiteQueenCell[0].firstElementChild) {

                        if (currentPiece.firstElementChild.classList.contains("white")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }

                            }
                        }
                        else if (currentPiece.firstElementChild.classList.contains("black")) {

                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }

                            }
                        }

                        if(nextPotencialWhiteQueenCell.length !== 0) {
                            if(!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                if (hasQueenEnemy) {
                                    needStep.push(nextPotencialWhiteQueenCell);
                                    needStepUpRight.push(nextPotencialWhiteQueenCell);

                                    pieceForFuch.push(current_piece);
                                }
                            }
                        }


                    }
                    else {
                        if (hasQueenEnemy) {
                            needStep.push(potencialWhiteQueenCell);
                            needStepUpRight.push(potencialWhiteQueenCell);

                            pieceForFuch.push(current_piece);
                        }
                        else {
                            if(color === "white") {
                                potencialStepsWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                }


                /**
                 *
                 * up_left
                 */


                hasQueenEnemy = false;

                potencial_up_left_x = parseInt(piece_x) - 1;
                potencial_up_left_y = parseInt(piece_y) - 1;

                nextPotencial_up_left_x = (parseInt(piece_x) - 1) - 1;
                nextPotencial_up_left_y = (parseInt(piece_y) - 1) - 1;


                potencialWhiteQueenCell = $('.rank__check[x=' + potencial_up_left_x + '][y=' + potencial_up_left_y + ']');
                nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_up_left_x + '][y=' + nextPotencial_up_left_y + ']');

                if(potencialWhiteQueenCell.length !== 0) {

                    if (potencialWhiteQueenCell[0].firstElementChild) {

                        if (currentPiece.firstElementChild.classList.contains("white")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }

                            }
                        }
                        else if (currentPiece.firstElementChild.classList.contains("black")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }

                            }
                        }

                        if(nextPotencialWhiteQueenCell.length !== 0) {
                            if(!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                if (hasQueenEnemy) {
                                    needStep.push(nextPotencialWhiteQueenCell);
                                    needStepUpLeft.push(nextPotencialWhiteQueenCell);

                                    pieceForFuch.push(current_piece);
                                }
                            }
                        }

                    }
                    else {
                        if (hasQueenEnemy) {
                            needStep.push(potencialWhiteQueenCell);
                            needStepUpLeft.push(potencialWhiteQueenCell);

                            pieceForFuch.push(current_piece);
                        }
                        else {
                            if(color === "white") {
                                potencialStepsWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                }

                /**
                 *
                 * bottom_right
                 */


                hasQueenEnemy = false;

                potencial_bottom_right_x = parseInt(piece_x) + 1;
                potencial_bottom_right_y = parseInt(piece_y) + 1;

                nextPotencial_bottom_right_x = (parseInt(piece_x) + 1) + 1;
                nextPotencial_bottom_right_y = (parseInt(piece_y) + 1) + 1;


                potencialWhiteQueenCell = $('.rank__check[x=' + potencial_bottom_right_x + '][y=' + potencial_bottom_right_y + ']');
                nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_bottom_right_x + '][y=' + nextPotencial_bottom_right_y + ']');

                if(potencialWhiteQueenCell.length !== 0) {

                    if (potencialWhiteQueenCell[0].firstElementChild) {

                        if (currentPiece.firstElementChild.classList.contains("white")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }
                            }
                        }
                        else if (currentPiece.firstElementChild.classList.contains("black")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }
                            }
                        }

                        if(nextPotencialWhiteQueenCell.length !== 0) {
                            if(!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                if (hasQueenEnemy) {
                                    needStep.push(nextPotencialWhiteQueenCell);
                                    needStepBottomRight.push(nextPotencialWhiteQueenCell);

                                    pieceForFuch.push(current_piece);
                                }
                            }
                        }

                    }
                    else {
                        if (hasQueenEnemy) {
                            needStep.push(potencialWhiteQueenCell);
                            needStepBottomRight.push(potencialWhiteQueenCell);

                            pieceForFuch.push(current_piece);
                        }
                        else {
                            if(color === "black") {
                                potencialStepsWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                }

                /**
                 *
                 * bottom_left
                 */

                hasQueenEnemy = false;

                potencial_bottom_left_x = parseInt(piece_x) - 1;
                potencial_bottom_left_y = parseInt(piece_y) + 1;

                nextPotencial_bottom_left_x = (parseInt(piece_x) - 1) - 1;
                nextPotencial_bottom_left_y = (parseInt(piece_y) + 1) + 1;


                potencialWhiteQueenCell = $('.rank__check[x=' + potencial_bottom_left_x + '][y=' + potencial_bottom_left_y + ']');
                nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_bottom_left_x + '][y=' + nextPotencial_bottom_left_y + ']');

                if(potencialWhiteQueenCell.length !== 0) {

                    if (potencialWhiteQueenCell[0].firstElementChild) {

                        if (currentPiece.firstElementChild.classList.contains("white")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {
                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }

                            }
                        }
                        else if (currentPiece.firstElementChild.classList.contains("black")) {
                            // if this is enemy
                            if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
                                if(typeof nextPotencialWhiteQueenCell[0] !== 'undefined') {

                                    if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                        //get next target fot attack
                                        potencialAttackWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                                        hasQueenEnemy = true;
                                        needEat.push(currentPiece);
                                    }
                                }
                            }
                        }

                        if(nextPotencialWhiteQueenCell.length !== 0) {
                            if(!nextPotencialWhiteQueenCell[0].firstElementChild) {
                                if (hasQueenEnemy) {
                                    needStep.push(nextPotencialWhiteQueenCell);
                                    needStepBottomLeft.push(nextPotencialWhiteQueenCell);

                                    pieceForFuch.push(current_piece);
                                }
                            }
                        }

                    }
                    else {
                        if (hasQueenEnemy) {
                            needStep.push(potencialWhiteQueenCell);
                            needStepBottomLeft.push(potencialWhiteQueenCell);

                            pieceForFuch.push(current_piece);
                        }
                        else {
                            if(color === "black") {
                                potencialStepsWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                            }
                        }
                    }
                }

                if (currentPiece.firstElementChild.classList.contains("black")) {
                    if(SIMPLE_BACK_ATTACK !== "on") {
                        needStepUpRight = [];
                        needStepUpLeft = [];
                        potencialAttackWhiteQueenUpRigth = [];
                        potencialAttackWhiteQueenUpLeft = [];
                    }
                }
                if (currentPiece.firstElementChild.classList.contains("white")) {
                    if(SIMPLE_BACK_ATTACK !== "on") {
                        needStepBottomRight = [];
                        needStepBottomLeft = [];
                        potencialAttackWhiteQueenBottomRigth = [];
                        potencialAttackWhiteQueenBottomLeft = [];
                    }
                }

                let queen = [{
                    currentpiece: currentPiece,
                    needeat: needEat,
                    upright: {
                        needStep: needStepUpRight,
                        empty: potencialStepsWhiteQueenUpRigth,
                        enemy: potencialAttackWhiteQueenUpRigth
                    },
                    upleft: {
                        needStep: needStepUpLeft,
                        empty: potencialStepsWhiteQueenUpLeft,
                        enemy: potencialAttackWhiteQueenUpLeft
                    },
                    bottomright: {
                        needStep: needStepBottomRight,
                        empty: potencialStepsWhiteQueenBottomRigth,
                        enemy: potencialAttackWhiteQueenBottomRigth
                    },
                    bottomleft: {
                        needStep: needStepBottomLeft,
                        empty: potencialStepsWhiteQueenBottomLeft,
                        enemy: potencialAttackWhiteQueenBottomLeft
                    }
                }];

                result.push(queen);
            }
        }

        return result;
    }

    // click on checkers
    addDynamicEventListener(document.body, 'click', '.piece', function (e) {

        if(current_piece !== null) {
            if (current_piece.classList.contains("next")) {
                return false;
            }
        }

        if(player !== playerColor) {
            alert("Подождите, соперник еще не сделал ход");
            return false;
        }

        let currentPlayer = checkPlayer(e.target);
        if(currentPlayer !== playerColor) {
            return false;
        }

        // current piece
        current_piece = e.target;

        //remove active from all pieces
        $(".piece").removeClass("active");
        $(".piece").removeClass("potencial_dead");

        // get current coordinates
        let piece_x = current_piece.parentElement.getAttribute("x");
        let piece_y = current_piece.parentElement.getAttribute("y");

        /**
         * QUEEN
         */

        let currentPiece = $('.rank__check[x=' + piece_x + '][y=' + piece_y + ']')[0];

        if(currentPiece.firstElementChild.classList.contains("queen")) {
            $(current_piece).addClass("active");

            let queens = [];

            if(currentPlayer === "white") {
                queens = getAllQueenCells("white");
            }
            else if(currentPlayer === "black") {
                queens = getAllQueenCells("black");
            }

            potencialStepsWhiteQueenGlobal = queens;

            $('.rank__check').toggleClass("over", false);

            // подсвечивание
            queens.forEach(function (value) {

                if(COLOR_FUCHS === "on") {
                    value[0].needeat.forEach(function (val_need) {
                        $(val_need.firstElementChild).toggleClass("fuch", true);
                    });
                }

                if(OVER_STEPS === "on") {

                    if (current_piece.parentElement === value[0].currentpiece) {
                        value[0].upright.empty.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });
                        value[0].upright.needStep.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });


                        value[0].upleft.empty.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });
                        value[0].upleft.needStep.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });

                        value[0].bottomright.empty.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });
                        value[0].bottomright.needStep.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });

                        value[0].bottomleft.empty.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });
                        value[0].bottomleft.needStep.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });
                    }
                }
            });

            $(current_piece).toggleClass("fuch", false);

        }
        /**
         * SIMPLE CHECKERS
         */
        else {
            $(current_piece).addClass("active");

            let simples = [];

            if(currentPlayer === "white") {
                simples = getAllSimpleCells("white");
            }
            else if(currentPlayer === "black") {
                simples = getAllSimpleCells("black");
            }

            potencialStepsSimpleGlobal = simples;

            $('.rank__check').toggleClass("over", false);

            // подсвечивание
            simples.forEach(function (value) {

                if(COLOR_FUCHS === "on") {
                    value[0].needeat.forEach(function (val_need) {
                        $(val_need.firstElementChild).toggleClass("fuch", true);
                    });
                }

                if(OVER_STEPS === "on") {
                    if (current_piece.parentElement === value[0].currentpiece) {
                        value[0].upright.empty.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });
                        value[0].upright.needStep.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });


                        value[0].upleft.empty.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });
                        value[0].upleft.needStep.forEach(function (val_up) {
                            val_up.toggleClass("over", true);
                        });

                        value[0].bottomright.empty.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });
                        value[0].bottomright.needStep.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });

                        value[0].bottomleft.empty.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });
                        value[0].bottomleft.needStep.forEach(function (val_bot) {
                            val_bot.toggleClass("over", true);
                        });
                    }
                }
            });

            $(current_piece).toggleClass("fuch", false);
        }

    });

    function nextQueenAttack(new_piece) {
        let queens = [];

        let currentColor = null;
        if(new_piece.classList.contains("black")) {
            currentColor = "black";
        }
        else if(new_piece.classList.contains("white")) {
            currentColor = "white";
        }

        if(currentColor === "white") {
            queens = getAllQueenCells("white");
        }
        else if(currentColor === "black") {
            queens = getAllQueenCells("black");
        }

        let needAttack = false;
        queens.forEach(function (value) {
            if (new_piece.parentElement === value[0].currentpiece) {
                if (value[0].upright.needStep.length > 0) {
                    needAttack = true;
                }

                if (value[0].upleft.needStep.length > 0) {
                    needAttack = true;
                }

                if (value[0].bottomright.needStep.length > 0) {
                    needAttack = true;
                }

                if (value[0].bottomleft.needStep.length > 0) {
                    needAttack = true;
                }
            }
        });

        if(needAttack) {
            $('.rank__check').toggleClass("over", false);
            // $(new_piece).addClass("active");

            // подсвечивание
            queens.forEach(function (value) {

                if(COLOR_FUCHS === "on") {
                    value[0].needeat.forEach(function (val_need) {
                        $(val_need.firstElementChild).toggleClass("fuch", true);
                    });
                }
            });

            $(new_piece).toggleClass("fuch", false);

            return true;

        }
        else {
            return false;
        }
    }

    function nextSimpleAttack(new_piece) {
        let simples = [];

        let currentColor = null;
        if(new_piece.classList.contains("black")) {
            currentColor = "black";
        }
        else if(new_piece.classList.contains("white")) {
            currentColor = "white";
        }

        if(currentColor === "white") {
            simples = getAllSimpleCells("white");
        }
        else if(currentColor === "black") {
            simples = getAllSimpleCells("black");
        }

        let needAttack = false;
        simples.forEach(function (value) {
            if (new_piece.parentElement === value[0].currentpiece) {
                if (value[0].upright.needStep.length > 0) {
                    needAttack = true;
                }

                if (value[0].upleft.needStep.length > 0) {
                    needAttack = true;
                }

                if (value[0].bottomright.needStep.length > 0) {
                    needAttack = true;
                }

                if (value[0].bottomleft.needStep.length > 0) {
                    needAttack = true;
                }
            }
        });

        if(needAttack) {
            $('.rank__check').toggleClass("over", false);

            // подсвечивание
            simples.forEach(function (value) {

                if(COLOR_FUCHS === "on") {
                    value[0].needeat.forEach(function (val_need) {
                        $(val_need.firstElementChild).toggleClass("fuch", true);
                    });
                }
            });

            $(new_piece).toggleClass("fuch", false);

            return true;

        }
        else {
            return false;
        }
    }

    // click on next attack
    addDynamicEventListener(document.body, 'click', ".next", function (event) {
        try {
            if (event.target.firstChild.classList.contains('active')) {

            }
        }catch (e) {
            if (current_piece) {

                $(current_piece).addClass("active");

                let currentColor = null;
                if (current_piece.classList.contains("black")) {
                    currentColor = "black";
                }
                else if (current_piece.classList.contains("white")) {
                    currentColor = "white";
                }

                if (current_piece.classList.contains("queen")) {

                    if (currentColor === "white") {
                        potencialStepsWhiteQueenGlobal = getAllQueenCells("white");
                    }
                    else if (currentColor === "black") {
                        potencialStepsWhiteQueenGlobal = getAllQueenCells("black");
                    }

                    // подсвечивание
                    potencialStepsWhiteQueenGlobal.forEach(function (value) {

                        if(COLOR_FUCHS === "on") {
                            value[0].needeat.forEach(function (val_need) {
                                $(val_need.firstElementChild).toggleClass("fuch", true);
                            });
                        }

                        if(OVER_STEPS === "on") {

                            if (current_piece.parentElement === value[0].currentpiece) {
                                value[0].upright.empty.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });
                                value[0].upright.needStep.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });


                                value[0].upleft.empty.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });
                                value[0].upleft.needStep.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });

                                value[0].bottomright.empty.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });
                                value[0].bottomright.needStep.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });

                                value[0].bottomleft.empty.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });
                                value[0].bottomleft.needStep.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });
                            }
                        }
                    });

                    $(current_piece).toggleClass("fuch", false);
                }
                else {
                    if (currentColor === "white") {
                        potencialStepsSimpleGlobal = getAllSimpleCells("white");
                    }
                    else if (currentColor === "black") {
                        potencialStepsSimpleGlobal = getAllSimpleCells("black");
                    }

                    // подсвечивание
                    potencialStepsSimpleGlobal.forEach(function (value) {

                        if(COLOR_FUCHS === "on") {
                            value[0].needeat.forEach(function (val_need) {
                                $(val_need.firstElementChild).toggleClass("fuch", true);
                            });
                        }

                        if(OVER_STEPS === "on") {

                            if (current_piece.parentElement === value[0].currentpiece) {
                                value[0].upright.empty.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });
                                value[0].upright.needStep.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });

                                value[0].upleft.empty.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });
                                value[0].upleft.needStep.forEach(function (val_up) {
                                    val_up.toggleClass("over", true);
                                });

                                value[0].bottomright.empty.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });
                                value[0].bottomright.needStep.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });

                                value[0].bottomleft.empty.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });
                                value[0].bottomleft.needStep.forEach(function (val_bot) {
                                    val_bot.toggleClass("over", true);
                                });
                            }
                        }
                    });

                    $(current_piece).toggleClass("fuch", false);
                }
            }
        }
    });

    // click on cell
    addDynamicEventListener(document.body, 'click', '.rank__check', function (event) {

        try {
            if (event.target.firstChild.classList.contains('active')) {

            }
        }catch (e) {
            if(current_piece){
                let but_x = current_piece.parentElement.getAttribute("x");
                let but_y = current_piece.parentElement.getAttribute("y");

                let current_x = event.target.getAttribute("x");
                let current_y = event.target.getAttribute("y");

                let currentColor = null;
                if(current_piece.classList.contains("black")) {
                    currentColor = "black";
                }
                else if(current_piece.classList.contains("white")) {
                    currentColor = "white";
                }

                let isPlayerChange = false;

                /**
                 * QUEENS CHECKERS
                 */
                if(current_piece.classList.contains("queen")) {

                    // если режим "обязательно рубить", то проверяем, срубилена шашка
                    // если не срублена, то шашка "съедается"
                    let needAttack = false;

                    potencialStepsWhiteQueenGlobal.forEach(function (value) {

                        //и заодно убираем лишние классы
                        value[0].needeat.forEach(function (val_need) {
                            $(val_need.firstElementChild).toggleClass("fuch", false);
                        });


                        if(value[0].upright.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value[0].upleft.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value[0].bottomright.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value[0].bottomleft.needStep.length > 0) {
                            needAttack = true;
                        }

                    });

                    // queen need attack
                    if(needAttack) {

                        // если режим "обязательно рубить", то проверяем, срубилена шашка
                        // если не срублена, то шашка "съедается"
                        let needEat = false;

                        potencialStepsWhiteQueenGlobal.forEach(function (value) {

                            value[0].upright.needStep.forEach(function (val_up) {
                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value[0].upleft.needStep.forEach(function (val_up) {
                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value[0].bottomright.needStep.forEach(function (val_bot) {
                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value[0].bottomleft.needStep.forEach(function (val_bot) {
                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                        });

                        // надо съесть (возможен фук)
                        if(!needEat && FUCHS === "on") {

                            isPlayerChange = false;
                            let isFuch = false;
                            let indexNeadEat = randomInteger(0, potencialStepsWhiteQueenGlobal[0][0].needeat.length - 1);

                            potencialStepsWhiteQueenGlobal.forEach(function (value) {
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        if(!isFuch) {
                                            value[0].upright.empty.forEach(function (val_up) {
                                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();

                                                    isFuch = true;
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].upleft.empty.forEach(function (val_up) {
                                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomright.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomleft.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                    // current_piece = null;
                                                }
                                            });
                                        }
                                    }
                                }

                                // прозевал шашку, но дальше ход сделать то надо
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        value[0].upright.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].upleft.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].bottomright.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;

                                            }
                                        });

                                        value[0].bottomleft.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });
                                    }
                                }

                            });

                            if(isPlayerChange) {
                                // change player
                                if (currentColor === "white") {
                                    player = "black";
                                }
                                else if (currentColor === "black") {
                                    player = "white";
                                }
                            }

                        }
                        //шаг без фука
                        else if(!needEat && FUCHS !== "on") {
                            potencialStepsWhiteQueenGlobal.forEach(function (value) {
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        value[0].upright.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].upleft.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].bottomright.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;

                                            }
                                        });

                                        value[0].bottomleft.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                if(currentColor === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else if(currentColor === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });
                                    }
                                }
                            });

                            if(isPlayerChange) {
                                // change player
                                if (currentColor === "white") {
                                    player = "black";
                                }
                                else if (currentColor === "black") {
                                    player = "white";
                                }
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {

                            let isAttackSucces = false;
                            let resultAttack = [];

                            potencialStepsWhiteQueenGlobal.forEach(function (value) {

                                if (current_piece.parentElement === value[0].currentpiece) {
                                    if(isAttackSucces === false) {
                                        value[0].upright.needStep.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].upright.enemy[0][0].getAttribute("x") + "][y=" + value[0].upright.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;
                                            }
                                        });
                                    }

                                    if(isAttackSucces === false) {
                                        value[0].upleft.needStep.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].upleft.enemy[0][0].getAttribute("x") + "][y=" + value[0].upleft.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;

                                            }
                                        });
                                    }

                                    if(isAttackSucces === false) {
                                        value[0].bottomright.needStep.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].bottomright.enemy[0][0].getAttribute("x") + "][y=" + value[0].bottomright.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;
                                            }
                                        });
                                    }

                                    if(isAttackSucces === false) {
                                        value[0].bottomleft.needStep.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].bottomleft.enemy[0][0].getAttribute("x") + "][y=" + value[0].bottomleft.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;
                                            }
                                        });
                                    }
                                }
                            });


                            // если атака прошла успешно
                            if(!$.isEmptyObject(resultAttack)) {

                                if(resultAttack.local_color === "white") {
                                    $(resultAttack.target_place).append('<div class="piece white queen">&#9813;</div>');
                                }
                                else if(resultAttack.local_color === "black") {
                                    $(resultAttack.target_place).append('<div class="piece black queen">&#9819;</div>');
                                }

                                $(current_piece).remove();
                                current_piece = null;

                                $(resultAttack.kill_target)[0].firstElementChild.remove();

                                /**
                                 * NEXT ATTACK
                                 * ===========================================
                                 *
                                 */

                                current_piece = $(".rank__check[x=" + current_x + "][y=" + current_y + "]")[0].firstElementChild;

                                let next = nextQueenAttack(current_piece);

                                if(next) {
                                    $(current_piece).addClass("next");

                                    socket.emit('attack', {
                                        gameId: resultAttack.gameId,
                                        prev: {
                                            x: resultAttack.prev.x,
                                            y: resultAttack.prev.y,
                                        },
                                        next: {
                                            x: resultAttack.next.x,
                                            y: resultAttack.next.y,
                                        },
                                        target: {
                                            x: resultAttack.target.x,
                                            y: resultAttack.target.y,
                                        },
                                        currentPlayer: resultAttack.currentPlayer,
                                        isQueen: resultAttack.isQueen,
                                        hasEnemy: true
                                    });

                                    return false;
                                }
                                else {
                                    socket.emit('attack', {
                                        gameId: resultAttack.gameId,
                                        prev: {
                                            x: resultAttack.prev.x,
                                            y: resultAttack.prev.y,
                                        },
                                        next: {
                                            x: resultAttack.next.x,
                                            y: resultAttack.next.y,
                                        },
                                        target: {
                                            x: resultAttack.target.x,
                                            y: resultAttack.target.y,
                                        },
                                        currentPlayer: resultAttack.currentPlayer,
                                        isQueen: resultAttack.isQueen,
                                        hasEnemy: false
                                    });

                                    // change player
                                    if (currentColor === "white") {
                                        player = "black";
                                    }
                                    else if (currentColor === "black") {
                                        player = "white";
                                    }

                                    $(".piece").removeClass("active");
                                    $(".piece").removeClass("potencial_dead");
                                    $('.rank__check').removeClass("over");

                                    return false;
                                }

                                /**
                                 *
                                 * ===========================================
                                 *
                                 */

                            }
                        }

                    }
                    // queen step
                    else {

                        potencialStepsWhiteQueenGlobal.forEach(function (value) {
                            if(current_piece !== null) {
                                if (current_piece.parentElement === value[0].currentpiece) {

                                    value[0].upright.empty.forEach(function (val_up) {
                                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                            if(currentColor === "white") {
                                                $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                            }
                                            else if(currentColor === "black") {
                                                $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                            }
                                            socket.emit('step', {
                                                gameId: serverGame.id,
                                                prev: {
                                                    x: but_x,
                                                    y: but_y,
                                                },
                                                next: {
                                                    x: val_up[0].getAttribute("x"),
                                                    y: val_up[0].getAttribute("y"),
                                                },
                                                currentPlayer: player,
                                                isQueen: true
                                            });

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });

                                    value[0].upleft.empty.forEach(function (val_up) {
                                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                            if(currentColor === "white") {
                                                $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                            }
                                            else if(currentColor === "black") {
                                                $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                            }
                                            socket.emit('step', {
                                                gameId: serverGame.id,
                                                prev: {
                                                    x: but_x,
                                                    y: but_y,
                                                },
                                                next: {
                                                    x: val_up[0].getAttribute("x"),
                                                    y: val_up[0].getAttribute("y"),
                                                },
                                                currentPlayer: player,
                                                isQueen: true
                                            });

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });

                                    value[0].bottomright.empty.forEach(function (val_bot) {
                                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                            if(currentColor === "white") {
                                                $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                            }
                                            else if(currentColor === "black") {
                                                $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                            }
                                            socket.emit('step', {
                                                gameId: serverGame.id,
                                                prev: {
                                                    x: but_x,
                                                    y: but_y,
                                                },
                                                next: {
                                                    x: val_bot[0].getAttribute("x"),
                                                    y: val_bot[0].getAttribute("y"),
                                                },
                                                currentPlayer: player,
                                                isQueen: true
                                            });

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });

                                    value[0].bottomleft.empty.forEach(function (val_bot) {
                                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                            if(currentColor === "white") {
                                                $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                            }
                                            else if(currentColor === "black") {
                                                $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                            }
                                            socket.emit('step', {
                                                gameId: serverGame.id,
                                                prev: {
                                                    x: but_x,
                                                    y: but_y,
                                                },
                                                next: {
                                                    x: val_bot[0].getAttribute("x"),
                                                    y: val_bot[0].getAttribute("y"),
                                                },
                                                currentPlayer: player,
                                                isQueen: true
                                            });

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });
                                }
                            }
                        });

                    }


                    $(".piece").removeClass("active");
                    $(".piece").removeClass("potencial_dead");
                    $('.rank__check').removeClass("over");

                    return false;

                }
                /**
                 * SIMPLE CHECKERS
                 */
                else {

                    // если режим "обязательно рубить", то проверяем, срубилена шашка
                    // если не срублена, то шашка "съедается"
                    needAttack = false;

                    potencialStepsSimpleGlobal.forEach(function (value) {

                        //и заодно убираем лишние классы
                        value[0].needeat.forEach(function (val_need) {
                            $(val_need.firstElementChild).toggleClass("fuch", false);
                        });


                        if(value[0].upright.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value[0].upleft.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value[0].bottomright.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value[0].bottomleft.needStep.length > 0) {
                            needAttack = true;
                        }

                    });

                    // simple need attack
                    if(needAttack) {

                        // если режим "обязательно рубить", то проверяем, срубилена шашка
                        // если не срублена, то шашка "съедается"
                        needEat = false;

                        potencialStepsSimpleGlobal.forEach(function (value) {

                            value[0].upright.needStep.forEach(function (val_up) {
                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value[0].upleft.needStep.forEach(function (val_up) {
                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value[0].bottomright.needStep.forEach(function (val_bot) {
                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value[0].bottomleft.needStep.forEach(function (val_bot) {
                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                        });

                        // надо съесть (возможен фук)
                        if(!needEat && FUCHS === "on") {

                            isPlayerChange = false;
                            isFuch = false;
                            indexNeadEat = randomInteger(0, potencialStepsSimpleGlobal[0][0].needeat.length - 1);

                            potencialStepsSimpleGlobal.forEach(function (value) {
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        if(!isFuch) {
                                            value[0].upright.empty.forEach(function (val_up) {
                                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();

                                                    isFuch = true;
                                                    isPlayerChange = true;

                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].upleft.empty.forEach(function (val_up) {
                                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomright.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomleft.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    socket.emit('fuch', {
                                                        gameId: serverGame.id,
                                                        currentPlayer: player,
                                                        target_x: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("x"),
                                                        target_y: potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].getAttribute("y"),
                                                    });

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }
                                    }
                                }

                                // прозевал шашку, но дальше ход сделать то надо
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        value[0].upright.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if(event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if(event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if(event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].upleft.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if(event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if(event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if(event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].bottomright.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if(event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if(event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if(event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;

                                            }
                                        });

                                        value[0].bottomleft.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if(event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if(event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if(event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });
                                    }
                                }

                            });

                            if(isPlayerChange) {
                                // change player
                                if (currentColor === "white") {
                                    player = "black";
                                }
                                else if (currentColor === "black") {
                                    player = "white";
                                }
                            }

                        }
                        else if (!needEat && FUCHS !== "on") {
                            potencialStepsSimpleGlobal.forEach(function (value) {
                                if (current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        value[0].upright.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if (event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if (event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if (event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].upleft.empty.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if (event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if (event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if (event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_up[0].getAttribute("x"),
                                                            y: val_up[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });

                                        value[0].bottomright.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if (event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if (event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if (event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;

                                            }
                                        });

                                        value[0].bottomleft.empty.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                                if (currentColor === "white") {
                                                    if (event.target.getAttribute("queen") === "white") {
                                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                                    }
                                                }
                                                else if (currentColor === "black") {
                                                    if (event.target.getAttribute("queen") === "black") {
                                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                    }
                                                    else {
                                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                                    }
                                                }

                                                if (event.target.getAttribute("queen") !== null) {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true
                                                    });
                                                }
                                                else {
                                                    socket.emit('step', {
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: val_bot[0].getAttribute("x"),
                                                            y: val_bot[0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                    });
                                                }

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                            }
                                        });
                                    }
                                }
                            });

                            if(isPlayerChange) {
                                // change player
                                if (currentColor === "white") {
                                    player = "black";
                                }
                                else if (currentColor === "black") {
                                    player = "white";
                                }
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {

                            isAttackSucces = false;
                            resultAttack = [];

                            potencialStepsSimpleGlobal.forEach(function (value) {

                                if (current_piece.parentElement === value[0].currentpiece) {
                                    if (isAttackSucces === false) {
                                        value[0].upright.needStep.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].upright.enemy[0][0].getAttribute("x") + "][y=" + value[0].upright.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;
                                            }
                                        });
                                    }

                                    if (isAttackSucces === false) {
                                        value[0].upleft.needStep.forEach(function (val_up) {
                                            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].upleft.enemy[0][0].getAttribute("x") + "][y=" + value[0].upleft.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].upleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].upleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;

                                            }
                                        });
                                    }

                                    if (isAttackSucces === false) {
                                        value[0].bottomright.needStep.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].bottomright.enemy[0][0].getAttribute("x") + "][y=" + value[0].bottomright.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomright.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomright.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;
                                            }
                                        });
                                    }

                                    if (isAttackSucces === false) {
                                        value[0].bottomleft.needStep.forEach(function (val_bot) {
                                            if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                let kill_target = $(".rank__check[x=" + value[0].bottomleft.enemy[0][0].getAttribute("x") + "][y=" + value[0].bottomleft.enemy[0][0].getAttribute("y") + "]");

                                                if (currentColor === "white") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "white",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        kill_target: kill_target
                                                    };

                                                }
                                                else if (currentColor === "black") {
                                                    resultAttack = {
                                                        target_place: event.target,
                                                        local_color: "black",
                                                        gameId: serverGame.id,
                                                        prev: {
                                                            x: but_x,
                                                            y: but_y,
                                                        },
                                                        next: {
                                                            x: current_x,
                                                            y: current_y,
                                                        },
                                                        target: {
                                                            x: value[0].bottomleft.enemy[0][0].getAttribute("x"),
                                                            y: value[0].bottomleft.enemy[0][0].getAttribute("y"),
                                                        },
                                                        currentPlayer: player,
                                                        isQueen: true,
                                                        kill_target: kill_target
                                                    };
                                                }

                                                isAttackSucces = true;
                                            }
                                        });
                                    }
                                }
                            });

                            // если атака прошла успешно
                            if (!$.isEmptyObject(resultAttack)) {

                                if (resultAttack.local_color === "white") {
                                    if(resultAttack.target_place.getAttribute("queen") === "white") {
                                        $(resultAttack.target_place).append('<div class="piece white queen">&#9813;</div>');
                                    }
                                    else {
                                        $(resultAttack.target_place).append('<div class="piece white">&#9814;</div>');
                                    }
                                }
                                else if (resultAttack.local_color === "black") {
                                    if(resultAttack.target_place.getAttribute("queen") === "black") {
                                        $(resultAttack.target_place).append('<div class="piece black queen">&#9819;</div>');
                                    }
                                    else {
                                        $(resultAttack.target_place).append('<div class="piece black">&#9820;</div>');
                                    }
                                }

                                // if (resultAttack.local_color === "white") {
                                //     $(resultAttack.target_place).append('<div class="piece white">&#9814;</div>');
                                // }
                                // else if (resultAttack.local_color === "black") {
                                //     $(resultAttack.target_place).append('<div class="piece black">&#9820;</div>');
                                // }

                                $(current_piece).remove();
                                current_piece = null;

                                $(resultAttack.kill_target)[0].firstElementChild.remove();

                                /**
                                 * NEXT ATTACK
                                 * ===========================================
                                 *
                                 */

                                current_piece = $(".rank__check[x=" + current_x + "][y=" + current_y + "]")[0].firstElementChild;

                                next = nextSimpleAttack(current_piece);

                                if (next) {
                                    $(current_piece).addClass("next");

                                    if(resultAttack.target_place.getAttribute("queen") !== null) {
                                        socket.emit('attack', {
                                            gameId: resultAttack.gameId,
                                            prev: {
                                                x: resultAttack.prev.x,
                                                y: resultAttack.prev.y,
                                            },
                                            next: {
                                                x: resultAttack.next.x,
                                                y: resultAttack.next.y,
                                            },
                                            target: {
                                                x: resultAttack.target.x,
                                                y: resultAttack.target.y,
                                            },
                                            currentPlayer: resultAttack.currentPlayer,
                                            isQueen: true,
                                            hasEnemy: true
                                        });
                                    }
                                    else {
                                        socket.emit('attack', {
                                            gameId: resultAttack.gameId,
                                            prev: {
                                                x: resultAttack.prev.x,
                                                y: resultAttack.prev.y,
                                            },
                                            next: {
                                                x: resultAttack.next.x,
                                                y: resultAttack.next.y,
                                            },
                                            target: {
                                                x: resultAttack.target.x,
                                                y: resultAttack.target.y,
                                            },
                                            currentPlayer: resultAttack.currentPlayer,
                                            hasEnemy: true
                                        });
                                    }
                                }
                                else {

                                    if(resultAttack.target_place.getAttribute("queen") !== null) {

                                        socket.emit('attack', {
                                            gameId: resultAttack.gameId,
                                            prev: {
                                                x: resultAttack.prev.x,
                                                y: resultAttack.prev.y,
                                            },
                                            next: {
                                                x: resultAttack.next.x,
                                                y: resultAttack.next.y,
                                            },
                                            target: {
                                                x: resultAttack.target.x,
                                                y: resultAttack.target.y,
                                            },
                                            currentPlayer: resultAttack.currentPlayer,
                                            isQueen: true,
                                            hasEnemy: false
                                        });
                                    }
                                    else {
                                        socket.emit('attack', {
                                            gameId: resultAttack.gameId,
                                            prev: {
                                                x: resultAttack.prev.x,
                                                y: resultAttack.prev.y,
                                            },
                                            next: {
                                                x: resultAttack.next.x,
                                                y: resultAttack.next.y,
                                            },
                                            target: {
                                                x: resultAttack.target.x,
                                                y: resultAttack.target.y,
                                            },
                                            currentPlayer: resultAttack.currentPlayer,
                                            hasEnemy: false
                                        });
                                    }

                                    // change player
                                    if (currentColor === "white") {
                                        player = "black";
                                    }
                                    else if (currentColor === "black") {
                                        player = "white";
                                    }

                                    $(".piece").removeClass("active");
                                    $(".piece").removeClass("potencial_dead");
                                    $('.rank__check').removeClass("over");
                                }
                            }
                        }
                    }
                    // simple step
                    else {

                        potencialStepsSimpleGlobal.forEach(function (value) {
                            if(current_piece !== null) {
                                if (current_piece.parentElement === value[0].currentpiece) {

                                    value[0].upright.empty.forEach(function (val_up) {
                                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                            if (currentColor === "white") {
                                                if(event.target.getAttribute("queen") === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece white">&#9814;</div>');
                                                }
                                            }
                                            else if (currentColor === "black") {
                                                if(event.target.getAttribute("queen") === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece black">&#9820;</div>');
                                                }
                                            }

                                            if(event.target.getAttribute("queen") !== null) {

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });
                                            }
                                            else {
                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                });
                                            }


                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });

                                    value[0].upleft.empty.forEach(function (val_up) {
                                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                            if (currentColor === "white") {
                                                if(event.target.getAttribute("queen") === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece white">&#9814;</div>');
                                                }
                                            }
                                            else if (currentColor === "black") {
                                                if(event.target.getAttribute("queen") === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece black">&#9820;</div>');
                                                }
                                            }

                                            if(event.target.getAttribute("queen") !== null) {

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });
                                            }
                                            else {
                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_up[0].getAttribute("x"),
                                                        y: val_up[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                });
                                            }

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });

                                    value[0].bottomright.empty.forEach(function (val_bot) {
                                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                            if (currentColor === "white") {
                                                if(event.target.getAttribute("queen") === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece white">&#9814;</div>');
                                                }
                                            }
                                            else if (currentColor === "black") {
                                                if(event.target.getAttribute("queen") === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece black">&#9820;</div>');
                                                }
                                            }

                                            if(event.target.getAttribute("queen") !== null) {

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });
                                            }
                                            else {
                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                });
                                            }

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });

                                    value[0].bottomleft.empty.forEach(function (val_bot) {
                                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                            if (currentColor === "white") {
                                                if(event.target.getAttribute("queen") === "white") {
                                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece white">&#9814;</div>');
                                                }
                                            }
                                            else if (currentColor === "black") {
                                                if(event.target.getAttribute("queen") === "black") {
                                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                                }
                                                else {
                                                    $(event.target).append('<div class="piece black">&#9820;</div>');
                                                }
                                            }

                                            if(event.target.getAttribute("queen") !== null) {

                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                    isQueen: true
                                                });
                                            }
                                            else {
                                                socket.emit('step', {
                                                    gameId: serverGame.id,
                                                    prev: {
                                                        x: but_x,
                                                        y: but_y,
                                                    },
                                                    next: {
                                                        x: val_bot[0].getAttribute("x"),
                                                        y: val_bot[0].getAttribute("y"),
                                                    },
                                                    currentPlayer: player,
                                                });
                                            }

                                            $(current_piece).remove();
                                            current_piece = null;

                                            // change player
                                            if (currentColor === "white") {
                                                player = "black";
                                            }
                                            else if (currentColor === "black") {
                                                player = "white";
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }


                    $(".piece").removeClass("active");
                    $(".piece").removeClass("potencial_dead");
                    $('.rank__check').removeClass("over");

                }
            }
        }

        $(".piece").removeClass("active");
        $(".piece").removeClass("potencial_dead");
        $('.rank__check').removeClass("over");

    });
});



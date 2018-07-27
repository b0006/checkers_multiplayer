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

    //можно обычным шашка аттаковать назад
    let SIMPLE_BACK_ATTACK = null;

    // click on player vs player
    addDynamicEventListener(document.body, 'click', '#PP', function (e) {
        $('#page-start').hide();
        $('#page-login').show();
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
    let potencialAttackWhiteQueenGlobal = [];
    let hasQueenEnemyForAttack = false;

    let potencialStepsWhiteQueenGlobal_2 = [];

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
        MULTYATTACK = settings_game.multiattack;
        FUCHS = settings_game.fuchs;
        SIMPLE_BACK_ATTACK = settings_game.simple_back_attack;

        console.log("joined as game id: " + msg.game.id );
        playerColor = msg.color;
        initGame(msg.game);

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
            console.log(msg);

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

            // меняем игрока
            if(msg.currentPlayer === "black") {
                player = "white";
            }
            else if(msg.currentPlayer === "white") {
                player = "black";
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
                            // piece = document.createElement("div");
                            // piece.className = "piece white";
                            // piece.innerHTML = "&#9814;";
                            // rank__check.append(piece);

                            piece = document.createElement("div");
                            piece.className = "piece white queen";
                            piece.innerHTML = "&#9813;";
                            rank__check.append(piece);
                        }
                    }
                    else {
                        if ((t % 2 === 0)) {
                            // piece = document.createElement("div");
                            // piece.className = "piece white";
                            // piece.innerHTML = "&#9814;";
                            // rank__check.append(piece);
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
    };

    // let player = "white"; //the first player
    let isHasEnemy = false;

    let current_piece = null; // global last click piece
    let nextAttack = null; // global next cell for player attack
    let nextStep = null; // global next cell for player step
    let nextTarget = null; // global next enemy of player

    function checkPlayer(object) {
        if(object.classList.contains("black")) {
            return "black";
        }
        else if(object.classList.contains("white"))
        {
            return "white";
        }
    }

    // if cell has coordinates, then at this cell posible move
    function isMoviableCell(cell) {
        if(cell.getAttribute("x"))
            return true;
        else
            return false;
    }

    // rotate a board
    addDynamicEventListener(document.body, 'click', '#rotate-board', function (e) {
        $('.board').toggleClass("rotate_board");
        $('.rank__check').toggleClass("rotate_board");
    });

    // click on checkers
    addDynamicEventListener(document.body, 'click', '.piece', function (e) {

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

        // надо исправить это недразумение будет
        let potencial_up_right_x = null;
        let potencial_up_right_y = null;
        let potencial_right_x = null;
        let potencial_right_y = null;
        let potencial_bottom_right_x = null;
        let potencial_bottom_right_y = null;

        let potencial_up_left_x = null;
        let potencial_up_left_y = null;
        let potencial_left_x = null;
        let potencial_left_y = null;
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


        // get all pieces
        let allPiece = document.querySelectorAll('.rank__check');


        let arPotencialWhite = [];
        let isWhiteNeedAttack = [];

        let arPotencialBlack = [];
        let isBlackNeedAttack = [];

        /**
         * QUEEN
         */

        let currentPiece = $('.rank__check[x=' + piece_x + '][y=' + piece_y + ']')[0];
        let potencialStepsWhiteQueenUpRigth = [];
        let potencialStepsWhiteQueenUpLeft = [];
        let potencialStepsWhiteQueenBottomRigth = [];
        let potencialStepsWhiteQueenBottomLeft = [];


        let potencialAttackWhiteQueenUpRigth = [];
        let potencialAttackWhiteQueenUpLeft = [];
        let potencialAttackWhiteQueenBottomRigth = [];
        let potencialAttackWhiteQueenBottomLeft = [];

        let count = 0;

        if(currentPiece.firstElementChild.classList.contains("queen")) {

            let potencialWhiteQueenCell = null;
            let nextPotencialWhiteQueenCell = null;

            //для того, чтобы "заставить" дамку рубить (если режим игры заставляет только рубит и ни как иначе)
            /**
             * if(!hasQueenEnemy) {
             *    count = 0;
             *    for (let q = 1; q < 8; q++)
             * }
             *
             */
            let needStepUpRight = [];
            let needStepUpLeft = [];
            let needStepBottomRight = [];
            let needStepBottomLeft = [];

            let hasQueenEnemy = false;
            let needStep = [];
            let forNeedStep = false; // для привязки enemy и needStep
            let arForNeedStep = [];

            count = 0;
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
                                                hasQueenEnemyForAttack = true; //global
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
                                needStepUpRight.push(potencialWhiteQueenCell); //test
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
                                                    hasQueenEnemyForAttack = true; //global
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
                                    needStepUpLeft.push(potencialWhiteQueenCell); //test
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
                                                hasQueenEnemyForAttack = true; //global
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
                                needStepBottomRight.push(potencialWhiteQueenCell); //test
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
                                                hasQueenEnemyForAttack = true; //global
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
                                needStepBottomLeft.push(potencialWhiteQueenCell); //test
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

            // hasQueenEnemy = false;
            // count = 0;
            // for (let q = 1; q < 8; q++) {
            //
            //     potencial_bottom_left_x = parseInt(piece_x) - q;
            //     potencial_bottom_left_y = parseInt(piece_y) + q;
            //
            //     nextPotencial_bottom_left_x = (parseInt(piece_x) - q) - 1;
            //     nextPotencial_bottom_left_y = (parseInt(piece_y) + q) + 1;
            //
            //     if ((potencial_bottom_left_x < 8) && (potencial_bottom_left_y < 8) && (potencial_bottom_left_x >= 0) && (potencial_bottom_left_y >= 0)) {
            //
            //         potencialWhiteQueenCell = $('.rank__check[x=' + potencial_bottom_left_x + '][y=' + potencial_bottom_left_y + ']');
            //         nextPotencialWhiteQueenCell = $('.rank__check[x=' + nextPotencial_bottom_left_x + '][y=' + nextPotencial_bottom_left_y + ']');
            //
            //         try {
            //             if (potencialWhiteQueenCell[0].firstElementChild) {
            //
            //                 if (currentPiece.firstElementChild.classList.contains("white")) {
            //                     if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
            //                         break;
            //                     }
            //                 }
            //                 else if (currentPiece.firstElementChild.classList.contains("black")) {
            //                     if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
            //                         break;
            //                     }
            //                 }
            //
            //                 if (count === 0) {
            //
            //                     if (currentPiece.firstElementChild.classList.contains("white")) {
            //                         // if this is enemy
            //                         if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {
            //
            //                             try {
            //                                 if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
            //                                     //get next target fot attack
            //                                     potencialAttackWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
            //                                     hasQueenEnemy = true;
            //                                 }
            //                             }
            //                             catch (exp) {
            //                             }
            //                         }
            //                     }
            //                     else if (currentPiece.firstElementChild.classList.contains("black")) {
            //                         // if this is enemy
            //                         if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {
            //
            //                             try {
            //                                 if (!nextPotencialWhiteQueenCell[0].firstElementChild) {
            //                                     //get next target fot attack
            //                                     potencialAttackWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
            //                                     hasQueenEnemy = true;
            //                                 }
            //                             }
            //                             catch (exp) {
            //                             }
            //                         }
            //                     }
            //                 }
            //                 else {
            //                     break;
            //                 }
            //                 count++;
            //
            //             }
            //             else {
            //                 if (hasQueenEnemy) {
            //                     needStep.push(potencialWhiteQueenCell);
            //                 }
            //                 else {
            //                     potencialStepsWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
            //                 }
            //             }
            //         }
            //         catch(exb){}
            //
            //         try {
            //             if (potencialWhiteQueenCell[0].firstElementChild && nextPotencialWhiteQueenCell[0].firstElementChild) {
            //                 break;
            //             }
            //         }
            //         catch (exp) {
            //         }
            //     }
            // }

            potencialStepsWhiteQueenGlobal = [];
            potencialAttackWhiteQueenGlobal = [];

            // potencialStepsWhiteQueenGlobal_2 = []; //test

            potencialStepsWhiteQueenGlobal = [{
                needeat : current_piece,
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

            // potencialStepsWhiteQueenGlobal = {
            //     needStep : needStep,
            //     empty : potencialStepsWhiteQueenGlobal.concat(potencialStepsWhiteQueenUpRigth, potencialStepsWhiteQueenUpLeft, potencialStepsWhiteQueenBottomRigth, potencialStepsWhiteQueenBottomLeft, needStep),
            //     enemy : potencialAttackWhiteQueenGlobal.concat(potencialAttackWhiteQueenUpRigth, potencialAttackWhiteQueenUpLeft, potencialAttackWhiteQueenBottomRigth, potencialAttackWhiteQueenBottomLeft)
            // };


            $('.rank__check').toggleClass("over", false);

            potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                value.upright.empty.forEach(function (val_up) {
                    val_up.toggleClass("over", true);
                });
                value.upright.needStep.forEach(function (val_up) {
                    val_up.toggleClass("over", true);
                });


                value.upleft.empty.forEach(function (val_up) {
                    val_up.toggleClass("over", true);
                });
                value.upleft.needStep.forEach(function (val_up) {
                    val_up.toggleClass("over", true);
                });

                value.bottomright.empty.forEach(function (val_bot) {
                    val_bot.toggleClass("over", true);
                });
                value.bottomright.needStep.forEach(function (val_bot) {
                    val_bot.toggleClass("over", true);
                });

                value.bottomleft.empty.forEach(function (val_bot) {
                    val_bot.toggleClass("over", true);
                });
                value.bottomleft.needStep.forEach(function (val_bot) {
                    val_bot.toggleClass("over", true);
                });
            });

            // potencialStepsWhiteQueenGlobal["empty"].forEach(function (value, index, array) {
            //     // value.toggleClass("over", true);
            // });

            // potencialStepsWhiteQueenUpRigth.forEach(function (value, index, array) {
            //     value.toggleClass("over", true);
            // });
            // potencialStepsWhiteQueenUpLeft.forEach(function (value, index, array) {
            //     value.toggleClass("over", true);
            // });
            // potencialStepsWhiteQueenBottomRigth.forEach(function (value, index, array) {
            //     value.toggleClass("over", true);
            // });
            // potencialStepsWhiteQueenBottomLeft.forEach(function (value, index, array) {
            //     value.toggleClass("over", true);
            // });
        }
        /**
         * SIMPLE CHECKERS
         */
        else {
            for(let i = 0; i < allPiece.length; i++) {
                // remove from all pieces potencial style cell
                $(allPiece[i]).removeClass("over");

                if(isMoviableCell(allPiece[i])){


                    // get for white next step
                    if(current_piece.classList.contains("white")) {
                        if (current_piece.classList.contains("queen")) {

                        }
                        else {
                            potencial_right_x = parseInt(piece_x) + 1;
                            potencial_right_y = parseInt(piece_y) - 1;

                            if ((potencial_right_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_right_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("black")) {

                                        potencial_right_x = parseInt(piece_x) + 2;
                                        potencial_right_y = parseInt(piece_y) - 2;

                                        try {

                                            let piece_for_attack = $('.rank__check[x=' + potencial_right_x + '][y=' + potencial_right_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {

                                                isWhiteNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }
                                    }
                                }
                                else {
                                    // get next step
                                    arPotencialWhite.push(allPiece[i]);
                                }
                            }

                            potencial_left_x = parseInt(piece_x) - 1;
                            potencial_left_y = parseInt(piece_y) - 1;

                            if ((potencial_left_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_left_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("black")) {

                                        potencial_left_x = parseInt(piece_x) - 2;
                                        potencial_left_y = parseInt(piece_y) - 2;

                                        try {
                                            let piece_for_attack = $('.rank__check[x=' + potencial_left_x + '][y=' + potencial_left_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {
                                                isWhiteNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }

                                    }
                                }
                                else {
                                    // get next step
                                    arPotencialWhite.push(allPiece[i]);
                                }
                            }

                            potencial_bottom_right_x = parseInt(piece_x) + 1;
                            potencial_bottom_right_y = parseInt(piece_y) + 1;

                            if ((potencial_bottom_right_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_bottom_right_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("black")) {

                                        potencial_bottom_right_x = parseInt(piece_x) + 2;
                                        potencial_bottom_right_y = parseInt(piece_y) + 2;

                                        try {

                                            let piece_for_attack = $('.rank__check[x=' + potencial_bottom_right_x + '][y=' + potencial_bottom_right_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {

                                                isWhiteNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }
                                    }
                                }
                            }

                            potencial_bottom_left_x = parseInt(piece_x) - 1;
                            potencial_bottom_left_y = parseInt(piece_y) + 1;

                            if ((potencial_bottom_left_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_bottom_left_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("black")) {

                                        potencial_bottom_left_x = parseInt(piece_x) - 2;
                                        potencial_bottom_left_y = parseInt(piece_y) + 2;

                                        try {

                                            let piece_for_attack = $('.rank__check[x=' + potencial_bottom_left_x + '][y=' + potencial_bottom_left_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {

                                                isWhiteNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if(current_piece.classList.contains("black")) {

                        if (current_piece.classList.contains("queen")) {
                            console.log("queen black");

                        }
                        else {

                            potencial_right_x = parseInt(piece_x) - 1;
                            potencial_right_y = parseInt(piece_y) + 1;

                            if ((potencial_right_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_right_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("white")) {

                                        potencial_right_x = parseInt(piece_x) - 2;
                                        potencial_right_y = parseInt(piece_y) + 2;

                                        try {
                                            let piece_for_attack = $('.rank__check[x=' + potencial_right_x + '][y=' + potencial_right_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {
                                                // get next step
                                                // arPotencialWhite.push(piece_for_attack);

                                                isBlackNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }
                                    }
                                }
                                else {
                                    arPotencialBlack.push(allPiece[i]);
                                }
                            }

                            potencial_left_x = parseInt(piece_x) + 1;
                            potencial_left_y = parseInt(piece_y) + 1;

                            if ((potencial_left_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_left_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("white")) {

                                        potencial_left_x = parseInt(piece_x) + 2;
                                        potencial_left_y = parseInt(piece_y) + 2;

                                        try {

                                            let piece_for_attack = $('.rank__check[x=' + potencial_left_x + '][y=' + potencial_left_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {
                                                // get next step
                                                // arPotencialWhite.push(piece_for_attack);

                                                isBlackNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }

                                    }
                                }
                                else {
                                    arPotencialBlack.push(allPiece[i]);
                                }
                            }

                            potencial_up_right_x = parseInt(piece_x) + 1;
                            potencial_up_right_y = parseInt(piece_y) - 1;

                            if ((potencial_up_right_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_up_right_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("white")) {

                                        potencial_up_right_x = parseInt(piece_x) + 2;
                                        potencial_up_right_y = parseInt(piece_y) - 2;

                                        try {
                                            let piece_for_attack = $('.rank__check[x=' + potencial_up_right_x + '][y=' + potencial_up_right_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {
                                                // get next step
                                                // arPotencialWhite.push(piece_for_attack);

                                                isBlackNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }
                                    }
                                }
                            }

                            potencial_up_left_x = parseInt(piece_x) - 1;
                            potencial_up_left_y = parseInt(piece_y) - 1;

                            if ((potencial_up_left_x === parseInt(allPiece[i].getAttribute("x"))) && (potencial_up_left_y === parseInt(allPiece[i].getAttribute("y")))) {
                                if (allPiece[i].hasChildNodes()) {
                                    if (allPiece[i].firstElementChild.classList.contains("white")) {

                                        potencial_up_left_x = parseInt(piece_x) - 2;
                                        potencial_up_left_y = parseInt(piece_y) - 2;

                                        try {
                                            let piece_for_attack = $('.rank__check[x=' + potencial_up_left_x + '][y=' + potencial_up_left_y + ']')[0];

                                            if (!piece_for_attack.hasChildNodes()) {
                                                // get next step
                                                // arPotencialWhite.push(piece_for_attack);

                                                isBlackNeedAttack.push({
                                                    enemy: allPiece[i],
                                                    target: piece_for_attack,
                                                    isAttack: true
                                                });

                                                isHasEnemy = true;
                                            }
                                        }
                                        catch (piece_for_e) {
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // attack
            if(isHasEnemy) {
                if(current_piece.classList.contains("white")) {
                    // set for white next step

                    // if next cell has enemy then attack
                    if(isWhiteNeedAttack.length > 0) {
                        let jumping = isWhiteNeedAttack[0].target;
                        let enemy = isWhiteNeedAttack[0].enemy;

                        nextTarget = enemy;

                        $(current_piece).addClass("active");
                        $($(enemy)[0].firstElementChild).addClass("potencial_dead");
                        $(jumping).addClass("over");

                        nextAttack = jumping;
                        isHasEnemy = true;

                    }
                }
                else if(current_piece.classList.contains("black")) {
                    // set for black next step

                    // if next cell has enemy then attack
                    if(isBlackNeedAttack.length > 0) {
                        let jumping = isBlackNeedAttack[0].target;
                        let enemy = isBlackNeedAttack[0].enemy;

                        nextTarget = enemy;

                        $(current_piece).addClass("active");
                        $($(enemy)[0].firstElementChild).addClass("potencial_dead");
                        $(jumping).addClass("over");

                        nextAttack = jumping;
                        isHasEnemy = true;

                    }
                }
            }
            // step
            else {

                if(current_piece.classList.contains("white")) {

                    $(current_piece).addClass("active");

                    arPotencialWhite.forEach(function (value, index) {
                        $(value).addClass("over");
                    });

                    nextStep = arPotencialWhite;

                }
                else if(current_piece.classList.contains("black")) {

                    $(current_piece).addClass("active");

                    arPotencialBlack.forEach(function (value, index) {
                        $(value).addClass("over");
                    });

                    nextStep = arPotencialBlack;
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

                if(current_piece.classList.contains("queen")) {

                    // если режим "обязательно рубить", то проверяем, срубилена шашка
                    // если не срублена, то шашка "съедается"
                    let needAttack = false;

                    potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                        if(value.upright.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value.upleft.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value.bottomright.needStep.length > 0) {
                            needAttack = true;
                        }

                        if(value.bottomleft.needStep.length > 0) {
                            needAttack = true;
                        }
                    });

                    if(needAttack) {
                        // если режим "обязательно рубить", то проверяем, срубилена шашка
                        // если не срублена, то шашка "съедается"
                        let needEat = false;

                        potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                            value.upright.needStep.forEach(function (val_up) {
                                if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value.upleft.needStep.forEach(function (val_up) {
                                if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value.bottomright.needStep.forEach(function (val_bot) {
                                if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });

                            value.bottomleft.needStep.forEach(function (val_bot) {
                                if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    needEat = true;
                                }
                            });
                        });

                        //nu i takoe byvaet
                        if(!needEat) { // tochnee nado :)

                            console.log(potencialStepsWhiteQueenGlobal);

                            if(current_piece.parentElement.getAttribute("x") === potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("x")
                            && current_piece.parentElement.getAttribute("y") === potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("y")
                            ) {

                                potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                                    value.upright.empty.forEach(function (val_up) {
                                        if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                            socket.emit('fuch', {
                                                gameId: serverGame.id,
                                                currentPlayer: player,
                                                target_x : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("x"),
                                                target_y : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("y"),
                                            });

                                            $(potencialStepsWhiteQueenGlobal[0].needeat).remove();

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

                                    value.upleft.empty.forEach(function (val_up) {
                                        if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                            socket.emit('fuch', {
                                                gameId: serverGame.id,
                                                currentPlayer: player,
                                                target_x : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("x"),
                                                target_y : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("y"),
                                            });

                                            $(potencialStepsWhiteQueenGlobal[0].needeat).remove();

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

                                    value.bottomright.empty.forEach(function (val_bot) {
                                        if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                            socket.emit('fuch', {
                                                gameId: serverGame.id,
                                                currentPlayer: player,
                                                target_x : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("x"),
                                                target_y : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("y"),
                                            });

                                            $(potencialStepsWhiteQueenGlobal[0].needeat).remove();

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

                                    value.bottomleft.empty.forEach(function (val_bot) {
                                        if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                            socket.emit('fuch', {
                                                gameId: serverGame.id,
                                                currentPlayer: player,
                                                target_x : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("x"),
                                                target_y : potencialStepsWhiteQueenGlobal[0].needeat.parentElement.getAttribute("y"),
                                            });

                                            $(potencialStepsWhiteQueenGlobal[0].needeat).remove();

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
                                });

                                $('.rank__check').toggleClass("over", false);

                                return false;
                            }

                            potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                                value.upright.empty.forEach(function (val_up) {
                                    if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

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

                                value.upleft.empty.forEach(function (val_up) {
                                    if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

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

                                value.bottomright.empty.forEach(function (val_bot) {
                                    if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

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

                                value.bottomleft.empty.forEach(function (val_bot) {
                                    if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

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
                            });

                        }
                        else {
                            potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                                value.upright.needStep.forEach(function (val_up) {
                                    if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                        if(currentColor === "white") {
                                            $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                        }
                                        else if(currentColor === "black") {
                                            $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                        }

                                        socket.emit('attack', {
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
                                                x: value.upright.enemy[0][0].getAttribute("x"),
                                                y: value.upright.enemy[0][0].getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                            isQueen: true
                                        });

                                        $(current_piece).remove();
                                        current_piece = null;

                                        let kill_target = $(".rank__check[x=" + value.upright.enemy[0][0].getAttribute("x") + "][y=" + value.upright.enemy[0][0].getAttribute("y") + "]");
                                        $(kill_target)[0].firstElementChild.remove();

                                        // change player
                                        if (currentColor === "white") {
                                            player = "black";
                                        }
                                        else if (currentColor === "black") {
                                            player = "white";
                                        }
                                    }
                                });

                                value.upleft.needStep.forEach(function (val_up) {
                                    if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                        if(currentColor === "white") {
                                            $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                        }
                                        else if(currentColor === "black") {
                                            $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                        }

                                        socket.emit('attack', {
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
                                                x: value.upleft.enemy[0][0].getAttribute("x"),
                                                y: value.upleft.enemy[0][0].getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                            isQueen: true
                                        });

                                        $(current_piece).remove();
                                        current_piece = null;

                                        let kill_target = $(".rank__check[x=" + value.upleft.enemy[0][0].getAttribute("x") + "][y=" + value.upleft.enemy[0][0].getAttribute("y") + "]");
                                        $(kill_target)[0].firstElementChild.remove();

                                        // change player
                                        if (currentColor === "white") {
                                            player = "black";
                                        }
                                        else if (currentColor === "black") {
                                            player = "white";
                                        }

                                    }
                                });

                                value.bottomright.needStep.forEach(function (val_bot) {
                                    if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                        if(currentColor === "white") {
                                            $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                        }
                                        else if(currentColor === "black") {
                                            $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                        }

                                        socket.emit('attack', {
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
                                                x: value.bottomright.enemy[0][0].getAttribute("x"),
                                                y: value.bottomright.enemy[0][0].getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                            isQueen: true
                                        });

                                        $(current_piece).remove();
                                        current_piece = null;

                                        let kill_target = $(".rank__check[x=" + value.bottomright.enemy[0][0].getAttribute("x") + "][y=" + value.bottomright.enemy[0][0].getAttribute("y") + "]");
                                        $(kill_target)[0].firstElementChild.remove();

                                        // change player
                                        if (currentColor === "white") {
                                            player = "black";
                                        }
                                        else if (currentColor === "black") {
                                            player = "white";
                                        }
                                    }
                                });

                                value.bottomleft.needStep.forEach(function (val_bot) {
                                    if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                        if(currentColor === "white") {
                                            $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                        }
                                        else if(currentColor === "black") {
                                            $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                        }

                                        socket.emit('attack', {
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
                                                x: value.bottomleft.enemy[0][0].getAttribute("x"),
                                                y: value.bottomleft.enemy[0][0].getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                            isQueen: true
                                        });

                                        $(current_piece).remove();
                                        current_piece = null;

                                        let kill_target = $(".rank__check[x=" + value.bottomleft.enemy[0][0].getAttribute("x") + "][y=" + value.bottomleft.enemy[0][0].getAttribute("y") + "]");
                                        $(kill_target)[0].firstElementChild.remove();

                                        // change player
                                        if (currentColor === "white") {
                                            player = "black";
                                        }
                                        else if (currentColor === "black") {
                                            player = "white";
                                        }
                                    }
                                });
                            });

                        }

                    }
                    //step queen
                    else {
                        potencialStepsWhiteQueenGlobal.forEach(function (value, index) {
                            value.upright.empty.forEach(function (val_up) {
                                if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
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

                            value.upleft.empty.forEach(function (val_up) {
                                if(current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
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

                            value.bottomright.empty.forEach(function (val_bot) {
                                if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
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

                            value.bottomleft.empty.forEach(function (val_bot) {
                                if(current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');
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
                        });
                    }
                }
                /**
                 * SIMPLE CHECKERS
                 */
                else {
                    //attack
                    if (nextAttack !== null) {

                        if ((nextAttack.getAttribute("x") === event.target.getAttribute("x")) && (nextAttack.getAttribute("y") === event.target.getAttribute("y"))) {

                            // createElement
                            // if (currentColor === "white") {
                            //     $(event.target).append('<div class="piece white">&#9814;</div>');
                            // }
                            // else if (currentColor === "black") {
                            //     $(event.target).append('<div class="piece black">&#9820;</div>');
                            // }

                            if (currentColor === "white") {
                                if (event.target.getAttribute("queen") === "white") {
                                    $(event.target).append('<div class="piece white queen">&#9813;</div>');

                                    socket.emit('attack', {
                                        gameId: serverGame.id,
                                        prev: {
                                            x: but_x,
                                            y: but_y,
                                        },
                                        next: {
                                            x: nextAttack.getAttribute("x"),
                                            y: nextAttack.getAttribute("y"),
                                        },
                                        target: {
                                            x: nextTarget.getAttribute("x"),
                                            y: nextTarget.getAttribute("y"),
                                        },
                                        currentPlayer: player,
                                        isQueen: true
                                    });

                                }
                                else {
                                    $(event.target).append('<div class="piece white">&#9814;</div>');

                                    socket.emit('attack', {
                                        gameId: serverGame.id,
                                        prev: {
                                            x: but_x,
                                            y: but_y,
                                        },
                                        next: {
                                            x: nextAttack.getAttribute("x"),
                                            y: nextAttack.getAttribute("y"),
                                        },
                                        target: {
                                            x: nextTarget.getAttribute("x"),
                                            y: nextTarget.getAttribute("y"),
                                        },
                                        currentPlayer: player
                                    });
                                }

                            }
                            else if (currentColor === "black") {
                                if (event.target.getAttribute("queen") === "black") {
                                    $(event.target).append('<div class="piece black queen">&#9819;</div>');

                                    socket.emit('attack', {
                                        gameId: serverGame.id,
                                        prev: {
                                            x: but_x,
                                            y: but_y,
                                        },
                                        next: {
                                            x: nextAttack.getAttribute("x"),
                                            y: nextAttack.getAttribute("y"),
                                        },
                                        target: {
                                            x: nextTarget.getAttribute("x"),
                                            y: nextTarget.getAttribute("y"),
                                        },
                                        currentPlayer: player,
                                        isQueen: true
                                    });
                                }
                                else {
                                    $(event.target).append('<div class="piece black">&#9820;</div>');

                                    socket.emit('attack', {
                                        gameId: serverGame.id,
                                        prev: {
                                            x: but_x,
                                            y: but_y,
                                        },
                                        next: {
                                            x: nextAttack.getAttribute("x"),
                                            y: nextAttack.getAttribute("y"),
                                        },
                                        target: {
                                            x: nextTarget.getAttribute("x"),
                                            y: nextTarget.getAttribute("y"),
                                        },
                                        currentPlayer: player
                                    });
                                }
                            }

                            $(current_piece).remove();
                            current_piece = null;


                            let kill_target = nextTarget.firstElementChild;
                            $(kill_target).remove();

                            // kill enemy
                            isHasEnemy = false;

                            // more attack must can do it...
                            //...
                            //...


                            // change player
                            if (currentColor === "white") {
                                player = "black";
                            }
                            else if (currentColor === "black") {
                                player = "white";
                            }
                        }
                    }
                    //step
                    else if (nextStep !== null) {
                        nextStep.forEach(function (value, index) {
                            if ((value.getAttribute("x") === current_x) && (value.getAttribute("y") === current_y)) {

                                if (currentColor === "white") {
                                    if (event.target.getAttribute("queen") === "white") {
                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');

                                        socket.emit('step', {
                                            gameId: serverGame.id,
                                            prev: {
                                                x: but_x,
                                                y: but_y,
                                            },
                                            next: {
                                                x: value.getAttribute("x"),
                                                y: value.getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                            isQueen: true
                                        });
                                    }
                                    else {
                                        $(event.target).append('<div class="piece white">&#9814;</div>');

                                        socket.emit('step', {
                                            gameId: serverGame.id,
                                            prev: {
                                                x: but_x,
                                                y: but_y,
                                            },
                                            next: {
                                                x: value.getAttribute("x"),
                                                y: value.getAttribute("y"),
                                            },
                                            currentPlayer: player
                                        });
                                    }

                                }
                                else if (currentColor === "black") {
                                    if (event.target.getAttribute("queen") === "black") {
                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');

                                        socket.emit('step', {
                                            gameId: serverGame.id,
                                            prev: {
                                                x: but_x,
                                                y: but_y,
                                            },
                                            next: {
                                                x: value.getAttribute("x"),
                                                y: value.getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                            isQueen: true
                                        });
                                    }
                                    else {
                                        $(event.target).append('<div class="piece black">&#9820;</div>');

                                        socket.emit('step', {
                                            gameId: serverGame.id,
                                            prev: {
                                                x: but_x,
                                                y: but_y,
                                            },
                                            next: {
                                                x: value.getAttribute("x"),
                                                y: value.getAttribute("y"),
                                            },
                                            currentPlayer: player,
                                        });
                                    }
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

                    nextStep = null;
                    nextTarget = null;
                    nextAttack = null;
                }
            }
        }

        $(".piece").removeClass("active");
        $(".piece").removeClass("potencial_dead");
        $('.rank__check').removeClass("over");

    });
});



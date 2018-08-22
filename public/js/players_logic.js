//БАГ - когда возможен фук. И игрок ходит той шашкой, которая должна же и фукнуться и именно ходит, а не атакует, то срабатывает фук
// ход передается другому игроку и ход остается одновременно и для игрока, который фукнулся - РЕШЕНО

//БАГ строка 1431, иногда при фуке срабатывает result_attack.prev is undefined

//БАГ - если был фук, но ход был сделан не зафуканной шашкой, то надо на доске цветом сигнализировать, что был ход и фук

//to do - надо передать настройки игры от игрока, которог позвали. А сейчас сделано наоборот

$(document).ready(function(){
    let current_script = document.querySelector('script[src*="players_logic.js"]');

    //вид шашек
    let TYPE_GAME = null;

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

    //логин текущего игрока
    let NICKNAME = current_script.getAttribute("nickname");
    let ID_NICKNAME = current_script.getAttribute("id_nickname");
    if(NICKNAME === "anonymus") {
        NICKNAME = NICKNAME + "_" + ID_NICKNAME;
    }

    let socket = io();
    let serverGame;
    let playerColor;
    let usersOnline = [];
    let myGames = [];

    let choosen_type_game_by_another_player = "Английские";

    // click on player_play vs player
    addDynamicEventListener(document.body, 'click', '#PP', function (e) {
        socket.emit('login', NICKNAME);

        //первоначальное положение choose_type_game (можно указать, только on. Off указывать изначально не имеет смысла)
        socket.emit('choose_game', {
            choose_game: "Английские",
            nickname: NICKNAME,
            color_potencial_step: 'on',
            multiattack: "on",
            fuchs: "on",
            color_potencial_fuchs: "off",
            simple_back_attack: "off",
            queen_awesome_step: "off"
        });

        $('#page-start').hide();
        $('#page-lobby').show();
        $('#button_setting').show();
    });

    // click on player_play vs player
    addDynamicEventListener(document.body, 'click', '#CP', function (e) {
        $('#page-start').hide();
        $('#page-computer').show();
        $('#button_setting').show();
    });

    // click on setting
    let flip = 0;
    addDynamicEventListener(document.body, 'click', '.button-setting', function (e) {
        $( "#page-setting" ).toggle( flip++ % 2 === 0 );
    });


    // нотация
    let words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let digits = ['8', '7', '6', '5', '4', '3', '2', '1'];

    let words_need = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
    let digits_need = ['1', '2', '3', '4', '5', '6', '7', '8'];

    let count_history = 0;

    let arBackHistory = [];
    let player_play = "white"; //the first player_play
    let current_piece = null; // текущая шашка
    let potencialStepsQueenGlobal = []; // возможные шаги для дамок
    let potencialStepsSimpleGlobal = []; // возможные шаги для обычных шашек

    socket.on('login', function(msg) {
        usersOnline = msg.users;
        // updateUserList();

        myGames = msg.games;
        // updateGamesList();
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

    socket.on('resign', function(msg) {
        if (msg.gameId === serverGame.id) {
            socket.emit('login', NICKNAME);

            $('#page-lobby').show();
            $('#page-game').hide();
        }
    });

    socket.on('joingame', function(msg) {
        console.log(msg);
        //get setting games
        try {
            // msg.settings.forEach(function (value) {
            //     settings_game[value.name] = value.value;
            // });

            OVER_STEPS = msg.settings.color_potencial_step;
            TIME_CHECK = msg.settings.time_check_checkbox;
            TIME_VALUE = msg.settings.time_check_text;
            FUCHS = msg.settings.fuchs;
            SIMPLE_BACK_ATTACK = msg.settings.simple_back_attack;
            COLOR_FUCHS = msg.settings.color_potencial_fuchs;
            TYPE_GAME = msg.settings.choose;
        }
        catch (e) {
            console.log(e.message);
        }

        console.log(msg.settings);

        console.log("joined as game id: " + msg.game.id );
        playerColor = msg.color;
        initGame(msg.game);

        $('#chat').show();
        $('#page-setting').hide();
        $('#button_setting').hide();
        $('#page-start').hide();
        $('#page-lobby').hide();
        $('#page-game').show();
    });

    // фук
    socket.on('fuch', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {

            colorSteps(msg.target_x, msg.target_y);

            let target = $(".rank__check[x="+ msg.target_x +"][y="+ msg.target_y +"]"); // кого нужно "фукнуть"
            target[0].firstElementChild.remove();

            // меняем игрока
            if (msg.currentPlayer === "black") {
                player_play = "white";
            }
            else if (msg.currentPlayer === "white") {
                player_play = "black";
            }
        }
    });

    function colorSteps(prev_x, prev_y, next_x = null, next_y = null, enemy_x = null, enemy_y = null){
        resetColorLastStep();

        let prev = getRankCheck(prev_x, prev_y);
        let next = null;
        if(next_x !== null && next_y !== null) {
            next = getRankCheck(next_x, next_y);
        }
        let enemy = null;
        if(enemy_x !== null && enemy_y != null) {
            enemy = getRankCheck(enemy_x, enemy_y);
        }

        colorLastStep(prev, next, enemy);
    }

    // шаг
    socket.on('step', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {

            colorSteps(msg.next.x, msg.next.y, msg.prev.x, msg.prev.y);

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
                let setQueen = false;
                if(next[0].getAttribute("queen")) {
                    setQueen = true;
                }

                if (playerColor === "black") {
                    if(!setQueen) {
                        next.append('<div class="piece white">&#9814;</div>');
                    }
                    else {
                        next.append('<div class="piece white queen">&#9813;</div>');
                    }
                    prev[0].firstElementChild.remove();
                }
                else if (playerColor === "white") {
                    if(!setQueen) {
                        next.append('<div class="piece black">&#9820;</div>');
                    }
                    else {
                        next.append('<div class="piece black queen">&#9819;</div>');
                    }
                    prev[0].firstElementChild.remove();
                }
            }

            // меняем игрока
            if (msg.currentPlayer === "black") {
                player_play = "white";
            }
            else if (msg.currentPlayer === "white") {
                player_play = "black";
            }
        }
    });

    //рубить
    socket.on('attack', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {

            colorSteps(msg.next.x, msg.next.y, msg.prev.x, msg.prev.y, msg.target.x, msg.target.y);

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
                let setQueen = false;
                if(next[0].getAttribute("queen")) {
                    setQueen = true;
                }

                if (playerColor === "black") {
                    if(!setQueen) {
                        next.append('<div class="piece white">&#9814;</div>');
                    }
                    else {
                        next.append('<div class="piece white queen">&#9813;</div>');
                    }
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
                else if (playerColor === "white") {
                    if(!setQueen) {
                        next.append('<div class="piece black">&#9820;</div>');
                    }
                    else {
                        next.append('<div class="piece black queen">&#9819;</div>');
                    }
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
            }

            if(!msg.hasEnemy) {
                // меняем игрока
                if (msg.currentPlayer === "black") {
                    player_play = "white";
                }
                else if (msg.currentPlayer === "white") {
                    player_play = "black";
                }
            }
        }
    });

    socket.on('logout', function (msg) {
        removeUser(msg.username);
    });

    socket.on('gameover', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
            alert("Победил: " + msg.winner);
        }
    });

    /**
     * CHAT
     */

    socket.on('chat', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
            let new_message = document.createElement("p");
            new_message.textContent = msg.from + ": " + msg.message;

            let chat = document.getElementById("chat");
            chat.appendChild(new_message);
        }
    });

    $("#chat_button").on('click', function (e) {

        let check_length = $("#chat_input").val().replace(new RegExp('\\s+'), "");

        if(check_length.length <= 0){
            $("#chat_input").val("");
            return false;
        }

        let new_message = document.createElement("p");
        new_message.textContent = NICKNAME + ": " + $("#chat_input").val();

        let chat = document.getElementById("chat");
        chat.appendChild(new_message);


        socket.emit('chat', {
            gameId: serverGame.id,
            message: $("#chat_input").val(),
            from: NICKNAME
        });

        $("#chat_input").val("");
    });

    /**
     * END CHAT
     */

    //////////////////////////////
    // Menus
    //////////////////////////////
    // $('#login').on('click', function() {
    //     username = $('#username').val();
    //
    //     if (username.length > 0) {
    //         $('#userLabel').text(username);
    //         socket.emit('login', username);
    //
    //         $('#page-login').hide();
    //         $('#page-lobby').show();
    //     }
    // });

    // $('#game-back').on('click', function() {
    //     socket.emit('login', NICKNAME);
    //
    //     $('#page-game').hide();
    //     $('#page-lobby').show();
    // });

    $('#updateUserList').on("click", function (e) {
        updateUserList();
    });

    $('#updateGamesList').on("click", function (e) {
        updateGamesList();
    });

    $('#game-resign').on('click', function() {
        socket.emit('resign', {userId: NICKNAME, gameId: serverGame.id});

        socket.emit('login', NICKNAME);
        $('#page-game').hide();
        $('#page-lobby').show();
    });

    let addUser = function(userId) {
        usersOnline.push(userId);
        // updateUserList();
    };

    let removeUser = function(userId) {
        for (let i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
        }
        // updateUserList();
    };

    let updateGamesList = function() {
        try {

            document.getElementById('gamesList').innerHTML = '';
            myGames.forEach(function (game) {
                $("#gamesList").append($('<button>')
                    .text('#' + game)
                    .on('click', function () {
                        socket.emit('resumegame', {
                            gameId: game,
                            settings_game: choosen_type_game_by_another_player // передать настройки на сервер
                        });
                    }));
            });
        }
        catch (e) {

        }
    };

    //информация об игре
    socket.on('choose_game', function (msg) {
        choosen_type_game_by_another_player = {
            choose: msg.choose_game,
            nickname: msg.nickname,
            color_potencial_step: msg.color_potencial_step,
            time_check: msg.time_check,
            multiattack: msg.multiattack,
            fuchs: msg.fuchs,
            color_potencial_fuchs: msg.color_potencial_fuchs,
            simple_back_attack: msg.simple_back_attack,
            queen_awesome_step: msg.queen_awesome_step
        };

        let user = $("#" + msg.nickname + "_type_game");
        let user_color_potencial_step = $("#" + msg.nickname + "_color_potencial_step");
        let user_time_check = $("#" + msg.nickname + "_time_check");
        let user_multiattack = $("#" + msg.nickname + "_multiattack");
        let user_fuchs = $("#" + msg.nickname + "_fuchs");
        let user_color_potencial_fuchs = $("#" + msg.nickname + "_color_potencial_fuchs");
        let user_simple_back_attack = $("#" + msg.nickname + "_simple_back_attack");
        let user_queen_awesome_step = $("#" + msg.nickname + "_queen_awesome_step");

        user.text(msg.choose_game);
        user_color_potencial_step.text(msg.color_potencial_step);
        user_time_check.text(msg.time_check);
        user_multiattack.text(msg.multiattack);
        user_fuchs.text(msg.fuchs);
        user_color_potencial_fuchs.text(msg.color_potencial_fuchs);
        user_simple_back_attack.text(msg.simple_back_attack);
        user_queen_awesome_step.text(msg.queen_awesome_step);
    });

    let updateUserList = function() {

        try {
            document.getElementById('userList').innerHTML = '';

            let new_div = document.createElement("div");
            new_div.className = "row";

            usersOnline.forEach(function (user) {
                let userListDiv = document.getElementById("userList");
                let new_div = document.createElement("div");
                new_div.className = "row";
                userListDiv.append(new_div);

                let new_user = document.createElement("button");
                new_user.setAttribute("id", user);

                //проверить на существование юзера (чтобы не было дублей одног и того же юзера)
                let check_div_user = document.getElementById(user);
                if(check_div_user === null) {

                    new_user.textContent = user;
                    new_user.onclick = function () {
                        //get settings of game
                        let data_form_settings = $("#settings").serializeArray();

                        socket.emit('invite', {
                            user: user,
                            settings_game: choosen_type_game_by_another_player // передать настройки на сервер
                        });

                        console.log(choosen_type_game_by_another_player)
                    };

                    new_div.append(new_user);


                    //блок инфо об игре
                    // тип игры
                    let info_type_game = document.createElement("div");
                    info_type_game.setAttribute("id", user + "_type_game");
                    info_type_game.textContent = choosen_type_game_by_another_player.choose;
                    new_div.append(info_type_game);

                    //Подсвечивать возможные ходы
                    let info_color_potencial_step = document.createElement('div');
                    info_color_potencial_step.setAttribute("id", user + "_color_potencial_step");
                    info_color_potencial_step.textContent = choosen_type_game_by_another_player.color_potencial_step;
                    new_div.append(info_color_potencial_step);

                    //Учитывать время
                    let info_time_check = document.createElement('div');
                    info_time_check.setAttribute("id", user + "_time_check");
                    info_time_check.textContent = choosen_type_game_by_another_player.time_check;
                    new_div.append(info_time_check);

                    //Возможность "рубить" несколько шашек за один ход
                    let info_multiattack = document.createElement('div');
                    info_multiattack.setAttribute("id", user + "_multiattack");
                    info_multiattack.textContent = choosen_type_game_by_another_player.multiattack;
                    new_div.append(info_multiattack);

                    //Играть с фуками
                    let info_fuchs = document.createElement('div');
                    info_fuchs.setAttribute("id", user + "_fuchs");
                    info_fuchs.textContent = choosen_type_game_by_another_player.fuchs;
                    new_div.append(info_fuchs);

                    //Подсвечивать потенциальные фуки
                    let info_color_potencial_fuchs = document.createElement('div');
                    info_color_potencial_fuchs.setAttribute("id", user + "_color_potencial_fuchs");
                    info_color_potencial_fuchs.textContent = choosen_type_game_by_another_player.color_potencial_fuchs;
                    new_div.append(info_color_potencial_fuchs);

                    //Рубить назад (обычные шашки)
                    let info_simple_back_attack = document.createElement('div');
                    info_simple_back_attack.setAttribute("id", user + "_simple_back_attack");
                    info_simple_back_attack.textContent = choosen_type_game_by_another_player.simple_back_attack;
                    new_div.append(info_simple_back_attack);

                    //Возможность хода по всей диагонали (дамки)
                    let info_queen_awesome_step = document.createElement('div');
                    info_queen_awesome_step.setAttribute("id", user + "_queen_awesome_step");
                    info_queen_awesome_step.textContent = choosen_type_game_by_another_player.queen_awesome_step;
                    new_div.append(info_queen_awesome_step);
                }
            });
        }
        catch (e) {

        }
    };

    //////////////////////////////
    // DataBase
    //////////////////////////////

    function createGameDB(nickname_white, nickname_black, settings){
        socket.emit('create_game_db', {
            nickname_white: nickname_white,
            nickname_black: nickname_black,
            settings: settings
        });
    }

    //////////////////////////////
    // Checkers Game
    //////////////////////////////

    let initGame = function (serverGameState) {
        serverGame = serverGameState;

        let checkers_board = $("#game-board");
        let content = document.createElement("div");
        content.className = "content";
        checkers_board.append(content);

        initNotation(content);

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
                        rank__check.setAttribute("not", words_need[t] + "" + digits_need[i]);
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
                        rank__check.setAttribute("not", words_need[t] + "" + digits_need[i]);
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

                            // ttt++;
                            // if(ttt < 4) {
                            //     piece = document.createElement("div");
                            //     piece.className = "piece white queen";
                            //     piece.innerHTML = "&#9819;";
                            //     rank__check.append(piece);
                            // }
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

    // ход назад
    function back_history(current, enemy = null, next = null, color, isqueen = false, wasMultiAttack = true) {

        let enemy_is_queen = false;
        if(enemy !== null){
            if(enemy.firstElementChild.classList.contains("queen")) {
                enemy_is_queen = true;
            }
        }

        arBackHistory.push({
            current: current,
            enemy: enemy,
            next: next,
            color: color,
            isqueen: isqueen,
            enemy_is_queen : enemy_is_queen,
            wasMultiAttack: wasMultiAttack
        });
    }

    let pick = 0;
    addDynamicEventListener(document.body, 'click', '#step-back', function (e) {

        if(arBackHistory.length > 0) {

            let index_last_element = arBackHistory.length - 1;

            let prev = arBackHistory[index_last_element].current;
            let enemy = arBackHistory[index_last_element].enemy;
            let next = arBackHistory[index_last_element].next;

            let color = arBackHistory[index_last_element].color;
            let isQueen = arBackHistory[index_last_element].isqueen;
            let enemyIsQueen = arBackHistory[index_last_element].enemy_is_queen;

            try {
                if (next !== null) {
                    $(next.firstElementChild).remove();
                }

                if (color === "black") {
                    if (enemy !== null) {
                        if (enemyIsQueen) {
                            $(enemy).append('<div class="piece white queen">&#9813;</div>');
                        }
                        else {
                            $(enemy).append('<div class="piece white">&#9814;</div>');
                        }
                    }

                    if (isQueen) {
                        $(prev).append('<div class="piece black queen">&#9819;</div>');
                    }
                    else {
                        $(prev).append('<div class="piece black">&#9820;</div>');
                    }
                }
                else if (color === "white") {
                    if (enemy !== null) {
                        if (enemyIsQueen) {
                            $(enemy).append('<div class="piece black queen">&#9819;</div>');
                        }
                        else {
                            $(enemy).append('<div class="piece black">&#9820;</div>');
                        }
                    }

                    if (isQueen) {
                        $(prev).append('<div class="piece white queen">&#9813;</div>');
                    }
                    else {
                        $(prev).append('<div class="piece white">&#9814;</div>');
                    }
                }
            }
            catch (e) {
            }

            if(pick == 0) {
                $("#hys_" + count_history).remove();
                count_history--;
                pick = 1;
            }
            else {
                pick = 0;
            }

            arBackHistory.pop();

        }
    });

    function initNotation(div_content) {
        let div_notation = document.createElement("div");
        div_notation.className = "notation";
        div_content.append(div_notation);

        let div_digits = document.createElement("div");
        div_digits.className = "notation__digits";
        div_notation.append(div_digits);

        for(let i = 0; i < words.length; i++) {
            let span_not_digit = document.createElement("span");
            span_not_digit.className = "not_digits";
            span_not_digit.innerHTML = digits[i];
            div_digits.append(span_not_digit)
        }

        let div_words = document.createElement("div");
        div_words.className = "notation__words";
        div_notation.append(div_words);

        // words notation
        for(let i = 0; i < words.length; i++) {
            let span_not_words = document.createElement("span");
            span_not_words.className = "not_words";
            span_not_words.innerHTML = words[i];
            div_words.append(span_not_words)
        }
    }

    // лог на клиенте (нотация)
    function add_history(prev, next, isAttack = null, isEnemy = null, enemyMultiAttack = false, friendMultiAttack = false) {

        if(isEnemy === true) {
            if(enemyMultiAttack) {
                let current_hys = $("#hys_" + count_history);
                current_hys.text(current_hys.text() + ":" + next.getAttribute("not"));
            }
            else {
                let current_hys = $("#hys_" + count_history);
                if (isAttack === true) {
                    current_hys.text(current_hys.text() + " " + prev.getAttribute("not") + ":" + next.getAttribute("not"));
                }
                else {
                    current_hys.text(current_hys.text() + " " + prev.getAttribute("not") + "-" + next.getAttribute("not"));
                }
            }

        }
        else {
            if (isAttack === true) {
                if (appendAttack >= 1) {
                    let current_hys = $("#hys_" + count_history);
                    current_hys.text(current_hys.text() + ":" + next.getAttribute("not"));
                }
                else {
                    count_history++;
                    $("#history").append("<p id='hys_" + count_history + "'>" + count_history + ". " + prev.getAttribute("not") + ":" + next.getAttribute("not") + "</p>");
                }
            }
            else {
                count_history++;
                $("#history").append("<p id='hys_" + count_history + "'>" + count_history + ". " + prev.getAttribute("not") + "-" + next.getAttribute("not") + "</p>");
            }

        }
    }
    // лог на сервер
    function writeLog(text) {
        // socket.emit('log', {
        //     id_game: id_game,
        //     text: text,
        // });
    }
    // убрать все подсвеченные возможные фуки
    function clear_color_fuchs(potencialSteps) {
        potencialSteps.forEach(function (value) {
            value[0].needeat.forEach(function (val_need) {
                $(val_need.firstElementChild).toggleClass("fuch", false);
            });
        });
    }
    // убрать подсветки активности шашки и возможных ходов
    function clear_color() {
        $(".piece").removeClass("active");
        $(".piece").removeClass("potencial_dead");
        $('.rank__check').removeClass("over");
    }
    // нужно ли аттаковать
    function isNeedAttackSimple(potencialSteps) {
        let needAttack = false;
        potencialSteps.forEach(function (value) {

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

        return needAttack;
    }
    // если возможен фук, то получить шашку, которую нужно "фукнуть"
    function isNeedEatSimple(potencialSteps,current_x, current_y) {
        let needEat = false;

        potencialSteps.forEach(function (value) {

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

        return needEat;
    }
    // фук
    function isFuchs(potencialSteps, value, indexNeadEat, current_x, current_y) {
        let isFuch = false;

        value.empty.forEach(function (val_up) {
            if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                $(potencialSteps[0][0].needeat[indexNeadEat].firstElementChild).remove();
                alert("Фук");
                isFuch = true;

                colorSteps(potencialSteps[0][0].needeat[indexNeadEat].getAttribute("x"), potencialSteps[0][0].needeat[indexNeadEat].getAttribute("y"));

                socket.emit('fuch', {
                    gameId: serverGame.id,
                    currentPlayer: player_play,
                    target_x: potencialSteps[0][0].needeat[indexNeadEat].getAttribute("x"),
                    target_y: potencialSteps[0][0].needeat[indexNeadEat].getAttribute("y"),
                });

            }
        });
        return isFuch;
    }
    // удалить текущую активную шашку после хода
    function removeCurrentPiece() {
        $(current_piece).remove();
        current_piece = null;
    }

    let appendAttack = 0;
    // создание шашки в новом месте
    function appendPiece(target, currentColor, isAttack = null, current_is_queen) {

        if (currentColor === "white") {
            if(target.getAttribute("queen") === "white") {
                $(target).append('<div class="piece white queen">&#9813;</div>');
            }
            else {
                if(current_is_queen) {
                    $(target).append('<div class="piece white queen">&#9813;</div>');
                }
                else {
                    $(target).append('<div class="piece white">&#9814;</div>');
                }
            }
        }
        else if (currentColor === "black") {
            if(target.getAttribute("queen") === "black") {
                $(target).append('<div class="piece black queen">&#9819;</div>');
            }
            else {
                if(current_is_queen) {
                    $(target).append('<div class="piece black queen">&#9819;</div>');
                }
                else {
                    $(target).append('<div class="piece black">&#9820;</div>');
                }
            }
        }

        if(isAttack === true) {
            add_history(current_piece.parentElement, target, true, false, false);
            appendAttack++;
        }
        else {
            add_history(current_piece.parentElement, target);
        }
    }
    // шаг игрока
    function stepplayer_play(potencialSteps, target, current_x, current_y, currentColor, isQueen = false) {
        let wasStep = false;

        let next_x = null;
        let next_y = null;

        potencialSteps.forEach(function (value) {
            if(current_piece !== null) {
                if (current_piece.parentElement === value[0].currentpiece) {

                    value[0].upright.empty.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            wasStep = true;

                            next_x = val_up[0].getAttribute("x");
                            next_y = val_up[0].getAttribute("y");
                        }
                    });

                    value[0].upleft.empty.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            wasStep = true;

                            next_x = val_up[0].getAttribute("x");
                            next_y = val_up[0].getAttribute("y");
                        }
                    });

                    value[0].bottomright.empty.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            wasStep = true;

                            next_x = val_bot[0].getAttribute("x");
                            next_y = val_bot[0].getAttribute("y");
                        }
                    });

                    value[0].bottomleft.empty.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            wasStep = true;

                            next_x = val_bot[0].getAttribute("x");
                            next_y = val_bot[0].getAttribute("y");
                        }
                    });
                }
            }
        });

        if(wasStep) {

            colorSteps(current_piece.parentElement.getAttribute("x"),current_piece.parentElement.getAttribute("y"), next_x, next_y);

            let for_next_notation = getRankCheck(next_x, next_y);

            let stateBoard = simulate_board();

            socket.emit('step', {
                gameId: serverGame.id,
                prev: {
                    x: current_piece.parentElement.getAttribute("x"),
                    y: current_piece.parentElement.getAttribute("y"),
                },
                next: {
                    x: next_x,
                    y: next_y,
                },
                currentPlayer: player_play,
                isQueen: isQueen,
                prev_notation: current_piece.parentElement.getAttribute("not"),
                next_notation: for_next_notation.getAttribute("not"),
                stateBoard: JSON.stringify(stateBoard)
            });

            removeCurrentPiece();
        }

        return wasStep;
    }

    function simulate_board() {

        let cells = [];
        let pieces = [];

        let cell = null;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                cell = $(".rank__check[x=" + j + "][y=" + i + "]")[0];
                if(typeof cell !== "undefined"){
                    if(cell.hasChildNodes()){
                        if(cell.firstElementChild.classList.contains("white")) {
                            if(cell.firstElementChild.classList.contains("queen")) {
                                cells.push({
                                    col: j,
                                    row: i,
                                    state: -1.1
                                });

                                pieces.push({
                                    col: j,
                                    row: i,
                                    state: -1.1
                                });
                            }
                            else {
                                cells.push({
                                    col: j,
                                    row: i,
                                    state: -1
                                });

                                pieces.push({
                                    col: j,
                                    row: i,
                                    state: -1
                                });
                            }

                        }
                        else if(cell.firstElementChild.classList.contains("black")) {
                            if(cell.firstElementChild.classList.contains("queen")) {
                                cells.push({
                                    col: j,
                                    row: i,
                                    state: 1.1
                                });

                                pieces.push({
                                    col: j,
                                    row: i,
                                    state: 1.1
                                });
                            }
                            else {
                                cells.push({
                                    col: j,
                                    row: i,
                                    state: 1
                                });

                                pieces.push({
                                    col: j,
                                    row: i,
                                    state: 1
                                });
                            }
                        }
                    }
                    else {
                        cells.push({
                            col: j,
                            row: i,
                            state: 0
                        });
                    }
                }
                else {
                    cells.push({
                        col: j,
                        row: i,
                        state: 0
                    });
                }
            }
        }

        return {cells: cells};
    }

    function colorLastStep(prev, next = null, enemy = null) {
        $(prev).css({"background-color" : "rgba(0,104,52,0.6)"});
        if(next !== null) {
            $(next).css({"background-color": "rgba(0,104,52,0.6)"});
        }
        if(enemy !== null) {
            $(enemy).css({"background-color" : "rgba(207, 56, 24, 0.6)"});
        }
    }

    function resetColorLastStep() {
        $(".rank__check").attr("style","");
    }

    // атака игрока
    function attackplayer_play(potencialSteps, target, current_x, current_y, currentColor, but_x, but_y, isQueen) {

        let isAttackSucces = false;
        let resultAttack = [];

        let enemy_for_history = null

        potencialSteps.forEach(function (value) {

            if (current_piece.parentElement === value[0].currentpiece) {
                if (isAttackSucces === false) {
                    value[0].upright.needStep.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                            let kill_target = $(".rank__check[x=" + value[0].upright.enemy[0][0].getAttribute("x") + "][y=" + value[0].upright.enemy[0][0].getAttribute("y") + "]");
                            enemy_for_history = kill_target[0];

                            if (currentColor === "white") {
                                if(isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if (isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }
                            }

                            isAttackSucces = true;
                        }
                    });
                }

                if (isAttackSucces === false) {
                    value[0].upleft.needStep.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                            let kill_target = $(".rank__check[x=" + value[0].upleft.enemy[0][0].getAttribute("x") + "][y=" + value[0].upleft.enemy[0][0].getAttribute("y") + "]");
                            enemy_for_history = kill_target[0];

                            if (currentColor === "white") {
                                if (isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if(isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }
                            }

                            isAttackSucces = true;

                        }
                    });
                }

                if (isAttackSucces === false) {
                    value[0].bottomright.needStep.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                            let kill_target = $(".rank__check[x=" + value[0].bottomright.enemy[0][0].getAttribute("x") + "][y=" + value[0].bottomright.enemy[0][0].getAttribute("y") + "]");
                            enemy_for_history = kill_target[0];

                            if (currentColor === "white") {
                                if(isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if(isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }
                            }

                            isAttackSucces = true;
                        }
                    });
                }

                if (isAttackSucces === false) {
                    value[0].bottomleft.needStep.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                            let kill_target = $(".rank__check[x=" + value[0].bottomleft.enemy[0][0].getAttribute("x") + "][y=" + value[0].bottomleft.enemy[0][0].getAttribute("y") + "]");
                            enemy_for_history = kill_target[0];

                            if (currentColor === "white") {
                                if(isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "white",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if(isQueen) {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: true,
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
                                        gameId: serverGame.id,
                                        target_place: target,
                                        local_color: "black",
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
                                        currentplayer_play: player_play,
                                        isQueen: false,
                                        kill_target: kill_target
                                    };
                                }
                            }

                            isAttackSucces = true;
                        }
                    });
                }
            }
        });

        if(resultAttack){

            let for_next_notation = null;

            try{
                for_next_notation = getRankCheck(resultAttack.next.x, resultAttack.next.y);
                colorSteps(resultAttack.prev.x, resultAttack.prev.y, resultAttack.next.x, resultAttack.next.y, resultAttack.target.x, resultAttack.target.y);
            }
            catch (e) {}

            back_history(current_piece.parentElement, enemy_for_history, target, currentColor, isQueen);

            appendPiece(resultAttack.target_place, resultAttack.local_color, true, resultAttack.isQueen)

            let prev_notation = current_piece.parentElement.getAttribute("not");

            removeCurrentPiece();
            $(resultAttack.kill_target)[0].firstElementChild.remove();

            let stateBoard = simulate_board();

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
                currentPlayer: resultAttack.currentplayer_play,
                isQueen: resultAttack.isQueen,
                prev_notation: prev_notation,
                next_notation: for_next_notation.getAttribute("not"),
                stateBoard: JSON.stringify(stateBoard)
            });
        }

        return resultAttack;
    }

    // какой текущий игрок
    function checkplayer_play(object) {
        if(object.classList.contains("black")) {
            return "black";
        }
        else if(object.classList.contains("white"))
        {
            return "white";
        }
    }

    let pieceForFuch = [];

    // рандом
    function getId(min, max) {
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        rand = Math.round(rand);
        return rand;
    }

    // получить все возможные ходы дамок
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

            let lenght_for_queen = 0;
            if(TYPE_GAME !== "Русские") {
                lenght_for_queen = 3;
            }
            else {
                lenght_for_queen = 8;
            }

            let count = 0;
            for (let q = 1; q < lenght_for_queen; q++) {

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
                                                needEat.push(currentPiece);
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
                                if(TYPE_GAME !== "Русские") {
                                    if (q < 2) {
                                        potencialStepsWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                                    }
                                }
                                else {
                                    potencialStepsWhiteQueenUpRigth.push(potencialWhiteQueenCell);
                                }
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
            for (let q = 1; q < lenght_for_queen; q++) {

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
                                                needEat.push(currentPiece);
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
                                if(TYPE_GAME !== "Русские") {
                                    if (q < 2) {
                                        potencialStepsWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                                    }
                                }
                                else {
                                    potencialStepsWhiteQueenUpLeft.push(potencialWhiteQueenCell);
                                }
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
            for (let q = 1; q < lenght_for_queen; q++) {

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
                                                needEat.push(currentPiece);
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
                                if(TYPE_GAME !== "Русские") {
                                    if (q < 2) {
                                        potencialStepsWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                                    }
                                }
                                else {
                                    potencialStepsWhiteQueenBottomRigth.push(potencialWhiteQueenCell);
                                }
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
            for (let q = 1; q < lenght_for_queen; q++) {

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
                                                needEat.push(currentPiece);
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
                                if(TYPE_GAME !== "Русские") {
                                    if(q < 2) {
                                        potencialStepsWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                                    }
                                }
                                else {
                                    potencialStepsWhiteQueenBottomLeft.push(potencialWhiteQueenCell);
                                }
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
    // получить все возможные ходы обычных шашек
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

    // проверка на конец игры
    function gameOver() {
        let queens_white = getAllQueenCells("white");
        let queens_black = getAllQueenCells("black");

        let simples_white = getAllSimpleCells("white");
        let simples_black = getAllSimpleCells("black");

        let isSimples_white = false;
        simples_white.forEach(function (value) {
            if(value[0].upright.empty.length > 0) {
                isSimples_white = true;
            }
            if(value[0].upleft.empty.length > 0) {
                isSimples_white = true;
            }
            if(value[0].bottomright.empty.length > 0) {
                isSimples_white = true;
            }
            if(value[0].bottomleft.empty.length > 0) {
                isSimples_white = true;
            }
        });
        let isSimples_black = false;
        simples_black.forEach(function (value) {
            if(value[0].upright.empty.length > 0) {
                isSimples_black = true;
            }
            if(value[0].upleft.empty.length > 0) {
                isSimples_black = true;
            }
            if(value[0].bottomright.empty.length > 0) {
                isSimples_black = true;
            }
            if(value[0].bottomleft.empty.length > 0) {
                isSimples_black = true;
            }
        });

        let isQueens_white = false;
        queens_white.forEach(function (value) {
            if(value[0].upright.empty.length > 0) {
                isQueens_white = true;
            }
            if(value[0].upleft.empty.length > 0) {
                isQueens_white = true;
            }
            if(value[0].bottomright.empty.length > 0) {
                isQueens_white = true;
            }
            if(value[0].bottomleft.empty.length > 0) {
                isQueens_white = true;
            }
        });
        let isQueens_black = false;
        queens_black.forEach(function (value) {
            if(value[0].upright.empty.length > 0) {
                isQueens_black = true;
            }
            if(value[0].upleft.empty.length > 0) {
                isQueens_black = true;
            }
            if(value[0].bottomright.empty.length > 0) {
                isQueens_black = true;
            }
            if(value[0].bottomleft.empty.length > 0) {
                isQueens_black = true;
            }
        });

        if((isSimples_white || isQueens_white) && (!isSimples_black && !isQueens_black)) {
            return {
                isGameOver: true,
                winner: "white"
            };
        }
        if((isSimples_black || isQueens_black) && (!isSimples_white && !isQueens_white)) {
            return {
                isGameOver: true,
                winner: "black"
            };
        }


        return {
            isGameOver: false
        };
    }

    // повернуть доску
    addDynamicEventListener(document.body, 'click', '#rotate-board', function (e) {
        $('.board').toggleClass("rotate_board");
        $('.rank__check').toggleClass("rotate_board");
    });

    // клик на шашку
    addDynamicEventListener(document.body, 'click', '.piece', function (e) {

        if(current_piece !== null) {
            if (current_piece.classList.contains("next")) {
                return false;
            }
        }

        if(player_play !== playerColor) {
            alert("Подождите, соперник еще не сделал ход");
            return false;
        }

        let currentplayer_play = checkplayer_play(e.target);
        if(currentplayer_play !== player_play) {
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

            if(currentplayer_play === "white") {
                queens = getAllQueenCells("white");
            }
            else if(currentplayer_play === "black") {
                queens = getAllQueenCells("black");
            }

            potencialStepsQueenGlobal = queens;

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

            if(currentplayer_play === "white") {
                simples = getAllSimpleCells("white");
            }
            else if(currentplayer_play === "black") {
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

    // клик на шашку (для многоходовочки) сырая версия
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
                        potencialStepsQueenGlobal = getAllQueenCells("white");
                    }
                    else if (currentColor === "black") {
                        potencialStepsQueenGlobal = getAllQueenCells("black");
                    }

                    // подсвечивание
                    potencialStepsQueenGlobal.forEach(function (value) {

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

    // клик по клетке
    addDynamicEventListener(document.body, 'click', '.rank__check', function (event) {

        try {
            if (event.target.firstChild.classList.contains('active')) {

            }
        }catch (e) {
            if(current_piece){
                let wasStep = false;

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

                let needAttack = false;
                let isplayer_playChange = false;
                let needEat = null;
                let isFuch = false;
                let indexNeadEat = null;
                // let isAttackSucces = false;
                let resultAttack = [];

                /**
                 * QUEENS CHECKERS
                 */
                if(current_piece.classList.contains("queen")) {
                    clear_color_fuchs(potencialStepsQueenGlobal);
                    needAttack = isNeedAttackSimple(potencialStepsQueenGlobal);

                    // queen need attack
                    if(needAttack) {

                        needEat = isNeedEatSimple(potencialStepsQueenGlobal, current_x, current_y);

                        // надо съесть (возможен фук)
                        if(!needEat && FUCHS === "on") {

                            isplayer_playChange = false;
                            isFuch = false;
                            indexNeadEat = getId(0, potencialStepsQueenGlobal[0][0].needeat.length - 1);

                            potencialStepsQueenGlobal.forEach(function (value) {
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsQueenGlobal, value[0].upright, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsQueenGlobal, value[0].upleft, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsQueenGlobal, value[0].bottomright, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsQueenGlobal, value[0].bottomleft, indexNeadEat, current_x, current_y);
                                        }
                                    }
                                }
                            });

                            wasStep = stepplayer_play(potencialStepsQueenGlobal, event.target, current_x, current_y, currentColor, true);

                            if(wasStep || isFuch) {
                                // stepComputer();
                                // change player
                                if (currentColor === "white") {
                                    player_play = "black";
                                }
                                else if (currentColor === "black") {
                                    player_play = "white";
                                }
                                gameOver();
                            }

                        }
                        //шаг без фука
                        else if(!needEat && FUCHS !== "on") {
                            wasStep = stepplayer_play(potencialStepsQueenGlobal, event.target, current_x, current_y, currentColor, true);

                            if(wasStep) {
                                // stepComputer();
                                // change player
                                if (currentColor === "white") {
                                    player_play = "black";
                                }
                                else if (currentColor === "black") {
                                    player_play = "white";
                                }
                                gameOver();
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {
                            resultAttack = attackplayer_play(potencialStepsQueenGlobal, event.target, current_x, current_y, currentColor, but_x, but_y, true);

                            // если атака прошла успешно
                            if(!$.isEmptyObject(resultAttack)) {

                                // appendPiece(resultAttack.target_place, resultAttack.local_color, true, true);
                                // removeCurrentPiece();
                                //
                                // $(resultAttack.kill_target)[0].firstElementChild.remove();

                                /**
                                 * NEXT ATTACK
                                 * ===========================================
                                 *
                                 */

                                current_piece = $(".rank__check[x=" + current_x + "][y=" + current_y + "]")[0].firstElementChild;

                                let next = nextQueenAttack(current_piece);

                                if(next) {
                                    $(current_piece).addClass("next");

                                    return false;
                                }
                                else {
                                    // stepComputer();
                                    // change player
                                    if (currentColor === "white") {
                                        player_play = "black";
                                    }
                                    else if (currentColor === "black") {
                                        player_play = "white";
                                    }

                                    gameOver();

                                    clear_color();
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

                        wasStep = stepplayer_play(potencialStepsQueenGlobal, event.target, current_x, current_y, currentColor, true);

                        if(wasStep) {
                            // stepComputer();
                            // change player
                            if (currentColor === "white") {
                                player_play = "black";
                            }
                            else if (currentColor === "black") {
                                player_play = "white";
                            }
                            gameOver();
                        }

                    }

                    clear_color();

                }
                /**
                 * SIMPLE CHECKERS
                 */
                else {
                    clear_color_fuchs(potencialStepsSimpleGlobal);
                    needAttack = isNeedAttackSimple(potencialStepsSimpleGlobal);

                    // simple need attack
                    if(needAttack) {

                        needEat = isNeedEatSimple(potencialStepsSimpleGlobal, current_x, current_y);

                        // надо съесть (возможен фук)
                        if(!needEat && FUCHS === "on") {

                            isplayer_playChange = false;

                            isFuch = false;
                            indexNeadEat = getId(0, potencialStepsSimpleGlobal[0][0].needeat.length - 1);

                            potencialStepsSimpleGlobal.forEach(function (value) {
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].upright, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].upleft, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].bottomright, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].bottomleft, indexNeadEat, current_x, current_y);
                                        }
                                    }
                                }
                            });

                            wasStep = stepplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep || isFuch) {
                                // stepComputer();
                                // change player
                                if (currentColor === "white") {
                                    player_play = "black";
                                }
                                else if (currentColor === "black") {
                                    player_play = "white";
                                }
                                gameOver();
                            }

                        }
                        else if (!needEat && FUCHS !== "on") {
                            wasStep = stepplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep) {
                                // stepComputer();
                                // change player
                                if (currentColor === "white") {
                                    player_play = "black";
                                }
                                else if (currentColor === "black") {
                                    player_play = "white";
                                }
                                gameOver();
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {
                            resultAttack = attackplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor, but_x, but_y, false);

                            // если атака прошла успешно
                            if (!$.isEmptyObject(resultAttack)) {

                                // appendPiece(resultAttack.target_place, resultAttack.local_color, true);
                                // removeCurrentPiece();
                                //
                                // $(resultAttack.kill_target)[0].firstElementChild.remove();

                                /**
                                 * NEXT ATTACK
                                 * ===========================================
                                 *
                                 */

                                current_piece = $(".rank__check[x=" + current_x + "][y=" + current_y + "]")[0].firstElementChild;

                                let next = nextSimpleAttack(current_piece);

                                if (next) {
                                    $(current_piece).addClass("next");
                                }
                                else {
                                    // stepComputer();
                                    // change player
                                    if (currentColor === "white") {
                                        player_play = "black";
                                    }
                                    else if (currentColor === "black") {
                                        player_play = "white";
                                    }
                                    gameOver();

                                    clear_color();
                                }
                            }
                            else {
                                isFuch = false;
                                indexNeadEat = getId(0, potencialStepsSimpleGlobal[0][0].needeat.length - 1);

                                potencialStepsSimpleGlobal.forEach(function (value) {
                                    if(current_piece !== null) {
                                        if (current_piece.parentElement === value[0].currentpiece) {

                                            if(!isFuch) {
                                                isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].upright, indexNeadEat, current_x, current_y);
                                            }

                                            if(!isFuch) {
                                                isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].upleft, indexNeadEat, current_x, current_y);
                                            }

                                            if(!isFuch) {
                                                isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].bottomright, indexNeadEat, current_x, current_y);
                                            }

                                            if(!isFuch) {
                                                isFuch = isFuchs(potencialStepsSimpleGlobal, value[0].bottomleft, indexNeadEat, current_x, current_y);
                                            }
                                        }
                                    }
                                });

                                wasStep = stepplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                                if(wasStep || isFuch) {
                                    // stepComputer();
                                    // change player
                                    if (currentColor === "white") {
                                        player_play = "black";
                                    }
                                    else if (currentColor === "black") {
                                        player_play = "white";
                                    }
                                    gameOver();
                                }
                            }
                        }
                    }
                    // simple step
                    else {

                        wasStep = stepplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                        if(wasStep) {
                            // stepComputer();
                            // change player
                            if (currentColor === "white") {
                                player_play = "black";
                            }
                            else if (currentColor === "black") {
                                player_play = "white";
                            }
                            gameOver();
                        }
                    }

                    clear_color();
                }
            }
        }

        clear_color();

        sleep(3000).then(() => {
            writeLog($("#hys_" + count_history).text() + "\n");
        });

        slow_count = 0;
        let isGameOver = gameOver();
        if(isGameOver.isGameOver) {

            alert("Победил: "+ isGameOver.winner)

            socket.emit('gameover', {
                gameId: serverGame.id,
                winner: isGameOver.winner
            });
        }
    });

    function getRankCheck(x, y) {
        return $(".rank__check[x=" + x + "][y=" + y + "]")[0];
    }

    let slow_count = 0;

    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    function md5 ( str ) {	// Calculate the md5 hash of a string
        let RotateLeft = function(lValue, iShiftBits) {
            return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
        };

        let AddUnsigned = function(lX,lY) {
            let lX4,lY4,lX8,lY8,lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        };

        let F = function(x,y,z) { return (x & y) | ((~x) & z); };
        let G = function(x,y,z) { return (x & z) | (y & (~z)); };
        let H = function(x,y,z) { return (x ^ y ^ z); };
        let I = function(x,y,z) { return (y ^ (x | (~z))); };

        let FF = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        let GG = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        let HH = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        let II = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        let ConvertToWordArray = function(str) {
            let lWordCount;
            let lMessageLength = str.length;
            let lNumberOfWords_temp1=lMessageLength + 8;
            let lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
            let lNumberOfWords = (lNumberOfWords_temp2+1)*16;
            let lWordArray=Array(lNumberOfWords-1);
            let lBytePosition = 0;
            let lByteCount = 0;
            while ( lByteCount < lMessageLength ) {
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount)<<lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
            lWordArray[lNumberOfWords-2] = lMessageLength<<3;
            lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
            return lWordArray;
        };

        let WordToHex = function(lValue) {
            let WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
            for (lCount = 0;lCount<=3;lCount++) {
                lByte = (lValue>>>(lCount*8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
            }
            return WordToHexValue;
        };

        let x=Array();
        let k,AA,BB,CC,DD,a,b,c,d;
        let S11=7, S12=12, S13=17, S14=22;
        let S21=5, S22=9 , S23=14, S24=20;
        let S31=4, S32=11, S33=16, S34=23;
        let S41=6, S42=10, S43=15, S44=21;

        // str = this.utf8_encode(str);
        x = ConvertToWordArray(str);
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

        for (k=0;k<x.length;k+=16) {
            AA=a; BB=b; CC=c; DD=d;
            a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
            d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
            c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
            b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
            a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
            d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
            c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
            b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
            a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
            d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
            c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
            b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
            a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
            d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
            c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
            b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
            a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
            d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
            c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
            b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
            a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
            d=GG(d,a,b,c,x[k+10],S22,0x2441453);
            c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
            b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
            a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
            d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
            c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
            b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
            a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
            d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
            c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
            b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
            a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
            d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
            c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
            b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
            a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
            d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
            c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
            b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
            a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
            d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
            c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
            b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
            a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
            d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
            c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
            b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
            a=II(a,b,c,d,x[k+0], S41,0xF4292244);
            d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
            c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
            b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
            a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
            d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
            c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
            b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
            a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
            d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
            c=II(c,d,a,b,x[k+6], S43,0xA3014314);
            b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
            a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
            d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
            c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
            b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
            a=AddUnsigned(a,AA);
            b=AddUnsigned(b,BB);
            c=AddUnsigned(c,CC);
            d=AddUnsigned(d,DD);
        }

        let temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

        return temp.toLowerCase();
    }

    //////////////////////////
    // НЕОКОНЧЕННЫЕ ПАРТИИ
    //////////////////////////

    function removeBoard() {
        try {
            let checkers_board = document.getElementById("game-board");
            while (checkers_board.firstChild) {
                checkers_board.removeChild(checkers_board.firstChild);
            }
        }
        catch (e) {}
    }

    let resume_game_notation = [
        'a8','b8','c8','d8','e8','f8','g8','h8',
        'a7','b7','c7','d7','e7','f7','g7','h7',
        'a6','b6','c6','d6','e6','f6','g6','h6',
        'a5','b5','c5','d5','e5','f5','g5','h5',
        'a4','b4','c4','d4','e4','f4','g4','h4',
        'a3','b3','c3','d3','e3','f3','g3','h3',
        'a2','b2','c2','d2','e2','f2','g2','h2',
        'a1','b1','c1','d1','e1','f1','g1','h1'
    ];

    function resumeInitGame(msg){
        let black_player = null;
        let white_player = null;

        msg.settings.game_setting.forEach(function (value) {
            if(value.id === msg.settings.resume_id_game) {
                if(value.first_move === msg.settings.who_invite){
                    white_player = msg.settings.who_invite;
                    black_player = msg.settings.who_invited;
                }
                else {
                    white_player = msg.settings.who_invited;
                    black_player = msg.settings.who_invite;
                }

                if(value.color_potencial_step)
                    OVER_STEPS = "on";
                if(value.time_check)
                    TIME_CHECK = "on";
                if(value.time_value)
                    TIME_VALUE = "on";
                if(value.fuchs)
                    FUCHS = "on";
                if(value.color_potencial_fuchs)
                    COLOR_FUCHS = "on";
                if(value.simple_back_attack)
                    SIMPLE_BACK_ATTACK = "on";

                TYPE_GAME = value.type_game;

            }
        });

        serverGame = {
            id: msg.settings.resume_id_game,
            black:  black_player,
            white:  white_player
        };

        if(msg.who_next_step === "black") {
            if(NICKNAME === serverGame.black){
                player_play = "black";
                playerColor = "black";
            }
            else {
                player_play = "black";
                playerColor = "white";
            }
        }
        else {
            if(NICKNAME === serverGame.white){
                player_play = "white";
                playerColor = "white";
            }
            else {
                player_play = "white";
                playerColor = "black";
            }
        }

        removeBoard();

        $('#page-setting').hide();
        $('#button_setting').hide();
        $('#page-start').hide();
        $('#page-lobby').hide();
        $('#page-game').show();
        $('#chat').show();

        let checkers_board = document.getElementById("game-board");
        let content = document.createElement("div");
        content.className = "content";
        checkers_board.append(content);

        let board = document.createElement("div");
        board.className = "board";
        content.append(board);

        let rank = null;
        let rank__check = null;

        let piece = null;

        let tmp_count = 0;
        let state_board = JSON.parse(msg.ar_moves);
        state_board.cells.forEach(function (value, index) {
            if((index === 0) || (index % 8 == 0)){
                rank = document.createElement("div");
                rank.className = "rank";
                board.append(rank);
            }

            //расставляем координаты
            rank__check = document.createElement("div");
            rank__check.className = "rank__check";
            //и нотация
            if(player_play === "white") {
                rank__check.setAttribute('not', resume_game_notation[index]);
            }
            else {
                rank__check.setAttribute('not', resume_game_notation[(resume_game_notation.length - 1) - index]);
            }

            if((index % 2 !== 0) && (tmp_count <= 8)) {
                rank__check.setAttribute("x", value.col);
                rank__check.setAttribute("y", value.row);
                if(index <= 8){
                    rank__check.setAttribute("queen", "white");
                }
            }
            if((index % 2 === 0) && ((tmp_count >= 8) && (tmp_count <= 16))) {
                rank__check.setAttribute("x", value.col);
                rank__check.setAttribute("y", value.row);
                if((state_board.cells.length - 1) - index <= 8){
                    rank__check.setAttribute("queen", "black");
                }
            }
            rank.append(rank__check);
            tmp_count++;
            if(tmp_count === 16){
                tmp_count = 0;
            }

            if(value.state === -1) {
                piece = document.createElement("div");
                piece.className = "piece white";
                piece.innerHTML = "&#9814;";
                rank__check.append(piece);
            }
            if(value.state === -1.1) {
                piece = document.createElement("div");
                piece.className = "piece white queen";
                piece.innerHTML = "&#9813;";
                rank__check.append(piece);
            }
            if(value.state === 1) {
                piece = document.createElement("div");
                piece.className = "piece black";
                piece.innerHTML = "&#9820;";
                rank__check.append(piece);
            }
            if(value.state === 1.1) {
                piece = document.createElement("div");
                piece.className = "piece black queen";
                piece.innerHTML = "&#9819;";
                rank__check.append(piece);
            }
        });

        if(playerColor === "black") {
            $('.board').addClass("rotate_board");
            $('.rank__check').addClass("rotate_board");
        }
    }

    socket.on('get_array_my_games', function (msg) {
        let arGames = msg.games;

        let divMyGames = document.getElementById("listMyGames");
        while (divMyGames.firstChild) {
            divMyGames.removeChild(divMyGames.firstChild);
        }

        let game_setting = [];
        arGames.forEach(function (value) {
            game_setting.push(value);

            let who_invited = null;
            let white_player = value.nickname_player_1;
            let black_player = value.nickname_player_2;

            if(NICKNAME === white_player) {
                who_invited = black_player;
            }
            else {
                who_invited = white_player;
            }

            let new_div = document.createElement("div");
            new_div.className = "row";
            divMyGames.append(new_div);

            let new_game = document.createElement("button");
            new_game.textContent = white_player + " vs " + black_player + " ("+ value.type_game +")";
            new_game.setAttribute("id", "game_" + value.id);

            new_game.onclick = function () {
                socket.emit('invite_to_resume_game', {
                    who_invite: NICKNAME,
                    who_invited: who_invited,
                    game_setting: game_setting,
                    resume_id_game: value.id
                })
            };

            new_div.append(new_game);
        })
    });

    socket.on('invite_to_resume_game_confirm', function (msg) {
        resumeInitGame(msg);
    });

    socket.on('invite_to_resume_game', function (msg) {
        if(typeof msg.error !== "undefined"){
            alert(msg.message);
        }
        else {
            let settings = null;
            msg.game_setting.forEach(function (value) {
                if(value.id === msg.resume_id_game) {
                    settings = value;
                }
            });

            let is_resume_game = confirm("Игрок '" + msg.who_invite + "' приглашает Вас продолжить партию (" + settings.type_game + ")");
            if (is_resume_game) {
                socket.emit('invite_to_resume_game_confirm', msg);
            }
            else {
                socket.emit('invite_to_resume_game_unconfirmed', msg);
            }
        }
    });

    socket.on('invite_to_resume_game_unconfirmed', function (msg) {
        alert("Игрок '" + msg.who_invited + "' отказался");
    });

    $("#getMyGames").on('click', function (e) {
        socket.emit('get_my_games', {
            nickname: NICKNAME
        });
    });

});

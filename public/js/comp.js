$(document).ready(function(){
    let current_script = document.querySelector('script[src*="comp.js"]');
    // low
    // medium
    // hard
    const COMPUTER_LEVEL = current_script.getAttribute("level");
    let DEPTH = null;
    if(COMPUTER_LEVEL === "low") {
        DEPTH = 2;
    }
    else if(COMPUTER_LEVEL === "medium") {
        DEPTH = 6;
    }
    else if(COMPUTER_LEVEL === "high") {
        DEPTH = 8;
    }

    // подсвечивать шаги
    const OVER_STEPS = current_script.getAttribute("color_potencial_step");
    //учитывать время
    const TIME_CHECK = current_script.getAttribute("time_check_checkbox");
    //если учитывать, то сколько
    const TIME_VALUE = current_script.getAttribute("time_check_text");
    //возможность рубить несколько шашек за один ход
    const MULTYATTACK = current_script.getAttribute("multiattack");
    //фуки
    const FUCHS = current_script.getAttribute("fuchs");
    const COLOR_FUCHS = current_script.getAttribute("color_potencial_fuchs");
    //можно обычным шашка аттаковать назад
    const SIMPLE_BACK_ATTACK = current_script.getAttribute("simple_back_attack");
    const TYPE_GAME = current_script.getAttribute("type_game");

    let socket = io();
    let id_game = new Date;
    id_game = md5(id_game.toString());

    // нотация
    let words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let digits = ['8', '7', '6', '5', '4', '3', '2', '1'];

    let count_history = 0;

    let arBackHistory = [];
    let player_play = "black"; //the first player_play
    let current_piece = null; // текущая шашка
    let potencialStepsQueenGlobal = []; // возможные шаги для дамок
    let potencialStepsSimpleGlobal = []; // возможные шаги для обычных шашек

    // ход назад
    function back_history(current, enemy = null, next = null, color, isqueen = false) {

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
            enemy_is_queen : enemy_is_queen
        });
    }
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


            $("#hys_" + count_history).remove();
            arBackHistory.pop();
            count_history--;
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

    // формируем доску
    function initBoard() {
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
                        rank__check.setAttribute("not", words[t] + "" + digits[i]);
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
                        rank__check.setAttribute("not", words[t] + "" + digits[i]);
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
                            // if(ttt < 3) {
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

        $('.board').toggleClass("rotate_board");
        $('.rank__check').toggleClass("rotate_board");
    }

    let ttt = 0;

    // лог на клиенте
    function add_history(prev, next, isAttack = null, isEnemy = null, isMine = null, count, count_enemy) {

        if(isEnemy === true) {
            let current_hys = $("#hys_" + count_history);

            if (isAttack === true) {
                current_hys.text(current_hys.text() + " " + prev.getAttribute("not") + ":" + next.getAttribute("not"));
            }
            else {
                current_hys.text(current_hys.text() + " " + prev.getAttribute("not") + "-" + next.getAttribute("not"));
            }

        }
        else {
            count_history++;
            if (isAttack === true) {
                if(count === 0) {
                    $("#history").append("<p id='hys_" + count_history + "'>" + count_history + ". " + prev.getAttribute("not") + ":" + next.getAttribute("not") + "</p>");
                }
                else {
                    let current_hys = $("#hys_" + (count_history - 1));
                    current_hys.text(current_hys.text() + ":" + next.getAttribute("not"));
                }
            }
            else {
                $("#history").append("<p id='hys_" + count_history + "'>" + count_history + ". " + prev.getAttribute("not") + "-" + next.getAttribute("not") + "</p>");
            }
        }
    }
    // лог на сервер
    function writeLog(text) {
        socket.emit('log', {
            id_game: id_game,
            text: text,
            level_game: COMPUTER_LEVEL
        });
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

            }
        });
        return isFuch;
    }
    // удалить текущую активную шашку после хода
    function removeCurrentPiece() {
        $(current_piece).remove();
        current_piece = null;
    }
    
    let append_count = 0;
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
            add_history(current_piece.parentElement, target, true, null, true, append_count, 0);
            append_count++;
        }
        else {
            add_history(current_piece.parentElement, target);
        }
    }
    // шаг игрока
    function stepplayer_play(potencialSteps, target, current_x, current_y, currentColor, isQueen = false) {
        let wasStep = false;

        potencialSteps.forEach(function (value) {
            if(current_piece !== null) {
                if (current_piece.parentElement === value[0].currentpiece) {

                    value[0].upright.empty.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });

                    value[0].upleft.empty.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });

                    value[0].bottomright.empty.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });

                    value[0].bottomleft.empty.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                            back_history(current_piece.parentElement, null, target, currentColor, isQueen);

                            appendPiece(target, currentColor, null, isQueen);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });
                }
            }
        });

        return wasStep;
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
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if (isQueen) {
                                    resultAttack = {
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
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if(isQueen) {
                                    resultAttack = {
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
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if(isQueen) {
                                    resultAttack = {
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
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
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
                                        kill_target: kill_target
                                    };
                                }

                            }
                            else if (currentColor === "black") {
                                if(isQueen) {
                                    resultAttack = {
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
                                        kill_target: kill_target
                                    };
                                }
                                else {
                                    resultAttack = {
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
                            }

                            isAttackSucces = true;
                        }
                    });
                }
            }
        });

        if(resultAttack){
            back_history(current_piece.parentElement, enemy_for_history, target, currentColor, isQueen);
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

    function getOneSimpleCells(color, currentPiece, prev) {
        //let currentPiece = $('.rank__check[x=' + piece_x + '][y=' + piece_y + ']')[0];
        let result = [];

        let needEat = [];

        let danger_up_right = [];
        let danger_up_left = [];
        let danger_bottom_right = [];
        let danger_bottom_left = [];

        let piece_x = currentPiece.getAttribute("x");
        let piece_y = currentPiece.getAttribute("y");

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

                if (color === "white") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                        danger_up_right.push(potencialWhiteQueenCell[0]);

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
                else if (color === "black") {

                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                        danger_up_right.push(potencialWhiteQueenCell[0]);

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

        // чтобы исключить "срубленные" шашки (те, которыя якобы срублены, но на доске они остались)
        if(nextPotencialWhiteQueenCell[0] ===  prev[0]) {
            danger_up_right = [];
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

                if (color === "white") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                        danger_up_left.push(potencialWhiteQueenCell[0]);

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
                else if (color === "black") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                        danger_up_left.push(potencialWhiteQueenCell[0]);

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

        // чтобы исключить "срубленные" шашки (те, которыя якобы срублены, но на доске они остались)
        if(nextPotencialWhiteQueenCell[0] === prev[0]) {
            danger_up_left = [];
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

                if (color === "white") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                        danger_bottom_right.push(potencialWhiteQueenCell[0]);

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
                else if (color === "black") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                        danger_bottom_right.push(potencialWhiteQueenCell[0]);

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

        // чтобы исключить "срубленные" шашки (те, которыя якобы срублены, но на доске они остались)
        if(nextPotencialWhiteQueenCell[0] ===  prev[0]) {
            danger_bottom_right = [];
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

                if (color === "white") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("black")) {

                        danger_bottom_left.push(potencialWhiteQueenCell[0]);

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
                else if (color === "black") {
                    // if this is enemy
                    if (potencialWhiteQueenCell[0].firstElementChild.classList.contains("white")) {

                        danger_bottom_left.push(potencialWhiteQueenCell[0]);

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

        // чтобы исключить "срубленные" шашки (те, которыя якобы срублены, но на доске они остались)
        if(nextPotencialWhiteQueenCell[0] ===  prev[0]) {
            danger_bottom_left = [];
        }

        if (color === "black") {
            if(SIMPLE_BACK_ATTACK !== "on") {
                needStepUpRight = [];
                needStepUpLeft = [];
                potencialAttackWhiteQueenUpRigth = [];
                potencialAttackWhiteQueenUpLeft = [];
            }

        }
        if (color === "white") {
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
                enemy: potencialAttackWhiteQueenUpRigth,
                danger: danger_up_right
            },
            upleft: {
                needStep: needStepUpLeft,
                empty: potencialStepsWhiteQueenUpLeft,
                enemy: potencialAttackWhiteQueenUpLeft,
                danger: danger_up_left
            },
            bottomright: {
                needStep: needStepBottomRight,
                empty: potencialStepsWhiteQueenBottomRigth,
                enemy: potencialAttackWhiteQueenBottomRigth,
                danger: danger_bottom_right
            },
            bottomleft: {
                needStep: needStepBottomLeft,
                empty: potencialStepsWhiteQueenBottomLeft,
                enemy: potencialAttackWhiteQueenBottomLeft,
                danger: danger_bottom_left
            }
        }];

        result.push(queen);

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
        let who_is_win = null;

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
            who_is_win = "white";
            alert("Белые выиграли");
        }
        if((isSimples_black || isQueens_black) && (!isSimples_white && !isQueens_white)) {
            who_is_win = "black";
            alert("Черные выиграли");
        }

        return who_is_win;
    }

    initBoard();

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

                            if(wasStep) {
                                stepComputer();
                            }

                        }
                        //шаг без фука
                        else if(!needEat && FUCHS !== "on") {
                            wasStep = stepplayer_play(potencialStepsQueenGlobal, event.target, current_x, current_y, currentColor, true);

                            if(wasStep) {
                                stepComputer();
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {
                            resultAttack = attackplayer_play(potencialStepsQueenGlobal, event.target, current_x, current_y, currentColor, but_x, but_y, true);

                            // если атака прошла успешно
                            if(!$.isEmptyObject(resultAttack)) {

                                appendPiece(resultAttack.target_place, resultAttack.local_color, true, true);
                                removeCurrentPiece();

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

                                    return false;
                                }
                                else {
                                    stepComputer();

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
                            stepComputer();
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

                            if(wasStep) {
                                stepComputer();
                            }

                        }
                        else if (!needEat && FUCHS !== "on") {
                            wasStep = stepplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep) {
                                stepComputer();
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {
                            resultAttack = attackplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor, but_x, but_y, false);

                            // если атака прошла успешно
                            if (!$.isEmptyObject(resultAttack)) {

                                appendPiece(resultAttack.target_place, resultAttack.local_color, true);
                                removeCurrentPiece();

                                $(resultAttack.kill_target)[0].firstElementChild.remove();

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
                                    stepComputer();

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

                                if(wasStep) {
                                    stepComputer();
                                }
                            }
                        }
                    }
                    // simple step
                    else {

                        wasStep = stepplayer_play(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                        if(wasStep) {
                            stepComputer();
                        }
                    }

                    clear_color();
                }
            }
        }

        gameOver();

        clear_color();

        sleep(3000).then(() => {
            writeLog($("#hys_" + count_history).text() + "\n");
        });

        slow_count = 0;
    });

    /**
     * COMPUTER LOGIC
     */
    function stepComputer(prev_move_to = null) {
        sleep(1000).then(() => {
            let wasAttack = false;

            // симуляция текущего состояния доски
            let simulated_board = simulate_board();

            // запуск алгоритма для вычисления следующего хода
            let selected_move = null;
            if (prev_move_to !== null) { // for multiattacks
                selected_move = alpha_beta_search(simulated_board, DEPTH, false);
            }
            else {
                selected_move = alpha_beta_search(simulated_board, DEPTH);
            }

            console.log("best move: " + selected_move.from.col + ":" + selected_move.from.row + " to " + selected_move.to.col + ":" + selected_move.to.row);

            let canStep = false;

            if (prev_move_to !== null) {
                if (selected_move.enemy && ((prev_move_to.col === selected_move.from.col) && (prev_move_to.row === selected_move.from.row))) {
                    canStep = true;
                }
            }
            else {
                canStep = true;
            }

            if (canStep) {
                let from_cell = getRankCheck(selected_move.from.col, selected_move.from.row);
                let to = getRankCheck(selected_move.to.col, selected_move.to.row);

                let current_player_isQueen = false;
                if (to.getAttribute("queen") === "white") {
                    $(to).append('<div class="piece white queen">&#9813;</div>');
                    current_player_isQueen = true;
                }
                else {
                    if (from_cell.firstElementChild.classList.contains("queen")) {
                        $(to).append('<div class="piece white queen">&#9813;</div>');
                        current_player_isQueen = true;
                    }
                    else {
                        $(to).append('<div class="piece white">&#9814;</div>');
                    }
                }

                $(from_cell.firstElementChild).remove();

                if (selected_move.enemy) {
                    let enemy = getRankCheck(selected_move.enemy.col, selected_move.enemy.row);
                    back_history(from_cell, enemy, to, "white", current_player_isQueen);
                    $(enemy.firstElementChild).remove();

                    wasAttack = true;
                }
                else {
                    back_history(from_cell, null, to, "white", current_player_isQueen);
                }

                if (wasAttack) {
                    stepComputer(selected_move.to);
                }
            }
        });
    }

    function getRankCheck(x, y) {
        return $(".rank__check[x=" + x + "][y=" + y + "]")[0];
    }

    // получить ходы, которые могут привести к потере шашки
    function getDangerPieces(array) {
        let arResult = [];
        let isDanger = false;

        array.forEach(function (value, index, array) {

            if(value.upright.empty.length > 0) {
                value.upright.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "upright");
                    if(isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "upright",
                            target: val[0]
                        });
                    }
                });
            }
            if(value.upleft.empty.length > 0) {
                value.upleft.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "upleft");
                    if(isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "upleft",
                            target: val[0]
                        });
                    }
                });
            }
            if(value.bottomright.empty.length > 0) {
                value.bottomright.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "bottomright");
                    if(isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "bottomright",
                            target: val[0]
                        });
                    }
                });
            }
            if(value.bottomleft.empty.length > 0) {
                value.bottomleft.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "bottomleft");
                    if(isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "bottomleft",
                            target: val[0]
                        });
                    }
                });
            }
        });

        return arResult;
    }

    // получить безопасные ходы
    function getNotDangerPieces(array) {
        let arResult = [];
        let isDanger = false;

        array.forEach(function (value, index, array) {

            if(value.upright.empty.length > 0) {
                value.upright.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "upright");
                    if(!isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "upright",
                            target: val[0]
                        });
                    }
                });
            }
            if(value.upleft.empty.length > 0) {
                value.upleft.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "upleft");
                    if(!isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "upleft",
                            target: val[0]
                        });
                    }
                });
            }
            if(value.bottomright.empty.length > 0) {
                value.bottomright.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "bottomright");
                    if(!isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "bottomright",
                            target: val[0]
                        });
                    }
                });
            }
            if(value.bottomleft.empty.length > 0) {
                value.bottomleft.empty.forEach(function (val) {
                    isDanger = getSituationNext(val[0], "bottomleft");
                    if(!isDanger) {
                        arResult.push({
                            prev: value.currentpiece,
                            side: "bottomleft",
                            target: val[0]
                        });
                    }
                });
            }
        });

        return arResult;
    }

    function isDangerForCell(array, side = null) {
        let isDanger = false;

        if(side === "bottomright") {
            if(typeof(array.bottomright) !== "undefined") {
                if (array.bottomright.hasChildNodes()) {
                    if (array.bottomright.firstElementChild.classList.contains("white")) {
                        if (((typeof array.upleft === "undefined") || (array.upleft === null)) || (array.upleft.firstElementChild.classList.contains("black"))) {
                            isDanger = true;
                        }
                    }
                }
            }
        }
        if(side === "bottomleft") {
            if(typeof(array.bottomleft) !== "undefined") {
                if (array.bottomleft.hasChildNodes()) {
                    if (array.bottomleft.firstElementChild.classList.contains("white")) {
                        if (((typeof array.upright === "undefined") || (array.upright === null)) || (array.upright.firstElementChild.classList.contains("black"))) {
                            isDanger = true;
                        }
                    }
                }
            }
        }
        if(side === "upright") {
            if(typeof(array.upright) !== "undefined") {
                if (array.upright.hasChildNodes()) {
                    if (array.upright.firstElementChild.classList.contains("white")) {
                        if (((typeof array.bottomleft === "undefined") || (array.bottomleft === null)) || (array.bottomleft.firstElementChild.classList.contains("black"))) {
                            isDanger = true;
                        }
                    }
                }
            }
        }
        if(side === "upleft") {
            if(typeof(array.upleft) !== "undefined") {
                if (array.upleft.hasChildNodes()) {
                    if (array.upleft.firstElementChild.classList.contains("white")) {
                        if (((typeof array.bottomright === "undefined") || (array.bottomright === null)) || (array.bottomright.firstElementChild.classList.contains("black"))) {
                            isDanger = true;
                        }
                    }
                }
            }
        }

        return isDanger;
    }

    // получить соседние (четыре) клетки
    function getAround(piece) {
        let x = parseInt(piece.getAttribute("x"));
        let y = parseInt(piece.getAttribute("y"));

        let arResult = [{
            current: piece,
            upright:  getRankCheck(x + 1, y - 1),
            upleft: getRankCheck(x - 1, y - 1),
            bottomright: getRankCheck(x + 1, y + 1),
            bottomleft: getRankCheck(x - 1, y + 1)
        }];

        return arResult;
    }

    function getSituationNext(piece, side) {
        let ghost_pieces = getAround(piece);

        return isDangerForCell(ghost_pieces[0], side);
    }

    let slow_count = 0;
    // атака ИИ
    function simple_slow_attack(prev, enemy = null, next, type = null, isAttack = null) {
        player_play = null;

        sleep(1000).then(() => {
            let color = prev.firstElementChild.classList.contains("black");

            $(prev.firstElementChild).remove();

            if (enemy !== null) {
                $(enemy.firstElementChild).remove();
            }

            if (color) {
                if (type !== null) {
                    $(next).append('<div class="piece black queen">&#9819;</div>');
                }
                else {
                    $(next).append('<div class="piece black">&#9820;</div>');
                }
            }
            else {
                if (type !== null) {
                    $(next).append('<div class="piece white queen">&#9813;</div>');
                }
                else {
                    $(next).append('<div class="piece white">&#9814;</div>');
                }
            }
            player_play = "white";

            if(isAttack === true) {
                add_history(prev, next, true, true, null, 0, slow_count);
                slow_count++;
            }
            else {
                add_history(prev, next, null, true, null);
            }
        });
    }

    // многоходовочка для ИИ (сырая версия функции)
    function isNeedAttackCP2(current_situation, enemy = null, prev_target = null, next_target = null) {
        let needNextAttack = false;

        current_situation.forEach(function (value) {
            if (value[0].upright.enemy.length > 0) {
                needNextAttack = true;
            }
            if (value[0].upleft.enemy.length > 0) {
                needNextAttack = true;
            }
            if (value[0].bottomright.enemy.length > 0) {
                needNextAttack = true;
            }
            if (value[0].bottomleft.enemy.length > 0) {
                needNextAttack = true;
            }

        });

        let prev = getPrev(current_situation[0][0]);
        let new_enemy = getEnemy(current_situation[0][0]);
        let next = getNext(current_situation[0][0]);

        if (needNextAttack) {

            sleep(1000).then(() => {
                simple_slow_attack(prev[0], new_enemy[0][0][0], next[0][0][0], null, true);
                current_situation = getOneSimpleCells("black", $(next)[0][0][0], prev);
                isNeedAttackCP2(current_situation, new_enemy[0][0][0], prev[0], next[0][0][0]);
            });
        }
        else {

            return false;
        }
    }

    function getNext(array) {
        let next = [];

        for (let prop in array) {
            if (prop === "upright" || prop === "upleft" || prop === "bottomright" || prop === "bottomleft") {

                if (array[prop].needStep.length > 0) {
                    next.push(array[prop].needStep);
                }
            }
        }

        return next;
    }
    function getEnemy(array) {
        let enemy = [];

        for (let prop in array) {
            if (prop === "upright" || prop === "upleft" || prop === "bottomright" || prop === "bottomleft") {

                if (array[prop].enemy.length > 0) {
                    enemy.push(array[prop].enemy);
                }
            }
        }

        return enemy;
    }
    function getPrev(array) {
        let prev = [];

        for (let prop in array) {
            if (prop === "currentpiece") {
                prev.push(array[prop]);
            }
        }

        return prev;
    }

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

        return {cells: cells, pieces: pieces};
    }

    let red = 1;
    let redKing = 1.1
    let black = -1;
    let blackKing = -1.1
    let empty = 0;
    let player = red;
    let computer = black;
    let currentBoard = {};
    let INFINITY = 10000;
    let NEG_INFINITY = -10000;
    let cell_width = 0;
    let board_origin = 0;

    function initializeBoard() {
        let initialBoard = [[red, empty, red, empty, red, empty, red, empty],
            [empty, red, empty, red, empty, red, empty, red],
            [red, empty, red, empty, red, empty, red, empty],
            [empty, empty, empty, empty, empty, empty, empty, empty],
            [empty, empty, empty, empty, empty, empty, empty, empty],
            [empty, black, empty, black, empty, black, empty, black],
            [black, empty, black, empty, black, empty, black, empty],
            [empty, black, empty, black, empty, black, empty, black]
        ];

        let cells = new Array();
        let pieces = new Array();
        for (let i=0;i<initialBoard.length;i++){
            let row = initialBoard[i];
            for (let j=0;j<row.length;j++) {
                let colValue=row[j];
                if (colValue != empty) {
                    let piece = {row: i, col: j, state: colValue};
                    pieces.push(piece);
                }
                let cell = {row: i, col: j, state: colValue};
                cells.push(cell);
            }
        }

        return {cells: cells, pieces: pieces, turn: red};
    }

    function mapCellToCoordinates(origin, width, cell) {
        let key = "" + cell.row + ":" + cell.col;
        if (!mapCellToCoordinates.answers) mapCellToCoordinates.answers = {};
        if (mapCellToCoordinates.answers[key] != null){
            return mapCellToCoordinates.answers[key];
        }
        let x = origin.x + (cell.col * width);
        let y = origin.y + (cell.row * width);
        return mapCellToCoordinates.answers[key] = {x: x , y: y};
    }

    function mapCoordinatesToCell(origin, width, cells, x, y){
        let numSquares = 8;
        let boardLength = numSquares * width;
        if (x > (origin.x + boardLength)) return null;
        if (y > (origin.y + boardLength)) return null;
        let col = Math.ceil((x - origin.x) / width) - 1;
        let row = Math.ceil((y - origin.y) / width) - 1;
        let index = ((row * numSquares) + col);
        let cell = cells[index];

        return cell;
    }

    function startGame(origin, cellWidth, boardCanvas) {
        movePiece.moves = [];
        d3.select("#btnReplay").style("display", "none");
        cell_width = cellWidth;
        board_origin = origin;
        currentBoard = drawBoard(origin, cellWidth, boardCanvas);
        currentBoard.ui = true;
        showBoardState();
    }

    function replayAll(origin, cellWidth, boardCanvas) {
        let allMoves = movePiece.moves;
        startGame(origin, cellWidth, boardCanvas);
        currentBoard.turn = 0; // can't really play
        for (let i=0; i<allMoves.length; i++) {
            let moveNum = i+1;
            let nextMove = allMoves[i];
            if (nextMove.to.row > -1){
                let cellCoordinates = mapCellToCoordinates(board_origin, cell_width, nextMove.to);
                d3.selectAll("circle").each(function(d,i) {
                    if (d.col === nextMove.from.col && d.row === nextMove.from.row){
                        d3.select(this)
                            .transition()
                            .delay(500 * moveNum)
                            .attr("cx", d.x = cellCoordinates.x + cell_width/2)
                            .attr("cy", d.y = cellCoordinates.y + cell_width/2);

                        d.col = nextMove.to.col;
                        d.row = nextMove.to.row;
                    }
                });
            }
            else {
                d3.selectAll("circle").each(function(d,i) {
                    if (d.row === nextMove.from.row && d.col === nextMove.from.col){
                        d3.select(this).transition().delay(500 * moveNum)
                            .style("display", "none");
                        d.col = -1;
                        d.row = -1;
                    }
                });
            }
        }
    }

    function undoMove(move, moveNum) {
        if (move.to.row > -1){
            let cellCoordinates = mapCellToCoordinates(board_origin, cell_width, move.from);
            d3.selectAll("circle").each(function(d,i) {
                if (d.col === move.to.col && d.row === move.to.row){
                    d3.select(this)
                        .transition()
                        .delay(500 * moveNum)
                        .attr("cx", d.x = cellCoordinates.x + cell_width/2)
                        .attr("cy", d.y = cellCoordinates.y + cell_width/2);

                    d.col = move.from.col;
                    d.row = move.from.row;
                }
            });
            let toIndex = getCellIndex(move.to.row, move.to.col);
            let cell = currentBoard.cells[toIndex];
            cell.state = 0;
            let fromIndex = getCellIndex(move.from.row, move.from.col);
            cell = currentBoard.cells[fromIndex];
            cell.state = move.piece.state;
            //let pieceIndex = getPieceIndex(currentBoard.pieces, move.to.row, move.to.col);
            //let piece = currentBoard.pieces[pieceIndex];
            //piece.col = move.from.col;
            //piece.row = move.from.row;

        }
        else {
            d3.selectAll("circle").each(function(d,i) {
                if (d.lastRow === move.from.row && d.lastCol === move.from.col){
                    d3.select(this).transition().delay(500 * moveNum)
                        .style("display", "block");
                    d.col = move.from.col;
                    d.row = move.from.row;

                    let fromIndex = getCellIndex(move.from.row, move.from.col);
                    let cell = currentBoard.cells[fromIndex];
                    cell.state = move.piece.state;
                    let pieceIndex = getPieceIndex(currentBoard.pieces, move.from.row, move.from.col);
                    let piece = currentBoard.pieces[pieceIndex];
                    piece.col = move.from.col;
                    piece.row = move.from.row;
                    piece.state = move.piece.state;
                }
            });
        }

    }

    function undo(numBack) {
        let computerUndo = 0;
        let lastTurn = player;
        let moveNum = 0;
        while (true) {
            moveNum += 1;
            let lastMove = movePiece.moves.pop();
            if (lastMove == null) {
                break;
            }
            if (lastTurn === player && lastMove.piece.state === computer) {
                computerUndo += 1
                if (computerUndo > numBack) {
                    break;
                }
            }
            if (lastMove.to.col > -1) {
                lastTurn = lastMove.piece.state;
            }
            undoMove(lastMove, moveNum);
            showBoardState();
        }
    }

    function movePiece(boardState, piece, fromCell, toCell, moveNum) {
        if (boardState.ui) {
            if (movePiece.moves == null) {
                movePiece.moves = [];
            }
            movePiece.moves.push({piece: { col: piece.col, row: piece.row, state: piece.state},
                from: {col: fromCell.col, row: fromCell.row},
                to: {col: toCell.col, row: toCell.row}});
        }

        // Get jumped piece
        let jumpedPiece = getJumpedPiece(boardState.cells, boardState.pieces, fromCell, toCell);

        // Update states
        let fromIndex = getCellIndex(fromCell.row, fromCell.col);
        let toIndex = getCellIndex(toCell.row, toCell.col);
        if ((toCell.row === 0 || toCell.row === 8) && Math.abs(piece.state) === 1) {
            boardState.cells[toIndex].state = piece.state * 1.1;
        }
        else {
            boardState.cells[toIndex].state = piece.state;
        }
        boardState.cells[fromIndex].state = empty;
        if ((toCell.row === 0 || toCell.row === 7) && Math.abs(piece.state) === 1) {
            piece.state = piece.state * 1.1
        }
        piece.col = toCell.col;
        piece.row = toCell.row;

        if (boardState.ui && (boardState.turn === computer || moveNum > 1)) {
            moveCircle(toCell, moveNum);
        }

        if (jumpedPiece != null) {
            let jumpedIndex = getPieceIndex(boardState.pieces, jumpedPiece.row, jumpedPiece.col);
            let originialJumpPieceState = jumpedPiece.state;
            jumpedPiece.state = 0;

            let cellIndex = getCellIndex(jumpedPiece.row, jumpedPiece.col);
            let jumpedCell = boardState.cells[cellIndex];
            jumpedCell.state = empty;
            boardState.pieces[jumpedIndex].lastCol = boardState.pieces[jumpedIndex].col;
            boardState.pieces[jumpedIndex].lastRow = boardState.pieces[jumpedIndex].row;
            boardState.pieces[jumpedIndex].col = -1;
            boardState.pieces[jumpedIndex].row = -1;
            if (boardState.ui) {
                hideCircle(jumpedCell, moveNum);
            }

            if (boardState.ui) {
                movePiece.moves.push({piece: { col: jumpedPiece.col, row: jumpedPiece.row, state: originialJumpPieceState},
                    from: {col: jumpedCell.col, row: jumpedCell.row},
                    to: {col: -1, row: -1}});
            }

            // Another jump?
            let more_moves = get_available_piece_moves(boardState, piece, boardState.turn);
            let another_move = null;
            for (let i=0; i<more_moves.length; i++) {
                more_move = more_moves[i];
                if (more_move.move_type === "jump") {
                    another_move = more_move;
                    break;
                }
            }
            if (another_move != null) {
                moveNum += 1;
                boardState = movePiece(boardState, piece, another_move.from, another_move.to, moveNum);
                if (boardState.ui && boardState.turn === player) {
                    boardState.numPlayerMoves += moveNum;
                }
            }
        }


        return boardState;
    }

    function getCellIndex(row, col) {
        let numSquares = 8;
        let index = ((row * numSquares) + col);
        return index;
    }

    function getPieceIndex(pieces, row, col) {
        let index = -1;
        for (let i=0; i<pieces.length;i++){
            let piece = pieces[i];
            if (piece.row===row && piece.col===col){
                index = i;
                break;
            }
        }
        return index;
    }

    function getPieceCount(boardState) {
        let numRed = 0;
        let numBlack = 0;
        let pieces = boardState.pieces;
        for (let i=0;i<pieces.length;i++) {
            let piece = pieces[i];
            if (piece.col >=0 && piece.row >=0){
                if (piece.state === red || piece.state === redKing) {
                    numRed += 1;
                }
                else if (piece.state === black || piece.state === blackKing) {
                    numBlack += 1;
                }
            }
        }

        return {red: numRed, black: numBlack};
    }

    function getScore(boardState) {
        let pieceCount = getPieceCount(boardState);
        let score = pieceCount.red - pieceCount.black;
        return score;
    }

    function getWinner(boardState) {
        let pieceCount = getPieceCount(boardState);
        if (pieceCount.red > 0  && pieceCount.black === 0) {
            return red;
        }
        else if (pieceCount.black > 0 && pieceCount.red === 0) {
            return black;
        }
        else return 0;
    }

    function getJumpedPiece(cells, pieces, from, to) {
        let distance = {x: to.col-from.col,y: to.row-from.row};
        if (abs(distance.x) == 2) {
            let jumpRow = from.row+sign(distance.y);
            let jumpCol = from.col+sign(distance.x);
            let index = getPieceIndex(pieces, jumpRow, jumpCol);
            let jumpedPiece = pieces[index];
            return jumpedPiece;
        }
        else return null;

    }

    let tt = 0;

    function isMoveLegal(cells, pieces, piece, from, to) {
        if ((to.col < 0) || (to.row < 0) || (to.col > 7) || (to.row > 7)) {
            //console.log("ILLEGAL MOVE: piece going off board");
            return false;
        }
        let distance = {x: to.col-from.col,y: to.row-from.row};
        if ((distance.x == 0) || (distance.y == 0)) {
            //console.log("ILLEGAL MOVE: horizontal or vertical move");
            return false;
        }
        if (abs(distance.x) != abs(distance.y)) {
            //console.log("ILLEGAL MOVE: non-diagonal move");
            return false;
        }

        if (abs(distance.x) > 2) {
            //console.log("ILLEGAL MOVE: more than two diagonals");
            if(TYPE_GAME !== "russian") {
                return false;
            }
            //return false;
        }
        /* TODO: handle double jump
        if ((abs(distance.x) == 1) && double_jump) {
            return false;
        }
        */
        if (to.state != empty) {
            //console.log("ILLEGAL MOVE: cell is not empty");
            return false;
        }

        if (abs(distance.x) == 2) {
            let jumpedPiece = getJumpedPiece(cells, pieces, from, to);
            if (jumpedPiece == null) {
                //console.log("ILLEGAL MOVE: no piece to jump");
                return false;
            }

            let pieceState = integ(piece.state);
            let jumpedState = integ(jumpedPiece.state);
            if (pieceState != -jumpedState) {
                //console.log("ILLEGAL MOVE: can't jump own piece");
                return false;
            }
        }


        if ((integ(piece.state) === piece.state) && (sign(piece.state) != sign(distance.y))) {
            //console.log("ILLEGAL MOVE: wrong direction");
            if(SIMPLE_BACK_ATTACK !== "on") {
                return false;
            }
        }

        return true;
    }

    function drawBoard(origin, cellWidth, boardCanvas) {
        let boardState = initializeBoard();
        let cells = boardState.cells;
        let pieces = boardState.pieces;

        //Draw cell rects
        boardCanvas.append("g")
            .selectAll("rect")
            .data(cells)
            .enter().append("rect")
            .attr("x", function(d) { return mapCellToCoordinates(origin, cellWidth, d).x})
            .attr("y", function(d) { return mapCellToCoordinates(origin, cellWidth, d).y})
            .attr("height", cellWidth)
            .attr("width", cellWidth)
            .style("fill", "white")
            .style("stroke", "black")
            .style("stroke-width", "1px");

        //Draw pieces
        let dragEndedDimensions = function(d) {
            node = d3.select(this);
            dragEnded(origin, cellWidth, node, d);
        }

        let drag = d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEndedDimensions);

        boardCanvas.append("g")
            .selectAll("circle")
            .data(pieces)
            .enter().append("circle")
            .attr("r", cellWidth/2)
            .attr("cx", function(d) { let x = mapCellToCoordinates(origin, cellWidth, d).x; return x+cellWidth/2;})
            .attr("cy", function(d) { let y = mapCellToCoordinates(origin, cellWidth, d).y; return y+cellWidth/2;})
            .style("fill", function(d) { if (d.state == red) return "red"; else return "black";})
            .call(drag)
        ;

        //Draw scoreboard
        d3.select("#divScoreboard").remove();
        d3.select("body").append("div")
            .attr("id", "divScoreboard")
            .style("font-size", "36")
            .html("SCOREBOARD")

        d3.select("#divScoreboard")
            .append("div")
            .style("font-size", "24")
            .attr("id", "winner");

        d3.select("#divScoreboard")
            .append("div")
            .attr("id", "redScore")
            .style("font-size", "18")
            .html("Red: 12")

        d3.select("#divScoreboard")
            .append("div")
            .attr("id", "blackScore")
            .style("font-size", "18")
            .html("Black: 12")
        ;

        return boardState;
    }

    function updateScoreboard() {
        let pieceCount = getPieceCount(currentBoard);
        let redLabel = "Red: " + pieceCount.red;
        let blackLabel = "Black: " + pieceCount.black;

        d3.select("#redScore")
            .html(redLabel);
        d3.select("#blackScore")
            .html(blackLabel);

        let winner = getWinner(currentBoard);
        let winnerLabel = "";
        if (winner === player) {
            winnerLabel = "Red Wins!!";
        }
        else if (winner === computer) {
            winnerLabel = "Black Wins!!";
        }

        if (winner != 0) {
            d3.select("#btnReplay")
                .style("display", "inline");
        }

        d3.select("#winner")
            .html(winnerLabel);
    }

    function integ(num) {
        if (num != null)
            return Math.round(num);
        else
            return null;
    }

    function abs(num) {
        return Math.abs(num);
    }

    function sign(num) {
        if (num < 0) return -1;
        else return 1;
    }

    function drawText(data) {
        boardCanvas.append("g")
            .selectAll("text")
            .data(data)
            .enter().append("text")
            .attr("x", function(d) { let x = mapCellToCoordinates(board_origin, cell_width, d).x; return x+cell_width/2;})
            .attr("y", function(d) { let y = mapCellToCoordinates(board_origin, cell_width, d).y; return y+cell_width/2;})
            .style("fill", function(d) { if (d.state === red) return "black"; else return "white";})
            .text(function(d) { /*if (d.state === red) return "R";
									else if (d.state === black) return "B";
									else*/ if (d.state === redKing || d.state === blackKing) return "K";
            else return "";})
        ;
    }

    function showBoardState() {
        d3.selectAll("text").each(function(d,i) {
            d3.select(this)
                .style("display", "none");
        });

        let cells = currentBoard.cells;
        let pieces = currentBoard.pieces;
        //drawText(cells);
        drawText(pieces);
    }

    /* COMPUTER AI FUNCTIONS */
    function copy_board(board) {
        let newBoard = {};
        newBoard.ui = false;
        let cells = new Array();
        let pieces = new Array();

        for (let i=0;i<board.cells.length;i++) {
            let cell = board.cells[i];
            let newCell = {row: cell.row, col: cell.col, state: cell.state};
            cells.push(newCell);
        }
        for (let i=0;i<board.pieces.length;i++){
            let piece = board.pieces[i];
            let newPiece = {row: piece.row, col: piece.col, state: piece.state};
            pieces.push(newPiece);
        }

        return {cells: cells, pieces: pieces, turn: board.turn};
    }

    function get_player_pieces(player, target_board) {
        player_pieces = new Array();
        for (let i=0;i<target_board.pieces.length;i++){
            let piece = target_board.pieces[i];
            if (piece.state === player || piece.state === (player+.1) || piece.state === (player-.1) ) {
                player_pieces.push(piece);
            }
        }
        return player_pieces;
    }

    function get_cell_index(target_board, col, row) {
        let index = -1;
        for (let i=0;i<target_board.cells.length;i++) {
            let cell = target_board.cells[i];
            if (cell.col === col && cell.row ===row) {
                index = i;
                break;
            }
        }
        return index;
    }

    function get_available_piece_moves(target_board, target_piece, player) {
        let moves = [];
        let from = target_piece;

        // check for slides
        let x = [-1, 1];
        x.forEach(function(entry) {
            let cell_index = get_cell_index(target_board, from.col+entry, from.row+(player*1));
            if (cell_index >= 0){
                let to = target_board.cells[cell_index];
                if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
                    move = {
                        move_type: 'slide',
                        piece: player,
                        from: {col: from.col, row: from.row},
                        to: {col: to.col, row: to.row}
                    };
                    moves[moves.length] = move;
                }
            }
        });

        // check for jumps
        x = [-2, 2];
        let y = [-2, 2];
        x.forEach(function(xmove) {
            y.forEach(function(ymove){
                let cell_index = get_cell_index(target_board, from.col+xmove, from.row+ymove);
                if (cell_index >= 0){
                    let to = target_board.cells[cell_index];

                    let col_enemy = 0;
                    let row_enemy = 0;
                    if(xmove === -2) {
                        col_enemy = from.col + (xmove + 1);
                    }
                    else {
                        col_enemy = from.col + (xmove - 1);
                    }

                    if(ymove === -2) {
                        row_enemy = from.row + (ymove + 1);
                    }
                    else {
                        row_enemy = from.row + (ymove - 1);
                    }

                    if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
                        move = {
                            enemy: {col: col_enemy, row: row_enemy},
                            move_type: 'jump',
                            piece: player,
                            from: {col: from.col, row: from.row},
                            to: {col: to.col, row: to.row}
                        };
                        moves[moves.length] = move;
                    }
                }
            });
        });

        // check for jumps
        // x = [-2, 2];
        // x.forEach(function(entry) {
        //     let cell_index = get_cell_index(target_board, from.col+entry, from.row+(player*2));
        //     if (cell_index >= 0) {
        //         let to = target_board.cells[cell_index];
        //
        //         let col_enemy = 0;
        //         if(entry === -2) {
        //             col_enemy = from.col + (entry + 1);
        //         }
        //         else {
        //             col_enemy = from.col + (entry - 1);
        //         }
        //
        //         if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
        //             move = {
        //                 enemy: {col: col_enemy, row: from.row+(player*1)},
        //                 move_type: 'jump',
        //                 piece: player,
        //                 from: {col: from.col, row: from.row},
        //                 to: {col: to.col, row: to.row}
        //             };
        //             moves[moves.length] = move;
        //         }
        //     }
        // });

        // kings
        if (Math.abs(from.state) === 1.1) {
            if (TYPE_GAME === "english") {
                // check for slides
                let x = [-1, 1];
                y = [-1, 1];
                x.forEach(function (xmove) {
                    y.forEach(function (ymove) {
                        let cell_index = get_cell_index(target_board, from.col + xmove, from.row + ymove);
                        if (cell_index >= 0) {
                            let to = target_board.cells[cell_index];
                            if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
                                move = {
                                    move_type: 'slide',
                                    piece: player,
                                    from: {col: from.col, row: from.row},
                                    to: {col: to.col, row: to.row}
                                };
                                moves[moves.length] = move;
                            }
                        }
                    });
                });

                // check for jumps
                x = [-2, 2];
                y = [-2, 2];
                x.forEach(function (xmove) {
                    y.forEach(function (ymove) {
                        let cell_index = get_cell_index(target_board, from.col + xmove, from.row + ymove);
                        if (cell_index >= 0) {
                            let to = target_board.cells[cell_index];

                            let col_enemy = 0;
                            let row_enemy = 0;
                            if(xmove === -2) {
                                col_enemy = from.col + (xmove + 1);
                            }
                            else {
                                col_enemy = from.col + (xmove - 1);
                            }

                            if(ymove === -2) {
                                row_enemy = from.row + (ymove + 1);
                            }
                            else {
                                row_enemy = from.row + (ymove - 1);
                            }

                            if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
                                move = {
                                    enemy: {col: col_enemy, row: row_enemy},
                                    move_type: 'jump',
                                    piece: player,
                                    from: {col: from.col, row: from.row},
                                    to: {col: to.col, row: to.row}
                                };
                                moves[moves.length] = move;
                            }
                        }
                    });
                });
            }
            else if(TYPE_GAME === "russian") {
                // check for slides
                let x = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
                y = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
                x.forEach(function (xmove) {
                    y.forEach(function (ymove) {
                        let cell_index = get_cell_index(target_board, from.col + xmove, from.row + ymove);
                        if (cell_index >= 0) {
                            let to = target_board.cells[cell_index];
                            if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
                                move = {
                                    move_type: 'slide',
                                    piece: player,
                                    from: {col: from.col, row: from.row},
                                    to: {col: to.col, row: to.row}
                                };
                                moves[moves.length] = move;
                            }
                        }
                    });
                });

                // check for jumps
                x = [-2, 2];
                y = [-2, 2];
                x.forEach(function (xmove) {
                    y.forEach(function (ymove) {
                        let cell_index = get_cell_index(target_board, from.col + xmove, from.row + ymove);
                        if (cell_index >= 0) {
                            let to = target_board.cells[cell_index];

                            let col_enemy = 0;
                            let row_enemy = 0;
                            if(xmove === -2) {
                                col_enemy = from.col + (xmove + 1);
                            }
                            else {
                                col_enemy = from.col + (xmove - 1);
                            }

                            if(ymove === -2) {
                                row_enemy = from.row + (ymove + 1);
                            }
                            else {
                                row_enemy = from.row + (ymove - 1);
                            }

                            if (isMoveLegal(target_board.cells, target_board.pieces, from, from, to)) {
                                move = {
                                    enemy: {col: col_enemy, row: row_enemy},
                                    move_type: 'jump',
                                    piece: player,
                                    from: {col: from.col, row: from.row},
                                    to: {col: to.col, row: to.row}
                                };
                                moves[moves.length] = move;
                            }
                        }
                    });
                });
            }
        }

        return moves;
    }

    function get_available_moves(player, target_board) {
        let moves = [];
        let move = null;
        let player_pieces = get_player_pieces(player, target_board);

        for (let i=0;i<player_pieces.length;i++) {
            let from = player_pieces[i];
            let piece_moves = get_available_piece_moves(target_board, from, player);
            moves.push.apply(moves, piece_moves);
        }

        //prune non-jumps, if applicable
        let jump_moves = [];
        for (let i=0; i<moves.length;i++) {
            let move = moves[i];
            if (move.move_type == "jump") {
                jump_moves.push(move);
            }
        }
        if (jump_moves.length > 0){
            moves = jump_moves;
        }

        return moves;
    }

    function select_random_move(moves){
        // Randomly select move
        let index = Math.floor(Math.random() * (moves.length - 1));
        let selected_move = moves[index];

        return selected_move;
    }

    // isNeedMarkAlphaBeta -- for multiattacks
    function alpha_beta_search(calc_board, limit, isNeedMarkAlphaBeta = true) {
        let alpha = NEG_INFINITY;
        let beta = INFINITY;

        //get available moves for computer
        let available_moves = get_available_moves(computer, calc_board);

        let max = 0;
        if(isNeedMarkAlphaBeta) {
            //get max value for each available move
            max = max_value(calc_board, available_moves, limit, alpha, beta);
        }

        // console.log(available_moves);

        //find all moves that have max-value
        let best_moves = [];
        let max_move = null;
        for(let i=0;i<available_moves.length;i++){
            let next_move = available_moves[i];
            if(isNeedMarkAlphaBeta) {
                if (next_move.score == max) {
                    max_move = next_move;
                    best_moves.push(next_move);
                }
            }
            else {
                max_move = next_move;
                best_moves.push(next_move);
            }
        }

        //randomize selection, if multiple moves have same max-value
        if (best_moves.length > 1){
            max_move = select_random_move(best_moves);
        }

        return max_move;
    }

    function computerMove() {
        // Copy board into simulated board
        let simulated_board = copy_board(currentBoard);
        console.log(simulated_board)

        // Run algorithm to select next move
        let selected_move = alpha_beta_search(simulated_board, 8);
        console.log("best move: " + selected_move.from.col + ":" + selected_move.from.row + " to " + selected_move.to.col + ":" + selected_move.to.row);

        // Make computer's move
        let pieceIndex = getPieceIndex(currentBoard.pieces, selected_move.from.row, selected_move.from.col);
        let piece = currentBoard.pieces[pieceIndex];
        currentBoard = movePiece(currentBoard, piece, selected_move.from, selected_move.to, 1);
        moveCircle(selected_move.to, 1);
        showBoardState();

        let winner = getWinner(currentBoard);
        if (winner != 0) {
            currentBoard.gameOver = true;
        }
        else {
            // Set turn back to human
            currentBoard.turn = player;
            currentBoard.delay = 0;
        }
    }

    function jump_available(available_moves) {
        let jump = false;
        for (let i=0;i<available_moves.length;i++){
            let move = available_moves[i];
            if (move.move_type == "jump") {
                jump = true;
                break;
            }
        }

        return jump;
    }

    function min_value(calc_board, human_moves, limit, alpha, beta) {
        if (limit <=0 && !jump_available(human_moves)) {
            return utility(calc_board);
        }
        let min = INFINITY;

        //for each move, get min
        if (human_moves.length > 0){
            for (let i=0;i<human_moves.length;i++){
                simulated_board = copy_board(calc_board);

                //move human piece
                let human_move = human_moves[i];
                let pieceIndex = getPieceIndex(simulated_board.pieces, human_move.from.row, human_move.from.col);
                let piece = simulated_board.pieces[pieceIndex];
                simulated_board = movePiece(simulated_board, piece, human_move.from, human_move.to);

                //get available moves for computer
                let computer_moves = get_available_moves(computer, simulated_board);

                //get max value for this move
                let max_score = max_value(simulated_board, computer_moves, limit-1, alpha, beta);

                //compare to min and update, if necessary
                if (max_score < min) {
                    min = max_score;
                }
                human_moves[i].score = min;
                if (min <= alpha) {
                    break;
                }
                if (min < beta) {
                    beta = min;
                }
            }
        }
        else {
            //log("NO MORE MOVES FOR MIN: l=" + limit);
        }

        return min;
    }

    function max_value(calc_board, computer_moves, limit, alpha, beta) {
        if (limit <= 0 && !jump_available(computer_moves)) {
            return utility(calc_board);
        }
        let max = NEG_INFINITY;

        //for each move, get max
        if (computer_moves.length > 0){
            for (let i=0;i<computer_moves.length;i++){
                simulated_board = copy_board(calc_board);

                //move computer piece
                let computer_move = computer_moves[i];
                let pieceIndex = getPieceIndex(simulated_board.pieces, computer_move.from.row, computer_move.from.col);
                let piece = simulated_board.pieces[pieceIndex];
                simulated_board = movePiece(simulated_board, piece, computer_move.from, computer_move.to);

                //get available moves for human
                let human_moves = get_available_moves(player, simulated_board);

                //get min value for this move
                let min_score = min_value(simulated_board, human_moves, limit-1, alpha, beta);
                computer_moves[i].score = min_score;

                //compare to min and update, if necessary
                if (min_score > max) {
                    max = min_score;
                }
                if (max >= beta) {
                    break;
                }
                if (max > alpha) {
                    alpha = max;
                }
            }
        }
        else {
            //log("NO MORE MOVES FOR MAX: l=" + limit);
        }

        return max;

    }

    function evaluate_position(x , y) {
        if (x == 0 || x == 7 || y == 0 || y == 7){
            return 5;
        }
        else {
            return 3;
        }
    }

    function utility(target_board) {
        let sum = 0;
        let computer_pieces = 0;
        let computer_kings = 0;
        let human_pieces = 0;
        let human_kings = 0;
        let computer_pos_sum = 0;
        let human_pos_sum = 0;

        //log("************* UTILITY *****************")
        for (let i=0; i<target_board.pieces.length; i++) {
            let piece = target_board.pieces[i];
            if (piece.row > -1) { // only count pieces still on the board
                if (piece.state > 0) { // human
                    human_pieces += 1;
                    if (piece.state === 1.1){
                        human_kings += 1;
                    }
                    let human_pos = evaluate_position(piece.col, piece.row);
                    human_pos_sum += human_pos;
                }
                else { // computer
                    computer_pieces += 1;
                    if (piece.state === -1.1){
                        computer_kings += 1;
                    }
                    let computer_pos = evaluate_position(piece.col, piece.row);
                    computer_pos_sum += computer_pos;
                }
            }
        }

        let piece_difference = computer_pieces - human_pieces;
        let king_difference = computer_kings - human_kings;
        if (human_pieces === 0){
            human_pieces = 0.00001;
        }
        let avg_human_pos = human_pos_sum / human_pieces;
        if (computer_pieces === 0) {
            computer_pieces = 0.00001;
        }
        let avg_computer_pos = computer_pos_sum / computer_pieces;
        let avg_pos_diff = avg_computer_pos - avg_human_pos;

        let features = [piece_difference, king_difference, avg_pos_diff];
        let weights = [100, 10, 1];

        let board_utility = 0;

        for (let f=0; f<features.length; f++){
            let fw = features[f] * weights[f];
            board_utility += fw;
        }

        //log("utility=" + board_utility);
        //log("************* END  UTILITY ************")

        return board_utility;
    }

});

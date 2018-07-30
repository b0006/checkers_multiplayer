
function initBoard() {
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
}

$(document).ready(function(){
    initBoard();

    let current_script = document.querySelector('script[src*="comp.js"]');

    // LOW
    // MEDIUM
    // HARD
    const COMPUTER_LEVEL = current_script.getAttribute("level");
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

    let player = "white"; //the first player
    let current_piece = null; // global last click piece

    let potencialStepsWhiteQueenGlobal = [];
    let potencialStepsSimpleGlobal = [];

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

        console.log(queen)

        return result;
    }

    // click on checkers
    addDynamicEventListener(document.body, 'click', '.piece', function (e) {

        if(current_piece !== null) {
            if (current_piece.classList.contains("next")) {
                return false;
            }
        }

        let currentPlayer = checkPlayer(e.target);
        if(currentPlayer !== player) {
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

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();

                                                    isFuch = true;
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].upleft.empty.forEach(function (val_up) {
                                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomright.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    $(potencialStepsWhiteQueenGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomleft.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

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

                                    return false;
                                }
                                else {
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

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();

                                                    isFuch = true;
                                                    isPlayerChange = true;

                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].upleft.empty.forEach(function (val_up) {
                                                if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isFuch = true;
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomright.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isFuch = true;
                                                    isPlayerChange = true;
                                                }
                                            });
                                        }

                                        if(!isFuch) {
                                            value[0].bottomleft.empty.forEach(function (val_bot) {
                                                if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {

                                                    $(potencialStepsSimpleGlobal[0][0].needeat[indexNeadEat].firstElementChild).remove();
                                                    isFuch = true;
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;

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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
                                            }
                                        });
                                    }
                                }

                            });

                            if(wasStep) {
                                stepComputer();
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
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

                                                $(current_piece).remove();
                                                current_piece = null;

                                                isPlayerChange = true;
                                                wasStep = true;
                                            }
                                        });
                                    }
                                }
                            });

                            if(wasStep) {
                                stepComputer();
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
                                }
                                else {
                                    stepComputer();

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

                                            $(current_piece).remove();
                                            current_piece = null;

                                            wasStep = true;
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

                                            $(current_piece).remove();
                                            current_piece = null;

                                            wasStep = true;
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

                                            $(current_piece).remove();
                                            current_piece = null;

                                            wasStep = true;
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

                                            $(current_piece).remove();
                                            current_piece = null;

                                            wasStep = true;
                                        }
                                    });
                                }
                            }
                        });

                        if(wasStep) {
                            stepComputer(event.target);
                        }
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

    //AI
    function markFunction(count_white_queen, count_black_queen, count_white_simple, count_black_simple, count_success_next_move_white, count_success_next_move_black, distance_to_last_line) {
        return (parseInt(count_white_queen) - parseInt(count_black_queen)) + (parseInt(count_white_simple) - parseInt(count_black_simple)) + (parseInt(count_success_next_move_white) - parseInt(count_success_next_move_black)) + parseInt(distance_to_last_line);
    }

    let temp = null;

    function stepComputer(new_piece) {
        if(COMPUTER_LEVEL === "low") {
            let simples = getAllSimpleCells("black");
            let queens = getAllQueenCells("black");

            // приоритет на дамок
            if (queens.length > 0) {
                // но сначала глянь есть ли враги у простых шашек
                    //руби обычной
                // ходи дамкой

            }
            else if(simples.length > 0) {
                let arEmptySteps = [];

                let arNeedStepFotAttack = [];
                let needAttack = false;
                simples.forEach(function (value) {
                    // need attack

                    if (value[0].upright.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }
                    if (value[0].upleft.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }
                    if (value[0].bottomright.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }
                    if (value[0].bottomleft.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }

                    // empties

                    if (value[0].upright.empty.length > 0) {
                        arEmptySteps.push(value[0]);
                    }

                    if (value[0].upleft.empty.length > 0) {
                        arEmptySteps.push(value[0]);
                    }

                    if (value[0].bottomright.empty.length > 0) {
                        arEmptySteps.push(value[0]);
                    }

                    if (value[0].bottomleft.empty.length > 0) {
                        arEmptySteps.push(value[0]);
                    }
                });

                if(needAttack) {
                    let arNeedStepUpRight = [];
                    let arNeedStepUpLeft = [];
                    let arNeedStepBottomRight = [];
                    let arNeedStepBottomLeft = [];

                    let arEnemyUpRight = [];
                    let arEnemyUpLeft = [];
                    let arEnemyBottomRight = [];
                    let arEnemyBottomLeft = [];

                    let targets = [];

                    for(let i = 0; i < arNeedStepFotAttack.length; i++) {
                        let target = [];

                        for (let prop in arNeedStepFotAttack[i]) {
                            if (prop === "upright") {
                                if (arNeedStepFotAttack[i][prop].needStep.length > 0) {
                                    arNeedStepUpRight.push(arNeedStepFotAttack[i][prop].needStep)
                                }
                                if (arNeedStepFotAttack[i][prop].enemy.length > 0) {
                                    arEnemyUpRight.push(arNeedStepFotAttack[i][prop].enemy)
                                }

                                if (arNeedStepUpRight.length > 0 && arEnemyUpRight.length > 0) {
                                    target = [{
                                        upright: {
                                            current: arNeedStepFotAttack[i]["currentpiece"],
                                            enemy: arEnemyUpRight,
                                            next: arNeedStepUpRight
                                        }
                                    }]
                                }
                            }
                            if (prop === "upleft") {

                                if (arNeedStepFotAttack[i][prop].needStep.length > 0) {
                                    arNeedStepUpLeft.push(arNeedStepFotAttack[i][prop].needStep)
                                }

                                if (arNeedStepFotAttack[i][prop].enemy.length > 0) {
                                    arEnemyUpLeft.push(arNeedStepFotAttack[i][prop].enemy)
                                }

                                if (arNeedStepUpLeft.length > 0 && arEnemyUpLeft.length > 0) {
                                    target = [{
                                        upleft: {
                                            current: arNeedStepFotAttack[i]["currentpiece"],
                                            enemy: arEnemyUpLeft,
                                            next: arNeedStepUpLeft
                                        }
                                    }]
                                }
                            }
                            if (prop === "bottomright") {

                                if (arNeedStepFotAttack[i][prop].needStep.length > 0) {
                                    arNeedStepBottomRight.push(arNeedStepFotAttack[i][prop].needStep)
                                }

                                if (arNeedStepFotAttack[i][prop].enemy.length > 0) {
                                    arEnemyBottomRight.push(arNeedStepFotAttack[i][prop].enemy)
                                }

                                if (arNeedStepBottomRight.length > 0 && arEnemyBottomRight.length > 0) {
                                    target = [{
                                        bottomright: {
                                            current: arNeedStepFotAttack[i]["currentpiece"],
                                            enemy: arEnemyBottomRight,
                                            next: arNeedStepBottomRight
                                        }
                                    }]
                                }
                            }
                            if (prop === "bottomleft") {

                                if (arNeedStepFotAttack[i][prop].needStep.length > 0) {
                                    arNeedStepBottomLeft.push(arNeedStepFotAttack[i][prop].needStep)
                                }

                                if (arNeedStepFotAttack[i][prop].enemy.length > 0) {
                                    arEnemyBottomLeft.push(arNeedStepFotAttack[i][prop].enemy)
                                }

                                if (arNeedStepBottomLeft.length > 0 && arEnemyBottomLeft.length > 0) {
                                    target = [{
                                        bottomleft: {
                                            current: arNeedStepFotAttack[i]["currentpiece"],
                                            enemy: arEnemyBottomLeft,
                                            next: arNeedStepBottomLeft
                                        }
                                    }]
                                }
                            }

                        }

                        targets.push(target);
                    }

                    let ind = randomInteger(0, targets.length - 1);
                    targets[ind].forEach(function (value) {
                        if(typeof value.upright !== "undefined"){
                            simple_attack(value.upright.current, value.upright.enemy[0][0][0], value.upright.next[0][0][0]);
                        }
                        if(typeof value.upleft !== "undefined"){
                            simple_attack(value.upleft.current, value.upleft.enemy[0][0][0], value.upleft.next[0][0][0]);
                        }
                        if(typeof value.bottomright !== "undefined"){
                            simple_attack(value.bottomright.current, value.bottomright.enemy[0][0][0], value.bottomright.next[0][0][0]);
                        }
                        if(typeof value.bottomleft !== "undefined"){
                            simple_attack(value.bottomleft.current, value.bottomleft.enemy[0][0][0], value.bottomleft.next[0][0][0]);
                        }
                    })

                }
                else {
                    //step
                    let ind = randomInteger(0, arEmptySteps.length - 1);
                    let current = arEmptySteps[ind].currentpiece;

                    let next = [];

                    if(arEmptySteps[ind].upright.empty.length > 0) {
                        next.push(arEmptySteps[ind].upright.empty[0][0])
                    }
                    if(arEmptySteps[ind].upleft.empty.length > 0) {
                        next.push(arEmptySteps[ind].upleft.empty[0][0])
                    }
                    if(arEmptySteps[ind].bottomright.empty.length > 0) {
                        next.push(arEmptySteps[ind].bottomright.empty[0][0])
                    }
                    if(arEmptySteps[ind].bottomleft.empty.length > 0) {
                        next.push(arEmptySteps[ind].bottomleft.empty[0][0])
                    }

                    next = next[randomInteger(0, next.length - 1)];

                    simple_attack(current, null, next);

                }
            }
            else {
                //game over
            }

        }
        else  if(COMPUTER_LEVEL === "medium") {
            let count_white_queen = 0, count_black_queen = 0,
                count_white_simple = 0, count_black_simple = 0,
                count_success_next_move_white = 0, count_success_next_move_black = 0,
                distance_to_last_line = 0;

            let new_x = new_piece.getAttribute("x");
            let new_y = new_piece.getAttribute("y");

            new_piece = $('.rank__check[x=' + new_x + '][y=' + new_y + ']')[0];
            console.log("computer step");

            let simples = getAllSimpleCells("black");
            let queens = getAllQueenCells("black");

            let simples_enemy = getAllSimpleCells("white");
            let queens_enemy = getAllQueenCells("white");

            // приоритет на дамок
            if (queens.length > 0) {
                // но сначала глянь есть ли враги у простых шашек
                //руби обычной
                // ходи дамкой

            }
            else if (simples.length > 0) {
                // сначала проверить на наличие врагов

                let arNeedStepFotAttack = [];
                let needAttack = false;
                simples.forEach(function (value) {
                    if (value[0].upright.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }

                    if (value[0].upleft.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }

                    if (value[0].bottomright.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }

                    if (value[0].bottomleft.needStep.length > 0) {
                        needAttack = true;
                        arNeedStepFotAttack.push(value[0]);
                    }
                });

                if (needAttack) {
                    console.log("computer need attack");
                    let prev = []; // currentPiece
                    let enemy = []; // enemy for currentPiece
                    let next = []; //needStep

                    // let index_next = randomInteger(0, arNeedStepFotAttack.length - 1);

                    for (let i = 0; i < arNeedStepFotAttack.length; i++) {
                        prev = [];
                        enemy = [];
                        next = [];

                        for (let prop in arNeedStepFotAttack[i]) {
                            if (prop === "upright" || prop === "upleft" || prop === "bottomright" || prop === "bottomleft") {

                                if (arNeedStepFotAttack[i][prop].needStep.length > 0) {
                                    next.push(arNeedStepFotAttack[i][prop].needStep);
                                }

                                if (arNeedStepFotAttack[i][prop].enemy.length > 0) {
                                    enemy.push(arNeedStepFotAttack[i][prop].enemy);
                                }
                            }
                            else if (prop === "currentpiece") {
                                prev.push(arNeedStepFotAttack[i][prop]);
                            }
                        }

                        let current_situation = getOneSimpleCells("black", $(next)[0][0][0], prev);
                        let isDanger = 0;

                        current_situation.forEach(function (value) {
                            if (value[0].upright.danger.length > 0) {
                                isDanger = 1;
                            }
                            if (value[0].upleft.danger.length > 0) {
                                isDanger = 1;
                            }
                            if (value[0].bottomright.danger.length > 0) {
                                isDanger = 1;
                            }
                            if (value[0].bottomleft.danger.length > 0) {
                                isDanger = 1;
                            }
                        });

                        let next_potencial_cells = [];
                        simples.forEach(function (value) {
                            if (value[0].bottomright.empty.length > 0) {
                                value[0].bottomright.empty.forEach(function (val_e) {
                                    next_potencial_cells.push(val_e);
                                })
                            }

                            if (value[0].bottomleft.empty.length > 0) {
                                value[0].bottomleft.empty.forEach(function (val_e) {
                                    next_potencial_cells.push(val_e);
                                })
                            }
                        });
                        let next_potencial_cells_enemy = [];
                        simples_enemy.forEach(function (value) {
                            if (value[0].upright.empty.length > 0) {
                                value[0].upright.empty.forEach(function (val_e) {
                                    next_potencial_cells_enemy.push(val_e);
                                })
                            }

                            if (value[0].upleft.empty.length > 0) {
                                value[0].upleft.empty.forEach(function (val_e) {
                                    next_potencial_cells_enemy.push(val_e);
                                })
                            }
                        });


                        count_black_simple = simples.length;
                        count_white_simple = simples_enemy.length;

                        count_success_next_move_white = next_potencial_cells.length;
                        count_success_next_move_black = next_potencial_cells_enemy.length;

                        let mark = markFunction(count_white_queen, count_black_queen,
                            count_white_simple, count_black_simple,
                            count_success_next_move_white, count_success_next_move_black, isDanger);

                        console.log(current_situation);

                        console.log(mark);
                    }
                }
                else {

                    let next_potencial_cells = [];
                    simples.forEach(function (value) {
                        if (value[0].bottomright.empty.length > 0) {
                            value[0].bottomright.empty.forEach(function (val_e) {
                                next_potencial_cells.push(val_e);
                            })
                        }

                        if (value[0].bottomleft.empty.length > 0) {
                            value[0].bottomleft.empty.forEach(function (val_e) {
                                next_potencial_cells.push(val_e);
                            })
                        }
                    });
                    let next_potencial_cells_enemy = [];
                    simples_enemy.forEach(function (value) {
                        if (value[0].upright.empty.length > 0) {
                            value[0].upright.empty.forEach(function (val_e) {
                                next_potencial_cells_enemy.push(val_e);
                            })
                        }

                        if (value[0].upleft.empty.length > 0) {
                            value[0].upleft.empty.forEach(function (val_e) {
                                next_potencial_cells_enemy.push(val_e);
                            })
                        }
                    });


                    count_black_simple = simples.length;
                    count_white_simple = simples_enemy.length;

                    count_success_next_move_white = next_potencial_cells.length;
                    count_success_next_move_black = next_potencial_cells_enemy.length;

                    distance_to_last_line = new_y;


                    let mark = markFunction(count_white_queen, count_black_queen,
                        count_white_simple, count_black_simple,
                        count_success_next_move_white, count_success_next_move_black, distance_to_last_line);

                    console.log(mark);
                }
            }
            else {
                //game over
            }
        }
        else if(COMPUTER_LEVEL === "high") {

        }

    }

    function simple_attack(prev, enemy = null, next) {
        let color = prev.firstElementChild.classList.contains("black");

        $(prev.firstElementChild).remove();

        if(enemy !== null) {
            $(enemy.firstElementChild).remove();
        }

        if(color) {
            $(next).append('<div class="piece black">&#9820;</div>');
        }
        else {
            $(next).append('<div class="piece white">&#9814;</div>');
        }

    }

});
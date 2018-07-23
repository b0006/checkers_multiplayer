
(function () {
    
    WinJS.UI.processAll().then(function () {
      
        let socket, serverGame;
        let username, playerColor;
        let game, board;
        let usersOnline = [];
        let myGames = [];
        let player = "white"; //the first player
        socket = io();

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

        socket.on('resign', function(msg) {
        if (msg.gameId == serverGame.id) {

              socket.emit('login', username);

              $('#page-lobby').show();
              $('#page-game').hide();
            }
        });

        socket.on('joingame', function(msg) {

            console.log("joined as game id: " + msg.game.id );
            playerColor = msg.color;
            initGame(msg.game);

            $('#page-lobby').hide();
            $('#page-game').show();

        });

        function findIndexInData(data, property, value) {
            for(let i = 0, l = data.length ; i < l ; i++) {
                if(data[i][property] === value) {
                    return i;
                }
            }
            return -1;
        }

        socket.on('step', function (msg) {
            if (serverGame && msg.gameId === serverGame.id) {

                let next = $(".rank__check[x="+ msg.next.x +"][y="+ msg.next.y +"]"); // куда был сделан ход
                let prev = $(".rank__check[x="+ msg.prev.x +"][y="+ msg.prev.y +"]"); // предыдущее место, которое нужно "очистить"

                if(playerColor === "black") {
                    next.append('<div class="piece white">&#9814;</div>');
                    prev[0].firstElementChild.remove();
                }
                else if(playerColor === "white") {
                    next.append('<div class="piece black">&#9820;</div>');
                    prev[0].firstElementChild.remove();
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

        socket.on('attack', function (msg) {
            if (serverGame && msg.gameId === serverGame.id) {
                let next = $(".rank__check[x="+ msg.next.x +"][y="+ msg.next.y +"]"); // куда был сделан ход
                let prev = $(".rank__check[x="+ msg.prev.x +"][y="+ msg.prev.y +"]"); // предыдущее место, которое нужно "очистить"
                let target = $(".rank__check[x="+ msg.target.x +"][y="+ msg.target.y +"]"); // цель, которую нужно "очистить"


                console.log(prev);
                console.log(target);
                console.log(next);

                if(playerColor === "black") {
                    next.append('<div class="piece white">&#9814;</div>');
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
                }
                else if(playerColor === "white") {
                    next.append('<div class="piece black">&#9820;</div>');
                    prev[0].firstElementChild.remove();
                    target[0].firstElementChild.remove();
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

      socket.on('move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
           game.move(msg.move);
           board.position(game.fen());
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
      
      $('#game-resign').on('click', function() {
        socket.emit('resign', {userId: username, gameId: serverGame.id});
        
        socket.emit('login', username);
        $('#page-game').hide();
        $('#page-lobby').show();
      });
      
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
                        .text(user)
                        .on('click', function() {
                          socket.emit('invite',  user);
                        }));
        });
      };
           
      //////////////////////////////
      // Checkers Game
      ////////////////////////////// 
      
      let initGame = function (serverGameState) {
          serverGame = serverGameState;

          // if(playerColor === "black") {
          //     $('.board').css({transform : "rotate(180deg)"})
          // }

          // console.log(serverGame);
              //transform: rotate(180deg);
        
          // var cfg = {
          //   draggable: true,
          //   showNotation: false,
          //   orientation: playerColor,
          //   position: serverGame.board ? serverGame.board : 'start',
          //   onDragStart: onDragStart,
          //   onDrop: onDrop,
          //   onSnapEnd: onSnapEnd
          // };
              //
          //game = serverGame.board ? new Chess(serverGame.board) : new Chess();
          //board = new ChessBoard('game-board', cfg);

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
                          rank__check.setAttribute("x", t);
                          rank__check.setAttribute("y", i);
                      }
                  }

                  if(i % 2 !== 0) {
                      if (t % 2 === 0) {
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
                              piece.innerHTML = "&#9820;";;
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


      };

        //socket.emit('step', {gameId: serverGame.id});

        let current_script = document.querySelector('script[src*="script.js"]');

        // PP - Player vs Player
        // CP - Computer vs Player
        // AUTO - Computer vs Computer
        // const MODE_GAME = current_script.getAttribute("mode-game");
        const MODE_GAME = "PP";

        // LOW
        // MEDIUM
        // HARD
        // const COMPUTER_LEVEL = current_script.getAttribute("game-level");
        const COMPUTER_LEVEL = "low";

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

        function isPotencialCellBlack(current_x, current_y, potencial_x, potencial_y) {
            if ((current_x - potencial_x === 1) && (current_y - potencial_y === -1) ||
                (current_x - potencial_x === -1) && (current_y - potencial_y === -1)
            ) {
                return true;
            }
            else {
                return false;
            }
        }

        function isPotencialCellWhite(current_x, current_y, potencial_x, potencial_y) {
            if ((current_x - potencial_x === -1) && (current_y - potencial_y === 1) ||
                (current_x - potencial_x === 1) && (current_y - potencial_y === 1)
            ) {
                return true;
            }
            else {
                return false;
            }
        }

        // COMPUTER LOGIC
        function getPosibleBlackPieces() {
            const rank__check = $(".rank__check");

            let arBlackPieces = [];

            let arEmptyPieces = [];

            let rank__check_x = null;
            let rank__check_y = null;

            rank__check.each(function(index, value) {
                if(isMoviableCell(value)){
                    try {
                        rank__check_x = value.getAttribute("x");
                        rank__check_y = value.getAttribute("y");

                        //get empty
                        if(value.hasChildNodes() === false) {
                            arEmptyPieces.push({
                                value : value,
                                rank__check_x : rank__check_x,
                                rank__check_y : rank__check_y,
                                type : "empty",
                            });
                        }

                        //get black
                        if(value.firstElementChild.classList.contains("black")){
                            arBlackPieces.push({
                                value : value,
                                rank__check_x : rank__check_x,
                                rank__check_y : rank__check_y,
                                type : "black",
                            });
                        }
                    }
                    catch (e){}
                }
            });

            let black_x = null;
            let black_y = null;

            let empty_x = null;
            let empty_y = null;

            // get good coord for next step without loose checkers
            let arGoodEmptyForNextStep = [];

            arBlackPieces.forEach(function (value_b, index_b) {
                black_x = value_b.rank__check_x;
                black_y = value_b.rank__check_y;

                arEmptyPieces.forEach(function (value_e, index_e) {
                    empty_x = value_e.rank__check_x;
                    empty_y = value_e.rank__check_y;

                    if(isPotencialCellBlack(black_x, black_y, empty_x, empty_y)) {
                        arGoodEmptyForNextStep.push({
                            current_piece : value_b.value,
                            next_piece : value_e.value,
                        })
                    }
                })
            });

            return arGoodEmptyForNextStep;

        }

        // COMPUTER LOGIC

        function getNeighborCell() {
            const rank__check = $(".rank__check");

            let arBlackPieces = [];
            let arWhitePieces = [];
            let arEmptyPieces = [];

            rank__check.each(function(index, value) {
                if(isMoviableCell(value)){
                    if(value.hasChildNodes()) {
                        if(value.firstElementChild.classList.contains("black")) {
                            arBlackPieces.push(value);
                        }
                        else if(value.firstElementChild.classList.contains("white")) {
                            arWhitePieces.push(value);
                        }
                    }
                    else {
                        arEmptyPieces.push(value);
                    }
                }
            });

            let arPotencialEnemy = [];

            let black_x = null;
            let black_y = null;

            let pot_enemy_bottom_left_x = null;
            let pot_enemy_bottom_left_y = null;

            let pot_enemy_bottom_right_x = null;
            let pot_enemy_bottom_right_y = null;

            let pot_enemy_up_left_x = null;
            let pot_enemy_up_left_y = null;

            let pot_enemy_up_right_x = null;
            let pot_enemy_up_right_y = null;

            // смотрим в глубину = 2 MEDIUM

            if(COMPUTER_LEVEL === "medium") {
                // medium
            }

            // medium
            arBlackPieces.forEach(function (value_b, index_b) {
                black_x = value_b.getAttribute("x");
                black_y = value_b.getAttribute("y");

                pot_enemy_bottom_left_x = parseInt(black_x) - 1;
                pot_enemy_bottom_left_y = parseInt(black_y) + 1;

                pot_enemy_bottom_right_x = parseInt(black_x) + 1;
                pot_enemy_bottom_right_y = parseInt(black_y) + 1;

                pot_enemy_up_left_x = parseInt(black_x) - 1;
                pot_enemy_up_left_y = parseInt(black_y) - 1;

                pot_enemy_up_right_x = parseInt(black_x) + 1;
                pot_enemy_up_right_y = parseInt(black_y) - 1;

                let potencial_enemy_bottom_left = $(".rank__check[x=" + pot_enemy_bottom_left_x + "][y=" + pot_enemy_bottom_left_y + "]");
                let potencial_enemy_bottom_right = $(".rank__check[x=" + pot_enemy_bottom_right_x + "][y=" + pot_enemy_bottom_right_y + "]");
                let potencial_enemy_up_left = $(".rank__check[x=" + pot_enemy_up_left_x + "][y=" + pot_enemy_up_left_y + "]");
                let potencial_enemy_up_right = $(".rank__check[x=" + pot_enemy_up_right_x + "][y=" + pot_enemy_up_right_y + "]");

                arPotencialEnemy[index_b] = {
                    current_piece : value_b,
                    potencial_enemy_bottom_left : potencial_enemy_bottom_left[0],
                    potencial_enemy_bottom_right : potencial_enemy_bottom_right[0],
                    potencial_enemy_up_left : potencial_enemy_up_left[0],
                    potencial_enemy_up_right : potencial_enemy_up_right[0]
                }

            });

            return arPotencialEnemy;
        }

        // computer logic (есть ли поблизости враги)
        function isEnemyForBlack(value) {

            let pot_x = null;
            let pot_y = null;

            let needAttack = null;

            let potencial_enemy_bottom_left = value.potencial_enemy_bottom_left;
            if(typeof potencial_enemy_bottom_left !== 'undefined') {

                if (potencial_enemy_bottom_left.hasChildNodes()) {
                    if (potencial_enemy_bottom_left.firstElementChild.classList.contains("white")) {

                        pot_x = parseInt(potencial_enemy_bottom_left.getAttribute("x")) - 1;
                        pot_y = parseInt(potencial_enemy_bottom_left.getAttribute("y")) + 1;

                        needAttack = $(".rank__check[x=" + pot_x + "][y=" + pot_y + "]");

                        try {
                            if (needAttack[0].hasChildNodes()) {
                                if (needAttack[0].firstElementChild.classList.contains("white")) {
                                    return {
                                        enemy: potencial_enemy_bottom_left,
                                        value: value.current_piece,
                                        needAttack: false,
                                    };
                                }
                                else if (needAttack[0].firstElementChild.classList.contains("black")) {
                                    return {
                                        enemy: potencial_enemy_bottom_left,
                                        value: value.current_piece,
                                        needAttack: false
                                    };
                                }
                            }
                            else {
                                return {
                                    enemy: potencial_enemy_bottom_left,
                                    value: value.current_piece,
                                    needAttack: true,
                                    targetAttack: needAttack
                                };
                            }
                        }catch(e) {}

                    }
                    else {
                        return false;
                    }
                }
            }

            let potencial_enemy_bottom_right = value.potencial_enemy_bottom_right;

            if(typeof potencial_enemy_bottom_right !== 'undefined') {

                if (potencial_enemy_bottom_right.hasChildNodes()) {
                    if (potencial_enemy_bottom_right.firstElementChild.classList.contains("white")) {
                        pot_x = parseInt(potencial_enemy_bottom_right.getAttribute("x")) + 1;
                        pot_y = parseInt(potencial_enemy_bottom_right.getAttribute("y")) + 1;

                        needAttack = $(".rank__check[x=" + pot_x + "][y=" + pot_y + "]");

                        try {
                            if (needAttack[0].hasChildNodes()) {
                                if (needAttack[0].firstElementChild.classList.contains("white")) {
                                    return {
                                        enemy: potencial_enemy_bottom_right,
                                        value: value.current_piece,
                                        needAttack: false,
                                    };
                                }
                                else if (needAttack[0].firstElementChild.classList.contains("black")) {
                                    return {
                                        enemy: potencial_enemy_bottom_right,
                                        value: value.current_piece,
                                        needAttack: false
                                    };
                                }
                            }
                            else {
                                return {
                                    enemy: potencial_enemy_bottom_right,
                                    value: value.current_piece,
                                    needAttack: true,
                                    targetAttack: needAttack
                                };
                            }
                        }catch (e) {}
                    }
                    else {
                        return false;
                    }
                }
            }


            let potencial_enemy_up_left = value.potencial_enemy_up_left;
            if(typeof potencial_enemy_up_left !== 'undefined') {

                if (potencial_enemy_up_left.hasChildNodes()) {
                    if (potencial_enemy_up_left.firstElementChild.classList.contains("white")) {
                        pot_x = parseInt(potencial_enemy_up_left.getAttribute("x")) - 1;
                        pot_y = parseInt(potencial_enemy_up_left.getAttribute("y")) - 1;

                        needAttack = $(".rank__check[x=" + pot_x + "][y=" + pot_y + "]");

                        try {
                            if (needAttack[0].hasChildNodes()) {
                                if (needAttack[0].firstElementChild.classList.contains("white")) {
                                    return {
                                        enemy: potencial_enemy_up_left,
                                        value: value.current_piece,
                                        needAttack: false,
                                    };
                                }
                                else if (needAttack[0].firstElementChild.classList.contains("black")) {
                                    return {
                                        enemy: potencial_enemy_up_left,
                                        value: value.current_piece,
                                        needAttack: false
                                    };
                                }
                            }
                            else {
                                return {
                                    enemy: potencial_enemy_up_left,
                                    value: value.current_piece,
                                    needAttack: true,
                                    targetAttack: needAttack
                                };
                            }
                        }catch (e) {}
                    }
                    else {
                        return false;
                    }
                }

            }

            let potencial_enemy_up_right = value.potencial_enemy_up_right;

            if(typeof potencial_enemy_up_right !== 'undefined') {

                if (potencial_enemy_up_right.hasChildNodes()) {
                    if (potencial_enemy_up_right.firstElementChild.classList.contains("white")) {
                        pot_x = parseInt(potencial_enemy_up_right.getAttribute("x")) + 1;
                        pot_y = parseInt(potencial_enemy_up_right.getAttribute("y")) - 1;

                        needAttack = $(".rank__check[x=" + pot_x + "][y=" + pot_y + "]");

                        try {
                            if (needAttack[0].hasChildNodes()) {
                                if (needAttack[0].firstElementChild.classList.contains("white")) {
                                    return {
                                        enemy: potencial_enemy_up_right,
                                        value: value.current_piece,
                                        needAttack: false,
                                    };
                                }
                                else if (needAttack[0].firstElementChild.classList.contains("black")) {
                                    return {
                                        enemy: potencial_enemy_up_right,
                                        value: value.current_piece,
                                        needAttack: false
                                    };
                                }
                            }
                            else {
                                return {
                                    enemy: potencial_enemy_up_right,
                                    value: value.current_piece,
                                    needAttack: true,
                                    targetAttack: needAttack
                                };
                            }
                        } catch (e) {}
                    }
                    else {
                        return false;
                    }
                }
            }

            return false;
        }

        function isFriendForBlack(value) {

            let potencial_friend_bottom_left = value.potencial_enemy_bottom_left;
            if(typeof potencial_friend_bottom_left !== 'undefined') {

                if (potencial_friend_bottom_left.hasChildNodes()) {
                    if (potencial_friend_bottom_left.firstElementChild.classList.contains("black")) {
                        return potencial_friend_bottom_left;
                    }
                    else {
                        return false;
                    }
                }
            }

            let potencial_friend_bottom_right = value.potencial_enemy_bottom_right;

            if(typeof potencial_friend_bottom_right !== 'undefined') {

                if (potencial_friend_bottom_right.hasChildNodes()) {
                    if (potencial_friend_bottom_right.firstElementChild.classList.contains("black")) {
                        return potencial_friend_bottom_right;
                    }
                    else {
                        return false;
                    }
                }
            }


            let potencial_friend_up_left = value.potencial_enemy_up_left;
            if(typeof potencial_friend_up_left !== 'undefined') {

                if (potencial_friend_up_left.hasChildNodes()) {
                    if (potencial_friend_up_left.firstElementChild.classList.contains("black")) {
                        return potencial_friend_up_left;
                    }
                    else {
                        return false;
                    }
                }

            }

            let potencial_friend_up_right = value.potencial_enemy_up_right;

            if(typeof potencial_friend_up_right !== 'undefined') {

                if (potencial_friend_up_right.hasChildNodes()) {
                    if (potencial_friend_up_right.firstElementChild.classList.contains("black")) {
                        return potencial_friend_up_right;
                    }
                    else {
                        return false;
                    }
                }
            }

            return false;
        }

        function getPosibleWhitePieces() {
            const rank__check = $(".rank__check");

            let arWhitePieces = [];

            let arEmptyPieces = [];

            let rank__check_x = null;
            let rank__check_y = null;

            rank__check.each(function(index, value) {
                if(isMoviableCell(value)){

                    try {

                        rank__check_x = value.getAttribute("x");
                        rank__check_y = value.getAttribute("y");

                        //get empty
                        if(value.hasChildNodes() === false) {
                            arEmptyPieces.push({
                                rank__check_x : rank__check_x,
                                rank__check_y : rank__check_y,
                                type : "empty",
                            });
                        }

                        //get white
                        else if(value.firstElementChild.classList.contains("white")) {
                            arWhitePieces.push({
                                rank__check_x : rank__check_x,
                                rank__check_y : rank__check_y,
                                type : "white",
                            });
                        }

                    }
                    catch (e){}

                }
            });

            let white_x = null;
            let white_y = null;

            let empty_x = null;
            let empty_y = null;

            // get good coord for next step without loose checkers
            let arGoodEmptyForNextStep = [];

            arWhitePieces.forEach(function (value_b, index_b) {
                white_x = value_b.rank__check_x;
                white_y = value_b.rank__check_y;

                arEmptyPieces.forEach(function (value_e, index_e) {
                    empty_x = value_e.rank__check_x;
                    empty_y = value_e.rank__check_y;

                    if(isPotencialCellWhite(white_x, white_y, empty_x, empty_y)) {
                        arGoodEmptyForNextStep.push({
                            empty_x : empty_x,
                            empty_y : empty_y,
                            x: white_x,
                            y : white_y
                        })
                    }
                })
            });

            return arGoodEmptyForNextStep;


        }


        function randomInteger(min, max) {
            var rand = min - 0.5 + Math.random() * (max - min + 1)
            rand = Math.round(rand);
            return rand;
        }

        function stepComputer() {

            let arPotencialEnemy = getNeighborCell();

            let arNeedAtack = [];

            arPotencialEnemy.forEach(function (value, index) {
                let isEnemy = isEnemyForBlack(value);
                let isFriend = isFriendForBlack(value);



                if(isEnemy) {
                    // проверить, можно ли ее рубить
                    // или нет
                    if(isEnemy.needAttack) {
                        // attack
                        arNeedAtack.push(isEnemy);
                    }
                }
            });


            // компьютер атакует
            if(arNeedAtack.length > 0) {
                let nextAttack = randomInteger(0, arNeedAtack.length - 1);
                // прыжок (рубит)
                $(arNeedAtack[nextAttack].targetAttack).append('<div class="piece black">&#9820;</div>');

                // удаляет срубленную шашку и саму себя на предыдущем месте
                $(arNeedAtack[nextAttack].enemy.firstElementChild).remove();
                $(arNeedAtack[nextAttack].value.firstElementChild).remove()
            }
            // иначе ходи
            else {
                // если легкий уровень, то потенциальная клетка для след хода
                // если средний уровень, то проверить на наличие врага
                // если высокий уровень, то проверить все варианты

                let arGoodEmptyForNextStep = getPosibleBlackPieces();

                if(COMPUTER_LEVEL === "low") {
                    let next_cell = randomInteger(0, arGoodEmptyForNextStep.length - 1);

                    //step

                    $(arGoodEmptyForNextStep[next_cell].next_piece).append('<div class="piece black">&#9820;</div>');
                    $(arGoodEmptyForNextStep[next_cell].current_piece.firstElementChild).remove();

                }
                else if(COMPUTER_LEVEL === "medium") {
                    let current_x = null;
                    let current_y = null;

                    let next_piece_x = null;
                    let next_piece_y = null;

                    let pot_enemy_up_left_x = null;
                    let pot_enemy_up_left_y = null;
                    let pot_enemy_up_right_x = null;
                    let pot_enemy_up_right_y = null;
                    let pot_enemy_bottom_left_x = null;
                    let pot_enemy_bottom_left_y = null;
                    let pot_enemy_bottom_right_x = null;
                    let pot_enemy_bottom_right_y = null;
                    let pot_enemy = null;

                    // console.log(arGoodEmptyForNextStep);

                    arGoodEmptyForNextStep.forEach(function (value, index) {
                        current_x = parseInt(value.current_piece.getAttribute("x"));
                        current_y = parseInt(value.current_piece.getAttribute("y"));

                        next_piece_x = parseInt(value.next_piece.getAttribute("x"));
                        next_piece_y = parseInt(value.next_piece.getAttribute("y"));


                        // bottom right
                        if((current_x - next_piece_x === -1) && (current_y - next_piece_y === -1)) {
                            next_piece_x = next_piece_x + 1;
                            next_piece_y = next_piece_y + 1;

                            pot_enemy = $('.rank__check[x=' + next_piece_x + '][y='+ next_piece_y +']');

                            if(pot_enemy[0].hasChildNodes()) {
                                if(pot_enemy[0].firstElementChild.classList.contains("white")) {
                                    console.log("не ходи так лучше");
                                    // console.log(value);
                                }
                                else if(pot_enemy[0].firstElementChild.classList.contains("black")) {
                                    console.log("так можешь ходить");
                                    // console.log(value);
                                }

                            }
                            else {
                                console.log("так можешь ходить");
                                // console.log(value);
                            }

                        }
                        // bottom left
                        if((current_x - next_piece_x === 1) && (current_y - next_piece_y === -1)) {
                            next_piece_x = next_piece_x - 1;
                            next_piece_y = next_piece_y + 1;

                            pot_enemy = $('.rank__check[x=' + next_piece_x + '][y='+ next_piece_y +']');

                            if(pot_enemy.length > 0) {

                                if (pot_enemy[0].hasChildNodes()) {
                                    if (pot_enemy[0].firstElementChild.classList.contains("white")) {
                                        console.log("не ходи так лучше");
                                        // console.log(value);
                                    }
                                    else if (pot_enemy[0].firstElementChild.classList.contains("black")) {
                                        console.log("так можешь ходить");
                                        // console.log(value);
                                    }

                                }
                                else {
                                    console.log("так можешь ходить");
                                    // console.log(value);
                                }
                            }
                        }
                    })
                }
                else if(COMPUTER_LEVEL === "high") {

                }
            }


            // try {
            //     console.log("stepComputer");
            //
            //     let arGoodEmptyForNextStep = getPosibleBlackPieces();
            //     let countGoodStep = arGoodEmptyForNextStep.length - 1;
            //     let nextStepComputer = randomInteger(0, countGoodStep);
            //
            //     let x = arGoodEmptyForNextStep[nextStepComputer]["x"];
            //     let y = arGoodEmptyForNextStep[nextStepComputer]["y"];
            //
            //     let next_x = arGoodEmptyForNextStep[nextStepComputer]["empty_x"];
            //     let next_y = arGoodEmptyForNextStep[nextStepComputer]["empty_y"];
            //
            //     let current_cell = $(".rank__check[x=" + x + "][y=" + y + "]");
            //     let next_cell = $(".rank__check[x=" + next_x + "][y=" + next_y + "]");
            //
            //     // remove current piece
            //     current_cell[0].firstElementChild.remove();
            //
            //     // add new piece
            //     next_cell.append('<div class="piece black">&#9820;</div>');
            // }
            // catch(e_comp){}



        }

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

            // check player

            // if(player !== currentPlayer) {
            //     alert("Сейчас ходит " + player);
            //     return false;
            // }

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

            // get all pieces
            let allPiece = document.querySelectorAll('.rank__check');

            let arPotencialWhite = [];
            let isWhiteNeedAttack = [];

            let arPotencialBlack = [];
            let isBlackNeedAttack = [];

            for(let i = 0; i < allPiece.length; i++) {
                // remove from all pieces potencial style cell
                $(allPiece[i]).removeClass("over");

                if(isMoviableCell(allPiece[i])){


                    // get for white next step
                    if(current_piece.classList.contains("white")) {
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
                                            // get next step
                                            // arPotencialWhite.push(piece_for_attack);

                                            isWhiteNeedAttack.push({
                                                enemy: allPiece[i],
                                                target: piece_for_attack,
                                                isAttack: true
                                            });

                                            isHasEnemy = true;
                                        }
                                    }
                                    catch(piece_for_e) {}
                                }
                            }
                            else {
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
                                            // get next step
                                            // arPotencialWhite.push(piece_for_attack);

                                            isWhiteNeedAttack.push({
                                                enemy: allPiece[i],
                                                target: piece_for_attack,
                                                isAttack: true
                                            });

                                            isHasEnemy = true;
                                        }
                                    }
                                    catch(piece_for_e) {}

                                }
                            }
                            else {
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
                                            // get next step
                                            // arPotencialWhite.push(piece_for_attack);

                                            isWhiteNeedAttack.push({
                                                enemy: allPiece[i],
                                                target: piece_for_attack,
                                                isAttack: true
                                            });

                                            isHasEnemy = true;
                                        }
                                    }
                                    catch(piece_for_e) {}
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
                                            // get next step
                                            // arPotencialWhite.push(piece_for_attack);

                                            isWhiteNeedAttack.push({
                                                enemy: allPiece[i],
                                                target: piece_for_attack,
                                                isAttack: true
                                            });

                                            isHasEnemy = true;
                                        }
                                    }
                                    catch(piece_for_e) {}
                                }
                            }
                        }
                    }

                    if(current_piece.classList.contains("black")) {
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
                                    catch(piece_for_e){}
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
                                    catch(piece_for_e){}

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
                                    catch(piece_for_e){}
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
                                    catch(piece_for_e){}
                                }
                            }
                        }
                    }


                }


                // get rank__check without piece
                // if(!allPiece[i].hasChildNodes()) {
                //     // if isset coordinates
                //     if(allPiece[i].getAttribute("x")) {
                //         potencial_x = allPiece[i].getAttribute("x");
                //         potencial_y = allPiece[i].getAttribute("y");
                //
                //         if(e.target.classList.contains('black')) {
                //
                //             // get next success cells
                //             if (isPotencialCellBlack(piece_x, piece_y, potencial_x, potencial_y)) {
                //
                //                 // set active class to current piece
                //                 $(e.target).addClass("active");
                //
                //                 let rank_check = allPiece[i];
                //
                //                 $(rank_check).addClass("over");
                //             }
                //         }
                //         else if(e.target.classList.contains('white')) {
                //
                //             // get next success cells
                //             if (isPotencialCellWhite(piece_x, piece_y, potencial_x, potencial_y)) {
                //                 // set active class to current piece
                //                 $(e.target).addClass("active");
                //
                //                 let rank_check = allPiece[i];
                //
                //                 $(rank_check).addClass("over");
                //             }
                //         }
                //
                //         // console.log(potencial_x + ", " + potencial_y);
                //     }
                // }
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


                    //attack
                    if(nextAttack !== null) {

                        if((nextAttack.getAttribute("x") === event.target.getAttribute("x")) && (nextAttack.getAttribute("y") === event.target.getAttribute("y"))) {

                            // createElement
                            if (currentColor === "white") {
                                $(event.target).append('<div class="piece white">&#9814;</div>');
                            }
                            else if (currentColor === "black") {
                                $(event.target).append('<div class="piece black">&#9820;</div>');
                            }

                            $(current_piece).remove();
                            current_piece = null;

                            socket.emit('attack', {
                                gameId: serverGame.id,
                                prev: {
                                    x : but_x,
                                    y : but_y,
                                },
                                next: {
                                    x : nextAttack.getAttribute("x"),
                                    y : nextAttack.getAttribute("y"),
                                },
                                target: {
                                    x : nextTarget.getAttribute("x"),
                                    y : nextTarget.getAttribute("y"),
                                },
                                currentPlayer: player
                            });


                            let kill_target = nextTarget.firstElementChild;
                            $(kill_target).remove();

                            // kill enemy
                            isHasEnemy = false;

                            // more attack must can do it...
                            //...
                            //...

                            if (MODE_GAME === "CP") {
                                stepComputer();
                            }
                            else if (MODE_GAME === "PP") {
                                // change player
                                if (currentColor === "white") {
                                    player = "black";
                                }
                                else if (currentColor === "black") {
                                    player = "white";
                                }

                            }
                        }

                    }
                    //step
                    else if(nextStep !== null) {
                        nextStep.forEach(function (value, index) {
                            if((value.getAttribute("x") === current_x) && (value.getAttribute("y") === current_y)) {

                                //&#9813; -white queen
                                //&#9819; -black queen


                                if(currentColor === "white") {
                                    if(event.target.getAttribute("queen") === "white") {
                                        $(event.target).append('<div class="piece white queen">&#9813;</div>');
                                    }
                                    else {
                                        $(event.target).append('<div class="piece white">&#9814;</div>');
                                    }

                                }
                                else if(currentColor === "black") {
                                    if(event.target.getAttribute("queen") === "black") {
                                        $(event.target).append('<div class="piece black queen">&#9819;</div>');
                                    }
                                    else {
                                        $(event.target).append('<div class="piece black">&#9820;</div>');
                                    }
                                }

                                // console.log(current_piece);
                                // console.log(event.target.getAttribute("queen"));

                                $(current_piece).remove();
                                current_piece = null;

                                socket.emit('step', {
                                    gameId: serverGame.id,
                                    prev: {
                                        x : but_x,
                                        y : but_y,
                                    },
                                    next: {
                                        x : value.getAttribute("x"),
                                        y : value.getAttribute("y"),
                                    },
                                    currentPlayer: player
                                });

                                if(MODE_GAME === "CP") {
                                    stepComputer();
                                }
                                else if(MODE_GAME === "PP") {
                                    // change player
                                    if(currentColor === "white") {
                                        player = "black";
                                    }
                                    else if(currentColor === "black") {
                                        player = "white";
                                    }
                                }
                            }
                        });

                    }

                    nextStep = null;
                    nextTarget = null;
                    nextAttack = null;

                }
            }

            $(".piece").removeClass("active");
            $(".piece").removeClass("potencial_dead");
            $('.rank__check').removeClass("over");

        });
       
      // // do not pick up pieces if the game is over
      // // only pick up pieces for the side to move
      // var onDragStart = function(source, piece, position, orientation) {
      //   if (game.game_over() === true ||
      //       (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      //       (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
      //       (game.turn() !== playerColor[0])) {
      //     return false;
      //   }
      // };
      //
      //
      //
      // var onDrop = function(source, target) {
      //
      //   // see if the move is legal
      //   var move = game.move({
      //     from: source,
      //     to: target,
      //     promotion: 'q' // NOTE: always promote to a queen for example simplicity
      //   });
      //
      //   // illegal move
      //   if (move === null) {
      //     return 'snapback';
      //   } else {
      //      socket.emit('move', {move: move, gameId: serverGame.id, board: game.fen()});
      //   }
      //
      // };
      //
      // // update the board position after the piece snap
      // // for castling, en passant, pawn promotion
      // var onSnapEnd = function() {
      //   board.position(game.fen());
      // };
    });
})();


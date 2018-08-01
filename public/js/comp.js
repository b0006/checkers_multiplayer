$(document).ready(function(){
    function md5 ( str ) {	// Calculate the md5 hash of a string
        //
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // + namespaced by: Michael White (http://crestidg.com)

        var RotateLeft = function(lValue, iShiftBits) {
            return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
        };

        var AddUnsigned = function(lX,lY) {
            var lX4,lY4,lX8,lY8,lResult;
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

        var F = function(x,y,z) { return (x & y) | ((~x) & z); };
        var G = function(x,y,z) { return (x & z) | (y & (~z)); };
        var H = function(x,y,z) { return (x ^ y ^ z); };
        var I = function(x,y,z) { return (y ^ (x | (~z))); };

        var FF = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        var GG = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        var HH = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        var II = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        var ConvertToWordArray = function(str) {
            var lWordCount;
            var lMessageLength = str.length;
            var lNumberOfWords_temp1=lMessageLength + 8;
            var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
            var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
            var lWordArray=Array(lNumberOfWords-1);
            var lBytePosition = 0;
            var lByteCount = 0;
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

        var WordToHex = function(lValue) {
            var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
            for (lCount = 0;lCount<=3;lCount++) {
                lByte = (lValue>>>(lCount*8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
            }
            return WordToHexValue;
        };

        var x=Array();
        var k,AA,BB,CC,DD,a,b,c,d;
        var S11=7, S12=12, S13=17, S14=22;
        var S21=5, S22=9 , S23=14, S24=20;
        var S31=4, S32=11, S33=16, S34=23;
        var S41=6, S42=10, S43=15, S44=21;

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

        var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

        return temp.toLowerCase();
    }

    let id_game = new Date;
    id_game = md5(id_game.toString());

    let socket = io();

    let words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let digits = ['8', '7', '6', '5', '4', '3', '2', '1'];
    let count_history = 0;

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
            rank.innerHTML = digits[i];
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

        // words notation
        for(let i = 0; i < words.length; i++) {
            let span_not_words = document.createElement("span");
            span_not_words.className = "not_words";
            span_not_words.innerHTML = words[i];
            board.append(span_not_words)
        }


    }

    function add_history(prev, next, isAttack = null, isEnemy = null, isMine = null, count, count_enemy) {

        if(isEnemy === true) {
            let current_hys = $("#hys_" + count_history);

            if (isAttack === true) {
                current_hys.text(current_hys.text() + " " + prev.getAttribute("not") + ":" + next.getAttribute("not"));
                // if(count_enemy === 0) {
                //     current_hys.text(current_hys.text() + " " + prev.getAttribute("not") + ":" + next.getAttribute("not"));
                // }
                // else {
                //     current_hys.text(current_hys.text() + ":" + next.getAttribute("not"));
                // }
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

    function writeLog(text) {
        socket.emit('log', {
            id_game: id_game,
            text: text
        });
    }

    function clear_color_fuchs(potencialSteps) {
        potencialSteps.forEach(function (value) {
            value[0].needeat.forEach(function (val_need) {
                $(val_need.firstElementChild).toggleClass("fuch", false);
            });
        });
    }

    function clear_color() {
        $(".piece").removeClass("active");
        $(".piece").removeClass("potencial_dead");
        $('.rank__check').removeClass("over");
    }

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

    function removeCurrentPiece() {
        $(current_piece).remove();
        current_piece = null;
    }

    let append_count = 0;
    function appendPiece(target, currentColor, isAttack = null) {
        if (currentColor === "white") {
            if(target.getAttribute("queen") === "white") {
                $(target).append('<div class="piece white queen">&#9813;</div>');
            }
            else {
                $(target).append('<div class="piece white">&#9814;</div>');
            }
        }
        else if (currentColor === "black") {
            if(target.getAttribute("queen") === "black") {
                $(target).append('<div class="piece black queen">&#9819;</div>');
            }
            else {
                $(target).append('<div class="piece black">&#9820;</div>');
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

    function stepPlayer(potencialSteps, target, current_x, current_y, currentColor) {
        let wasStep = false;

        potencialSteps.forEach(function (value) {
            if(current_piece !== null) {
                if (current_piece.parentElement === value[0].currentpiece) {

                    value[0].upright.empty.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                            appendPiece(target, currentColor);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });

                    value[0].upleft.empty.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {
                            appendPiece(target, currentColor);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });

                    value[0].bottomright.empty.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                            appendPiece(target, currentColor);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });

                    value[0].bottomleft.empty.forEach(function (val_bot) {
                        if (current_x === val_bot[0].getAttribute("x") && current_y === val_bot[0].getAttribute("y")) {
                            appendPiece(target, currentColor);
                            removeCurrentPiece();
                            wasStep = true;
                        }
                    });
                }
            }
        });

        return wasStep;
    }

    function attackPlayer(potencialSteps, target, current_x, current_y, currentColor, but_x, but_y, isQueen) {
        let isAttackSucces = false;
        let resultAttack = [];

        potencialSteps.forEach(function (value) {

            if (current_piece.parentElement === value[0].currentpiece) {
                if (isAttackSucces === false) {
                    value[0].upright.needStep.forEach(function (val_up) {
                        if (current_x === val_up[0].getAttribute("x") && current_y === val_up[0].getAttribute("y")) {

                            let kill_target = $(".rank__check[x=" + value[0].upright.enemy[0][0].getAttribute("x") + "][y=" + value[0].upright.enemy[0][0].getAttribute("y") + "]");

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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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
                                        currentPlayer: player,
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

        return resultAttack;
    }

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

    function getId(current, new_current) {
        let rand = current - 0.5 + Math.random() * (new_current - current + 1);
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

        let matrix_board = getMatrixBoard();
        matrix_board.forEach(function (value) {
            // console.log(value);
        });

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
                let isPlayerChange = false;
                let needEat = null;
                let isFuch = false;
                let indexNeadEat = null;
                // let isAttackSucces = false;
                let resultAttack = [];

                /**
                 * QUEENS CHECKERS
                 */
                if(current_piece.classList.contains("queen")) {
                    clear_color_fuchs(potencialStepsWhiteQueenGlobal);
                    needAttack = isNeedAttackSimple(potencialStepsWhiteQueenGlobal);

                    // queen need attack
                    if(needAttack) {

                        needEat = isNeedEatSimple(potencialStepsWhiteQueenGlobal, current_x, current_y);

                        // надо съесть (возможен фук)
                        if(!needEat && FUCHS === "on") {

                            isPlayerChange = false;
                            isFuch = false;
                            indexNeadEat = getId(0, potencialStepsWhiteQueenGlobal[0][0].needeat.length - 1);

                            potencialStepsWhiteQueenGlobal.forEach(function (value) {
                                if(current_piece !== null) {
                                    if (current_piece.parentElement === value[0].currentpiece) {

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsWhiteQueenGlobal, value[0].upright, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsWhiteQueenGlobal, value[0].upleft, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsWhiteQueenGlobal, value[0].bottomright, indexNeadEat, current_x, current_y);
                                        }

                                        if(!isFuch) {
                                            isFuch = isFuchs(potencialStepsWhiteQueenGlobal, value[0].bottomleft, indexNeadEat, current_x, current_y);
                                        }
                                    }
                                }
                            });

                            wasStep = stepPlayer(potencialStepsWhiteQueenGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep) {
                                stepComputer(event.target);
                            }

                        }
                        //шаг без фука
                        else if(!needEat && FUCHS !== "on") {
                            wasStep = stepPlayer(potencialStepsWhiteQueenGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep) {
                                stepComputer(event.target);
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {
                            resultAttack = attackPlayer(potencialStepsWhiteQueenGlobal, event.target, current_x, current_y, currentColor, but_x, but_y, true);

                            // если атака прошла успешно
                            if(!$.isEmptyObject(resultAttack)) {

                                appendPiece(resultAttack.target_place, resultAttack.local_color, true);
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
                                    stepComputer(event.target);

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

                        wasStep = stepPlayer(potencialStepsWhiteQueenGlobal, event.target, current_x, current_y, currentColor);

                        if(wasStep) {
                            stepComputer(event.target);
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

                            isPlayerChange = false;

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

                            wasStep = stepPlayer(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep) {
                                stepComputer(event.target);
                            }

                        }
                        else if (!needEat && FUCHS !== "on") {
                            wasStep = stepPlayer(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                            if(wasStep) {
                                stepComputer(event.target);
                            }
                        }
                        //не надо съесть. Обычная аттака
                        else {
                            resultAttack = attackPlayer(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor, but_x, but_y, false);

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

                                next = nextSimpleAttack(current_piece);

                                if (next) {
                                    $(current_piece).addClass("next");
                                }
                                else {
                                    stepComputer(event.target);

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

                                wasStep = stepPlayer(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                                if(wasStep) {
                                    stepComputer(event.target);
                                }
                            }
                        }
                    }
                    // simple step
                    else {

                        wasStep = stepPlayer(potencialStepsSimpleGlobal, event.target, current_x, current_y, currentColor);

                        if(wasStep) {
                            stepComputer(event.target);
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

    //AI
    function markFunction(count_white_queen, count_black_queen, count_white_simple, count_black_simple, count_success_next_move_white, count_success_next_move_black, distance_to_last_line) {
        return (parseInt(count_white_queen) - parseInt(count_black_queen)) + (parseInt(count_white_simple) - parseInt(count_black_simple)) + (parseInt(count_success_next_move_white) - parseInt(count_success_next_move_black)) + parseInt(distance_to_last_line);
    }

    function stepComputer(new_piece) {
        append_count = 0; // for add history

        if(COMPUTER_LEVEL === "low") {
            let any = [0, 1];
            let tax = getId(0, any.length - 1);
            let choose = null;

            let simples = getAllSimpleCells("black");
            let queens = getAllQueenCells("black");

            let arEmptySteps = [];
            let arNeedStepFotAttack = [];
            let needAttackSimple = false;
            simples.forEach(function (value) {
                // need attack

                if (value[0].upright.needStep.length > 0) {
                    needAttackSimple = true;
                    arNeedStepFotAttack.push(value[0]);
                }
                if (value[0].upleft.needStep.length > 0) {
                    needAttackSimple = true;
                    arNeedStepFotAttack.push(value[0]);
                }
                if (value[0].bottomright.needStep.length > 0) {
                    needAttackSimple = true;
                    arNeedStepFotAttack.push(value[0]);
                }
                if (value[0].bottomleft.needStep.length > 0) {
                    needAttackSimple = true;
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

            let arEmptyStepsQueen  = [];
            let arNeedStepFotAttackQueen  = [];
            let needAttackQueen = false;
            queens.forEach(function (value) {
                // need attack

                if (value[0].upright.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }
                if (value[0].upleft.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }
                if (value[0].bottomright.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }
                if (value[0].bottomleft.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }

                // empties

                if (value[0].upright.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }

                if (value[0].upleft.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }

                if (value[0].bottomright.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }

                if (value[0].bottomleft.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }
            });

            if(needAttackQueen && !needAttackSimple) {
                choose = any[1];
            }
            else if(!needAttackQueen && needAttackSimple){
                choose = any[0];
            }
            else if(!needAttackQueen && !needAttackSimple) {
                if(queens.length > 0 && simples.length > 0) {
                    choose = any[tax];
                }
                else if(queens.length > 0 && simples.length <= 0) {
                    choose = any[1];
                }
                else if(queens.length <= 0 && simples.length > 0) {
                    choose = any[0];
                }
            }

            if(choose === 1) {

                if (needAttackQueen) {
                    let arNeedStepUpRight = [];
                    let arNeedStepUpLeft = [];
                    let arNeedStepBottomRight = [];
                    let arNeedStepBottomLeft = [];

                    let arEnemyUpRight = [];
                    let arEnemyUpLeft = [];
                    let arEnemyBottomRight = [];
                    let arEnemyBottomLeft = [];

                    let targets = [];

                    for (let i = 0; i < arNeedStepFotAttackQueen.length; i++) {
                        let target = [];

                        for (let prop in arNeedStepFotAttackQueen[i]) {
                            if (prop === "upright") {
                                if (arNeedStepFotAttackQueen[i][prop].needStep.length > 0) {
                                    arNeedStepUpRight.push(arNeedStepFotAttackQueen[i][prop].needStep)
                                }
                                if (arNeedStepFotAttackQueen[i][prop].enemy.length > 0) {
                                    arEnemyUpRight.push(arNeedStepFotAttackQueen[i][prop].enemy)
                                }

                                if (arNeedStepUpRight.length > 0 && arEnemyUpRight.length > 0) {
                                    target = [{
                                        upright: {
                                            current: arNeedStepFotAttackQueen[i]["currentpiece"],
                                            enemy: arEnemyUpRight,
                                            next: arNeedStepUpRight
                                        }
                                    }]
                                }
                            }
                            if (prop === "upleft") {

                                if (arNeedStepFotAttackQueen[i][prop].needStep.length > 0) {
                                    arNeedStepUpLeft.push(arNeedStepFotAttackQueen[i][prop].needStep)
                                }

                                if (arNeedStepFotAttackQueen[i][prop].enemy.length > 0) {
                                    arEnemyUpLeft.push(arNeedStepFotAttackQueen[i][prop].enemy)
                                }

                                if (arNeedStepUpLeft.length > 0 && arEnemyUpLeft.length > 0) {
                                    target = [{
                                        upleft: {
                                            current: arNeedStepFotAttackQueen[i]["currentpiece"],
                                            enemy: arEnemyUpLeft,
                                            next: arNeedStepUpLeft
                                        }
                                    }]
                                }
                            }
                            if (prop === "bottomright") {

                                if (arNeedStepFotAttackQueen[i][prop].needStep.length > 0) {
                                    arNeedStepBottomRight.push(arNeedStepFotAttackQueen[i][prop].needStep)
                                }

                                if (arNeedStepFotAttackQueen[i][prop].enemy.length > 0) {
                                    arEnemyBottomRight.push(arNeedStepFotAttackQueen[i][prop].enemy)
                                }

                                if (arNeedStepBottomRight.length > 0 && arEnemyBottomRight.length > 0) {
                                    target = [{
                                        bottomright: {
                                            current: arNeedStepFotAttackQueen[i]["currentpiece"],
                                            enemy: arEnemyBottomRight,
                                            next: arNeedStepBottomRight
                                        }
                                    }]
                                }
                            }
                            if (prop === "bottomleft") {

                                if (arNeedStepFotAttackQueen[i][prop].needStep.length > 0) {
                                    arNeedStepBottomLeft.push(arNeedStepFotAttackQueen[i][prop].needStep)
                                }

                                if (arNeedStepFotAttackQueen[i][prop].enemy.length > 0) {
                                    arEnemyBottomLeft.push(arNeedStepFotAttackQueen[i][prop].enemy)
                                }

                                if (arNeedStepBottomLeft.length > 0 && arEnemyBottomLeft.length > 0) {
                                    target = [{
                                        bottomleft: {
                                            current: arNeedStepFotAttackQueen[i]["currentpiece"],
                                            enemy: arEnemyBottomLeft,
                                            next: arNeedStepBottomLeft
                                        }
                                    }]
                                }
                            }

                        }

                        targets.push(target);
                    }

                    let ind = getId(0, targets.length - 1);
                    targets[ind].forEach(function (value) {
                        if (typeof value.upright !== "undefined") {

                            simple_slow_attack(value.upright.current, value.upright.enemy[0][0][0], value.upright.next[0][getId(0, value.upright.next[0].length - 1)][0], "queen", true);

                        }
                        if (typeof value.upleft !== "undefined") {

                            simple_slow_attack(value.upleft.current, value.upleft.enemy[0][0][0], value.upleft.next[0][getId(0, value.upleft.next[0].length - 1)][0], "queen", true);

                        }
                        if (typeof value.bottomright !== "undefined") {

                            simple_slow_attack(value.bottomright.current, value.bottomright.enemy[0][0][0], value.bottomright.next[0][getId(0, value.bottomright.next[0].length - 1)][0], "queen", true);
                        }

                        if (typeof value.bottomleft !== "undefined") {
                            simple_slow_attack(value.bottomleft.current, value.bottomleft.enemy[0][0][0], value.bottomleft.next[0][getId(0, value.bottomleft.next[0].length - 1)][0], "queen", true);
                        }
                    })

                }
                else {

                    //step
                    let ind = getId(0, arEmptyStepsQueen.length - 1);
                    let current = arEmptyStepsQueen[ind].currentpiece;

                    let next = [];

                    if (arEmptyStepsQueen[ind].upright.empty.length > 0) {
                        next.push(arEmptyStepsQueen[ind].upright.empty[getId(0, arEmptyStepsQueen[ind].upright.empty.length - 1)][0]);
                    }
                    if (arEmptyStepsQueen[ind].upleft.empty.length > 0) {
                        next.push(arEmptyStepsQueen[ind].upleft.empty[getId(0, arEmptyStepsQueen[ind].upleft.empty.length - 1)][0]);
                    }
                    if (arEmptyStepsQueen[ind].bottomright.empty.length > 0) {
                        next.push(arEmptyStepsQueen[ind].bottomright.empty[getId(0, arEmptyStepsQueen[ind].bottomright.empty.length - 1)][0]);
                    }
                    if (arEmptyStepsQueen[ind].bottomleft.empty.length > 0) {
                        next.push(arEmptyStepsQueen[ind].bottomleft.empty[getId(0, arEmptyStepsQueen[ind].bottomleft.empty.length - 1)][0]);
                    }

                    next = next[getId(0, next.length - 1)];

                    simple_slow_attack(current, null, next, "queen");
                }
            }
            else {

                if (needAttackSimple) {
                    let arNeedStepUpRight = [];
                    let arNeedStepUpLeft = [];
                    let arNeedStepBottomRight = [];
                    let arNeedStepBottomLeft = [];

                    let arEnemyUpRight = [];
                    let arEnemyUpLeft = [];
                    let arEnemyBottomRight = [];
                    let arEnemyBottomLeft = [];

                    let targets = [];

                    for (let i = 0; i < arNeedStepFotAttack.length; i++) {
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

                    let next = null;

                    let ind = getId(0, targets.length - 1);
                    targets[ind].forEach(function (value) {
                        if (typeof value.upright !== "undefined") {
                            if(value.upright.next[0][0][0].getAttribute("queen") === "black"){
                                simple_slow_attack(value.upright.current, value.upright.enemy[0][0][0], value.upright.next[0][0][0], "queen", true);
                            }
                            else {
                                simple_slow_attack(value.upright.current, value.upright.enemy[0][0][0], value.upright.next[0][0][0], null, true);
                                next = getOneSimpleCells("black", value.upright.next[0][0][0], value.upright.current);
                            }
                        }
                        if (typeof value.upleft !== "undefined") {
                            if(value.upleft.next[0][0][0].getAttribute("queen") === "black") {
                                simple_slow_attack(value.upleft.current, value.upleft.enemy[0][0][0], value.upleft.next[0][0][0], "queen", true);
                            }
                            else {
                                simple_slow_attack(value.upleft.current, value.upleft.enemy[0][0][0], value.upleft.next[0][0][0], null, true);
                                next= getOneSimpleCells("black", value.upleft.next[0][0][0], value.upleft.current);
                            }
                        }
                        if (typeof value.bottomright !== "undefined") {
                            if(value.bottomright.next[0][0][0].getAttribute("queen") === "black") {
                                simple_slow_attack(value.bottomright.current, value.bottomright.enemy[0][0][0], value.bottomright.next[0][0][0], "queen", true);
                            }
                            else {
                                simple_slow_attack(value.bottomright.current, value.bottomright.enemy[0][0][0], value.bottomright.next[0][0][0], null, true);
                                next = getOneSimpleCells("black", value.bottomright.next[0][0][0], value.bottomright.current);
                            }
                        }
                        if (typeof value.bottomleft !== "undefined") {
                            if(value.bottomleft.next[0][0][0].getAttribute("queen") === "black") {
                                simple_slow_attack(value.bottomleft.current, value.bottomleft.enemy[0][0][0], value.bottomleft.next[0][0][0], "queen", true);
                            }
                            else {
                                simple_slow_attack(value.bottomleft.current, value.bottomleft.enemy[0][0][0], value.bottomleft.next[0][0][0], null, true);
                                next = getOneSimpleCells("black", value.bottomleft.next[0][0][0], value.bottomleft.current);
                            }
                        }
                    });

                    let isDanger = 0;
                    let needNextAttack = false;

                    let prev_target = null;
                    let enemy_target = null;
                    let next_target = null;

                    try {
                        next.forEach(function (value) {
                            if (value[0].upright.danger.length > 0 && value[0].bottomleft.danger.length <= 0) {
                                isDanger = 1;
                            }
                            if (value[0].upleft.danger.length > 0 && value[0].bottomright.danger.length <= 0) {
                                isDanger = 1;
                            }
                            if (value[0].bottomright.danger.length > 0 && value[0].upleft.danger.length <= 0) {
                                isDanger = 1;
                            }
                            if (value[0].bottomleft.danger.length > 0 && value[0].upright.danger.length <= 0) {
                                isDanger = 1;
                            }

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

                        prev_target = getPrev(next[0][0]);
                        enemy_target = getEnemy(next[0][0]);
                        next_target = getNext(next[0][0]);
                    }
                    catch(exp) {
                        console.log(exp.message);
                    }

                    try {
                        isNeedAttackCP2(next, enemy_target[0][0][0], prev_target[0], next_target[0][0][0]);
                    }
                    catch(exp) {
                        console.log(exp.message);
                    }

                    // isNeedAttackCP(next, enemy_target[0][0][0], prev_target[0], next_target[0][0][0]);



                }
                else {

                    //step
                    try {
                        
                        let res = getNextLow(arEmptySteps);

                        let ind = getId(0, arEmptySteps.length - 1);
                        let current = arEmptySteps[ind].currentpiece;

                        let next = [];

                        if (arEmptySteps[ind].upright.empty.length > 0) {
                            next.push(arEmptySteps[ind].upright.empty[0][0])
                        }
                        if (arEmptySteps[ind].upleft.empty.length > 0) {
                            next.push(arEmptySteps[ind].upleft.empty[0][0])
                        }
                        if (arEmptySteps[ind].bottomright.empty.length > 0) {
                            next.push(arEmptySteps[ind].bottomright.empty[0][0])
                        }
                        if (arEmptySteps[ind].bottomleft.empty.length > 0) {
                            next.push(arEmptySteps[ind].bottomleft.empty[0][0])
                        }

                        next = next[getId(0, next.length - 1)];
                        if (next.getAttribute("queen") === "black") {
                            simple_slow_attack(current, null, next, "queen");
                        }
                        else {
                            simple_slow_attack(current, null, next);
                        }
                    }
                    catch (exp) {
                        console.log(exp.message)
                    }

                }
            }
        }
        else if(COMPUTER_LEVEL === "medium") {
            let new_x = new_piece.getAttribute("x");
            let new_y = new_piece.getAttribute("y");

            new_piece = $('.rank__check[x=' + new_x + '][y=' + new_y + ']')[0];

            let simples_enemy = getAllSimpleCells("white");
            let queens_enemy = getAllQueenCells("white");

            let count_white_queen = 0, count_black_queen = 0,
                count_white_simple = 0, count_black_simple = 0,
                count_success_next_move_white = 0, count_success_next_move_black = 0,
                distance_to_last_line = 0;


            let any = [0, 1];
            let tax = getId(0, any.length - 1);
            let choose = null;

            let simples = getAllSimpleCells("black");
            let queens = getAllQueenCells("black");

            let arEmptySteps = [];
            let arNeedStepFotAttack = [];
            let needAttackSimple = false;
            simples.forEach(function (value) {
                // need attack

                if (value[0].upright.needStep.length > 0) {
                    needAttackSimple = true;
                    arNeedStepFotAttack.push(value[0]);
                }
                if (value[0].upleft.needStep.length > 0) {
                    needAttackSimple = true;
                    arNeedStepFotAttack.push(value[0]);
                }
                if (value[0].bottomright.needStep.length > 0) {
                    needAttackSimple = true;
                    arNeedStepFotAttack.push(value[0]);
                }
                if (value[0].bottomleft.needStep.length > 0) {
                    needAttackSimple = true;
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

            let arEmptyStepsEnemy = [];
            let arNeedStepFotAttackEnemy = [];
            simples_enemy.forEach(function (value) {
                // need attack

                if (value[0].upright.needStep.length > 0) {
                    arNeedStepFotAttackEnemy.push(value[0]);
                }
                if (value[0].upleft.needStep.length > 0) {
                    arNeedStepFotAttackEnemy.push(value[0]);
                }
                if (value[0].bottomright.needStep.length > 0) {
                    arNeedStepFotAttackEnemy.push(value[0]);
                }
                if (value[0].bottomleft.needStep.length > 0) {
                    arNeedStepFotAttackEnemy.push(value[0]);
                }

                // empties

                if (value[0].upright.empty.length > 0) {
                    arEmptyStepsEnemy.push(value[0]);
                }

                if (value[0].upleft.empty.length > 0) {
                    arEmptyStepsEnemy.push(value[0]);
                }

                if (value[0].bottomright.empty.length > 0) {
                    arEmptyStepsEnemy.push(value[0]);
                }

                if (value[0].bottomleft.empty.length > 0) {
                    arEmptyStepsEnemy.push(value[0]);
                }
            });

            let arEmptyStepsQueen  = [];
            let arNeedStepFotAttackQueen  = [];
            let needAttackQueen = false;
            queens.forEach(function (value) {
                // need attack

                if (value[0].upright.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }
                if (value[0].upleft.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }
                if (value[0].bottomright.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }
                if (value[0].bottomleft.needStep.length > 0) {
                    needAttackQueen = true;
                    arNeedStepFotAttackQueen.push(value[0]);
                }

                // empties

                if (value[0].upright.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }

                if (value[0].upleft.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }

                if (value[0].bottomright.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }

                if (value[0].bottomleft.empty.length > 0) {
                    arEmptyStepsQueen.push(value[0]);
                }
            });

            count_white_queen = queens.length;
            count_black_queen = queens_enemy.length;
            count_white_simple = simples.length;
            count_black_simple = simples_enemy.length;
            count_success_next_move_white = arEmptyStepsEnemy.length;
            count_success_next_move_black = arEmptySteps.length;

            if(needAttackQueen && !needAttackSimple) {
                choose = any[1];
            }
            else if(!needAttackQueen && needAttackSimple){
                choose = any[0];
            }
            else if(!needAttackQueen && !needAttackSimple) {
                if(queens.length > 0 && simples.length > 0) {
                    choose = any[tax];
                }
                else if(queens.length > 0 && simples.length <= 0) {
                    choose = any[1];
                }
                else if(queens.length <= 0 && simples.length > 0) {
                    choose = any[0];
                }
            }

            if (choose === 1) {
                // но сначала глянь есть ли враги у простых шашек
                //руби обычной
                // ходи дамкой

            }
            else {
                if (needAttackSimple) {
                    console.log("computer need attack");
                    let prev = []; // currentPiece
                    let enemy = []; // enemy for currentPiece
                    let next = []; //needStep

                    for (let i = 0; i < arNeedStepFotAttack.length; i++) {
                        prev = getPrev(arNeedStepFotAttack[i]);
                        enemy = getEnemy(arNeedStepFotAttack[i]);
                        next = getNext(arNeedStepFotAttack[i]);

                        // for (let prop in arNeedStepFotAttack[i]) {
                        //     if (prop === "upright" || prop === "upleft" || prop === "bottomright" || prop === "bottomleft") {
                        //
                        //         if (arNeedStepFotAttack[i][prop].needStep.length > 0) {
                        //             next.push(arNeedStepFotAttack[i][prop].needStep);
                        //         }
                        //
                        //         if (arNeedStepFotAttack[i][prop].enemy.length > 0) {
                        //             enemy.push(arNeedStepFotAttack[i][prop].enemy);
                        //         }
                        //     }
                        //     else if (prop === "currentpiece") {
                        //         prev.push(arNeedStepFotAttack[i][prop]);
                        //     }
                        // }

                        let current_situation = getOneSimpleCells("black", $(next)[0][0][0], prev);

                        let isDanger = 0;
                        let needNextAttack = false;
                        current_situation.forEach(function (value) {
                            if (value[0].upright.danger.length > 0 && value[0].bottomleft.danger.length <= 0) {
                                isDanger = 1;
                            }
                            if (value[0].upleft.danger.length > 0 && value[0].bottomright.danger.length <= 0) {
                                isDanger = 1;
                            }
                            if (value[0].bottomright.danger.length > 0 && value[0].upleft.danger.length <= 0) {
                                isDanger = 1;
                            }
                            if (value[0].bottomleft.danger.length > 0 && value[0].upright.danger.length <= 0) {
                                isDanger = 1;
                            }

                            if(value[0].upright.enemy.length > 0) {
                                needNextAttack = true;
                            }
                            if(value[0].upleft.enemy.length > 0) {
                                needNextAttack = true;
                            }
                            if(value[0].bottomright.enemy.length > 0) {
                                needNextAttack = true;
                            }
                            if(value[0].bottomleft.enemy.length > 0) {
                                needNextAttack = true;
                            }

                        });

                        // isNeedAttackCP(current_situation, enemy[0][0][0]);

                        if(needNextAttack) {

                            // isNeedAttackCP(current_situation);

                            // console.log(getPrev(current_situation[0][0])); // один 0
                            // console.log(getEnemy(current_situation[0][0])); // три 0
                            // console.log(getNext(current_situation[0][0])); // три 0

                            // let nnn = getOneSimpleCells("black", $(next)[0][0][0], prev);
                            // let test = isNeedAttackCP(nnn);

                            isDanger--;
                        }

                        let mark = markFunction(count_white_queen, count_black_queen,
                            count_white_simple, count_black_simple,
                            count_success_next_move_white, count_success_next_move_black, isDanger);

                        // console.log(count_white_queen + ", " + count_black_queen);
                        // console.log(count_white_simple + ", " + count_black_simple);
                        // console.log(count_success_next_move_white + ", " + count_success_next_move_black + ", " + isDanger);
                        //
                        // console.log(current_situation);
                        // console.log(mark);
                    }
                }
                else {
                    console.log("computer step");

                }
            }
        }
        else if(COMPUTER_LEVEL === "high") {

        }
    }
    
    function getNextLow(potencialPieces) {
        let isDanger = false;

        potencialPieces.forEach(function (value) {
            if(value.upright.enemy.length > 0) {

            }
        })
    }

    let slow_count = 0;
    function simple_slow_attack(prev, enemy = null, next, type = null, isAttack = null) {
        player = null;

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
            player = "white";

            if(isAttack === true) {
                add_history(prev, next, true, true, null, 0, slow_count);
                slow_count++;
            }
            else {
                add_history(prev, next, null, true, null);
            }
        });
    }

    function simple_attack(prev, enemy = null, next, type = null) {
        let color = prev.firstElementChild.classList.contains("black");

            $(prev.firstElementChild).remove();

            if(enemy !== null) {
                $(enemy.firstElementChild).remove();
            }

            if(color) {
                if(type !== null) {
                    $(next).append('<div class="piece black queen">&#9819;</div>');
                }
                else {
                    $(next).append('<div class="piece black">&#9820;</div>');
                }
            }
            else {
                if(type !== null) {
                    $(next).append('<div class="piece white queen">&#9813;</div>');
                }
                else {
                    $(next).append('<div class="piece white">&#9814;</div>');
                }
            }



    }

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

    let prev_temp = [];
    let next_temp = [];

    function isNeedAttackCP(current_situation, enemy = null, prev_target = null, next_target = null) {
        let needNextAttack = false;

        if (enemy !== null) {
            $(enemy.firstElementChild).remove();
        }

        if (prev_target !== null) {
            $(prev_target.firstElementChild).remove();
        }

        prev_temp.push(prev_target);
        next_temp.push(next_target);

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

            current_situation = getOneSimpleCells("black", $(next)[0][0][0], prev);
            isNeedAttackCP(current_situation, new_enemy[0][0][0], prev[0], next[0][0][0]);

            // isNeedAttackCP(current_situation, new_enemy[0][0][0], prev[0], next[0][0][0]);
        }
        else {

            if (next_target !== null) {
                $(next_target).append('<div class="piece black">&#9820;</div>');
            }

            if (prev_temp[prev_temp.length - 1] === next_temp[next_temp.length - 2]) {
                $(next_temp[next_temp.length - 2]).append('<div class="piece black">&#9820;</div>');
            }
            if (prev_temp[prev_temp.length - 2] === next_temp[next_temp.length - 1]) {
                $(prev_temp[prev_temp.length - 2].firstElementChild).remove();
            }

            prev_temp = [];
            next_temp = [];

            return false;
        }
    }

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

    function getNext(arNeedStepFotAttack) {
        let next = [];

        for (let prop in arNeedStepFotAttack) {
            if (prop === "upright" || prop === "upleft" || prop === "bottomright" || prop === "bottomleft") {

                if (arNeedStepFotAttack[prop].needStep.length > 0) {
                    next.push(arNeedStepFotAttack[prop].needStep);
                }
            }
        }

        return next;
    }
    function getEnemy(arNeedStepFotAttack) {
        let enemy = [];

        for (let prop in arNeedStepFotAttack) {
            if (prop === "upright" || prop === "upleft" || prop === "bottomright" || prop === "bottomleft") {

                if (arNeedStepFotAttack[prop].enemy.length > 0) {
                    enemy.push(arNeedStepFotAttack[prop].enemy);
                }
            }
        }

        return enemy;
    }
    function getPrev(arNeedStepFotAttack) {
        let prev = [];

        for (let prop in arNeedStepFotAttack) {
            if (prop === "currentpiece") {
                prev.push(arNeedStepFotAttack[prop]);
            }
        }

        return prev;
    }

    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    function getMatrixBoard() {
        let matrix_board = [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ];

        let temp_cell = null;

        matrix_board.forEach(function (row_value, row_index) {
            row_value.forEach(function (col_value, col_index) {
                temp_cell = $(".rank__check[x=" + col_index + "][y=" + row_index + "]");

                if(typeof temp_cell[0] !== "undefined") {
                    if(temp_cell[0].firstElementChild !== null) {
                        matrix_board[row_index][col_index] = 1;
                    }
                }
            });
        });

        return matrix_board;
    }

});
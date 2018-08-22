let date = new Date().getDate() + "." + (new Date().getMonth() + 1) + "." + new Date().getFullYear();
let path = require("path");
let env = process.env.NODE_ENV || "development";
let Sequelize = require("sequelize");
let config = require(path.join(__dirname, '..', './app/config', 'config.json'))[env];
let sequelize = new Sequelize(config.database, config.username, config.password, config);

//добавить новую партию
function create_game_db(msg){
    let color_potencial_step = false;
    if(msg.settings_game.color_potencial_step === "on"){
        color_potencial_step = true;
    }
    let time_check = false;
    if(msg.settings_game.time_check === "on"){
        time_check = true;
    }
    let multiattack = false;
    if(msg.settings_game.multiattack === "on") {
        multiattack = true;
    }
    let fuchs = false;
    if(msg.settings_game.fuchs === "on") {
        fuchs = true;
    }
    let color_potencial_fuchs = false;
    if(msg.settings_game.color_potencial_fuchs === "on"){
        color_potencial_fuchs = true;
    }
    let simple_back_attack = false;
    if(msg.settings_game.simple_back_attack === "on"){
        simple_back_attack = true;
    }
    let queen_awesome_step = false;
    if(msg.settings_game.queen_awesome_step === "on"){
        queen_awesome_step = true;
    }

    //сначала извлекаем ID типа игры (тут финты ушами: извлекается несколько раз переменные из callback)
    let id_game = (async () => {
        let result = await sequelize.query("SELECT * FROM type_games WHERE type_game = '" + msg.settings_game.choose + "'");

        let id_type_game = 0;

        result.forEach(function (value) {
            value.forEach(function (val) {
                id_type_game = val.id;
            })
        });

        if(id_type_game > 0){
            let result_insert_promise = (async () => {
                let result_insert = await sequelize.query('INSERT INTO games (type_game, nickname_player_1, nickname_player_2, created_at, first_move, is_end, color_potencial_step, time_check, time_value, multiattack, fuchs, color_potencial_fuchs, simple_back_attack, queen_awesome_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', {
                    replacements: [
                        id_type_game, //type_game
                        msg.white, //nickname_player_1
                        msg.black, //nickname_player_2
                        new Date(), //created_at
                        msg.white, //first_move
                        0, //is_end
                        color_potencial_step,
                        time_check,
                        0, //msg.settings_game.time_value
                        multiattack,
                        fuchs,
                        color_potencial_fuchs,
                        simple_back_attack,
                        queen_awesome_step
                    ],
                    type: Sequelize.QueryTypes.INSERT
                });
                result_insert = result_insert.toString();
                let arResult_insert = result_insert.split(',');
                id_game = arResult_insert[0];
                return arResult_insert[0];
            })();

            let tmp = (async () => {
                let tmp2 = await result_insert_promise.then(function(result) {
                    return result;
                })

                return tmp2;
            })();

            return tmp;
        }
    })()

    let tmp3 = (async () => {
        let tmp4 = await id_game.then(function(result) {
            return result;
        });

        return tmp4;
    })();

    tmp3.then(result => {
        return result;
    });

    return tmp3;
}
//добавить ход
function add_move_db(msg, isAttack){
    let replacements = null;
    let current_player = msg.currentPlayer;
    if(current_player === "white"){
        if(isAttack){
            replacements = [
                msg.gameId,
                msg.prev_notation + " : " + msg.next_notation,
                null,
                msg.isQueen,
                isAttack,
                msg.stateBoard
            ]
        }
        else {
            replacements = [
                msg.gameId,
                msg.prev_notation + " - " + msg.next_notation,
                null,
                msg.isQueen,
                isAttack,
                msg.stateBoard
            ]
        }

    }
    else {
        if(isAttack){
            replacements = [
                msg.gameId,
                null,
                msg.prev_notation + " : " + msg.next_notation,
                msg.isQueen,
                isAttack,
                msg.stateBoard
            ]
        }
        else {
            replacements = [
                msg.gameId,
                null,
                msg.prev_notation + " - " + msg.next_notation,
                msg.isQueen,
                isAttack,
                msg.stateBoard
            ]
        }
    }

    sequelize.query('INSERT INTO moves (game_id, white_step, black_step, is_queen, is_attack, state_board) VALUES (?, ?, ?, ?, ?, ?);', {
        replacements: replacements,
        type: Sequelize.QueryTypes.INSERT
    }).spread((results, metadata) => {
        // console.log(results);
    });

}
//добавить сообещние чата
function add_chat_db(msg){
    sequelize.query('INSERT INTO chat (game_id, author, message) VALUES (?, ?, ?);', {
        replacements: [
            msg.gameId,
            msg.from,
            msg.message
        ],
        type: Sequelize.QueryTypes.INSERT
    }).spread((results, metadata) => {
        // console.log(results);
    });

}
//зафиксировать конец партии
function set_end_game(msg){
    //установить конец партии
    sequelize.query('UPDATE games SET is_end = 1 WHERE id = ' + msg.gameId, {
        type: Sequelize.QueryTypes.UPDATE
    });

    //удалить сообщения чата оконченной партии
    sequelize.query('DELETE FROM chat WHERE game_id = ' + msg.gameId, {
        type: Sequelize.QueryTypes.DELETE
    });
}
//получить неоконченные партии
function get_my_games(msg){

    let result_type_games = (async () => {
        let result_select_type = await sequelize.query("SELECT * FROM type_games");
        result_select_type = result_select_type[0];
        return result_select_type;
    })();

    let result_games = (async () => {
        let result_select_games = await sequelize.query("SELECT * FROM games WHERE (nickname_player_1 = '"+ msg.nickname + "' OR nickname_player_2 = '" + msg.nickname + "') and is_end = 0")
        result_select_games = result_select_games[0];
        return result_select_games;
    })();

    let games = Promise.all([result_games, result_type_games]).then(values => {
        return values;
    });

    return games;
}
//получить неоконченные партии
function get_moves_game(msg){
    let setting_game = null;
    msg.game_setting.forEach(function (value) {
        if(value.id === msg.resume_id_game) {
            setting_game = value;
        }
    });

    let result_moves = (async () => {
        let result_select = await sequelize.query("SELECT * FROM moves WHERE game_id = " + setting_game.id + " ORDER BY id DESC LIMIT 1");
        result_select = result_select[0];
        return result_select;
    })();

    let moves = Promise.all([result_moves]).then(values => {
        return values;
    });

    return moves;
}

module.exports.create_game_db = create_game_db;
module.exports.add_move_db = add_move_db;
module.exports.add_chat_db = add_chat_db;
module.exports.set_end_game = set_end_game;
module.exports.get_my_games = get_my_games;
module.exports.get_moves_game = get_moves_game;
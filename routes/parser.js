const express = require('express');
const router = express.Router();
const fs = require('fs');
const osmosis = require('osmosis');
const request = require('request');
const cheerio = require('cheerio');
let database = require('../db/db');

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

/* GET home page. */
router.get('/parser/id', function(req, res, next) {

    database.connection.query('SELECT * FROM themes', function (error, results, fields) {
        if (error) {
            console.log("Ошибка запроса к таблице themes", error);
            res.send({
                "code":400,
                "failed":"Ошибка запроса к таблице themes"
            })
        }else{

            let themes = [];
            results.forEach(function (value) {
                themes.push({
                    id: value.id,
                    theme: value.theme
                });
            });

            res.render('parser', {
                title: 'Write your URL:',
                example: "http://chessproblem.ru/id13538",
                packet : "N",
                themes: themes
            });

            // database.connection.end();
        }
    });

    // database.connection.end();
});

/* GET home page. */
router.get('/parser/packet', function(req, res, next) {

    database.connection.query('SELECT * FROM themes', function (error, results, fields) {
        if (error) {
            console.log("Ошибка запроса к таблице themes", error);
            res.send({
                "code":400,
                "failed":"Ошибка запроса к таблице themes"
            })
        }else{

            let themes = [];
            results.forEach(function (value) {
                themes.push({
                    id: value.id,
                    theme: value.theme
                });
            });

            res.render('parser', {
                title: 'Write your URL:',
                example: "http://chessproblem.ru/pages/1",
                packet : "Y",
                themes: themes
            });

            // database.connection.end();
        }
    });
});

router.post('/parser/packet', function (req, res, next) {
    let URL = req.body.url;

    request(URL, function (err, res, body) {
        if (err)
            throw err;

        // парсим DOM
        let $ = cheerio.load(body);

        let links = $('#maintable a');
        let parsing_links = [];

        links.each(function(index, value) {
            parsing_links.push(links[index].attribs.href);
        });


        parsing_links.forEach(function (value) {
            osmosis
                .get(value)
                .set({
                    'title' : '#pr_right > p > b',
                    'pieces' : '#pr_right > ul',
                    'answer': '#answer'
                })
                .data(function(data) {

                    let pieces = data.pieces;
                    let startWhite = pieces.indexOf("Белые");
                    let endWhite = pieces.indexOf("Черные");
                    let endBlack = pieces.indexOf("Просмотров");

                    let white = pieces.slice(startWhite, endWhite);
                    let black = pieces.slice(endWhite, endBlack);


                    let answer = data.answer;
                    let startAnswerText = answer.indexOf("1");
                    let endAnswerText = answer.indexOf("Как");

                    answer = answer.slice(startAnswerText, endAnswerText);


                    // for HTML файла
                    let html = data.title;
                    html += "\n" + white;
                    html += "\n" + black;
                    html += "\n" + answer;
                    // end HTML


                    //get id from url
                    let txt_name = null;

                    const regex = /[\d]+$/gm;
                    const str = value;
                    let m;

                    while ((m = regex.exec(str)) !== null) {
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        m.forEach((match, groupIndex) => {
                            txt_name = match;
                        });
                    }

                    let textFile = white + '\n' + black + '\n' + answer;

                    fs.writeFile('parser/packet/txt/' + txt_name + '.txt', textFile, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("Файл " + txt_name + ".txt сохранён.");
                    });

                    // for HTML
                    fs.writeFile('parser/packet/html/' + txt_name + '.html', html, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("Файл " + txt_name + ".html сохранён.");
                    });

                    /**
                     * ADD TO DataBase
                     */

                    let today = new Date();
                    let new_data_parsing = {
                        "id_task" : txt_name,
                        "id_theme": req.body.theme,
                        "txt_file": textFile,
                        "original_text" : html,
                        "success" : true,
                        "active" : true,
                        "created": today,
                    };

                    database.connection.query('INSERT INTO parsing SET ?', new_data_parsing, function (error, results, fields) {
                        if (error) {
                            console.log("Ошибка добавления данных в БД", error);
                        }else{

                        }
                    });
                });
        })

    });

    res.render("parser", {
        title: "Packet answers",
        status : "ok"
    });


});

router.post('/parser/id', function(req, res, next) {

    osmosis
        .get(req.body.url)
        .set({
            'title' : '#pr_right > p > b',
            'pieces' : '#pr_right > ul',
            'answer': '#answer'
        })
        .data(function(data) {

            let pieces = data.pieces;
            let startWhite = pieces.indexOf("Белые");
            let endWhite = pieces.indexOf("Черные");
            let endBlack = pieces.indexOf("Просмотров");

            let white = pieces.slice(startWhite, endWhite);
            let black = pieces.slice(endWhite, endBlack);


            let answer = data.answer;
            let startAnswerText = answer.indexOf("1.");
            let endAnswerText = answer.indexOf("Как");

            answer = answer.slice(startAnswerText, endAnswerText);

            // for HTML файла
            let html = data.title;
            html += "\n" + white;
            html += "\n" + black;
            html += "\n" + answer;
            // end HTML


            //get id from url
            let txt_name = null;

            const regex = /[\d]+$/gm;
            const str = req.body.url;
            let m;

            while ((m = regex.exec(str)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                m.forEach((match, groupIndex) => {
                    txt_name = match;
                });
            }

            let textFile = white + '\n' + black + '\n' + answer;

            fs.writeFile('parser/id/txt/' + txt_name + '.txt', textFile, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("Файл " + txt_name + ".txt сохранён.");
            });

            fs.writeFile('parser/id/html/' + txt_name + '.html', html, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("Файл " + txt_name + ".html сохранён.");
            });

            /**
             * ADD TO DataBase
             */

            let today = new Date();
            let new_data_parsing = {
                "id_task" : txt_name,
                "id_theme": req.body.theme,
                "txt_file": textFile,
                "original_text" : html,
                "success" : true,
                "active" : true,
                "created": today,
            };

            database.connection.query('INSERT INTO parsing SET ?', new_data_parsing, function (error, results, fields) {
                if (error) {
                    console.log("Ошибка добавления данных в БД", error);
                    res.send({
                        "code":400,
                        "failed":"Ошибка добавления данных в БД"
                    })
                }else{
                    res.render("parser", {
                        title: req.body.url,
                        name : data.title,
                        white: white,
                        black: black,
                        result: answer,
                        textFile : textFile,
                        txt_name : txt_name
                    });
                }
            });

            // database.connection.end();


            /**
             * CLOSE CONNECTION TO DB
             */

        })
});

module.exports = router;

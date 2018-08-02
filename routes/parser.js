const express = require('express');
const router = express.Router();
const fs = require('fs');
const osmosis = require('osmosis');
const request = require('request');
const cheerio = require('cheerio');

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
    res.render('parser', { title: 'Write your URL:', example: "http://chessproblem.ru/id13538", packet : "N" });
});

/* GET home page. */
router.get('/parser/packet', function(req, res, next) {
    res.render('parser', { title: 'Write your URL:', example: "http://chessproblem.ru/pages/1", packet : "Y" });
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

                    let count_strings = answer.split('\n').length - 1;

                    // for HTML файла
                    let html = data.title;
                    html += "\n" + white;
                    html += "\n" + black;
                    html += "\n" + answer;
                    // end HTML

                    answer = answer.replaceAll(/[*]/gm, '-');
                    answer = answer.replaceAll(' # ', ',"#"');
                    answer = answer.replaceAll(' #', ',"#"');
                    answer = answer.replaceAll(/ \+/g, ',"+"');

                    // пожалуйста, простите за этот код, меня. Я знаю, что он ужасен

                    // дикий костыль
                    answer = answer.replaceAll("0 угроза:", '0,"угроза:"');
                    answer = answer.replaceAll("1 угроза:", '1,"угроза:"');
                    answer = answer.replaceAll("2 угроза:", '2,"угроза:"');
                    answer = answer.replaceAll("3 угроза:", '3,"угроза:"');
                    answer = answer.replaceAll("4 угроза:", '4,"угроза:"');
                    answer = answer.replaceAll("5 угроза:", '5,"угроза:"');
                    answer = answer.replaceAll("6 угроза:", '6,"угроза:"');
                    answer = answer.replaceAll("7 угроза:", '7,"угроза:"');
                    answer = answer.replaceAll("8 угроза:", '8,"угроза:"');
                    answer = answer.replaceAll("9 угроза:", '9,"угроза:"');

                    answer = answer.replaceAll("0 цугцванг.", '0,"цугцванг."');
                    answer = answer.replaceAll("1 цугцванг.", '1,"цугцванг."');
                    answer = answer.replaceAll("2 цугцванг.", '2,"цугцванг."');
                    answer = answer.replaceAll("3 цугцванг.", '3,"цугцванг."');
                    answer = answer.replaceAll("4 цугцванг.", '4,"цугцванг."');
                    answer = answer.replaceAll("5 цугцванг.", '5,"цугцванг."');
                    answer = answer.replaceAll("6 цугцванг.", '6,"цугцванг."');
                    answer = answer.replaceAll("7 цугцванг.", '7,"цугцванг."');
                    answer = answer.replaceAll("8 цугцванг.", '8,"цугцванг."');
                    answer = answer.replaceAll("9 цугцванг.", '9,"цугцванг."');


                    answer = answer.replaceAll("Кр", 'K');
                    answer = answer.replaceAll("Ф", 'Q');
                    answer = answer.replaceAll("Л", 'R');
                    answer = answer.replaceAll("К", 'N');
                    answer = answer.replaceAll("С", 'B');
                    answer = answer.replaceAll("п", 'p');

                    answer = answer.replaceAll("K угроза:", 'K,"угроза:"');
                    answer = answer.replaceAll("Q угроза:", 'Q,"угроза:"');
                    answer = answer.replaceAll("R угроза:", 'R,"угроза:"');
                    answer = answer.replaceAll("N угроза:", 'N,"угроза:"');
                    answer = answer.replaceAll("B угроза:", 'B,"угроза:"');
                    answer = answer.replaceAll("p угроза:", 'p,"угроза:"');

                    white = white.replaceAll("Кр", 'K');
                    white = white.replaceAll("Ф", 'Q');
                    white = white.replaceAll("Л", 'R');
                    white = white.replaceAll("К", 'N');
                    white = white.replaceAll("С", 'B');
                    white = white.replaceAll("п", 'p');

                    black = black.replaceAll("Кр", 'K');
                    black = black.replaceAll("Ф", 'Q');
                    black = black.replaceAll("Л", 'R');
                    black = black.replaceAll("К", 'N');
                    black = black.replaceAll("С", 'B');
                    black = black.replaceAll("п", 'p');

                    let tmp_white = white;
                    let rmp_black = black;

                    answer = answer.replaceAll("! цугцванг.", ',"! цугцванг."');
                    answer = answer.replaceAll("! угроза:", ',"! угроза:"');
                    answer = answer.replaceAll(/\s+,/g, ',');



                    if(count_strings === 1 || count_strings === 2) {

                        answer = answer.replaceAll('1. ', '1.');
                        answer = answer.replaceAll(' 2. ', '\n2.');
                        answer = answer.replaceAll(' 3. ', '\n3.');
                        answer = answer.replaceAll(' 4. ', '\n4.');
                        answer = answer.replaceAll(" 5. ", '\n5.');
                        answer = answer.replaceAll(' 6. ', '\n6.');
                        answer = answer.replaceAll(' 7. ', '\n7.');
                        answer = answer.replaceAll(' 8. ', '\n8.');
                        answer = answer.replaceAll(' 9. ', '\n9.');

                        answer = answer.replaceAll(/\n\s+/, '\n');

                        const regex = /\d\.\w/gm;
                        let m;
                        let matchingWhite = [];
                        let matchingBlack = [];

                        while ((m = regex.exec(answer)) !== null) {
                            // This is necessary to avoid infinite loops with zero-width matches
                            if (m.index === regex.lastIndex) {
                                regex.lastIndex++;
                            }

                            m.forEach((match, groupIndex) => {
                                matchingWhite.push(match.substr(2));
                            });
                        }

                        matchingWhite.forEach(function (value, index) {

                            const regex = new RegExp("/"+value+"\\w+/g");

                            // const regex = /R\w+/g;
                            let m;

                            while ((m = regex.exec(tmp_white)) !== null) {
                                // This is necessary to avoid infinite loops with zero-width matches
                                if (m.index === regex.lastIndex) {
                                    regex.lastIndex++;
                                }

                                // The result can be accessed through the `m`-variable.
                                m.forEach((match, groupIndex) => {
                                    console.log(`Found match, group ${groupIndex}: ${match}`);
                                });
                            }
                        });



                    }
                    else {

                        // answer = answer.replaceAll(/1\.\.\./, '-1.');
                        // answer = answer.replaceAll(/2\.\.\./, '-2.');
                        // answer = answer.replaceAll(/3\.\.\./, '-3.');
                        // answer = answer.replaceAll(/4\.\.\./, '-4.');
                        // answer = answer.replaceAll(/5\.\.\./, '-5.');
                        // answer = answer.replaceAll(/6\.\.\./, '-6.');
                        // answer = answer.replaceAll(/7\.\.\./, '-7.');
                        // answer = answer.replaceAll(/8\.\.\./, '-8.');
                        // answer = answer.replaceAll(/9\.\.\./, '-9.');

                        answer = answer.replaceAll(/\s+1\.\.\./, '\n-1.');
                        answer = answer.replaceAll(/\s+2\.\.\./, '\n -2.');
                        answer = answer.replaceAll(/\s+3\.\.\./, '\n  -3.');
                        answer = answer.replaceAll(/\s+4\.\.\./, '\n   -4.');
                        answer = answer.replaceAll(/\s+5\.\.\./, '\n    -5.');
                        answer = answer.replaceAll(/\s+6\.\.\./, '\n     -6.');
                        answer = answer.replaceAll(/\s+7\.\.\./, '\n      -7.');
                        answer = answer.replaceAll(/\s+8\.\.\./, '\n       -8.');
                        answer = answer.replaceAll(/\s+9\.\.\./, '\n        -9.');

                        answer = answer.replaceAll(/\s+1\./, '\n1.');
                        answer = answer.replaceAll(/\s+2\./, '\n 2.');
                        answer = answer.replaceAll(/\s+3\./, '\n  3.');
                        answer = answer.replaceAll(/\s+4\./, '\n   4.');
                        answer = answer.replaceAll(/\s+5\./, '\n    5.');
                        answer = answer.replaceAll(/\s+6\./, '\n     6.');
                        answer = answer.replaceAll(/\s+7\./, '\n      7.');
                        answer = answer.replaceAll(/\s+8\./, '\n       8.');
                        answer = answer.replaceAll(/\s+9\./, '\n        9.');

                        answer = answer.replaceAll(/1\n 1./g, '1 1.');
                        answer = answer.replaceAll(/2\n 1./g, '2 1.');
                        answer = answer.replaceAll(/3\n 1./g, '3 1.');
                        answer = answer.replaceAll(/4\n 1./g, '4 1.');
                        answer = answer.replaceAll(/5\n 1./g, '5 1.');
                        answer = answer.replaceAll(/6\n 1./g, '6 1.');
                        answer = answer.replaceAll(/7\n 1./g, '7 1.');
                        answer = answer.replaceAll(/8\n 1./g, '8 1.');
                        answer = answer.replaceAll(/9\n 1./g, '9 1.');

                        answer = answer.replaceAll(/1\n 2./g, '1 2.');
                        answer = answer.replaceAll(/2\n 2./g, '2 2.');
                        answer = answer.replaceAll(/3\n 2./g, '3 2.');
                        answer = answer.replaceAll(/4\n 2./g, '4 2.');
                        answer = answer.replaceAll(/5\n 2./g, '5 2.');
                        answer = answer.replaceAll(/6\n 2./g, '6 2.');
                        answer = answer.replaceAll(/7\n 2./g, '7 2.');
                        answer = answer.replaceAll(/8\n 2./g, '8 2.');
                        answer = answer.replaceAll(/9\n 2./g, '9 2.');

                        answer = answer.replaceAll(/1\n 3./g, '1 3.');
                        answer = answer.replaceAll(/2\n 3./g, '2 3.');
                        answer = answer.replaceAll(/3\n 3./g, '3 3.');
                        answer = answer.replaceAll(/4\n 3./g, '4 3.');
                        answer = answer.replaceAll(/5\n 3./g, '5 3.');
                        answer = answer.replaceAll(/6\n 3./g, '6 3.');
                        answer = answer.replaceAll(/7\n 3./g, '7 3.');
                        answer = answer.replaceAll(/8\n 3./g, '8 3.');
                        answer = answer.replaceAll(/9\n 3./g, '9 3.');

                        answer = answer.replaceAll(/1\n 4./g, '1 4.');
                        answer = answer.replaceAll(/2\n 4./g, '2 4.');
                        answer = answer.replaceAll(/3\n 4./g, '3 4.');
                        answer = answer.replaceAll(/4\n 4./g, '4 4.');
                        answer = answer.replaceAll(/5\n 4./g, '5 4.');
                        answer = answer.replaceAll(/6\n 4./g, '6 4.');
                        answer = answer.replaceAll(/7\n 4./g, '7 4.');
                        answer = answer.replaceAll(/8\n 4./g, '8 4.');
                        answer = answer.replaceAll(/9\n 4./g, '9 4.');

                        answer = answer.replaceAll(/1\n 5./g, '1 5.');
                        answer = answer.replaceAll(/2\n 5./g, '2 5.');
                        answer = answer.replaceAll(/3\n 5./g, '3 5.');
                        answer = answer.replaceAll(/4\n 5./g, '4 5.');
                        answer = answer.replaceAll(/5\n 5./g, '5 5.');
                        answer = answer.replaceAll(/6\n 5./g, '6 5.');
                        answer = answer.replaceAll(/7\n 5./g, '7 5.');
                        answer = answer.replaceAll(/8\n 5./g, '8 5.');
                        answer = answer.replaceAll(/9\n 5./g, '9 5.');

                        answer = answer.replaceAll(/1\n 6./g, '1 6.');
                        answer = answer.replaceAll(/2\n 6./g, '2 6.');
                        answer = answer.replaceAll(/3\n 6./g, '3 6.');
                        answer = answer.replaceAll(/4\n 6./g, '4 6.');
                        answer = answer.replaceAll(/5\n 6./g, '5 6.');
                        answer = answer.replaceAll(/6\n 6./g, '6 6.');
                        answer = answer.replaceAll(/7\n 6./g, '7 6.');
                        answer = answer.replaceAll(/8\n 6./g, '8 6.');
                        answer = answer.replaceAll(/9\n 6./g, '9 6.');

                        answer = answer.replaceAll(/1\n 7./g, '1 7.');
                        answer = answer.replaceAll(/2\n 7./g, '2 7.');
                        answer = answer.replaceAll(/3\n 7./g, '3 7.');
                        answer = answer.replaceAll(/4\n 7./g, '4 7.');
                        answer = answer.replaceAll(/5\n 7./g, '5 7.');
                        answer = answer.replaceAll(/6\n 7./g, '6 7.');
                        answer = answer.replaceAll(/7\n 7./g, '7 7.');
                        answer = answer.replaceAll(/8\n 7./g, '8 7.');
                        answer = answer.replaceAll(/9\n 7./g, '9 7.');

                        answer = answer.replaceAll(/1\n 8./g, '1 8.');
                        answer = answer.replaceAll(/2\n 8./g, '2 8.');
                        answer = answer.replaceAll(/3\n 8./g, '3 8.');
                        answer = answer.replaceAll(/4\n 8./g, '4 8.');
                        answer = answer.replaceAll(/5\n 8./g, '5 8.');
                        answer = answer.replaceAll(/6\n 8./g, '6 8.');
                        answer = answer.replaceAll(/7\n 8./g, '7 8.');
                        answer = answer.replaceAll(/8\n 8./g, '8 8.');
                        answer = answer.replaceAll(/9\n 8./g, '9 8.');

                        answer = answer.replaceAll(/1\n 9./g, '1 9.');
                        answer = answer.replaceAll(/2\n 9./g, '2 9.');
                        answer = answer.replaceAll(/3\n 9./g, '3 9.');
                        answer = answer.replaceAll(/4\n 9./g, '4 9.');
                        answer = answer.replaceAll(/5\n 9./g, '5 9.');
                        answer = answer.replaceAll(/6\n 9./g, '6 9.');
                        answer = answer.replaceAll(/7\n 9./g, '7 9.');
                        answer = answer.replaceAll(/8\n 9./g, '8 9.');
                        answer = answer.replaceAll(/9\n 9./g, '9 9.');

                        answer = answer.replaceAll(/но\n-1/, ', "но" -1');
                        answer = answer.replaceAll(/но\n-2/, ', "но" -2');
                        answer = answer.replaceAll(/но\n-3/, ', "но" -3');
                        answer = answer.replaceAll(/но\n-4/, ', "но" -4');
                        answer = answer.replaceAll(/но\n-5/, ', "но" -5');
                        answer = answer.replaceAll(/но\n-6/, ', "но" -6');
                        answer = answer.replaceAll(/но\n-7/, ', "но" -7');
                        answer = answer.replaceAll(/но\n-8/, ', "но" -8');
                        answer = answer.replaceAll(/но\n-9/, ', "но" -9');
                    }



                    //get id from url
                    let txt_name = null;

                    const regex = /[\d]+$/gm;
                    const str = value;
                    let m;

                    while ((m = regex.exec(str)) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }

                        // The result can be accessed through the `m`-variable.
                        m.forEach((match, groupIndex) => {
                            // console.log(`Found match, group ${groupIndex}: ${match}`);
                            txt_name = match;
                        });
                    }

                    let textFile = '#checkmate\n' + '"' +data.title + '"\n' + white + '\n' + black + '\n' + answer;

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

                })

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
            let startAnswerText = answer.indexOf("1");
            let endAnswerText = answer.indexOf("Как");

            answer = answer.slice(startAnswerText, endAnswerText);

            let count_strings = answer.split('\n').length - 1;

            // for HTML файла
            let html = data.title;
            html += "\n" + white;
            html += "\n" + black;
            html += "\n" + answer;
            // end HTML

            answer = answer.replaceAll(/[*]/gm, '-');
            answer = answer.replaceAll(' # ', ',"#"');
            answer = answer.replaceAll(' #', ',"#"');
            answer = answer.replaceAll(/ \+/g, ',"+"');

            // пожалуйста, простите за этот код, меня. Я знаю, что он ужасен

            // дикий костыль
            answer = answer.replaceAll("0 угроза:", '0,"угроза:"');
            answer = answer.replaceAll("1 угроза:", '1,"угроза:"');
            answer = answer.replaceAll("2 угроза:", '2,"угроза:"');
            answer = answer.replaceAll("3 угроза:", '3,"угроза:"');
            answer = answer.replaceAll("4 угроза:", '4,"угроза:"');
            answer = answer.replaceAll("5 угроза:", '5,"угроза:"');
            answer = answer.replaceAll("6 угроза:", '6,"угроза:"');
            answer = answer.replaceAll("7 угроза:", '7,"угроза:"');
            answer = answer.replaceAll("8 угроза:", '8,"угроза:"');
            answer = answer.replaceAll("9 угроза:", '9,"угроза:"');

            answer = answer.replaceAll("0 цугцванг.", '0,"цугцванг."');
            answer = answer.replaceAll("1 цугцванг.", '1,"цугцванг."');
            answer = answer.replaceAll("2 цугцванг.", '2,"цугцванг."');
            answer = answer.replaceAll("3 цугцванг.", '3,"цугцванг."');
            answer = answer.replaceAll("4 цугцванг.", '4,"цугцванг."');
            answer = answer.replaceAll("5 цугцванг.", '5,"цугцванг."');
            answer = answer.replaceAll("6 цугцванг.", '6,"цугцванг."');
            answer = answer.replaceAll("7 цугцванг.", '7,"цугцванг."');
            answer = answer.replaceAll("8 цугцванг.", '8,"цугцванг."');
            answer = answer.replaceAll("9 цугцванг.", '9,"цугцванг."');


            answer = answer.replaceAll("Кр", 'K');
            answer = answer.replaceAll("Ф", 'Q');
            answer = answer.replaceAll("Л", 'R');
            answer = answer.replaceAll("К", 'N');
            answer = answer.replaceAll("С", 'B');
            answer = answer.replaceAll("п", 'p');

            answer = answer.replaceAll("K угроза:", 'K,"угроза:"');
            answer = answer.replaceAll("Q угроза:", 'Q,"угроза:"');
            answer = answer.replaceAll("R угроза:", 'R,"угроза:"');
            answer = answer.replaceAll("N угроза:", 'N,"угроза:"');
            answer = answer.replaceAll("B угроза:", 'B,"угроза:"');
            answer = answer.replaceAll("p угроза:", 'p,"угроза:"');

            white = white.replaceAll("Кр", 'K');
            white = white.replaceAll("Ф", 'Q');
            white = white.replaceAll("Л", 'R');
            white = white.replaceAll("К", 'N');
            white = white.replaceAll("С", 'B');
            white = white.replaceAll("п", 'p');

            black = black.replaceAll("Кр", 'K');
            black = black.replaceAll("Ф", 'Q');
            black = black.replaceAll("Л", 'R');
            black = black.replaceAll("К", 'N');
            black = black.replaceAll("С", 'B');
            black = black.replaceAll("п", 'p');

            let tmp_white = white;
            let rmp_black = black;

            answer = answer.replaceAll("! цугцванг.", ',"! цугцванг."');
            answer = answer.replaceAll("! угроза:", ',"! угроза:"');
            answer = answer.replaceAll(/\s+,/g, ',');

            if(count_strings === 1 || count_strings === 2) {

                answer = answer.replaceAll('1. ', '1.');
                answer = answer.replaceAll(' 2. ', '\n2.');
                answer = answer.replaceAll(' 3. ', '\n3.');
                answer = answer.replaceAll(' 4. ', '\n4.');
                answer = answer.replaceAll(" 5. ", '\n5.');
                answer = answer.replaceAll(' 6. ', '\n6.');
                answer = answer.replaceAll(' 7. ', '\n7.');
                answer = answer.replaceAll(' 8. ', '\n8.');
                answer = answer.replaceAll(' 9. ', '\n9.');

                answer = answer.replaceAll(/\n\s+/, '\n');

                const regex = /\d\.\w/gm;
                let m;
                let matchingWhite = [];
                let matchingBlack = [];

                while ((m = regex.exec(answer)) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }

                    m.forEach((match, groupIndex) => {
                        matchingWhite.push(match.substr(2));
                    });
                }

                matchingWhite.forEach(function (value, index) {

                    const regex = new RegExp("/"+value+"\\w+/g");

                    // const regex = /R\w+/g;
                    let m;

                    while ((m = regex.exec(tmp_white)) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }

                        // The result can be accessed through the `m`-variable.
                        m.forEach((match, groupIndex) => {
                            console.log(`Found match, group ${groupIndex}: ${match}`);
                        });
                    }
                });



            }
            else {

                // answer = answer.replaceAll(/1\.\.\./, '-1.');
                // answer = answer.replaceAll(/2\.\.\./, '-2.');
                // answer = answer.replaceAll(/3\.\.\./, '-3.');
                // answer = answer.replaceAll(/4\.\.\./, '-4.');
                // answer = answer.replaceAll(/5\.\.\./, '-5.');
                // answer = answer.replaceAll(/6\.\.\./, '-6.');
                // answer = answer.replaceAll(/7\.\.\./, '-7.');
                // answer = answer.replaceAll(/8\.\.\./, '-8.');
                // answer = answer.replaceAll(/9\.\.\./, '-9.');

                answer = answer.replaceAll(/\s+1\.\.\./, '\n-1.');
                answer = answer.replaceAll(/\s+2\.\.\./, '\n -2.');
                answer = answer.replaceAll(/\s+3\.\.\./, '\n  -3.');
                answer = answer.replaceAll(/\s+4\.\.\./, '\n   -4.');
                answer = answer.replaceAll(/\s+5\.\.\./, '\n    -5.');
                answer = answer.replaceAll(/\s+6\.\.\./, '\n     -6.');
                answer = answer.replaceAll(/\s+7\.\.\./, '\n      -7.');
                answer = answer.replaceAll(/\s+8\.\.\./, '\n       -8.');
                answer = answer.replaceAll(/\s+9\.\.\./, '\n        -9.');

                answer = answer.replaceAll(/\s+1\./, '\n1.');
                answer = answer.replaceAll(/\s+2\./, '\n 2.');
                answer = answer.replaceAll(/\s+3\./, '\n  3.');
                answer = answer.replaceAll(/\s+4\./, '\n   4.');
                answer = answer.replaceAll(/\s+5\./, '\n    5.');
                answer = answer.replaceAll(/\s+6\./, '\n     6.');
                answer = answer.replaceAll(/\s+7\./, '\n      7.');
                answer = answer.replaceAll(/\s+8\./, '\n       8.');
                answer = answer.replaceAll(/\s+9\./, '\n        9.');

                answer = answer.replaceAll(/1\n 1./g, '1 1.');
                answer = answer.replaceAll(/2\n 1./g, '2 1.');
                answer = answer.replaceAll(/3\n 1./g, '3 1.');
                answer = answer.replaceAll(/4\n 1./g, '4 1.');
                answer = answer.replaceAll(/5\n 1./g, '5 1.');
                answer = answer.replaceAll(/6\n 1./g, '6 1.');
                answer = answer.replaceAll(/7\n 1./g, '7 1.');
                answer = answer.replaceAll(/8\n 1./g, '8 1.');
                answer = answer.replaceAll(/9\n 1./g, '9 1.');

                answer = answer.replaceAll(/1\n 2./g, '1 2.');
                answer = answer.replaceAll(/2\n 2./g, '2 2.');
                answer = answer.replaceAll(/3\n 2./g, '3 2.');
                answer = answer.replaceAll(/4\n 2./g, '4 2.');
                answer = answer.replaceAll(/5\n 2./g, '5 2.');
                answer = answer.replaceAll(/6\n 2./g, '6 2.');
                answer = answer.replaceAll(/7\n 2./g, '7 2.');
                answer = answer.replaceAll(/8\n 2./g, '8 2.');
                answer = answer.replaceAll(/9\n 2./g, '9 2.');

                answer = answer.replaceAll(/1\n 3./g, '1 3.');
                answer = answer.replaceAll(/2\n 3./g, '2 3.');
                answer = answer.replaceAll(/3\n 3./g, '3 3.');
                answer = answer.replaceAll(/4\n 3./g, '4 3.');
                answer = answer.replaceAll(/5\n 3./g, '5 3.');
                answer = answer.replaceAll(/6\n 3./g, '6 3.');
                answer = answer.replaceAll(/7\n 3./g, '7 3.');
                answer = answer.replaceAll(/8\n 3./g, '8 3.');
                answer = answer.replaceAll(/9\n 3./g, '9 3.');

                answer = answer.replaceAll(/1\n 4./g, '1 4.');
                answer = answer.replaceAll(/2\n 4./g, '2 4.');
                answer = answer.replaceAll(/3\n 4./g, '3 4.');
                answer = answer.replaceAll(/4\n 4./g, '4 4.');
                answer = answer.replaceAll(/5\n 4./g, '5 4.');
                answer = answer.replaceAll(/6\n 4./g, '6 4.');
                answer = answer.replaceAll(/7\n 4./g, '7 4.');
                answer = answer.replaceAll(/8\n 4./g, '8 4.');
                answer = answer.replaceAll(/9\n 4./g, '9 4.');

                answer = answer.replaceAll(/1\n 5./g, '1 5.');
                answer = answer.replaceAll(/2\n 5./g, '2 5.');
                answer = answer.replaceAll(/3\n 5./g, '3 5.');
                answer = answer.replaceAll(/4\n 5./g, '4 5.');
                answer = answer.replaceAll(/5\n 5./g, '5 5.');
                answer = answer.replaceAll(/6\n 5./g, '6 5.');
                answer = answer.replaceAll(/7\n 5./g, '7 5.');
                answer = answer.replaceAll(/8\n 5./g, '8 5.');
                answer = answer.replaceAll(/9\n 5./g, '9 5.');

                answer = answer.replaceAll(/1\n 6./g, '1 6.');
                answer = answer.replaceAll(/2\n 6./g, '2 6.');
                answer = answer.replaceAll(/3\n 6./g, '3 6.');
                answer = answer.replaceAll(/4\n 6./g, '4 6.');
                answer = answer.replaceAll(/5\n 6./g, '5 6.');
                answer = answer.replaceAll(/6\n 6./g, '6 6.');
                answer = answer.replaceAll(/7\n 6./g, '7 6.');
                answer = answer.replaceAll(/8\n 6./g, '8 6.');
                answer = answer.replaceAll(/9\n 6./g, '9 6.');

                answer = answer.replaceAll(/1\n 7./g, '1 7.');
                answer = answer.replaceAll(/2\n 7./g, '2 7.');
                answer = answer.replaceAll(/3\n 7./g, '3 7.');
                answer = answer.replaceAll(/4\n 7./g, '4 7.');
                answer = answer.replaceAll(/5\n 7./g, '5 7.');
                answer = answer.replaceAll(/6\n 7./g, '6 7.');
                answer = answer.replaceAll(/7\n 7./g, '7 7.');
                answer = answer.replaceAll(/8\n 7./g, '8 7.');
                answer = answer.replaceAll(/9\n 7./g, '9 7.');

                answer = answer.replaceAll(/1\n 8./g, '1 8.');
                answer = answer.replaceAll(/2\n 8./g, '2 8.');
                answer = answer.replaceAll(/3\n 8./g, '3 8.');
                answer = answer.replaceAll(/4\n 8./g, '4 8.');
                answer = answer.replaceAll(/5\n 8./g, '5 8.');
                answer = answer.replaceAll(/6\n 8./g, '6 8.');
                answer = answer.replaceAll(/7\n 8./g, '7 8.');
                answer = answer.replaceAll(/8\n 8./g, '8 8.');
                answer = answer.replaceAll(/9\n 8./g, '9 8.');

                answer = answer.replaceAll(/1\n 9./g, '1 9.');
                answer = answer.replaceAll(/2\n 9./g, '2 9.');
                answer = answer.replaceAll(/3\n 9./g, '3 9.');
                answer = answer.replaceAll(/4\n 9./g, '4 9.');
                answer = answer.replaceAll(/5\n 9./g, '5 9.');
                answer = answer.replaceAll(/6\n 9./g, '6 9.');
                answer = answer.replaceAll(/7\n 9./g, '7 9.');
                answer = answer.replaceAll(/8\n 9./g, '8 9.');
                answer = answer.replaceAll(/9\n 9./g, '9 9.');

                answer = answer.replaceAll(/но\n-1/, ', "но" -1');
                answer = answer.replaceAll(/но\n-2/, ', "но" -2');
                answer = answer.replaceAll(/но\n-3/, ', "но" -3');
                answer = answer.replaceAll(/но\n-4/, ', "но" -4');
                answer = answer.replaceAll(/но\n-5/, ', "но" -5');
                answer = answer.replaceAll(/но\n-6/, ', "но" -6');
                answer = answer.replaceAll(/но\n-7/, ', "но" -7');
                answer = answer.replaceAll(/но\n-8/, ', "но" -8');
                answer = answer.replaceAll(/но\n-9/, ', "но" -9');
            }



            //get id from url
            let txt_name = null;

            const regex = /[\d]+$/gm;
            const str = req.body.url;
            let m;

            while ((m = regex.exec(str)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                // The result can be accessed through the `m`-variable.
                m.forEach((match, groupIndex) => {
                    // console.log(`Found match, group ${groupIndex}: ${match}`);
                    txt_name = match;
                });
            }

            let textFile = '#checkmate\n' + '"' +data.title + '"\n' + white + '\n' + black + '\n' + answer;

            fs.writeFile('parser/id/txt/' + txt_name + '.txt', textFile, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("Файл " + txt_name + ".txt сохранён.");
            });

            // for HTML
            fs.writeFile('parser/id/html/' + txt_name + '.html', html, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("Файл " + txt_name + ".html сохранён.");
            });


            res.render("parser", {
                title: "Answer",
                name : data.title,
                white: white,
                black: black,
                result: answer,
                textFile : textFile,
                txt_name : txt_name
            });
        })
});

module.exports = router;

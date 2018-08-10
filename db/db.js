let mysql = require('mysql');

let con = mysql.createConnection({
    host: "mastersv.ru",
    user: "64dbu",
    password: "Unhj86*2",
    port: 3306,
    database: '64db'
});

con.connect(function(err) {
    if (err)
        console.log(err);

    console.log("Connected to DB: 195.2.77.70. like a 'pma' user");
});

module.exports.connection = con;
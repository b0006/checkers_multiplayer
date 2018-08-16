module.exports = function(sequelize, Sequelize) {

    let User = sequelize.define('user',
        {
            id: {
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            email: {
                type: Sequelize.STRING,
                validate: {
                    isEmail: true
                }
            },
            hash: {
                type: Sequelize.STRING,
                notEmpty: true
            },
            nickname: {
                type: Sequelize.STRING
            },
            created_games : {
                type: Sequelize.TINYINT
            },
            raiting: {
                type: Sequelize.INTEGER
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: '1'
            }
        },
        // {
        //     timestamps: false //without createdAt and modifeAt fields at mysql
        // }
    );

    return User;

};
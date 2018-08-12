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

            salt: {
                type: Sequelize.STRING
            },

            device_type: {
                type: Sequelize.STRING
            },

            nickname: {
                type: Sequelize.STRING
            },

            created_games : {
                type: Sequelize.TINYINT
            },
            raiting: {
                type: Sequelize.INTEGER
            }
            // status: {
            //     type: Sequelize.ENUM('active', 'inactive'),
            //     defaultValue: 'active'
            // }
        },
        {
            timestamps: false //without createdAt and modifeAt fields at mysql
        }
    );

    return User;

};
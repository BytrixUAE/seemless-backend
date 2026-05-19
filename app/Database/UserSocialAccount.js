const { SOCIAL_ACCOUNT_TYPE_ENUM } = require("../config/enum");

module.exports = (sequelize, Sequelize) => {

    const UserSocialAccount = sequelize.define("user_social_accounts", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            
                allowNull: false
            },
    account_type: {
            type: Sequelize.ENUM(...Object.values(SOCIAL_ACCOUNT_TYPE_ENUM)),
            allowNull: false
        },
    url: {
            type: Sequelize.STRING(500),
            allowNull: false
        },
    is_active: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
    createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
        },
    updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
        },
    deletedAt: {
            type: Sequelize.DATE,
            
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
    });

    return UserSocialAccount;
};
  
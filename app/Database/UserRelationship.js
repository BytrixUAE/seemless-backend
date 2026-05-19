const { USER_RELATIONSHIP_ACTION_ENUM } = require("../config/enum");

module.exports = (sequelize, Sequelize) => {

    const UserRelationship = sequelize.define("user_relationships", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    user_one_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        
            allowNull: false
        },
    user_two_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        
            allowNull: false
        },
    user_one_action: {
            type: Sequelize.INTEGER,
            defaultValue: USER_RELATIONSHIP_ACTION_ENUM.PENDING,
            allowNull: true
        },
    user_two_action: {
            type: Sequelize.INTEGER,
            defaultValue: USER_RELATIONSHIP_ACTION_ENUM.PENDING,
            allowNull: true
        },
    user_one_hidden_until: {
            type: Sequelize.DATE,
            allowNull: true
        },
    user_two_hidden_until: {
            type: Sequelize.DATE,
            allowNull: true
        },
    connected_time: {
            type: Sequelize.DATE,
            
            allowNull: true
        },
    location: {
            type: Sequelize.STRING(500),
            allowNull: true
        },
    latitude: {
            type: Sequelize.FLOAT,
            allowNull: true
        },
    longitude: {
            type: Sequelize.FLOAT,
            allowNull: true
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

    return UserRelationship;
};
  
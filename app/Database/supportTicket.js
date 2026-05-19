const { SUPPORT_TICKET_STATUS_ENUM } = require("../config/enum");
module.exports = (sequelize, Sequelize) => {

    const supportTicket = sequelize.define("support_tickets", {
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
        
            allowNull: true
        },
    first_name: {
            type: Sequelize.STRING(100),
            
            allowNull: false
        },
    last_name: {
            type: Sequelize.STRING(100),
            
            allowNull: false
        },
    term: {
            type: Sequelize.STRING(150),
            
            allowNull: false
        },
    message: {
            type: Sequelize.TEXT,
            
            allowNull: false
        },
    admin_notes: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    status: {
            type: Sequelize.INTEGER,
            defaultValue: SUPPORT_TICKET_STATUS_ENUM.PENDING,
            allowNull: false
        },
    resolved_at: {
            type: Sequelize.DATE,
            
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

    return supportTicket;
};
  
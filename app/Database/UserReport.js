
module.exports = (sequelize, Sequelize) => {

    const UserReport = sequelize.define("user_reports", {
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
    reported_user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        
            allowNull: false
        },
    reason: {
            type: Sequelize.STRING(255),
            
            allowNull: false
        },
    notes: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    admin_notes: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    status: {
            type: Sequelize.INTEGER,
            defaultValue: 10,
            allowNull: true
        },
    createdAt: {
            type: Sequelize.DATE,
            // field: 'created_at',
            defaultValue: Sequelize.NOW,
            allowNull: true
        },
    updatedAt: {
            type: Sequelize.DATE,
            // field: 'updated_at',
            defaultValue: Sequelize.NOW,
            allowNull: true
        },
    deletedAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
    });

    return UserReport;
};
  
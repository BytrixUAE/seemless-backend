
module.exports = (sequelize, Sequelize) => {

    const UserBlock = sequelize.define("user_blocks", {
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
    block_user_id: {
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

    return UserBlock;
};
  

module.exports = (sequelize, Sequelize) => {

    const Hobby = sequelize.define("hobbies", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    title: {
            type: Sequelize.STRING(150),
            
            allowNull: false
        },
    icon_url: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    description: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: true
        },
    updatedAt: {
            type: Sequelize.DATE,
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

    return Hobby;
};
  
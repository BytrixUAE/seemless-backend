
module.exports = (sequelize, Sequelize) => {

    const AppUpdate = sequelize.define("app_updates", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        android_version: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        ios_version: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        force_update: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0,
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

    return AppUpdate;
};
  
module.exports = (sequelize, Sequelize) => {
    const WebhookLog = sequelize.define("webhook_logs", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        data: {
            type: Sequelize.TEXT('long'),
            allowNull: false
        },
        platform: {
            type: Sequelize.STRING(200),
            allowNull: false
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    });

    return WebhookLog;
};

module.exports = (sequelize, Sequelize) => {
    const UserSubscriptionEvent = sequelize.define("user_subscription_events", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: require("./User.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        subscriber_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            onDelete: 'CASCADE',
            references: {
                model: require("./Subscriber.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        status: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        data: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    });

    return UserSubscriptionEvent;
};

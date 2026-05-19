const {PLATFORMS} = require("../config/enum");

module.exports = (sequelize, Sequelize) => {
    const Subscriber = sequelize.define("subscribers", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        package_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: true,
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
            references: {
                model: require("./SubscriptionPackage.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            references: {
                model: require("./User.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        subscriber_id: {
            type: Sequelize.STRING(100),
            allowNull: true,
        },
        platform: {
            type: Sequelize.ENUM,
            values: [PLATFORMS.ANDROID, PLATFORMS.IOS],
        },
        type: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        amount: {
            type: Sequelize.STRING(50),
            allowNull: true,
        },
        currency: {
            type: Sequelize.STRING(100),
            allowNull: true,
        },
        expiry_date: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        transaction_reference: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        status: {
            type: Sequelize.STRING(200),
            allowNull: false,
        },
        data: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    });

    return Subscriber;
};

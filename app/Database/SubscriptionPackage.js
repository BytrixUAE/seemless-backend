const { SUBSCRIPTION_PACKAGE_TYPE_ENUM } = require("../config/enum");

module.exports = (sequelize, Sequelize) => {

    const SubscriptionPackage = sequelize.define("subscription_packages", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    name: {
            type: Sequelize.STRING(100),
            
            allowNull: false
        },
    description: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    price: {
            type: Sequelize.DECIMAL(10, 2),
            
            allowNull: false
        },
    duration_days: {
            type: Sequelize.INTEGER,
            
            allowNull: false
        },
    type: {
            type: Sequelize.ENUM(...Object.values(SUBSCRIPTION_PACKAGE_TYPE_ENUM)),
            allowNull: false
        },
    stripe_price_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    stripe_product_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    apple_product_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    google_product_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    status: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
    daily_encounter_limit: {
            type: Sequelize.INTEGER,
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

    return SubscriptionPackage;
};
  
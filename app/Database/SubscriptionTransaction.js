const { SUBSCRIPTION_TRANSACTION_PAYMENT_TYPE_ENUM, SUBSCRIPTION_TRANSACTION_STATUS_ENUM } = require("../config/enum");

module.exports = (sequelize, Sequelize) => {

    const SubscriptionTransaction = sequelize.define("subscription_transactions", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    subscription_id: {
            type: Sequelize.INTEGER,
            
        references: {
            model: 'subscriptions',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        
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
    amount: {
            type: Sequelize.DECIMAL(10, 2),
            
            allowNull: false
        },
    currency: {
            type: Sequelize.STRING(10),
            defaultValue: 'USD',
            allowNull: false
        },
    payment_type: {
            type: Sequelize.ENUM(...Object.values(SUBSCRIPTION_TRANSACTION_PAYMENT_TYPE_ENUM)),
            defaultValue: SUBSCRIPTION_TRANSACTION_PAYMENT_TYPE_ENUM.INITIAL,
            allowNull: false
        },
    billing_reason: {
            type: Sequelize.STRING(50),
            
            allowNull: true
        },
    status: {
            type: Sequelize.ENUM(...Object.values(SUBSCRIPTION_TRANSACTION_STATUS_ENUM)),
            defaultValue: SUBSCRIPTION_TRANSACTION_STATUS_ENUM.PENDING,
            allowNull: false
        },
    stripe_invoice_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    stripe_payment_intent_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    stripe_charge_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    period_start: {
            type: Sequelize.DATE,
            
            allowNull: true
        },
    period_end: {
            type: Sequelize.DATE,
            
            allowNull: true
        },
    payment_date: {
            type: Sequelize.DATE,
            
            allowNull: true
        },
    metadata: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    failure_reason: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    refund_amount: {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: true
        },
    refund_date: {
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

    return SubscriptionTransaction;
};
  
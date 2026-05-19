
module.exports = (sequelize, Sequelize) => {

    const StripeWebhook = sequelize.define("stripe_webhooks", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
    event_id: {
            type: Sequelize.STRING(255),
            unique: true,
            allowNull: false
        },
    event_type: {
            type: Sequelize.STRING(100),
            
            allowNull: false
        },
    object_type: {
            type: Sequelize.STRING(100),
            
            allowNull: true
        },
    object_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    livemode: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
    api_version: {
            type: Sequelize.STRING(20),
            
            allowNull: true
        },
    request_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    payload: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    processed: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
    processing_error: {
            type: Sequelize.TEXT,
            
            allowNull: true
        },
    subscription_id: {
            type: Sequelize.INTEGER,
            
        references: {
            model: 'subscriptions',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        
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

    return StripeWebhook;
};
  

module.exports = (sequelize, Sequelize) => {

    const Subscription = sequelize.define("subscriptions", {
        id: {
            type: Sequelize.INTEGER,
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
    package_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            
        references: {
            model: 'subscription_packages',
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
    start_date: {
            type: Sequelize.DATE,
            
            allowNull: false
        },
    end_date: {
            type: Sequelize.DATE,
            
            allowNull: false
        },
    status: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
    stripe_subscription_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    stripe_customer_id: {
            type: Sequelize.STRING(255),
            
            allowNull: true
        },
    stripe_payment_intent_id: {
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

    return Subscription;
};
  
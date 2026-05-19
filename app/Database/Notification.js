module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notifications", {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: require("./User.js")(sequelize, Sequelize), // Assumes User model is defined in User.js
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        type: {
            type: Sequelize.STRING(200),
            allowNull: false,
        },
        title: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        message: {
            type: Sequelize.STRING(300),
            allowNull: false,
        },
        badge: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        mutable_content: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        content_available: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        image_url: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        payload: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        is_read: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    }, {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
        paranoid: true, // Enables `deletedAt` for soft deletes
    });

    return Notification;
};

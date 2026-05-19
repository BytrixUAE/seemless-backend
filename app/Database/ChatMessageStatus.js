module.exports = (sequelize, Sequelize) => {
    const ChatMessageStatus = sequelize.define("chat_message_status", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "NO ACTION",
            references: {
                model: require("./User.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        chat_room_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "NO ACTION",
            references: {
                model: require("./ChatRooms.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        message_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "NO ACTION",
            references: {
                model: require("./ChatMessages.js")(sequelize, Sequelize),
                key: "id",
            },
        },
        is_sender: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        read_timestamp: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    });

    return ChatMessageStatus;
};

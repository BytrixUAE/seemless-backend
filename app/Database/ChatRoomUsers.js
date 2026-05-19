module.exports = (sequelize, Sequelize) => {
    const ChatRoomUsers = sequelize.define("chat_room_users", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
        is_owner: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        is_subAdmin: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: Sequelize.STRING(30),
            allowNull: false,
        },
        unread_message_count: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
        is_anonymous: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
        },
        is_leaved: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_kicked: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        is_blocked: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        blocked_timestamp: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        is_visible: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        last_message_timestamp: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    });

    return ChatRoomUsers;
};

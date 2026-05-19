module.exports = (db) => {
    /*Chat Rooms Relation */
    db.users.hasMany(db.chat_rooms, { foreignKey: "user_id", sourceKey: "id", as: 'ChatRoom_UserSlug' });
    db.chat_rooms.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: "id",
        as: 'ChatRoom_UserSlug'
    });

    /*Chat Rooms User Relation */
    db.users.hasMany(db.chat_room_users, { foreignKey: "user_id", sourceKey: "id", as: 'ChatRoomUser_UserSlug' });
    db.chat_room_users.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: "id",
        as: 'ChatRoomUser_UserSlug'
    });

    db.chat_rooms.hasMany(db.chat_room_users, { foreignKey: "chat_room_id", sourceKey: "id", as: 'ChatRoomUser_ChatRoomSlug' });
    db.chat_room_users.belongsTo(db.chat_rooms, {
        foreignKey: "chat_room_id",
        targetKey: "id",
        as: 'ChatRoomUser_ChatRoomSlug'
    });

    db.chat_room_users.hasMany(db.chat_room_users, {
        foreignKey: "chat_room_id",
        sourceKey: 'chat_room_id',
        as: 'ChatRoomUser_ChatRoomSlug_Self'
    });

    db.chat_room_users.hasOne(db.chat_room_users, {
        foreignKey: "chat_room_id",
        sourceKey: 'chat_room_id',
        as: 'ChatRoomUser_ChatRoomSlug_Self_Single'
    });


    /*Chat Message Relation */
    db.users.hasMany(db.chat_messages, { foreignKey: "user_id", sourceKey: "id", as: 'ChatMessage_UserSlug' });
    db.chat_messages.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: "id",
        as: 'ChatMessage_UserSlug'
    });

    db.chat_rooms.hasOne(db.chat_messages, { foreignKey: "chat_room_id", sourceKey: "id", as: 'ChatMessage_ChatRoomSlug_Single' });
    db.chat_rooms.hasMany(db.chat_messages, { foreignKey: "chat_room_id", sourceKey: "id", as: 'ChatMessage_ChatRoomSlug' });
    db.chat_messages.belongsTo(db.chat_rooms, {
        foreignKey: "chat_room_id",
        targetKey: "id",
        as: 'ChatMessage_ChatRoomSlug'
    });

    db.chat_messages.belongsTo(db.chat_messages, {
        foreignKey: "reply_message_id",
        targetKey: "id",
        as: 'ChatMessage_ChatMessageSlug'
    });

    /*Chat Message Status Relation */
    db.users.hasMany(db.chat_message_status, { foreignKey: "user_id", sourceKey: "id", as: 'ChatMessageStatus_UserSlug' });
    db.chat_message_status.belongsTo(db.users, {
        foreignKey: "user_id",
        targetKey: "id",
        as: 'ChatMessageStatus_UserSlug'
    });

    db.chat_rooms.hasMany(db.chat_message_status, { foreignKey: "chat_room_id", sourceKey: "id", as: 'ChatMessageStatus_ChatRoomSlug' });
    db.chat_message_status.belongsTo(db.chat_rooms, {
        foreignKey: "chat_room_id",
        targetKey: "id",
        as: 'ChatMessageStatus_ChatRoomSlug'
    });

    db.chat_messages.hasOne(db.chat_message_status, { foreignKey: "message_id", sourceKey: "id", as: 'ChatMessageStatus_ChatMessageSlug_Single' });
    db.chat_messages.hasMany(db.chat_message_status, { foreignKey: "message_id", sourceKey: "id", as: 'ChatMessageStatus_ChatMessageSlug' });
    db.chat_message_status.belongsTo(db.chat_messages, {
        foreignKey: "message_id",
        targetKey: "id",
        as: 'ChatMessageStatus_ChatMessageSlug'
    });
}
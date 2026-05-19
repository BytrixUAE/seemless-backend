const MessageController = require("../Controllers/Socket/User/MessageController");
const ChatRoomController = require("../Controllers/Socket/User/ChatRoomController");
const ChatRoomUserController = require("../Controllers/Socket/User/ChatRoomUserController");
const constants = require("../config/constants");
const SocketStore = require("../config/SocketStore");

module.exports = (socket, io) => {
    socket.on('_getOnlineStatus', async (params = {}, callback = () => { }) => {
        const user_ids = params.user_ids || [];
        if (user_ids.length === 0) {
            const online_user_ids = SocketStore.getOnlineUserIds();
            return callback(null, { online_user_ids });
        }
        const users = {};
        user_ids.forEach((id) => {
            users[id] = SocketStore.isOnline(id);
        });
        callback(null, { users, online_user_ids: user_ids.filter((id) => users[id]) });
    });

    socket.on('_joinRoom', async (params) => {
        console.log("Join Room Called By: ", socket.user);
        console.log("Join Room Called : ", params);
        console.log("Socket Rooms Before : ", socket.rooms);
        socket.join('room_' + params)
        socket.emit("room_", "Room joined successfully");
        console.log("Socket Rooms After : ", socket.rooms);
    })


    socket.on('_leaveRoom', async (params) => {
        console.log("Leave Room Called : ", params);
        console.log("Socket Rooms Before : ", socket.rooms);
        socket.leave('room_' + params)
        socket.emit("room_", "Room leaved successfully");
        console.log("Socket Rooms After : ", socket.rooms);
    })

    /**-------------------------------- Chat Message Listners ---------------------------------------------*/
    socket.on('_sendMessage', async (params = {}, callback = () => { }) => {
        socket.body = params;
        socket.callback = callback
        await (new MessageController()).store({ io: io, socket })
        return true;
    })

    socket.on('_deleteChatMessage', async (params = {}, callback = () => { }) => {
        socket.body = params;
        socket.callback = callback
        await (new MessageController()).deleteChatMessage({ io: io, socket })
        return true;
    })

    socket.on('_getChatThreads', async (params = {}, callback = () => { }) => {
        socket.body = params;
        socket.callback = callback;
        socket.query = {};
        socket.query.page = params?.page || 0;
        socket.query.limit = params?.limit || constants.PAGINATION_LIMIT;
        await (new ChatRoomUserController()).getChatThreads({ io: io, socket })
        return true;
    })

    socket.on('_getGroupThreads', async (params = {}, callback = () => { }) => {
        socket.body = params;
        socket.callback = callback;
        socket.query = {};
        await (new ChatRoomUserController()).getGroupThreads({ io: io, socket })
        return true;
    })
    socket.on('_getUnreadThreadsCount', async (params = {}, callback = () => { }) => {
        socket.body = params;
        socket.callback = callback;
        socket.query = {};
        await (new ChatRoomUserController()).getUnreadThreadsCount({ io: io, socket })
        return true;
    })
    socket.on('_loadChatHistory', async (params = {}) => {
        console.log("Load Chat History : ", params)
        socket.body = params;
        socket.query = {};
        socket.query.page = params?.page || 0;
        socket.query.limit = params?.limit || constants.PAGINATION_LIMIT;
        socket.query.offset = params?.offset;
        await (new MessageController()).loadChatHistory({ io: io, socket })
        return true;
    })

    socket.on('_loadChatHistoryBetweenUsers', async (params = {}) => {
        console.log("Load Chat History Between Users : ", params)
        socket.body = params;
        socket.query = {};
        socket.query.page = params?.page || 0;
        socket.query.limit = params?.limit || constants.PAGINATION_LIMIT;
        socket.query.offset = params?.offset;
        await (new MessageController()).loadChatHistoryBetweenUser({ io: io, socket })
        return true;
    })

    socket.on('_resetMessageCount', async (params = {}) => {
        console.log("Reset Message Count Params : ", params)
        socket.body = params;
        await (new ChatRoomUserController()).resetMessageCount({ io: io, socket })
        return true;
    })

    socket.on('_markMessagesAsSeen', async (params = {}, callback = () => { }) => {
        socket.body = params;
        socket.callback = callback;
        await (new MessageController()).markMessagesAsSeen({ io: io, socket });
        return true;
    })

    socket.on('_blockChatThread', async (params = {}, callback = () => { }) => {
        socket.callback = callback;
        socket.body = params;
        await (new ChatRoomUserController()).blockChatThread({ io: io, socket })
        return true;
    })

    socket.on('_deleteChatThread', async (params = {}, callback = () => { }) => {
        socket.callback = callback;
        socket.body = params;
        await (new ChatRoomUserController()).deleteChatThread({ io: io, socket })
        return true;
    })

    socket.on('_findOrCreateRoom', async (params = {}) => {
        socket.body = params;
        await (new ChatRoomUserController()).getOrCreateRoom({ io: io, socket })
        return true;
    })

    /** ------------------------------------- Group Chat Listeners ----------------------------- */

    socket.on('_createGroup', async (params = {}) => {
        socket.body = params;
        await (new ChatRoomController()).createGroup({ io: io, socket })
        return true;
    })

    socket.on('_updateGroupDetails', async (params = {}) => {
        socket.body = params;
        await (new ChatRoomController()).updateGroupDetails({ io: io, socket })
        return true;
    })

    socket.on('_addMember', async (params = {}) => {
        socket.body = params;
        await (new ChatRoomUserController()).addMember({ io: io, socket })
        return true;
    })

    socket.on('_removeMember', async (params = {}) => {
        socket.body = params;
        await (new ChatRoomUserController()).removeMember({ io: io, socket })
        return true;
    })

    socket.on('_leaveGroup', async (params = {}) => {
        socket.body = params;
        await (new ChatRoomUserController()).leaveGroup({ io: io, socket })
        return true;
    })
}
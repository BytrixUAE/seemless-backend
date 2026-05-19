const io = require("socket.io");
const SocketAuthentication = require("./app/Middleware/SocketAuthentication");
const ChatRoomUser = require("./app/Models/ChatRoomUser");
const ChatListener = require("./app/Listeners/ChatListener");
const SocketStore = require("./app/config/SocketStore");

class Socket {
    constructor(server) {
        this.io = io(server);
        this.io.use(SocketAuthentication.authenticate)
            .on('connection', async (socket) => {
                const user_id = socket.user.id;
                socket.join("user_" + user_id);
                const user_rooms = await ChatRoomUser.instance().getUserRooms(user_id);
                console.log("User Rooms : ", user_rooms);
                for (let i = 0; i < user_rooms.length; i++) {
                    socket.join("room_" + user_rooms[i].chat_room_id);
                }
                // Mark user online and broadcast to all connected clients
                SocketStore.setOnline(user_id);
                this.io.emit('user_online', { user_id });
                socket.on('disconnect', () => {
                    if (SocketStore.setOffline(user_id)) {
                        this.io.emit('user_offline', { user_id });
                    }
                });
                this.connection(socket);
            });
    }
    getIo() {
        return this.io;
    }
    connection(socket) {
        console.log("Connection created");
        ChatListener(socket, this.io);

    }


    static instance(server) {
        return new this(server);
    }
}

module.exports = Socket;
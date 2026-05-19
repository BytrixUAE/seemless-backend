const _ = require("lodash");
const ChatRoom = require("../../../Models/ChatRoom");
const SocketRestController = require("../../SocketRestController");
const User = require("../../../Models/User");
const { getImageUrl, validateAll } = require("../../../Helper");
const SocketStore = require("../../../config/SocketStore");
const {
    MESSAGE_TYPE_ENUM,
    BADGE_TYPE_ENUM,
    CHAT_ROOM_TYPE_ENUM,
    ROLES
} = require("../../../config/enum");
const ChatMessages = require("../../../Models/ChatMessages");
const ChatMessageStatus = require("../../../Models/ChatMessageStatus");

class ChatRoomUserController extends SocketRestController {
    constructor() {
        super("ChatRoomUser");
        this.resource = "ChatRoomUser";
        this.io; // io obj
        this.socket; // request obj
        this.params = {}; // this is used for get parameters from url
        this.emitter = [];
    }

    async getChatThreads({ io, socket }) {
        this.io = io;
        this.socket = socket;
        const user_id = this.socket.user.id;
        const params = this.socket.body || {};
        if (socket.user.user_type == ROLES.ADMIN){
            params.is_admin = 1;
        }
        let records = await this.modal.getChatThreads(user_id, params);
        records = (records || []).map((thread) => {
            const other = thread.ChatRoomUser_ChatRoomSlug_Self_Single?.ChatRoomUser_UserSlug;
            const other_user_id = other?.id;
            return {
                ...thread,
                is_online: other_user_id ? SocketStore.isOnline(other_user_id) : false,
            };
        });

        this.resource = "ChatThreads";
        this.__is_paginate = false;
        this.emitter.push((obj) => this.socket.emit("getChatThreads_", obj));

        await this.sendResponse(200, "Retrieved data successfully!.", records);
        return;
    }

    async getGroupThreads({ io, socket }) {
        this.io = io;
        this.socket = socket;
        const user_id = this.socket.user.id;

        let records = await this.modal.getGroupThreads(user_id);
        records = (records || []).map((thread) => {
            const members = thread.ChatRoomUser_ChatRoomSlug_Self;
            if (Array.isArray(members)) {
                thread.ChatRoomUser_ChatRoomSlug_Self = members.map((m) => ({
                    ...m,
                    ChatRoomUser_UserSlug: m.ChatRoomUser_UserSlug
                        ? { ...m.ChatRoomUser_UserSlug, is_online: SocketStore.isOnline(m.ChatRoomUser_UserSlug.id) }
                        : m.ChatRoomUser_UserSlug,
                }));
            }
            return thread;
        });

        this.resource = "GroupThreads";
        this.__is_paginate = false;
        this.emitter.push((obj) => this.socket.emit("getGroupThreads_", obj));

        await this.sendResponse(200, "Retrieved data successfully!.", records);
        return;
    }

    async resetMessageCount({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            const user_id = this.socket.user.id;
            const params = this.socket.body;

            await this.modal.resetMessageCount(params.chat_room_id, user_id);

            this.__collection = false;
            this.__is_paginate = false;
            this.emitter.push((obj) => this.socket.emit("resetMessageCount_", obj));

            await this.sendResponse(
                200,
                "Chat room message count reset successfully!.",
                { chat_room_id: params.chat_room_id }
            );
            return;
        } catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later.",
                {},
                500
            );
        }
    }
    async getUnreadThreadsCount({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            const user_id = this.socket.user.id;

            const unreadChatCount = await this.modal.getUnreadChatThreadCount(user_id);
            const unreadGroupCount = await this.modal.getUnreadGroupThreadCount(user_id);

            this.__collection = false;
            this.__is_paginate = false;
            this.emitter.push((obj) => this.socket.emit("getUnreadThreadsCount_", obj));

            await this.sendResponse(
                200,
                "Chat room message count reset successfully!.",
                {
                    chat_count: unreadChatCount,
                    group_count: unreadGroupCount
                }
            );
            return;
        } catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later.",
                {},
                500
            );
        }
    }
    async blockChatThread({ io, socket }) {
        this.io = io;
        this.socket = socket;

        const chat_room_id = socket.body.chat_room_id;
        if (chat_room_id) {
            await this.modal.blockChatThread(socket, socket.body.chat_room_id);
        }

        this.__is_paginate = false;
        this.__collection = false;
        this.emitter.push((obj) => this.socket.emit("blockChatThread_", obj));

        await this.sendResponse(200, "Blocked Chat Thread successfully!.", {
            chat_room_id,
        });
        return;
    }

    async deleteChatThread({ io, socket }) {
        this.io = io;
        this.socket = socket;

        const chat_room_id = socket.body.chat_room_id;
        if (chat_room_id) {
            await this.modal.deleteChatThread(socket, socket.body.chat_room_id);
        }

        this.__is_paginate = false;
        this.__collection = false;
        this.emitter.push((obj) => this.socket.emit("deleteChatThread_", obj));

        await this.sendResponse(200, "Chat thread deleted successfully!.", {});
        return;
    }

    async getOrCreateRoom({ io, socket }) {
        this.io = io;
        this.socket = socket;
        let records = {};
        let chat_room_id = "";

        const user_id = socket.user.id;
        const target_user_id = socket.body.target_user_id;

        if (!target_user_id) {
            this.emitter.push((obj) => this.socket.emit("error", obj));
            this.sendError({}, "Target User not defined", 400);
            return;
        }

        records = await this.modal.findRoomAgainstUsers(user_id, target_user_id);
        if (_.isEmpty(records)) {
            records = await ChatRoom.instance().createRecord(
                this.socket,
                socket.body
            );
            chat_room_id = records.id;
            this.socket.join("room_" + chat_room_id);
            this.emitter.push((obj) =>
                this.socket.in("user_" + target_user_id).emit("newRoom_", obj)
            );
        } else {
            chat_room_id = records.chat_room_id;
        }

        const condition = {};
        condition.id = target_user_id;
        const user = await User.instance().getRecordByCondition(socket, condition);

        this.__is_paginate = false;
        this.__collection = false;

        const payload = {
            chat_room_id,
            name: user.name,
            image_url: getImageUrl(user.image_url, "Array")[0],
        };
        this.emitter.push((obj) => this.socket.emit("findOrCreateRoom_", obj));

        await this.sendResponse(200, "Retrieved data successfully!.", payload);
        return;
    }

    async addMember({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            this.error_emitter = "addMemberError_";
            const params = this.socket.body;
            const user = this.socket.user;

            const rules = {
                chat_room_id: "required",
                members: "required|array",
            };

            let validator = await validateAll(params, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error) {
                return validation_error;
            }

            const chat_room_record = await ChatRoom.instance().getGroupWithMembers(
                params.chat_room_id
            );
            if (_.isEmpty(chat_room_record)) {
                return this.sendError("Invalid chat room id", {}, 400);
            }

            if (!chat_room_record.can_memberAddMember) {
                const user_chat_room_record =
                    chat_room_record?.ChatRoomUser_ChatRoomSlug?.find(
                        (item) =>
                            item.user_id === user.id && (item.is_owner || item.is_subAdmin)
                    );
                if (_.isEmpty(user_chat_room_record)) {
                    return this.sendError("Only admin are able to add member", {}, 400);
                }
            }

            let flag = false;
            const leaved_member_list = [];
            const leaved_members = [];
            const existing_member = [];
            chat_room_record?.ChatRoomUser_ChatRoomSlug.forEach((item) => {
                if (item.is_leaved || item.is_kicked) {
                    leaved_members.push(item.user_id);
                } else {
                    existing_member.push(item.user_id);
                }
            });

            console.log("Leaved Members : ", leaved_members);
            for (let i = 0; i < params.members.length; i++) {
                const user_id = params.members[i];
                if (user_id === user.id) continue;
                if (existing_member.includes(user_id)) continue;

                flag = true;
                if (leaved_members.includes(user_id)) {
                    leaved_member_list.push(user_id);
                    await this.modal.updateLeavedMember(params.chat_room_id, user_id);
                } else {
                    const user = await User.instance().validateUser(user_id);
                    if (_.isEmpty(user)) continue;

                    const payload = {
                        is_newMembers: true,
                        chat_room_id: params.chat_room_id,
                        user_id: user_id,
                    };
                    const record = await this.modal.createRecord(this.socket, payload);
                }

                const message_payload = {
                    chat_room_id: params.chat_room_id,
                    message_type: MESSAGE_TYPE_ENUM.BADGE,
                    badge_type: BADGE_TYPE_ENUM.ADD_MEMBER,
                    message: "Admin added new member",
                };
                const message_record = await ChatMessages.instance().createRecord(
                    this.socket,
                    message_payload
                );
                const message_status_payload = {
                    chat_room_id: params.chat_room_id,
                    message_id: message_record.id,
                };
                await ChatMessageStatus.instance().createRecord(
                    this.socket,
                    message_status_payload
                );
                await this.modal.updateUserChatRoomLastMessageTimeStamp(
                    params.chat_room_id,
                    user_id
                );

                this.__is_paginate = false;

                const group_details =
                    await ChatRoom.instance().getRoomRecordWithUserDetails(
                        params.chat_room_id
                    );

                this.resource = "ChatMessages";
                this.emitter.push((obj) =>
                    this.io
                        .in("room_" + params.chat_room_id)
                        .emit("receivedMessage_", obj)
                );
                await this.sendResponse(
                    200,
                    "New member added in group.",
                    message_payload
                );

                this.emitter.push((obj) =>
                    this.io.in("room_" + params.chat_room_id).emit("newMemberAdded_", obj)
                );
                this.resource = "NewMemberList";
                await this.sendResponse(
                    200,
                    "Member added successfully",
                    group_details?.ChatRoomUser_ChatRoomSlug
                );

                this.resource = "Group";
                this.emitter.push((obj) =>
                    this.io
                        .in("user_" + user_id)
                        .emit("receivedAddedInGroupMessage_", obj)
                );
                await this.sendResponse(
                    200,
                    "You are added in new group.",
                    group_details
                );
            }

            if (!flag) {
                const group_details =
                    await ChatRoom.instance().getRoomRecordWithUserDetails(
                        params.chat_room_id
                    );
                this.emitter.push((obj) =>
                    this.io.in("room_" + params.chat_room_id).emit("newMemberAdded_", obj)
                );
                this.resource = "NewMemberList";
                await this.sendResponse(
                    200,
                    "Member added successfully",
                    group_details?.ChatRoomUser_ChatRoomSlug
                );
            }
            return;
        } catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later",
                {},
                500
            );
        }
    }

    async removeMember({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            this.error_emitter = "removeMemberError_";
            const params = this.socket.body;
            const user = this.socket.user;

            const rules = {
                chat_room_id: "required",
                members: "required|array",
            };

            let validator = await validateAll(params, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error) {
                return validation_error;
            }

            const chat_room_record = await ChatRoom.instance().getGroupWithMembers(
                params.chat_room_id
            );
            if (_.isEmpty(chat_room_record)) {
                return this.sendError("Invalid chat room id", {}, 400);
            }

            const user_chat_room_record =
                chat_room_record?.ChatRoomUser_ChatRoomSlug?.find(
                    (item) =>
                        item.user_id === user.id && (item.is_owner || item.is_subAdmin)
                );
            if (_.isEmpty(user_chat_room_record)) {
                return this.sendError("Only admin are able to remove member", {}, 400);
            }

            const member_list = [];
            chat_room_record?.ChatRoomUser_ChatRoomSlug.forEach((item) => {
                if (
                    !item.is_leaved &&
                    !item.is_kicked &&
                    !item.is_owner &&
                    !item.is_subAdmin &&
                    !(item.user_id === user.id) &&
                    params.members.includes(item.user_id)
                ) {
                    member_list.push(item.user_id);
                }
            });

            console.log("Members to be removed : ", member_list);

            for (let i = 0; i < member_list.length; i++) {
                const user_id = member_list[i];

                const message_payload = {
                    chat_room_id: params.chat_room_id,
                    message_type: MESSAGE_TYPE_ENUM.BADGE,
                    badge_type: BADGE_TYPE_ENUM.REMOVE_MEMBER,
                    message: "Admin remove member from group",
                };

                const message_record = await ChatMessages.instance().createRecord(
                    this.socket,
                    message_payload
                );
                const message_status_payload = {
                    chat_room_id: params.chat_room_id,
                    message_id: message_record.id,
                };
                await ChatMessageStatus.instance().createRecord(
                    this.socket,
                    message_status_payload
                );
                await this.modal.updateUserChatRoomLastMessageTimeStamp(
                    params.chat_room_id,
                    user_id
                );
                await this.modal.removeMemberFromChatRoom(params.chat_room_id, user_id);

                this.__is_paginate = false;
                this.__collection = false;
                this.emitter.push((obj) =>
                    this.io
                        .in("room_" + params.chat_room_id)
                        .emit("receivedMessage_", obj)
                );
                this.emitter.push((obj) =>
                    this.io
                        .in("user_" + user_id)
                        .emit("receivedRemoveFromGroupMessage_", obj)
                );
                this.sendResponse(
                    200,
                    "Member removed from group successfully.",
                    message_payload
                );
            }

            const members = await this.modal.getRoomMembersWithDetails(
                params.chat_room_id
            );
            this.emitter.push((obj) =>
                this.io.in("room_" + params.chat_room_id).emit("removeMember_", obj)
            );
            this.__collection = true;
            this.resource = "NewMemberList";
            return this.sendResponse(
                200,
                "Member removed from group message.",
                members
            );
        } catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later",
                {},
                500
            );
        }
    }
    async leaveGroup({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            const params = this.socket.body;
            const user = this.socket.user;

            const rules = {
                chat_room_id: "required|string",
            };

            let validator = await validateAll(params, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error) {
                return validation_error;
            }

            const chat_room_record = await ChatRoom.instance().getGroupWithMembers(
                params.chat_room_id
            );
            if (_.isEmpty(chat_room_record)) {
                return this.sendError("Invalid chat room id", {}, 400);
            }

            const user_chat_room_record =
                chat_room_record?.ChatRoomUser_ChatRoomSlug?.find(
                    (item) =>
                        item.user_id === user.id && !item.is_leaved && !item.is_kicked
                );
            if (_.isEmpty(user_chat_room_record)) {
                return this.sendError("Not able to leave this group.", {}, 400);
            }

            const message_payload = {
                chat_room_id: params.chat_room_id,
                message_type: MESSAGE_TYPE_ENUM.BADGE,
                badge_type: BADGE_TYPE_ENUM.LEAVE_GROUP,
                message: "Member left this group.",
            };

            const message_record = await ChatMessages.instance().createRecord(
                this.socket,
                message_payload
            );
            const message_status_payload = {
                chat_room_id: params.chat_room_id,
                message_id: message_record.id,
            };
            await ChatMessageStatus.instance().createRecord(
                this.socket,
                message_status_payload
            );
            await this.modal.updateUserChatRoomLastMessageTimeStamp(
                params.chat_room_id,
                user.id
            );

            await this.modal.leaveChatRoom(user.id, params.chat_room_id);
            this.socket.leave("room_" + params.chat_room_id);

            this.__is_paginate = false;
            this.__collection = false;
            this.emitter.push((obj) =>
                this.io.in("room_" + params.chat_room_id).emit("receivedMessage_", obj)
            );
            this.sendResponse(200, "Member leaved this group.", message_payload);

            const active_users = chat_room_record?.ChatRoomUser_ChatRoomSlug?.map(
                (item) =>
                    item.user_id !== user.id && !item.is_leaved && !item.is_kicked
                        ? item
                        : null
            ).filter(Boolean);

            if (
                (user_chat_room_record.is_owner || user_chat_room_record.is_subAdmin) &&
                active_users.length
            ) {
                const admin_record = active_users
                    ?.map((item) => (item.is_owner || item.is_subAdmin ? item : null))
                    .filter(Boolean);

                if (!admin_record.length) {
                    const new_admin_record = active_users?.find(
                        (item) => !item.is_owner && !item.is_subAdmin
                    );

                    if (!_.isEmpty(new_admin_record)) {
                        await this.modal.makeAdmin(
                            new_admin_record.user_id,
                            params.chat_room_id
                        );
                        this.emitter.push(() =>
                            this.io
                                .in("user_" + new_admin_record.user_id)
                                .emit("becomeAdmin_", {})
                        );
                    }
                }
            }

            const members = await this.modal.getRoomMembersWithDetails(
                params.chat_room_id
            );
            this.emitter.push((obj) =>
                this.io.in("room_" + params.chat_room_id).emit("memberLeaved_", obj)
            );
            this.__collection = true;
            this.resource = "NewMemberList";
            await this.sendResponse(
                200,
                "Member leaved from group message.",
                members
            );

            this.emitter.push((obj) => this.socket.emit("leaveGroup_", obj));
            this.__is_paginate = false;
            this.__collection = false;
            return this.sendResponse(200, "Group leaved successfully.", {});
        } catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later",
                {},
                500
            );
        }
    }
}

module.exports = ChatRoomUserController;

const _ = require("lodash");
const { validateAll } = require("../../../Helper");
const User = require("../../../Models/User");
const {
    CHAT_ROOM_TYPE_ENUM,
    BADGE_TYPE_ENUM,
    MESSAGE_TYPE_ENUM,
} = require("../../../config/enum");
const SocketRestController = require("../../SocketRestController");
const ChatMessages = require("../../../Models/ChatMessages");
const ChatMessageStatus = require("../../../Models/ChatMessageStatus");

class ChatRoomController extends SocketRestController {
    constructor() {
        super("ChatRoom");
        this.io; // io obj
        this.socket; // request obj
        this.params = {}; // this is used for get parameters from url
        this.emitter = [];
    }

    async createGroup({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            this.error_emitter = "createGroupError_";
            const params = this.socket.body;

            const rules = {
                title: "required|min:2|max:15",
                image_url: "required|string",
                members: "required|array|min:1",
            };

            let validator = await validateAll(params, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error) {
                return validation_error;
            }

            for (let i = 0; i < params.members.length; i++) {
                const user_id = params.members[i];
                if (user_id === this.socket.user.id) {
                    return this.sendError("Not able to create group with you", {}, 400);
                }

                console.log("Members : ", params.members)
                const user = await User.instance().validateUser(user_id);
                console.log(user)
                if (_.isEmpty(user)) {
                    return this.sendError("Invalid user id", {}, 400);
                }
            }

            const payload = {};
            payload.title = params.title;
            payload.type = CHAT_ROOM_TYPE_ENUM.GROUP;
            payload.image_url = params.image_url;
            payload.members = params.members;

            const record = await this.modal.createRecord(this.socket, payload);

            this.__is_paginate = false;
            this.socket.join("room_" + record.id);
            // this.resource = 'CreateGroup'
            // this.emitter.push((obj) => this.socket.emit('createGroup_', obj))
            // await this.sendResponse(
            //     200,
            //     "Group created successfully",
            //     record
            // )

            this.resource = "Group";
            const group_record = await this.modal.getRoomRecordWithUserDetails(
                record.id
            );
            this.emitter.push((obj) => this.socket.emit("createGroup_", obj));
            console.log("Member added emitter to user :  ", params.members);
            params.members.forEach((user_id) => {
                this.emitter.push((obj) =>
                    this.io.in("user_" + user_id).emit("newGroup_", obj)
                );
            });

            await this.sendResponse(200, "Group created successfully", group_record);
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

    async updateGroupDetails({ io, socket }) {
        try {
            this.io = io;
            this.socket = socket;
            this.error_emitter = "updateGroupDetailsError_";
            const params = this.socket.body;
            const user = this.socket.user;

            const rules = {
                chat_room_id: "required",
                title: "required|min:2|max:15",
                image_url: "required|string",
            };

            let validator = await validateAll(params, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error) {
                return validation_error;
            }

            const chat_room_record = await this.modal.getRoomRecordWithUser(
                user.id,
                params.chat_room_id
            );
            if (
                _.isEmpty(chat_room_record) ||
                chat_room_record.type !== CHAT_ROOM_TYPE_ENUM.GROUP
            ) {
                return this.sendError("Invalid chat room id", {}, 400);
            }
            if (
                _.isEmpty(chat_room_record.ChatRoomUser_ChatRoomSlug) ||
                chat_room_record.ChatRoomUser_ChatRoomSlug[0]?.is_leaved ||
                chat_room_record.ChatRoomUser_ChatRoomSlug[0]?.is_kicked
            ) {
                return this.sendError("You are not a member of this group", {}, 400);
            }

            if (
                !chat_room_record.can_memberEditGroup &&
                chat_room_record.user_id !== user.id
            ) {
                return this.sendError("Only admin are able to edit group", {}, 400);
            }

            const payload = {};
            payload.title = params.title;
            payload.image_url = params.image_url;

            const record = await this.modal.updateRecord(
                this.socket,
                payload,
                params.chat_room_id
            );

            const message_payload = {
                chat_room_id: params.chat_room_id,
                message_type: MESSAGE_TYPE_ENUM.BADGE,
                badge_type: BADGE_TYPE_ENUM.DETAILS_UPDATED,
                message: "Group details updated",
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

            this.__collection = true;
            this.__is_paginate = false;
            this.resource = "ChatMessages";
            this.emitter.push((obj) =>
                this.io.in("room_" + params.chat_room_id).emit("receivedMessage_", obj)
            );
            await this.sendResponse(
                200,
                "Group details updated successfully.",
                message_record
            );

            this.resource = "CreateGroup";
            this.emitter.push((obj) =>
                this.io
                    .in("room_" + params.chat_room_id)
                    .emit("updateGroupDetails_", obj)
            );
            await this.sendResponse(
                200,
                "Group details updated successfully",
                record
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
}

module.exports = ChatRoomController;

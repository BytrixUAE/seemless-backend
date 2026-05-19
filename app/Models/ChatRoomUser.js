const RestModel = require("./RestModel");
const _ = require("lodash");
const { Op, sequelize, Sequelize } = require("../Database");
const { CHAT_ROOM_STATUS_ENUM, CHAT_ROOM_TYPE_ENUM, } = require("../config/enum");

class ChatRoomUser extends RestModel {
    constructor() {
        super("chat_room_users");
    }

    softdelete() {
        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return [
            "chat_room_id",
            "target_user_id",
            "is_owner",
            "is_subAdmin",
            "status",
            "unread_message_count",
        ];
    }

    showColumns() {
        return [
            "id",
            "id",
            "user_id",
            "chat_room_id",
            "is_owner",
            "is_subAdmin",
            "is_kicked",
            "is_leaved",
            "status",
            "unread_message_count",
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [];
    }

    async createRecord(request, params) {
        let record = [];

        console.log(params);
        if (params?.is_newRoom) {
            let sender_record = {
                chat_room_id: params.id,
                user_id: request.user.id,
                is_owner: true,
                status: CHAT_ROOM_STATUS_ENUM.ACCEPTED,
                unread_message_count: 0,
                is_visible: false,
                last_message_timestamp: new Date(),
            };
            let reciever_record = {
                chat_room_id: params.id,
                user_id: request.body.target_user_id,
                is_owner: false,
                status: CHAT_ROOM_STATUS_ENUM.PENDING,
                unread_message_count: 0,
                is_visible: false,
                last_message_timestamp: new Date(),
            };
            record.push(sender_record);
            record.push(reciever_record);
        } else if (params?.is_newGroup) {
            let owner_record = {
                chat_room_id: params.id,
                user_id: request.user.id,
                is_owner: true,
                status: CHAT_ROOM_STATUS_ENUM.ACCEPTED,
                unread_message_count: 0,
                last_message_timestamp: new Date(),
            };
            record.push(owner_record);

            const members = params?.members || [];
            for (let i = 0; i < members.length; i++) {
                const member_id = members[i];
                let member_record = {
                    chat_room_id: params.id,
                    user_id: member_id,
                    is_owner: false,
                    status: CHAT_ROOM_STATUS_ENUM.PENDING,
                    unread_message_count: 0,
                    last_message_timestamp: new Date(),
                };
                record.push(member_record);
            }
        } else if (params.is_newMembers) {
            let participant_record = {
                chat_room_id: params.chat_room_id,
                user_id: params.user_id,
                is_owner: false,
                status: CHAT_ROOM_STATUS_ENUM.PENDING,
                unread_message_count: 0,
                last_message_timestamp: new Date(),
            };
            record.push(participant_record);
        }

        if (!_.isEmpty(record)) {
            const result = await this.orm.bulkCreate(record);
            return result.map((item) => item.toJSON());
        } else {
            return [];
        }
    }

    // async getChatThreads(user_id) {
    //     const record = await this.orm.findAll({
    //         where: {
    //             user_id: user_id,
    //             is_visible: true,
    //             deletedAt: null
    //         },
    //         include: [
    //             {
    //                 model: this.getModel(),
    //                 required: false,
    //                 as: 'ChatRoomUser_ChatRoomSlug_Self_Single',
    //                 where: {
    //                     user_id: { [Op.ne]: user_id }
    //                 },
    //                 include: {
    //                     model: ChatRoom.instance().getModel(),
    //                     required: true,
    //                     as: "ChatRoomUser_ChatRoomSlug",
    //                     where: {
    //                         type: CHAT_ROOM_TYPE_ENUM.SINGLE
    //                     }
    //                 }
    //             },
    //             {
    //                 model: ChatRoom.instance().getModel(),
    //                 required: true,
    //                 as: "ChatRoomUser_ChatRoomSlug",
    //                 where: {
    //                     deletedAt: null
    //                 },
    //                 include: {
    //                     model: ChatMessages.instance().getModel(),
    //                     required: false,
    //                     as: "ChatMessage_ChatRoomSlug_Single",
    //                     where: {
    //                         deletedAt: null
    //                     },
    //                     include: {
    //                         model: ChatMessageStatus.instance().getModel(),
    //                         required: true,
    //                         as: "ChatMessageStatus_ChatMessageSlug_Single",
    //                         where: {
    //                             user_id: user_id,
    //                             deletedAt: null
    //                         },
    //                     },
    //                 },
    //             }
    //         ],
    //         order: [
    //             ['last_message_timestamp', 'DESC'],
    //             [
    //                 {
    //                     model: ChatRoom.instance().getModel(),
    //                     as: 'ChatRoomUser_ChatRoomSlug',
    //                 },
    //                 {
    //                     model: ChatMessages.instance().getModel(),
    //                     as: 'ChatMessage_ChatRoomSlug_Single'
    //                 },
    //                 'createdAt',
    //                 'DESC'
    //             ]
    //         ]
    //     })

    //     return record.map(item => item.toJSON())
    // }

    async getGroupThreads(user_id) {
        const record = await this.orm.findAll({
            where: {
                user_id: user_id,
                is_visible: true,
                is_leaved: false,
                is_kicked: false,
                deletedAt: null,
            },
            include: [
                {
                    model: this.getModel(),
                    required: true,
                    as: "ChatRoomUser_ChatRoomSlug_Self",
                    include: {
                        model: User.instance().getModel(),
                        required: true,
                        as: "ChatRoomUser_UserSlug",
                    },
                    where: {
                        [Op.or]: [
                            { user_id: user_id },
                            {
                                [Op.and]: [
                                    { user_id: { [Op.ne]: user_id } },
                                    { is_leaved: false },
                                    { is_kicked: false },
                                ],
                            },
                        ],
                    },
                },
                {
                    model: ChatRoom.instance().getModel(),
                    required: true,
                    as: "ChatRoomUser_ChatRoomSlug",
                    where: {
                        type: CHAT_ROOM_TYPE_ENUM.GROUP,
                        deletedAt: null,
                    },
                },
            ],
            order: [["last_message_timestamp", "DESC"]],
        });

        return record.map((item) => item.toJSON());
    }

    async getChatThreads(user_id,params) {
        let conditions = {
            type: CHAT_ROOM_TYPE_ENUM.SINGLE,
            deletedAt: null,
            is_admin: 0
        }
        if (params?.is_admin){
            conditions.is_admin = 1;
        }
        const record = await this.orm.findAll({
            where: {
                user_id: user_id,
                is_visible: true,
                deletedAt: null,
            },
            include: [
                {
                    model: this.getModel(),
                    required: true,
                    as: "ChatRoomUser_ChatRoomSlug_Self_Single",
                    where: {
                        user_id: { [Op.ne]: user_id },
                    },
                    include: {
                        model: User.instance().getModel(),
                        required: true,
                        as: "ChatRoomUser_UserSlug",
                    },
                },
                {
                    model: ChatRoom.instance().getModel(),
                    required: true,
                    as: "ChatRoomUser_ChatRoomSlug",
                    where: conditions,
                    include: {
                        model: ChatMessages.instance().getModel(),
                        required: false,
                        as: "ChatMessage_ChatRoomSlug",
                        where: {
                            deletedAt: null,
                        },
                        include: {
                            model: ChatMessageStatus.instance().getModel(),
                            required: true,
                            as: "ChatMessageStatus_ChatMessageSlug_Single",
                            where: {
                                user_id: user_id,
                                deletedAt: null,
                            },
                        },
                        limit: 1,
                        separate: true,
                        order: [["createdAt", "DESC"]],
                    },
                },
            ],
            order: [
                ["last_message_timestamp", "DESC"],
                // [
                //     {
                //         model: ChatRoom.instance().getModel(),
                //         as: 'ChatRoomUser_ChatRoomSlug',
                //     },
                //     {
                //         model: ChatMessages.instance().getModel(),
                //         as: 'ChatMessage_ChatRoomSlug'
                //     },
                //     'createdAt',
                //     'DESC'
                // ]
            ],
        });

        return record.map((item) => item.toJSON());
    }

    async getUnreadChatThreadCount(user_id) {
        const count = await this.orm.count({
            where: {
                user_id: user_id,
                unread_message_count: { [Op.gt]: 0 },
                is_visible: true,
                deletedAt: null,
            },
            include: {
                model: ChatRoom.instance().getModel(),
                required: true,
                as: "ChatRoomUser_ChatRoomSlug",
                where: {
                    type: CHAT_ROOM_TYPE_ENUM.SINGLE,
                    deletedAt: null,
                },
            }
        })

        return (count || 0)
    }

    async getUnreadGroupThreadCount(user_id) {
        const count = await this.orm.count({
            where: {
                user_id: user_id,
                unread_message_count: { [Op.gt]: 0 },
                is_visible: true,
                is_kicked: false,
                is_leaved: false,
                deletedAt: null,
            },
            include: {
                model: ChatRoom.instance().getModel(),
                required: true,
                as: "ChatRoomUser_ChatRoomSlug",
                where: {
                    type: CHAT_ROOM_TYPE_ENUM.GROUP,
                    deletedAt: null,
                },
            }
        })

        return (count || 0)
    }

    async getRoomMembersWithDetails(chat_room_id) {
        const record = await this.orm.findAll({
            where: {
                chat_room_id: chat_room_id,
                is_leaved: false,
                is_kicked: false,
                deletedAt: null,
            },
            include: {
                model: User.instance().getModel(),
                as: "ChatRoomUser_UserSlug",
                required: true,
                where: {
                    deletedAt: null,
                },
            },
        });

        return record.map((item) => item.toJSON());
    }

    async findRoomAgainstUsers(user_id, target_user_id) {
        const record = await this.orm.findOne({
            where: {
                chat_room_id: {
                    [Op.in]: [
                        Sequelize.literal(`select cru2.chat_room_id from chat_room_users as cru2
                     where cru2.user_id = '${user_id}' and cru2.deletedAt is null`),
                    ],
                },
                user_id: target_user_id,
            },
            include: {
                model: ChatRoom.instance().getModel(),
                as: "ChatRoomUser_ChatRoomSlug",
                required: true,
                where: {
                    type: CHAT_ROOM_TYPE_ENUM.SINGLE,
                    deletedAt: null,
                },
            },
        });

        return _.isEmpty(record) ? {} : record.toJSON();
    }

    async getRoomUsers(chat_room_id) {
        const record = await this.orm.findAll({
            where: {
                chat_room_id: chat_room_id,
                is_leaved: false,
                is_blocked: false,
                is_kicked: false,
                deletedAt: null,
            },
            raw: true,
        });

        return _.isEmpty(record) ? [] : record;
    }

    async updateLeavedMember(chat_room_id = "", user_id = "") {
        await this.orm.update(
            {
                is_owner: false,
                is_subAdmin: false,
                is_leaved: false,
                is_kicked: false,
                deletedAt: null,
            },
            {
                where: {
                    chat_room_id: chat_room_id,
                    user_id: user_id,
                },
            }
        );
        return true;
    }

    async removeMemberFromChatRoom(chat_room_id = "", user_id = "") {
        await this.orm.update(
            { is_kicked: true },
            {
                where: {
                    chat_room_id: chat_room_id,
                    user_id: user_id,
                },
            }
        );
        return true;
    }

    async incrementMessageCount(request, chat_room_id) {
        const record = await this.orm.update(
            {
                unread_message_count: sequelize.literal("unread_message_count + 1"),
                last_message_timestamp: new Date(),
            },
            {
                where: {
                    chat_room_id,
                    [Op.not]: {
                        user_id: request.user.id,
                    },
                    is_blocked: false,
                    deletedAt: null,
                },
            }
        );

        return true;
    }

    async updateLastMessageTimeStamp(chat_room_id) {
        const record = await this.orm.update(
            { last_message_timestamp: new Date() },
            {
                where: {
                    chat_room_id: chat_room_id,
                    deletedAt: null,
                },
            }
        );
        return true;
    }

    async blockChatThread(request, chat_room_id) {
        const record = await this.orm.update(
            { is_blocked: true },
            {
                where: {
                    chat_room_id,
                    user_id: request.user.id,
                },
            }
        );

        return true;
    }

    async leaveChatRoom(user_id, chat_room_id) {
        const record = await this.orm.update(
            { is_leaved: true },
            {
                where: {
                    chat_room_id,
                    user_id: user_id,
                },
            }
        );

        return true;
    }

    async makeAdmin(user_id, chat_room_id) {
        await this.orm.update(
            { is_subAdmin: true },
            {
                where: {
                    chat_room_id: chat_room_id,
                    user_id: user_id,
                },
            }
        );
        return true;
    }

    async deleteChatThread(request, chat_room_id) {
        const user_id = request.user.id;

        const record = await this.orm.update(
            { is_visible: false },
            {
                where: {
                    chat_room_id,
                    user_id,
                },
            }
        );

        await ChatMessageStatus.instance().deleteThreadMessages(
            user_id,
            chat_room_id
        );

        return true;
    }

    async getUserRooms(user_id) {
        const record = await this.orm.findAll({
            where: {
                user_id,
                is_leaved: false,
                is_kicked: false,
                is_blocked: false,
                deletedAt: null,
            },
            raw: true,
        });
        return _.isEmpty(record) ? [] : record;
    }

    async getRecordByUserAndRoom(user_id, chat_room_id) {
        const record = await this.orm.findOne({
            where: {
                user_id: user_id,
                chat_room_id: chat_room_id,
                is_leaved: false,
                is_kicked: false,
                deletedAt: null,
            },
            order: [["createdAt", "desc"]],
            raw: true,
        });

        return _.isEmpty(record) ? {} : record;
    }

    async updateVisibility(user_id, chat_room_id) {
        await this.orm.update(
            { is_visible: true },
            {
                where: {
                    chat_room_id,
                    // [Op.not]: { user_id: user_id }
                },
            }
        );
    }

    async resetMessageCount(chat_room_id = "", user_id) {
        await this.orm.update(
            { unread_message_count: 0 },
            {
                where: {
                    user_id,
                    chat_room_id,
                },
            }
        );
        return true;
    }

    //this update specific user last message timestamp and increase message count
    async updateUserChatRoomLastMessageTimeStamp(chat_room_id, user_id) {
        const record = await this.orm.update(
            {
                last_message_timestamp: new Date(),
                unread_message_count: sequelize.literal("unread_message_count + 1"),
            },
            {
                where: {
                    chat_room_id: chat_room_id,
                    user_id: user_id,
                    deletedAt: null,
                },
            }
        );
        return true;
    }
}

module.exports = ChatRoomUser;

const ChatRoom = require("./ChatRoom");
const ChatMessageStatus = require("./ChatMessageStatus");
const ChatMessages = require("./ChatMessages");
const User = require("./User");

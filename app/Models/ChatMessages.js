const { removeBaseUrl } = require("../Helper");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const constants = require("../config/constants");

const RestModel = require("./RestModel");

class ChatMessages extends RestModel {
  constructor() {
    super("chat_messages");
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
      "message_type",
      "file_type",
      "badge_type",
      "message",
      "file_name",
      "file_url",
      "file_thumb",
      "instance_type",
      "instance_id",
      "is_forwarded",
      "is_oneTime",
      "is_reply",
      "reply_message_id",
      "is_disappear",
      "disappear_timestamp",
      "is_anonymous",
    ];
  }

  showColumns() {
    return [
      "id",
      "user_id",
      "chat_room_id",
      "message_type",
      "file_type",
      "badge_type",
      "message",
      "file_name",
      "file_url",
      "file_thumb",
      "instance_type",
      "instance_id",
      "is_forwarded",
      "is_oneTime",
      "is_reply",
      "reply_message_id",
      "is_disappear",
      "disappear_timestamp",
      "is_anonymous",
      "createdAt",
    ];
  }

  /**
   * omit fields from update request
   */
  exceptUpdateField() {
    return [];
  }

  async beforeCreateHook(request, params) {
    params.user_id = request.user.id;
    params.file_url = params.file_url ? removeBaseUrl(params.file_url) : null;
    params.file_thumb = params.file_thumb
      ? removeBaseUrl(params.file_thumb)
      : null;
    params.createdAt = new Date();
  }

  async loadChatHistory(request) {
    const page =
      _.isEmpty(request.query) || !request.query?.page
        ? 0
        : parseInt(request.query.page) - 1;
    const limit =
      _.isEmpty(request.query) || !request.query?.limit
        ? constants.PAGINATION_LIMIT
        : parseInt(request.query.limit);
    const offset =
      _.isEmpty(request.query) || !request.query?.offset
        ? page * limit
        : parseInt(request.query.offset);
    const chat_room_id = request?.body?.chat_room_id || "";

    const query = {
      where: {
        chat_room_id,
        deletedAt: null,
      },
      include: [
        {
          model: ChatMessageStatus.instance().getModel(),
          as: "ChatMessageStatus_ChatMessageSlug",
          required: true,
          where: {
            chat_room_id: chat_room_id,
            user_id: request.user.id,
            deletedAt: null,
          },
        },
        {
          model: User.instance().getModel(),
          as: "ChatMessage_UserSlug",
          required: true,
          where: {
            deletedAt: null,
          },
        },
      ],
      order: [["createdAt", "DESC"]],
      raw: false,
      limit: limit,
      offset: offset,
    };

    const record = await this.orm.findAll(query);

    const total_record = await this.orm.count({
      where: query.where
    })
    request.query.total = total_record

    return _.isEmpty(record) ? [] : record;
  }

  async deleteRecord(user_id, id) {
    await this.orm.update(
      { deletedAt: new Date() },
      {
        where: {
          user_id: user_id,
          id: id,
          deletedAt: null,
        },
      }
    );
    return true;
  }
}

module.exports = ChatMessages;

const ChatMessageStatus = require("./ChatMessageStatus");
const User = require("./User");

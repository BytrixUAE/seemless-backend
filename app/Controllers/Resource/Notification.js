const _ = require("lodash");
const { getImageUrl } = require("../../Helper");
const db = require("../../Database");
const { NOTIFICATION_TYPES, USER_RELATIONSHIP_ACTION_ENUM } = require("../../config/enum");

const RELATIONSHIP_NOTIFICATION_TYPES = [
    NOTIFICATION_TYPES.NEW_ENCOUNTER,
    NOTIFICATION_TYPES.relationship_request,
    NOTIFICATION_TYPES.relationship_request_accepted,
    NOTIFICATION_TYPES.relationship_request_rejected,
    NOTIFICATION_TYPES.relationship_request_ignored,
    NOTIFICATION_TYPES.relationship_request_blocked,
    NOTIFICATION_TYPES.relationship_request_unblocked,
    NOTIFICATION_TYPES.relationship_request_deleted,
    NOTIFICATION_TYPES.relationship_request_near_timeout,
];

class Notification {
    static async initResponse(data, request) {
        if (_.isEmpty(data)) return Array.isArray(data) ? [] : {};

        let response;
        if (Array.isArray(data)) {
            response = [];
            for (var i = 0; i < data.length; i++) {
                response.push(await this.jsonSchema(data[i], request));
            }
        } else {
            response = await this.jsonSchema(data, request);
        }
        return response;
    }

    static async jsonSchema(record, request) {
        const payload = record?.payload
            ? (typeof record.payload === 'string' ? JSON.parse(record.payload) : record.payload)
            : null;

        const base = {
            id: record.id,
            user_id: record.user_id,
            type: record.type,
            title: record.title,
            message: record.message,
            image_url: record.image_url ? getImageUrl(record.image_url) : null,
            payload,
            is_read: record.is_read,
            created_at: record.createdAt,
            is_accepted: false,
            is_ignored: false,
            is_blocked: false,
        };

        if (!RELATIONSHIP_NOTIFICATION_TYPES.includes(record.type) || !payload) {
            return base;
        }

        const relationship_id = payload.relationship_id != null ? payload.relationship_id : payload.ref_id;
        const other_user_id = payload.user_id;

        let relationship = null;
        let other_user = null;

        if (relationship_id) {
            try {
                relationship = await db.user_relationships.findByPk(relationship_id, { raw: true, paranoid: false });
            } catch (e) {
                // ignore
            }
        }
        if (other_user_id) {
            try {
                const u = await db.users.findByPk(other_user_id, {
                    attributes: ['id', 'uuid', 'firstname', 'lastname', 'name', 'username', 'image_url'],
                    raw: true
                });
                if (u) {
                    other_user = {
                        ...u,
                        image_url: u.image_url ? getImageUrl(u.image_url) : null,
                    };
                }
            } catch (e) {
                // ignore
            }
        }

        const is_accepted = relationship
            ? relationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED &&
              relationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED
            : false;
        const is_ignored = relationship
            ? relationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.IGNORED ||
              relationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.IGNORED
            : false;
        const is_blocked = relationship
            ? relationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.BLOCKED ||
              relationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.BLOCKED
            : false;

        return {
            ...base,
            relationship,
            other_user,
            is_accepted,
            is_ignored,
            is_blocked,
        };
    }
}

module.exports = Notification;

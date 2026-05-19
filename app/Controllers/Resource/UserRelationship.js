
    const _ = require("lodash")

class UserRelationship {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        let response;
        if (Array.isArray(data)) {
            response = []
            for (var i = 0; i < data.length; i++) {
                response.push(this.jsonSchema(data[i], request));
            }
        } else {
            response = this.jsonSchema(data, request)
        }
        return response;

    }


    static jsonSchema(record, request) {
        return {
            "id": record.id,
            "user_one_id": record.user_one_id,
            "user_two_id": record.user_two_id,
            "user_one_action": record.user_one_action,
            "user_two_action": record.user_two_action,
            "user_one_hidden_until": record.user_one_hidden_until,
            "user_two_hidden_until": record.user_two_hidden_until,
            "connected_time": record.connected_time,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = UserRelationship;

    const _ = require("lodash")

class UserReport {

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
            "user_id": record.user_id,
            "user": record.User || null,
            "reported_user_id": record.reported_user_id,
            "reported_user": record.ReportedUser || null,
            "reason": record.reason,
            "notes": record.notes,
            "admin_notes": record.admin_notes || null,
            "status": record.status,
            "attachments": record.UserReportAttachments || [],
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
    }
}

module.exports = UserReport;
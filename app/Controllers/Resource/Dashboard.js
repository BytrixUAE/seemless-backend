const _ = require("lodash")

class Dashboard {

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
            "totalUsers": record.totalUsers || 0,
            "totalActiveSubscriptions": record.totalActiveSubscriptions || 0,
            "totalSupportTickets": record.totalSupportTickets || 0,
            // "userGrowthData": this.formatUserGrowthData(record.userGrowthData || []),
            "totalRevenue": record.totalRevenue || 0,
            "revenue": record.revenue || 0,
            "active_subscription": record.active_subscription || 0,
            "users": record.users || 0,
            "support_tickets": record.support_tickets || 0,
        }
    }

    static formatUserGrowthData(userGrowthData) {
        if (!Array.isArray(userGrowthData)) {
            return [];
        }
        return userGrowthData.map(item => ({
            "date": item.date || "",
            "users": item.users || 0
        }));
    }

}

module.exports = Dashboard;


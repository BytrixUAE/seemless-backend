const _ = require("lodash");
const { SUBSCRIPTION_PACKAGE_TYPE_ENUM_TITLE } = require("../../config/enum");

class SubscriptionPackage {

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
            "name": record.name,
            "description": record.description,
            "price": record.price,
            "duration_days": record.duration_days,
            "type": SUBSCRIPTION_PACKAGE_TYPE_ENUM_TITLE[record.type] || record.type,
            "stripe_price_id": record.stripe_price_id,
            "stripe_product_id": record.stripe_product_id,
            "apple_product_id": record.apple_product_id,
            "google_product_id": record.google_product_id,
            "status": record.status,
            "daily_encounter_limit": record.daily_encounter_limit ?? null,
            "createdAt": record.createdAt,
            "updatedAt": record.updatedAt,
            "deletedAt": record.deletedAt
        }
    }
}

module.exports = SubscriptionPackage;
const { getImageUrl } = require("../../Helper");
const _ = require("lodash");
const UserResource = require("./User");

class MyProfile {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        this.headers = request.headers;
        let response;
        if (Array.isArray(data)) {
            response = []
            for (var i = 0; i < data.length; i++) {
                response.push(await this.jsonSchema(data[i], request));
            }
        } else {
            response = await this.jsonSchema(data, request)
        }
        return response;

    }


    static async jsonSchema(record, request) {
        let api_token = _.isEmpty(this.headers.authorization)
            ? Buffer.from(request.api_token).toString('base64')
            : Buffer.from(request.authorization).toString('base64');

        const todayEncountersCount = await UserResource.calculateTodayEncountersCount(record.id);
        
        let todayRemainingEncounters = 0;
        
        if(record.trail_expired_at && record.trail_expired_at > new Date()) {
            todayRemainingEncounters = 1000;
        }

        if(record.Subscription) {
            todayRemainingEncounters = record.Subscription.SubscriptionPackage.daily_encounter_limit - todayEncountersCount;
        }

        return {
            "id": record.id,
            "uuid": record.uuid,
            "firstname": record.firstname || '',
            "lastname": record.lastname || '',
            "username": record.username,
            "dob": record.dob,
            "social_accounts": record.UserSocialAccounts || [],
            "star_name": record.star_name,
            "gender": record.gender,
            "is_visible": record.is_visible,
            "current_location": record.current_location,
            "current_longitude": record.current_longitude,
            "current_latitude": record.current_latitude,
            "radius_unit": record.radius_unit || 'meter',
            "stripe_customer_id": record.stripe_customer_id || null,
            "name": record.name || '',
            "email": record.email,
            "image_url": getImageUrl(record.image_url),
            "mobile_no": record.mobile_no,
            "api_token": api_token,
            "push_notification": !!record.push_notification,
            "is_special": !!record.is_special,
            "trail_expired_at": record.trail_expired_at,
            "is_on_trial": record.trail_expired_at && record.trail_expired_at > new Date(),
            "subscription": record.Subscription || null,
            "email_verifyAt": record.email_verifyAt,
            "user_social_accounts": record.UserSocialAccounts || [],
            "today_remaining_encounters": todayRemainingEncounters,
            "hobbies": record?.Hobbies || [],
            "login_type": record.login_type,
            "radius_unit": record.radius_unit || 'meter',
            "stripe_customer_id": record.stripe_customer_id || null,
            "today_encounters_count": todayEncountersCount
        }
    }
}

module.exports = MyProfile
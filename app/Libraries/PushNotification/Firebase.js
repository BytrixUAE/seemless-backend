'use strict'
const admin = require("firebase-admin");
const constants = require("../../config/constants");
const { isJSON } = require("../../Helper");



class Firebase {
    constructor() {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(constants.SERVICE_ACCOUNT)
            });
        }
    }
    async sendPush(token, title, message, payload, badge, mutableContent, contentAvailable, image_url = '') {
        var notification_payload = {
            data: isJSON(payload) ? JSON.parse(payload) : {},
            notification: {
                title: title,
                body: message,
            },
            apns: {
                payload: {
                    aps: {
                        badge: badge,
                        mutableContent: mutableContent,
                        "content-available": contentAvailable
                    },
                },
                // fcm_options: {
                //     image: imageUrl
                // }
            },
            webpush: {
                // headers: {
                //     image: imageUrl
                // }
            },
            token: token
        };

        console.log(notification_payload)
        return await admin
            .messaging()
            .send(notification_payload)
    }

    async sendPushNotification(registrationTokens, notification, data = {}) {
        const message = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            data: data,
        };

        try {
            message.token = registrationTokens;
            const response = await admin.messaging().send(message);
            console.log('Successfully sent notification:', response);
            console.log('response:', response.responses);
            return response;
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}
module.exports = Firebase;

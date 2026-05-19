'use strict'

const { validateAll } = require("../../Helper");
const RestController = require("../RestController");
const { NOTIFICATION_TYPES } = require("../../config/enum");

class NotificationController extends RestController {
    constructor() {
        super('Notification');
        this.resource = "Notification";
        this.request;
        this.response;
        this.params = {};
    }

    /**
     * This function is used for validate restfull request
     * @param $action
     * @param string $slug
     * @return validator response
     */
    async validation(action, slug = '') {
        let validator = [];
        let rules;
        switch (action) {
            case "store":
                rules = {
                    name: 'required',
                }
                validator = await validateAll(this.request.body, rules)
                break;
            case "update":
                rules = {
                    name: 'required',
                }
                validator = await validateAll(this.request.body, rules);
                break;
        }
        return validator;
    }

    async getUnreadCount({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false
        this.__is_paginate = false
        let result = await this.modal.getUnreadCount(request);
        console.log("result:",result)
        return this.sendResponse(200,"Unread Count", {total:result})
    }
    async markAllRead({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false
        this.__is_paginate = false
        let result = await this.modal.markAllRead(request);
        return this.sendResponse(200,"Mark read successfully", {})
    }
    async markSingleRead({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false
        this.__is_paginate = false
        let result = await this.modal.markSingleRead(request);
        return this.sendResponse(200,"Mark read successfully", {})
    }
    async sendTestNotification({request,response}){
        this.request = request;
        this.response = response;
        let result = await this.modal.createRecord(request,{
            user_id: request.user.id,
            type: "test",
            title: request?.body?.title || "Test Notification",
            message: request?.body?.message || "Test Notification",
            image_url: request?.body?.image_url || null,
            payload: {
                title: request?.body?.title || "Test Notification",
                message: request?.body?.message || "Test Notification",
            },
            is_read: 0
        });
        return this.sendResponse(200,"Record created successfully", result)
    }

    async sendPushNotification({request,response}){
        this.request = request;
        this.response = response;
        this.__collection = false;
        this.__is_paginate = false;

        // Validation
        const rules = {
            title: 'required|string',
            message: 'required|string',
        };
        const validator = await require("../../Helper").validateAll(request.body, rules);
        if (validator.fails()) {
            return this.sendErrorResponse(422, "Validation failed", validator.errors.all());
        }

        const { title, message, image_url, user_ids, type, payload } = request.body;
        const User = require("../../Models/User");
        const UserApiToken = require("../../Models/UserApiToken");
        const { Op } = require("../../Database");

        try {
            // Build user query conditions
            let userWhereConditions = {
                push_notification: 1,
                is_visible: true,
                deletedAt: null,
                is_blocked: false,
                is_activated: true
            };

            // If user_ids provided, filter by those users
            if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
                userWhereConditions.id = { [Op.in]: user_ids };
            }

            // Get all users with device tokens
            const users = await User.instance().getModel().findAll({
                include: [
                    {
                        model: UserApiToken.instance().getModel(),
                        attributes: ['device_type', 'device_token'],
                        required: true,
                        where: {
                            deletedAt: null,
                            device_token: {
                                [Op.not]: null
                            }
                        },
                        order: [['createdAt', 'DESC']]
                    }
                ],
                where: userWhereConditions,
                raw: true
            });

            if (!users || users.length === 0) {
                return this.sendResponse(200, "No users found with device tokens", {
                    sent_count: 0,
                    total_users: 0
                });
            }

            // Prepare notification data
            const notificationType = type || NOTIFICATION_TYPES?.ADMIN_NOTIFICATION;
            const notificationPayload = payload || {
                title: title,
                message: message,
                type: notificationType
            };

            // Create notifications for each user
            // Use Set to track processed users (in case user has multiple device tokens)
            const processedUsers = new Set();
            let successCount = 0;
            let failedCount = 0;
            const errors = [];

            for (const user of users) {
                try {
                    // Skip if we've already processed this user
                    if (processedUsers.has(user.id)) {
                        continue;
                    }

                    // Check if user has device token (using raw query format)
                    const deviceToken = user['user_api_tokens.device_token'];
                    
                    if (!deviceToken) {
                        failedCount++;
                        processedUsers.add(user.id);
                        continue;
                    }

                    // Create notification record (afterCreateHook will automatically send push notification)
                    await this.modal.createRecord(request, {
                        user_id: user.id,
                        type: notificationType,
                        title: title,
                        message: message,
                        image_url: image_url || null,
                        payload: notificationPayload,
                        badge: 1,
                        mutable_content: 1,
                        content_available: 1,
                        is_read: 0
                    });

                    successCount++;
                    processedUsers.add(user.id);
                } catch (error) {
                    failedCount++;
                    processedUsers.add(user.id);
                    errors.push({
                        user_id: user.id,
                        error: error.message
                    });
                    console.error(`Error sending notification to user ${user.id}:`, error);
                }
            }

            // Count unique users
            const uniqueUserIds = new Set(users.map(u => u.id));
            const totalUsers = uniqueUserIds.size;

            return this.sendResponse(200, "Push notifications sent successfully", {
                sent_count: successCount,
                failed_count: failedCount,
                total_users: totalUsers,
                errors: errors.length > 0 ? errors : undefined
            });

        } catch (error) {
            console.error("Error in sendPushNotification:", error);
            return this.sendErrorResponse(500, "Failed to send push notifications", error.message);
        }
    }
}
module.exports = NotificationController;

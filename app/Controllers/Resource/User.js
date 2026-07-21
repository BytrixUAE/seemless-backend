const { getImageUrl } = require("../../Helper");
const _ = require("lodash");
const { USER_RELATIONSHIP_ACTION_ENUM } = require("../../config/enum");
const db = require("../../Database");
const { Op } = require("sequelize");

class User {

    static async initResponse(data, request) {
        if (_.isEmpty(data))
            return data;

        this.headers = request.headers;
        let response;
        if (Array.isArray(data)) {
            const userIds = data.map(r => r.id).filter(Boolean);
            const precomputed = userIds.length > 0
                ? await this.batchPrecompute(userIds, request)
                : { relationshipByViewed: new Map(), seeCountByUser: new Map(), todayEncountersByUser: new Map() };
            response = [];
            for (let i = 0; i < data.length; i++) {
                response.push(await this.jsonSchema(data[i], request, precomputed));
            }
        } else {
            response = await this.jsonSchema(data, request);
        }
        return response;
    }

    /**
     * Batch precompute relationship status, seeCount, and todayEncounters for a list of user IDs (5–6 queries total).
     */
    static async batchPrecompute(userIds, request) {
        const currentUser = request.user?.id;
        const relationshipByViewed = new Map();
        const seeCountByUser = new Map();
        const todayEncountersByUser = new Map();

        userIds.forEach(id => {
            seeCountByUser.set(id, 0);
            todayEncountersByUser.set(id, 0);
        });

        const emptyRelationship = {
            relationship_status: {},
            my_friend: 0,
            my_requested: 0,
            request_by_me: 0,
            my_ignored: 0,
            ignored_by_me: 0,
            my_blocked: 0,
            blocked_by_me: 0
        };

        if (!currentUser) {
            userIds.forEach(id => relationshipByViewed.set(id, { ...emptyRelationship }));
            return { relationshipByViewed, seeCountByUser, todayEncountersByUser };
        }

        const uniqueIds = [...new Set(userIds)];

        const [
            acceptedRows,
            todayRows,
            relationships,
            blockedByMeList,
            blockedByThemList
        ] = await Promise.all([
            db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                    user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                    [Op.or]: [
                        { user_one_id: { [Op.in]: uniqueIds } },
                        { user_two_id: { [Op.in]: uniqueIds } }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            }),
            (() => {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);
                return db.user_relationships.findAll({
                    where: {
                        deletedAt: null,
                        createdAt: { [Op.gte]: startOfToday, [Op.lte]: endOfToday },
                        [Op.or]: [
                            { user_one_id: { [Op.in]: uniqueIds } },
                            { user_two_id: { [Op.in]: uniqueIds } }
                        ]
                    },
                    attributes: ['user_one_id', 'user_two_id'],
                    raw: true
                });
            })(),
            db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        { user_one_id: currentUser, user_two_id: { [Op.in]: uniqueIds } },
                        { user_two_id: currentUser, user_one_id: { [Op.in]: uniqueIds } }
                    ]
                },
                raw: true
            }),
            db.user_blocks.findAll({
                where: { user_id: currentUser, block_user_id: { [Op.in]: uniqueIds }, deletedAt: null },
                attributes: ['block_user_id'],
                raw: true
            }),
            db.user_blocks.findAll({
                where: { block_user_id: currentUser, user_id: { [Op.in]: uniqueIds }, deletedAt: null },
                attributes: ['user_id'],
                raw: true
            })
        ]);

        acceptedRows.forEach(r => {
            const u1 = r.user_one_id, u2 = r.user_two_id;
            seeCountByUser.set(u1, (seeCountByUser.get(u1) || 0) + 1);
            seeCountByUser.set(u2, (seeCountByUser.get(u2) || 0) + 1);
        });
        todayRows.forEach(r => {
            const u1 = r.user_one_id, u2 = r.user_two_id;
            todayEncountersByUser.set(u1, (todayEncountersByUser.get(u1) || 0) + 1);
            todayEncountersByUser.set(u2, (todayEncountersByUser.get(u2) || 0) + 1);
        });

        const blockedByMeSet = new Set((blockedByMeList || []).map(r => r.block_user_id));
        const blockedByThemSet = new Set((blockedByThemList || []).map(r => r.user_id));
        const relByPair = new Map();
        (relationships || []).forEach(r => {
            const key = `${Math.min(r.user_one_id, r.user_two_id)}-${Math.max(r.user_one_id, r.user_two_id)}`;
            relByPair.set(key, r);
        });

        uniqueIds.forEach(viewedUser => {
            if (viewedUser === currentUser) {
                relationshipByViewed.set(viewedUser, { ...emptyRelationship });
                return;
            }
            const myBlocked = blockedByMeSet.has(viewedUser) ? 1 : 0;
            const blockedBy = blockedByThemSet.has(viewedUser) ? 1 : 0;
            const user_one_id = Math.min(currentUser, viewedUser);
            const user_two_id = Math.max(currentUser, viewedUser);
            const key = `${user_one_id}-${user_two_id}`;
            const relationship = relByPair.get(key);
            let relationship_status = {};
            let my_friend = 0, my_requested = 0, request_by_me = 0, my_ignored = 0, ignored_by_me = 0;
            const isCurrentUserOne = currentUser === user_one_id;
            if (relationship) {
                const currentUserAction = isCurrentUserOne ? relationship.user_one_action : relationship.user_two_action;
                const otherUserAction = isCurrentUserOne ? relationship.user_two_action : relationship.user_one_action;
                relationship_status = {
                    id: relationship.id,
                    user_one_id: relationship.user_one_id,
                    user_two_id: relationship.user_two_id,
                    user_one_action: relationship.user_one_action,
                    user_two_action: relationship.user_two_action,
                    connected_time: relationship.connected_time,
                    location: relationship.location,
                    latitude: relationship.latitude,
                    longitude: relationship.longitude,
                    createdAt: relationship.createdAt,
                };
                if (currentUserAction === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED && otherUserAction === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED) my_friend = 1;
                if (currentUserAction === USER_RELATIONSHIP_ACTION_ENUM.REQUESTED) my_requested = 1;
                if (otherUserAction === USER_RELATIONSHIP_ACTION_ENUM.REQUESTED) request_by_me = 1;
                if (currentUserAction === USER_RELATIONSHIP_ACTION_ENUM.IGNORED) my_ignored = 1;
                if (otherUserAction === USER_RELATIONSHIP_ACTION_ENUM.IGNORED) ignored_by_me = 1;
            }
            relationshipByViewed.set(viewedUser, {
                relationship_status,
                my_friend,
                my_requested,
                request_by_me,
                my_ignored,
                ignored_by_me,
                my_blocked: myBlocked,
                blocked_by_me: blockedBy
            });
        });

        return { relationshipByViewed, seeCountByUser, todayEncountersByUser };
    }

    /**
     * Calculate the count of accepted relationships for a user
     * Accepted relationships are where both users have ACCEPTED status
     * @param {number} userId - User ID to calculate count for
     * @returns {Promise<number>} Count of accepted relationships
     */
    static async calculateSeeCount(userId) {
        try {
            const count = await db.user_relationships.count({
                where: {
                    deletedAt: null,
                    user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                    user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                    [Op.or]: [
                        { user_one_id: userId },
                        { user_two_id: userId }
                    ]
                }
            });
            return count || 0;
        } catch (error) {
            console.error("Error calculating seeCount:", error);
            return 0;
        }
    }

    /**
     * Count today's encounters (relationship requests with any status) for a user
     * @param {number} userId - User ID to count for
     * @returns {Promise<number>} Count of relationships created today where user is involved
     */
    static async calculateTodayEncountersCount(userId) {
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            const count = await db.user_relationships.count({
                where: {
                    deletedAt: null,
                    createdAt: {
                        [Op.gte]: startOfToday,
                        [Op.lte]: endOfToday
                    },
                    [Op.or]: [
                        { user_one_id: userId },
                        { user_two_id: userId }
                    ]
                }
            });
            return count || 0;
        } catch (error) {
            console.error("Error calculating todayEncountersCount:", error);
            return 0;
        }
    }

    /**
     * Calculate relationship status flags between current user and viewed user
     * @param {object} record - User record being viewed
     * @param {object} request - Request object with current user info
     * @returns {Promise<object>} Relationship status flags
     */
    static async calculateRelationshipStatus(record, request) {
        // If viewing own profile or no authenticated user, return default values
        if (!request.user || !request.user.id || request.user.id === record.id) {
            return {
                relationship_status: {},
                my_friend: 0,
                my_requested: 0,
                request_by_me: 0,
                my_ignored: 0,
                ignored_by_me: 0,
                my_blocked: 0,
                blocked_by_me: 0
            };
        }

        const currentUser = request.user.id;
        const viewedUser = record.id;

        // Initialize flags
        let my_friend = 0;
        let my_requested = 0;
        let request_by_me = 0;
        let my_ignored = 0;
        let ignored_by_me = 0;
        let my_blocked = 0;
        let blocked_by_me = 0;
        let relationship_status = {};

        // Get canonical order
        const user_one_id = Math.min(currentUser, viewedUser);
        const user_two_id = Math.max(currentUser, viewedUser);
        const isCurrentUserOne = currentUser === user_one_id;

        // Query relationship
        const relationship = await db.user_relationships.findOne({
            where: {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                deletedAt: null
            },
            raw: true
        });

        // Query block status
        const blockedByCurrentUser = await db.user_blocks.findOne({
            where: {
                user_id: currentUser,
                block_user_id: viewedUser,
                deletedAt: null
            },
            raw: true
        });

        const blockedCurrentUser = await db.user_blocks.findOne({
            where: {
                user_id: viewedUser,
                block_user_id: currentUser,
                deletedAt: null
            },
            raw: true
        });

        // Check block status
        if (blockedByCurrentUser) {
            my_blocked = 1;
        }
        if (blockedCurrentUser) {
            blocked_by_me = 1;
        }

        // If relationship exists, calculate status flags
        if (relationship) {
            const currentUserAction = isCurrentUserOne ? relationship.user_one_action : relationship.user_two_action;
            const otherUserAction = isCurrentUserOne ? relationship.user_two_action : relationship.user_one_action;

            relationship_status = {
                id: relationship.id,
                user_one_id: relationship.user_one_id,
                user_two_id: relationship.user_two_id,
                user_one_action: relationship.user_one_action,
                user_two_action: relationship.user_two_action,
                connected_time: relationship.connected_time,
                location: relationship.location,
                latitude: relationship.latitude,
                longitude: relationship.longitude,
                createdAt: relationship.createdAt,
            };

            // Check if friends (both accepted)
            if (currentUserAction === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED && 
                otherUserAction === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED) {
                my_friend = 1;
            }

            // Check if current user requested
            if (currentUserAction === USER_RELATIONSHIP_ACTION_ENUM.REQUESTED) {
                my_requested = 1;
            }

            // Check if other user requested
            if (otherUserAction === USER_RELATIONSHIP_ACTION_ENUM.REQUESTED) {
                request_by_me = 1;
            }

            // Check if current user ignored
            if (currentUserAction === USER_RELATIONSHIP_ACTION_ENUM.IGNORED) {
                my_ignored = 1;
            }

            // Check if other user ignored
            if (otherUserAction === USER_RELATIONSHIP_ACTION_ENUM.IGNORED) {
                ignored_by_me = 1;
            }
        }

        return {
            relationship_status: relationship_status,
            my_friend: my_friend,
            my_requested: my_requested,
            request_by_me: request_by_me,
            my_ignored: my_ignored,
            ignored_by_me: ignored_by_me,
            my_blocked: my_blocked,
            blocked_by_me: blocked_by_me
        };
    }

    static async jsonSchema(record, request, precomputed = null) {
        let api_token = _.isEmpty(this.headers.authorization)
            ? Buffer.from(request.api_token).toString('base64')
            : Buffer.from(request.authorization).toString('base64');

        let relationshipData;
        let seeCount;
        let todayEncountersCount;
        if (precomputed) {
            relationshipData = precomputed.relationshipByViewed.get(record.id) || {
                relationship_status: {},
                my_friend: 0,
                my_requested: 0,
                request_by_me: 0,
                my_ignored: 0,
                ignored_by_me: 0,
                my_blocked: 0,
                blocked_by_me: 0
            };
            seeCount = precomputed.seeCountByUser.get(record.id) ?? 0;
            todayEncountersCount = precomputed.todayEncountersByUser.get(record.id) ?? 0;
        } else {
            relationshipData = await this.calculateRelationshipStatus(record, request);
            seeCount = await this.calculateSeeCount(record.id);
            todayEncountersCount = await this.calculateTodayEncountersCount(record.id);
        }

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
            "name": record.name || '',
            "email": record.email,
            "is_special": !!record.is_special,
            "dob": record.dob,
            "star_name": record.star_name,
            "gender": record.gender,
            "is_visible": record.is_visible,
            "current_location": record.current_location,
            "current_longitude": record.current_longitude,
            "current_latitude": record.current_latitude,
            "is_complete_profile": (record.image_url && record.UserSocialAccounts && record.UserSocialAccounts.length === 0),
            "image_url": getImageUrl(record.image_url),
            "blured_image_url": getImageUrl(record.blured_image_url),
            "mobile_no": record.mobile_no,
            "login_type": record.login_type,
            "push_notification": !!record.push_notification,
            "email_verifyAt": record.email_verifyAt,
            // "is_mobile_verified": !!record.is_mobile_verified,
            "is_blocked": !!record.is_blocked,
            "block_reason": record.block_reason || null,
            "trail_expired_at": record.trail_expired_at,
            "is_on_trial": record.trail_expired_at && record.trail_expired_at > new Date() ? true : false,
            "subscription": record.Subscription || null,
            "user_social_accounts": record.UserSocialAccounts || [],
            "api_token": api_token,
            "seeCount": seeCount,
            "today_encounters_count": todayEncountersCount,
            "relationship_status": relationshipData.relationship_status,
            "my_friend": relationshipData.my_friend,
            "my_requested": relationshipData.my_requested,
            "request_by_me": relationshipData.request_by_me,
            "my_ignored": relationshipData.my_ignored,
            "ignored_by_me": relationshipData.ignored_by_me,
            "my_blocked": relationshipData.my_blocked,
            "blocked_by_me": relationshipData.blocked_by_me,
            today_remaining_encounters: todayRemainingEncounters,
            "hobbies": (record?.Hobbies || []).map(h => {
                const hobby = h && typeof h.toJSON === 'function' ? h.toJSON() : { ...(h || {}) };
                return { ...hobby, icon_url: getImageUrl(hobby.icon_url) };
            }),
            "radius_unit": record.radius_unit || 'km',
            "stripe_customer_id": record.stripe_customer_id || null,
            "createdAt": record.createdAt, 
            "updatedAt": record.updatedAt,
        }
    }
}

module.exports = User
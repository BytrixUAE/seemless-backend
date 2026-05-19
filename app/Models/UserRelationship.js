
const _ = require("lodash");
const RestModel = require("./RestModel");
const db = require("../Database");
const { Op } = require("sequelize");
const { Sequelize } = db;
const { USER_RELATIONSHIP_ACTION_ENUM, CONNECTION_REQUEST_TIMEOUT_MINUTES, NOTIFICATION_TYPES } = require("../config/enum");
const UserBlock = require("./UserBlock");
const User = require("./User");
const Notification = require("./Notification");
const Hobby = require("./Hobby");

class UserRelationship extends RestModel {

    constructor() {
        super("user_relationships");
    }

    softdelete() {
        return false;
    }
    
    includeShow(){
        return [
            {
                model: User.instance().getModel(),
                as: 'UserOne',
                required: false,
                include: [
                    {
                        model: require("./UserSocialAccount").instance().getModel(),
                        as: 'UserSocialAccounts',
                        required: false
                    }
                ]
            },
            {
                model: User.instance().getModel(),
                as: 'UserTwo',
                required: false,
                include: [
                    {
                        model: require("./UserSocialAccount").instance().getModel(),
                        as: 'UserSocialAccounts',
                        required: false
                    }
                ]
            }
        ];
    }
    
    includeIndex(){
        return [
            {
                model: User.instance().getModel(),
                as: 'UserOne',
                required: false,
                include: [
                    {
                        model: require("./UserSocialAccount").instance().getModel(),
                        as: 'UserSocialAccounts',
                        required: false
                    }
                ]
            },
            {
                model: User.instance().getModel(),
                as: 'UserTwo',
                required: false,
                include: [
                    {
                        model: require("./UserSocialAccount").instance().getModel(),
                        as: 'UserSocialAccounts',
                        required: false
                    }
                ]
            }
        ];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return ["user_one_id", "user_two_id", "user_one_action", "user_two_action", "user_one_hidden_until", "user_two_hidden_until", "connected_time", "location", "latitude", "longitude", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "user_one_id", "user_two_id", "user_one_action", "user_two_action", "user_one_hidden_until", "user_two_hidden_until", "connected_time", "location", "latitude", "longitude", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "user_one_id", "user_two_id"];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
        
        const currentUser = request.user.id;
        const { myRequested, requesterByme, myFriend, myIgnored, ignoredByme } = request.query;
        
        // Build filter conditions based on query parameters
        const filterConditions = [];
        
        // Request not older than 5 minutes (for myRequested and requesterByme)
        const timeMinutesAgo = new Date(Date.now() - CONNECTION_REQUEST_TIMEOUT_MINUTES * 60 * 1000);

        // Filter: myRequested - Current user has REQUESTED status
        if (myRequested === '1') {
            filterConditions.push({
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                user_one_id: currentUser,
                                user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                            },
                            {
                                user_two_id: currentUser,
                                user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                            }
                        ]
                    },
                    { createdAt: { [Op.gte]: timeMinutesAgo } }
                ]
            });
        }
        
        // Filter: requesterByme - Other user has REQUESTED status (they requested from me)
        if (requesterByme === '1') {
            filterConditions.push({
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                user_one_id: currentUser,
                                user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                            },
                            {
                                user_two_id: currentUser,
                                user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                            }
                        ]
                    },
                    { createdAt: { [Op.gte]: timeMinutesAgo } }
                ]
            });
        }
        
        // Filter: myFriend - Both users have ACCEPTED status
        if (myFriend === '1') {
            filterConditions.push({
                user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                [Op.or]: [
                    { user_one_id: currentUser },
                    { user_two_id: currentUser }
                ]
            });
        }
        
        // Filter: myIgnored - Current user has IGNORED status
        if (myIgnored === '1') {
            filterConditions.push({
                [Op.or]: [
                    {
                        user_one_id: currentUser,
                        user_one_action: USER_RELATIONSHIP_ACTION_ENUM.IGNORED
                    },
                    {
                        user_two_id: currentUser,
                        user_two_action: USER_RELATIONSHIP_ACTION_ENUM.IGNORED
                    }
                ]
            });
        }
        
        // Filter: ignoredByme - Other user has IGNORED status (they ignored me)
        if (ignoredByme === '1') {
            filterConditions.push({
                [Op.or]: [
                    {
                        user_one_id: currentUser,
                        user_two_action: USER_RELATIONSHIP_ACTION_ENUM.IGNORED
                    },
                    {
                        user_two_id: currentUser,
                        user_one_action: USER_RELATIONSHIP_ACTION_ENUM.IGNORED
                    }
                ]
            });
        }
        
        // Ensure we only get relationships where current user is involved
        const baseCondition = {
            [Op.or]: [
                { user_one_id: currentUser },
                { user_two_id: currentUser }
            ]
        };
        
        // Apply filters if any are specified
        if (filterConditions.length > 0) {
            // Use OR logic: if multiple filters are provided, show relationships matching ANY of them
            query.where = {
                ...query.where,
                [Op.and]: [
                    baseCondition,
                    {
                        [Op.or]: filterConditions
                    }
                ]
            };
        } else {
            // If no filters, show all relationships where current user is involved
            query.where = {
                ...query.where,
                ...baseCondition
            };
        }
    }
    async singleQueryHook(query, request, id){
        query.include = this.includeShow();
    }
    async beforeCreateHook(request, params) {
   
    }
    async afterCreateHook(record, request, params) {
        if(record.user_one_id === request.user.id){
            await Notification.instance().createRecord(request, {
                user_id: record.user_two_id,
                type: NOTIFICATION_TYPES.relationship_request,
                title: "New Encounter Request",
                payload: {
                    relationship_id: record.id, 
                    user_id: request.user.id
                },
                message: `${request.user.username} requested to connect with you`,
            });
        }
    }

    /**
     * Helper method to send notification to user
     * @param {number} userId - User ID to send notification to
     * @param {string} type - Notification type
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {object} payload - Additional payload data
     */
    static async sendNotification(userId, type, title, message, payload = {}) {
        try {
            // Create a minimal request object for notification creation
            const requestObj = { user: { id: userId } };
            // console.log("requestObj===>", requestObj);
            
            await Notification.instance().createRecord(requestObj, {
                user_id: userId,
                type: type,
                title: title,
                message: message,
                payload: payload, // Will be stringified in beforeCreateHook
                badge: 1,
                mutable_content: 1,
                content_available: 1,
                is_read: 0
            });
        } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
        }
    }
    async beforeEditHook(request, params, slug) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });
    }

    /**
     * Helper method to get canonical order for user pair
     * Always stores user_one_id as smaller ID and user_two_id as larger ID
     * @param {number} userId1 
     * @param {number} userId2 
     * @returns {object} {user_one_id, user_two_id, isUserOne}
     */
    static getCanonicalOrder(userId1, userId2) {
        const user_one_id = Math.min(userId1, userId2);
        const user_two_id = Math.max(userId1, userId2);
        const isUserOne = userId1 === user_one_id;
        return { user_one_id, user_two_id, isUserOne };
    }

    /**
     * Helper method to get user location, fallback to user's current location if not provided
     * @param {number} userId - User ID
     * @param {string} location - Optional location from request
     * @param {number} latitude - Optional latitude from request
     * @param {number} longitude - Optional longitude from request
     * @returns {Promise<object>} {location, latitude, longitude}
     */
    static async getUserLocation(userId, location = null, latitude = null, longitude = null) {
        // Fetch user's current location from users table as fallback
        const user = await db.users.findByPk(userId, {
            attributes: ['current_location', 'current_latitude', 'current_longitude'],
            raw: true
        });

        // Use provided values, or fallback to user's current location, or null
        return {
            location: location !== null && location !== undefined ? location : (user?.current_location || null),
            latitude: latitude !== null && latitude !== undefined ? latitude : (user?.current_latitude || null),
            longitude: longitude !== null && longitude !== undefined ? longitude : (user?.current_longitude || null)
        };
    }

    /**
     * Main entry point for handling connection actions
     * @param {number} currentUser - Authenticated user ID
     * @param {number} connect_id - Other user ID
     * @param {number} status - Action status (10=requested, 20=accepted, 30=ignored, 40=blocked)
     * @param {object} locationData - Optional location data {location, latitude, longitude}
     * @returns {Promise<object>} Result object
     */
    static async handleConnectionAction(currentUser, connect_id, status, locationData = {}) {
        // Prevent self connection
        if (currentUser === connect_id) {
            throw new Error("Cannot connect with yourself");
        }

        // Get location data (use provided or fetch from user)
        const userLocation = await this.getUserLocation(
            currentUser,
            locationData.location,
            locationData.latitude,
            locationData.longitude
        );

        // Use transaction for data consistency
        const transaction = await db.sequelize.transaction();
        
        try {
            let result;

            switch (status) {
                case USER_RELATIONSHIP_ACTION_ENUM.REQUESTED: // 10 - Cross Path
                    result = await this.handleCrossPath(currentUser, connect_id, transaction, userLocation);
                    break;
                case USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED: // 20 - Accept
                    result = await this.acceptConnection(currentUser, connect_id, transaction, userLocation);
                    break;
                case USER_RELATIONSHIP_ACTION_ENUM.IGNORED: // 30 - Ignore
                    result = await this.ignoreConnection(currentUser, connect_id, transaction, userLocation);
                    break;
                case USER_RELATIONSHIP_ACTION_ENUM.BLOCKED: // 40 - Block
                    result = await this.blockUser(currentUser, connect_id, transaction, userLocation);
                    break;
                default:
                    throw new Error(`Invalid status: ${status}`);
            }

            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Handle cross path (status = 10)
     * Creates a new relationship if it doesn't exist
     * @param {number} currentUser 
     * @param {number} connect_id 
     * @param {object} transaction 
     * @param {object} locationData - Location data {location, latitude, longitude}
     * @returns {Promise<object>}
     */
    static async handleCrossPath(currentUser, connect_id, transaction, locationData = {}) {
        // Check if either user blocked the other
        const isBlocked = await UserBlock.isBlocked(currentUser, connect_id);
        if (isBlocked) {
            // Do nothing if blocked
            return { message: "Action ignored due to block", relationship: null };
        }

        const { user_one_id, user_two_id } = this.getCanonicalOrder(currentUser, connect_id);

        // Check if relationship already exists (not deleted)
        const existingRelationship = await db.user_relationships.findOne({
            where: {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                deletedAt: null
            },
            transaction
        });

        if (existingRelationship) {
            const bothAccepted =
                existingRelationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED &&
                existingRelationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED;
            if (bothAccepted) {
                return { message: "Already connected", relationship: existingRelationship.toJSON() };
            }
            return { message: "Request already sent or pending", relationship: existingRelationship.toJSON() };
        }

        // Create new relationship with location data
        const relationshipData = {
            user_one_id: user_one_id,
            user_two_id: user_two_id,
            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED,
            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED,
            connected_time: null
        };

        // Add location fields if provided
        if (locationData.location !== null && locationData.location !== undefined) {
            relationshipData.location = locationData.location;
        }
        if (locationData.latitude !== null && locationData.latitude !== undefined) {
            relationshipData.latitude = locationData.latitude;
        }
        if (locationData.longitude !== null && locationData.longitude !== undefined) {
            relationshipData.longitude = locationData.longitude;
        }

        const relationship = await db.user_relationships.create(relationshipData, { transaction });

        return { 
            message: "Cross path relationship created", 
            relationship: relationship.toJSON() 
        };
    }

    /**
     * Handle accept connection (status = 20)
     * Updates the relationship to accepted status, or creates new one if doesn't exist
     * @param {number} currentUser 
     * @param {number} connect_id 
     * @param {object} transaction 
     * @param {object} locationData - Location data {location, latitude, longitude}
     * @returns {Promise<object>}
     */
    static async acceptConnection(currentUser, connect_id, transaction, locationData = {}) {
        // Check if either user blocked the other
        const isBlocked = await UserBlock.isBlocked(currentUser, connect_id);
        if (isBlocked) {
            throw new Error("Cannot accept connection with a blocked user.");
        }

        const { user_one_id, user_two_id, isUserOne } = this.getCanonicalOrder(currentUser, connect_id);

        // Find existing relationship
        let relationship = await db.user_relationships.findOne({
            where: {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                deletedAt: null
            },
            transaction
        });

        // Already connected (both accepted) – duplicate action
        if (relationship) {
            const bothAccepted =
                relationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED &&
                relationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED;
            if (bothAccepted) {
                // const err = new Error("Already connected");
                // err.statusCode = 400;
                // throw err;
            }
        }

        // If relationship doesn't exist, create a new one
        if (!relationship) {
            const relationshipData = {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                user_one_action: isUserOne ? USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED : USER_RELATIONSHIP_ACTION_ENUM.REQUESTED,
                user_two_action: isUserOne ? USER_RELATIONSHIP_ACTION_ENUM.REQUESTED : USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                connected_time: null
            };

            // Add location fields if provided
            if (locationData.location !== null && locationData.location !== undefined) {
                relationshipData.location = locationData.location;
            }
            if (locationData.latitude !== null && locationData.latitude !== undefined) {
                relationshipData.latitude = locationData.latitude;
            }
            if (locationData.longitude !== null && locationData.longitude !== undefined) {
                relationshipData.longitude = locationData.longitude;
            }

            relationship = await db.user_relationships.create(relationshipData, { transaction });
        } else {
            // Relationship exists, update it
            const updateData = {};
            
            // Update the action for the current user
            if (isUserOne) {
                updateData.user_one_action = USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED;
            } else {
                updateData.user_two_action = USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED;
            }

            // Update location fields if provided
            if (locationData.location !== null && locationData.location !== undefined) {
                updateData.location = locationData.location;
            }
            if (locationData.latitude !== null && locationData.latitude !== undefined) {
                updateData.latitude = locationData.latitude;
            }
            if (locationData.longitude !== null && locationData.longitude !== undefined) {
                updateData.longitude = locationData.longitude;
            }

            await relationship.update(updateData, { transaction });
        }

        // Check if both users have accepted
        const updatedRelationship = await db.user_relationships.findByPk(relationship.id, { transaction });
        const bothAccepted = 
            updatedRelationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED &&
            updatedRelationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED;

        if (bothAccepted) {
            await updatedRelationship.update({
                connected_time: new Date()
            }, { transaction });
        }

        // Get current user info for notification
        const currentUserInfo = await User.instance().getUserByID(currentUser);
        const otherUserId = currentUser === user_one_id ? user_two_id : user_one_id;
        
        // Send notification to the other user
        if (bothAccepted) {
            // Both users accepted - they are now friends
            await this.sendNotification(
                otherUserId,
                NOTIFICATION_TYPES.relationship_request_accepted,
                "Request Accepted",
                `${currentUserInfo?.username || ''} has accepted your connection request. You are now friends!`,
                { relationship_id: relationship.id, user_id: currentUser }
            );
        } else {
            // Current user accepted the request
            await this.sendNotification(
                otherUserId,
                NOTIFICATION_TYPES.relationship_request,
                `New Connection Request`,
                `${currentUserInfo?.username || ''} sent you a connection request`,
                { relationship_id: relationship.id, user_id: currentUser }
            );
        }

        const finalRelationship = await db.user_relationships.findByPk(relationship.id, { transaction });
        return { 
            message: bothAccepted ? "Connection accepted - You are now friends!" : "Connection request sent with accepted status", 
            relationship: finalRelationship.toJSON() 
        };
    }

    /**
     * Handle ignore connection (status = 30)
     * Updates the relationship to ignored status and sets hidden_until, or creates new one if doesn't exist
     * @param {number} currentUser 
     * @param {number} connect_id 
     * @param {object} transaction 
     * @param {object} locationData - Location data {location, latitude, longitude}
     * @returns {Promise<object>}
     */
    static async ignoreConnection(currentUser, connect_id, transaction, locationData = {}) {
        // Check if either user blocked the other
        const isBlocked = await UserBlock.isBlocked(currentUser, connect_id);
        if (isBlocked) {
            throw new Error("Cannot ignore connection with a blocked user.");
        }

        const { user_one_id, user_two_id, isUserOne } = this.getCanonicalOrder(currentUser, connect_id);

        // Find existing relationship
        let relationship = await db.user_relationships.findOne({
            where: {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                deletedAt: null
            },
            transaction
        });

        // Already ignored by current user – duplicate action
        if (relationship) {
            const myAction = isUserOne ? relationship.user_one_action : relationship.user_two_action;
            if (myAction === USER_RELATIONSHIP_ACTION_ENUM.IGNORED) {
                return {
                    message: "Already ignored",
                    relationship: relationship.toJSON()
                };
            }
        }

        // Calculate hidden_until (5 minutes from now)
        const hiddenUntil = new Date();
        hiddenUntil.setMinutes(hiddenUntil.getMinutes() + CONNECTION_REQUEST_TIMEOUT_MINUTES);

        // If relationship doesn't exist, create a new one
        if (!relationship) {
            const relationshipData = {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                user_one_action: isUserOne ? USER_RELATIONSHIP_ACTION_ENUM.IGNORED : USER_RELATIONSHIP_ACTION_ENUM.REQUESTED,
                user_two_action: isUserOne ? USER_RELATIONSHIP_ACTION_ENUM.REQUESTED : USER_RELATIONSHIP_ACTION_ENUM.IGNORED,
                connected_time: null
            };

            // Set hidden_until for the current user
            if (isUserOne) {
                relationshipData.user_one_hidden_until = hiddenUntil;
            } else {
                relationshipData.user_two_hidden_until = hiddenUntil;
            }

            // Add location fields if provided
            if (locationData.location !== null && locationData.location !== undefined) {
                relationshipData.location = locationData.location;
            }
            if (locationData.latitude !== null && locationData.latitude !== undefined) {
                relationshipData.latitude = locationData.latitude;
            }
            if (locationData.longitude !== null && locationData.longitude !== undefined) {
                relationshipData.longitude = locationData.longitude;
            }

            relationship = await db.user_relationships.create(relationshipData, { transaction });
        } else {
            // Relationship exists, update it
            const updateData = {};
            
            // Update the action and hidden_until for the current user
            if (isUserOne) {
                updateData.user_one_action = USER_RELATIONSHIP_ACTION_ENUM.IGNORED;
                updateData.user_one_hidden_until = hiddenUntil;
            } else {
                updateData.user_two_action = USER_RELATIONSHIP_ACTION_ENUM.IGNORED;
                updateData.user_two_hidden_until = hiddenUntil;
            }

            // Update location fields if provided
            if (locationData.location !== null && locationData.location !== undefined) {
                updateData.location = locationData.location;
            }
            if (locationData.latitude !== null && locationData.latitude !== undefined) {
                updateData.latitude = locationData.latitude;
            }
            if (locationData.longitude !== null && locationData.longitude !== undefined) {
                updateData.longitude = locationData.longitude;
            }

            await relationship.update(updateData, { transaction });
        }

        // Get current user info for notification
        // const currentUserInfo = await User.instance().getUserByID(currentUser);
        // const otherUserId = currentUser === user_one_id ? user_two_id : user_one_id;
        
        // Send notification to the other user
        // await this.sendNotification(
        //     otherUserId,
        //     NOTIFICATION_TYPES.relationship_request_ignored,
        //     "Ignored Request",
        //     `${currentUserInfo?.username || ''} has ignored your connection request`,
        //     { relationship_id: relationship.id, user_id: currentUser }
        // );

        const updatedRelationship = await db.user_relationships.findByPk(relationship.id, { transaction });
        return { 
            message: "Connection ignored", 
            relationship: updatedRelationship.toJSON() 
        };
    }

    /**
     * Handle block user (status = 40)
     * Creates a block record and soft deletes the relationship (creates relationship first if doesn't exist)
     * @param {number} currentUser 
     * @param {number} connect_id 
     * @param {object} transaction 
     * @param {object} locationData - Location data {location, latitude, longitude}
     * @returns {Promise<object>}
     */
    static async blockUser(currentUser, connect_id, transaction, locationData = {}) {
        const { user_one_id, user_two_id } = this.getCanonicalOrder(currentUser, connect_id);

        // Check if block already exists – duplicate action
        const existingBlock = await db.user_blocks.findOne({
            where: {
                user_id: currentUser,
                block_user_id: connect_id,
                deletedAt: null
            },
            transaction
        });

        if (existingBlock) {
            const relationship = await db.user_relationships.findOne({
                where: {
                    user_one_id: user_one_id,
                    user_two_id: user_two_id,
                    deletedAt: null
                },
                transaction
            });
            return {
                message: "User already blocked",
                relationship: relationship ? relationship.toJSON() : null
            };
        }

        // Create block record
        await db.user_blocks.create({
            user_id: currentUser,
            block_user_id: connect_id
        }, { transaction });

        // Find or create relationship (will be soft deleted)
        let relationship = await db.user_relationships.findOne({
            where: {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                deletedAt: null
            },
            transaction
        });

        // If relationship doesn't exist, create it first (then soft delete it)
        if (!relationship) {
            const relationshipData = {
                user_one_id: user_one_id,
                user_two_id: user_two_id,
                user_one_action: USER_RELATIONSHIP_ACTION_ENUM.BLOCKED,
                user_two_action: USER_RELATIONSHIP_ACTION_ENUM.BLOCKED,
                connected_time: null
            };

            // Add location fields if provided
            if (locationData.location !== null && locationData.location !== undefined) {
                relationshipData.location = locationData.location;
            }
            if (locationData.latitude !== null && locationData.latitude !== undefined) {
                relationshipData.latitude = locationData.latitude;
            }
            if (locationData.longitude !== null && locationData.longitude !== undefined) {
                relationshipData.longitude = locationData.longitude;
            }

            relationship = await db.user_relationships.create(relationshipData, { transaction });
        }

        // Soft delete the relationship
        const updateData = {
            deletedAt: new Date()
        };

        // Update location fields if provided (before soft delete)
        if (locationData.location !== null && locationData.location !== undefined) {
            updateData.location = locationData.location;
        }
        if (locationData.latitude !== null && locationData.latitude !== undefined) {
            updateData.latitude = locationData.latitude;
        }
        if (locationData.longitude !== null && locationData.longitude !== undefined) {
            updateData.longitude = locationData.longitude;
        }

        await relationship.update(updateData, { transaction });

        // Get current user info for notification
        // const currentUserInfo = await User.instance().getUserByID(currentUser);
        
        // Send notification to the blocked user
        // await this.sendNotification(
        //     connect_id,
        //     NOTIFICATION_TYPES.relationship_request_blocked,
        //     "User Blocked",
        //     `${currentUserInfo?.username || ''} has blocked you`,
        //     { relationship_id: relationship.id, user_id: currentUser }
        // );

        return { 
            message: "User blocked successfully", 
            relationship: relationship.toJSON() 
        };
    }

    async searchRecords(request, params) {
        try {
            const { location, latitude, longitude, radius } = params;
            const currentUser = request.user.id;
            
            // Update current user's location
            await User.instance().updateRecord(request, {
                current_location: location,
                current_latitude: latitude,
                current_longitude: longitude,
            }, currentUser);
            
            // Convert radius from meters to kilometers for calculation
            const radiusInKm = radius / 1000;
            
            // Earth's radius in kilometers
            const earthRadiusKm = 6371;
            
            // Calculate bounding box for optimization (improves performance by filtering first)
            const latDiff = radiusInKm / earthRadiusKm * (180 / Math.PI);
            const lonDiff = radiusInKm / (earthRadiusKm * Math.cos(latitude * Math.PI / 180)) * (180 / Math.PI);
            
            // Haversine formula to calculate distance in meters
            const haversineFormula = Sequelize.literal(
                `(6371000 * acos(
                    GREATEST(-1.0, LEAST(1.0,
                        cos(radians(${latitude})) * 
                        cos(radians(current_latitude)) * 
                        cos(radians(current_longitude) - radians(${longitude})) + 
                        sin(radians(${latitude})) * 
                        sin(radians(current_latitude))
                    ))
                ))`
            );
            
            // Step 1: Get blocked user IDs (users that current user blocked OR users who blocked current user)
            const blockedByCurrentUser = await UserBlock.instance().getModel().findAll({
                where: {
                    deletedAt: null,
                    user_id: currentUser,
                },
                attributes: ['block_user_id'],
                raw: true
            });
            
            const blockedCurrentUser = await UserBlock.instance().getModel().findAll({
                where: {
                    deletedAt: null,
                    block_user_id: currentUser,
                },
                attributes: ['user_id'],
                raw: true
            });
            
            const blockedUserIds = [
                ...blockedByCurrentUser.map(b => b.block_user_id),
                ...blockedCurrentUser.map(b => b.user_id)
            ];
            
            // Step 2: Get users who are already friends (both actions are ACCEPTED)
            const friendRelationships = await db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        {
                            user_one_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED
                        },
                        {
                            user_two_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED
                        }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            });
            
            const friendUserIds = friendRelationships.map(rel => {
                return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
            });
            
            // Step 3: Get users who are ignored (hidden_until is within 5 minutes from now)
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - CONNECTION_REQUEST_TIMEOUT_MINUTES * 60 * 1000);
            
            const ignoredRelationships = await db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        {
                            user_one_id: currentUser,
                            user_one_hidden_until: {
                                [Op.gte]: fiveMinutesAgo,
                                [Op.lte]: now
                            }
                        },
                        {
                            user_two_id: currentUser,
                            user_two_hidden_until: {
                                [Op.gte]: fiveMinutesAgo,
                                [Op.lte]: now
                            }
                        }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            });
            
            const ignoredUserIds = ignoredRelationships.map(rel => {
                return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
            });
            
            // Step 4: Get users I already requested (pending) and users who requested me (pending)
            const requestedRelationships = await db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        {
                            user_one_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        },
                        {
                            user_one_id: currentUser,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        },
                        {
                            user_two_id: currentUser,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        },
                        {
                            user_two_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            });
            
            const requestedUserIds = requestedRelationships.map(rel => {
                return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
            });
            
            // Combine all excluded user IDs (blocked, friends, ignored, already requested / requested me)
            const excludedUserIds = [...new Set([...blockedUserIds, ...friendUserIds, ...ignoredUserIds, ...requestedUserIds])];
            
            // Build where clause
            const whereClause = {
                deletedAt: null,
                is_visible: true,
                is_activated: true,
                is_blocked: false,
                id: {
                    [Op.ne]: currentUser // Exclude current user
                },
                current_latitude: {
                    [Op.between]: [latitude - latDiff, latitude + latDiff],
                    [Op.ne]: null
                },
                current_longitude: {
                    [Op.between]: [longitude - lonDiff, longitude + lonDiff],
                    [Op.ne]: null
                }
            };
            
            // Exclude blocked, friends, and ignored users
            if (excludedUserIds.length > 0) {
                whereClause.id = {
                    [Op.ne]: currentUser,
                    [Op.notIn]: excludedUserIds
                };
            }
            
            // Use subquery approach to filter by distance directly in SQL
            const UserModel = User.instance().getModel();
            const users = await UserModel.findAll({
                where: {
                    ...whereClause,
                    // Filter by distance directly in WHERE clause using the Haversine formula
                    [Op.and]: [
                        Sequelize.literal(`(
                            6371000 * acos(
                                GREATEST(-1.0, LEAST(1.0,
                                    cos(radians(${latitude})) * 
                                    cos(radians(current_latitude)) * 
                                    cos(radians(current_longitude) - radians(${longitude})) + 
                                    sin(radians(${latitude})) * 
                                    sin(radians(current_latitude))
                                ))
                            )
                        ) <= ${radius}`)
                    ]
                },
                attributes: {
                    include: [
                        [haversineFormula, 'distance']
                    ]
                },
                include: [
                    {
                        model: Hobby.instance().getModel(),
                        as: 'Hobbies',
                        required: false
                    }
                ],
                order: [[Sequelize.literal('distance'), 'ASC']],
                limit: 10,
                raw: false
            });
            
            return users;
        }
        catch (err) {
            console.log("Search Records Model Error ", err)
            if (request.transaction) {
                await request.transaction.rollback()
                request.transaction = null;
            }
            throw new Error(err?.sqlMessage || err.message)
        }
    }
    
    async searchRecordsOffline(request, params) {
        try {
            const { location, latitude, longitude, radius } = params;
            const currentUser = request.user.id;
            
            // Update current user's location
            await User.instance().updateRecord(request, {
                current_location: location,
                current_latitude: latitude,
                current_longitude: longitude,
            }, currentUser);
            
            // Convert radius from meters to kilometers for calculation
            const radiusInKm = radius / 1000;
            
            // Earth's radius in kilometers
            const earthRadiusKm = 6371;
            
            // Calculate bounding box for optimization (improves performance by filtering first)
            const latDiff = radiusInKm / earthRadiusKm * (180 / Math.PI);
            const lonDiff = radiusInKm / (earthRadiusKm * Math.cos(latitude * Math.PI / 180)) * (180 / Math.PI);
            
            // Haversine formula to calculate distance in meters
            const haversineFormula = Sequelize.literal(
                `(6371000 * acos(
                    GREATEST(-1.0, LEAST(1.0,
                        cos(radians(${latitude})) * 
                        cos(radians(current_latitude)) * 
                        cos(radians(current_longitude) - radians(${longitude})) + 
                        sin(radians(${latitude})) * 
                        sin(radians(current_latitude))
                    ))
                ))`
            );
            
            // Step 1: Get blocked user IDs (users that current user blocked OR users who blocked current user)
            const blockedByCurrentUser = await UserBlock.instance().getModel().findAll({
                where: {
                    deletedAt: null,
                    user_id: currentUser,
                },
                attributes: ['block_user_id'],
                raw: true
            });
            
            const blockedCurrentUser = await UserBlock.instance().getModel().findAll({
                where: {
                    deletedAt: null,
                    block_user_id: currentUser,
                },
                attributes: ['user_id'],
                raw: true
            });
            
            const blockedUserIds = [
                ...blockedByCurrentUser.map(b => b.block_user_id),
                ...blockedCurrentUser.map(b => b.user_id)
            ];
            
            // Step 2: Get users who are already friends (both actions are ACCEPTED)
            const friendRelationships = await db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        {
                            user_one_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED
                        },
                        {
                            user_two_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED
                        }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            });
            
            const friendUserIds = friendRelationships.map(rel => {
                return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
            });
            
            // Step 3: Get users who are ignored (hidden_until is within 5 minutes from now)
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - CONNECTION_REQUEST_TIMEOUT_MINUTES * 60 * 1000);
            
            const ignoredRelationships = await db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        {
                            user_one_id: currentUser,
                            user_one_hidden_until: {
                                [Op.gte]: fiveMinutesAgo,
                                [Op.lte]: now
                            }
                        },
                        {
                            user_two_id: currentUser,
                            user_two_hidden_until: {
                                [Op.gte]: fiveMinutesAgo,
                                [Op.lte]: now
                            }
                        }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            });
            
            const ignoredUserIds = ignoredRelationships.map(rel => {
                return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
            });
            
            // Step 4: Get users I already requested (pending) and users who requested me (pending)
            const requestedRelationships = await db.user_relationships.findAll({
                where: {
                    deletedAt: null,
                    [Op.or]: [
                        {
                            user_one_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        },
                        {
                            user_one_id: currentUser,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        },
                        {
                            user_two_id: currentUser,
                            user_two_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        },
                        {
                            user_two_id: currentUser,
                            user_one_action: USER_RELATIONSHIP_ACTION_ENUM.REQUESTED
                        }
                    ]
                },
                attributes: ['user_one_id', 'user_two_id'],
                raw: true
            });
            
            const requestedUserIds = requestedRelationships.map(rel => {
                return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
            });
            
            // Combine all excluded user IDs (blocked, friends, ignored, already requested / requested me)
            const excludedUserIds = [...new Set([...blockedUserIds, ...friendUserIds, ...ignoredUserIds, ...requestedUserIds])];
            
            // Build where clause
            const whereClause = {
                deletedAt: null,
                is_visible: true,
                is_activated: true,
                is_blocked: false,
                id: {
                    [Op.ne]: currentUser // Exclude current user
                },
                current_latitude: {
                    [Op.between]: [latitude - latDiff, latitude + latDiff],
                    [Op.ne]: null
                },
                current_longitude: {
                    [Op.between]: [longitude - lonDiff, longitude + lonDiff],
                    [Op.ne]: null
                }
            };
            
            // Exclude blocked, friends, and ignored users
            if (excludedUserIds.length > 0) {
                whereClause.id = {
                    [Op.ne]: currentUser,
                    [Op.notIn]: excludedUserIds
                };
            }
            
            // Use subquery approach to filter by distance directly in SQL
            const UserModel = User.instance().getModel();
            const users = await UserModel.findAll({
                where: {
                    ...whereClause,
                    // Filter by distance directly in WHERE clause using the Haversine formula
                    [Op.and]: [
                        Sequelize.literal(`(
                            6371000 * acos(
                                GREATEST(-1.0, LEAST(1.0,
                                    cos(radians(${latitude})) * 
                                    cos(radians(current_latitude)) * 
                                    cos(radians(current_longitude) - radians(${longitude})) + 
                                    sin(radians(${latitude})) * 
                                    sin(radians(current_latitude))
                                ))
                            )
                        ) <= ${radius}`)
                    ]
                },
                attributes: ['id'],
                order: [[Sequelize.literal(`(6371000 * acos(GREATEST(-1.0, LEAST(1.0, cos(radians(${latitude})) * cos(radians(current_latitude)) * cos(radians(current_longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(current_latitude))))))`), 'ASC']],
                limit: 10,
                raw: true
            });

            // Send "new encounter" / "someone crossed your path" notification to each matching user (do not return user list)
            const currentUserName = request.user.username || 'Someone';
            for (const u of users) {
                await UserRelationship.sendNotification(
                    u.id,
                    NOTIFICATION_TYPES.NEW_ENCOUNTER,
                    "New Encounter",
                    `${currentUserName} just crossed your path`,
                    { user_id: currentUser,
                        relationship_id: '',
                     }
                );
            }
        }
        catch (err) {
            console.log("Search Records Model Error ", err)
            if (request.transaction) {
                await request.transaction.rollback()
                request.transaction = null;
            }
            throw new Error(err?.sqlMessage || err.message)
        }
    }

    /**
     * Get visible nearby users after applying block and relationship filters
     * @param {number} currentUser - Current authenticated user ID
     * @param {array} nearbyUserIds - Array of user IDs from nearby search
     * @returns {Promise<array>} Array of visible user IDs with relationship info
     */
    static async getVisibleNearbyUsers(currentUser, nearbyUserIds) {
        if (!nearbyUserIds || nearbyUserIds.length === 0) {
            return [];
        }

        // Step 1: Exclude blocked users
        // Get users blocked by currentUser
        const blockedByCurrentUser = await db.user_blocks.findAll({
            where: {
                user_id: currentUser,
                deletedAt: null
            },
            attributes: ['block_user_id'],
            raw: true
        });

        // Get users who blocked currentUser
        const blockedCurrentUser = await db.user_blocks.findAll({
            where: {
                block_user_id: currentUser,
                deletedAt: null
            },
            attributes: ['user_id'],
            raw: true
        });

        const blockedUserIds = new Set([
            ...blockedByCurrentUser.map(b => b.block_user_id),
            ...blockedCurrentUser.map(b => b.user_id)
        ]);

        // Filter out blocked users
        const unblockedUserIds = nearbyUserIds.filter(id => !blockedUserIds.has(id));

        if (unblockedUserIds.length === 0) {
            return [];
        }

        // Step 2: Get relationships for remaining users
        // Build canonical pairs for all users
        const relationshipPairs = unblockedUserIds.map(otherUserId => {
            const { user_one_id, user_two_id } = this.getCanonicalOrder(currentUser, otherUserId);
            return { user_one_id, user_two_id, otherUserId };
        });

        // Fetch all relationships in one query
        const relationships = await db.user_relationships.findAll({
            where: {
                [Op.or]: relationshipPairs.map(pair => ({
                    user_one_id: pair.user_one_id,
                    user_two_id: pair.user_two_id
                })),
                deletedAt: null
            },
            raw: true
        });

        // Create a map for quick lookup
        const relationshipMap = new Map();
        relationships.forEach(rel => {
            const key = `${rel.user_one_id}_${rel.user_two_id}`;
            relationshipMap.set(key, rel);
        });

        // Step 3: Filter by visibility rules
        const now = new Date();
        const visibleUsers = [];

        unblockedUserIds.forEach(otherUserId => {
            const { user_one_id, user_two_id, isUserOne } = this.getCanonicalOrder(currentUser, otherUserId);
            const key = `${user_one_id}_${user_two_id}`;
            const relationship = relationshipMap.get(key);

            if (!relationship) {
                // No relationship exists - include user
                visibleUsers.push({
                    user_id: otherUserId,
                    is_friend: false,
                    relationship: null
                });
            } else {
                // Check if current user is hidden
                const hiddenUntil = isUserOne ? relationship.user_one_hidden_until : relationship.user_two_hidden_until;
                
                if (hiddenUntil && new Date(hiddenUntil) > now) {
                    // User is hidden - exclude
                    return;
                }

                // Check if both accepted (friends)
                const bothAccepted = 
                    relationship.user_one_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED &&
                    relationship.user_two_action === USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED;

                visibleUsers.push({
                    user_id: otherUserId,
                    is_friend: bothAccepted,
                    relationship: relationship
                });
            }
        });

        return visibleUsers;
    }

}

module.exports = UserRelationship;
  
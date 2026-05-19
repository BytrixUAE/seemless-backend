const { v4: uuidv4 } = require('uuid');
const _ = require("lodash")
const randomstring = require("randomstring");
const {Op, fn} = require('sequelize');
const moment = require("moment")

const { generateHash } = require("../Helper");
const RestModel = require("./RestModel")
const ResetPassword = require("./ResetPassword")
const UserSocialAccount = require("./UserSocialAccount");
const Setting = require("./Setting");
const Subscription = require("./Subscription");
const SubscriptionPackage = require("./SubscriptionPackage");
const Subscriber = require("./Subscriber");
const emailHandler = require("../Libraries/EmailHandler/EmailHandler");
const { LOGIN_TYPE, API_TOKENS_ENUM, ROLES } = require('../config/enum');
const constants = require('../config/constants');
const { Sequelize } = require('../Database');
const db = require('../Database');
const UserHobby = require("./UserHobby");
const Hobby = require("./Hobby");


class User extends RestModel {

    constructor() {
        super("users")
    }

    softdelete() {
        return true;
    }

    includeShow() {
        return [
            {
                model: UserSocialAccount.instance().getModel(),
                as: 'UserSocialAccounts',
                required: false
            },
            {
                model: Subscriber.instance().getModel(),
                attributes: ['id', 'expiry_date', 'status', 'package_id', 'subscriber_id', 'platform', 'type', 'amount', 'currency'],
                where: {
                    expiry_date: {
                        [Op.gt]: fn('NOW')
                    },
                    status: {
                        [Op.notIn]: [Subscriber.STATUS_EXPIRE, Subscriber.STATUS_HOLD]
                    }
                },
                order: [['expiry_date', 'DESC']],
                as: 'Subscription',
                include: [
                    {
                        model: SubscriptionPackage.instance().getModel(),
                        as: 'SubscriptionPackage',
                        required: false
                    }
                ],
                required: false
            },
            {
                model: Hobby.instance().getModel(),
                as: 'Hobbies',
                required: false
            },
        ];
    }
    includeIndex() {
        return [
            {
                model: Subscriber.instance().getModel(),
                attributes: ['id', 'expiry_date', 'status', 'package_id', 'subscriber_id', 'platform', 'type', 'amount', 'currency'],
                where: {
                    expiry_date: {
                        [Op.gt]: fn('NOW')
                    },
                    status: {
                        [Op.notIn]: [Subscriber.STATUS_EXPIRE, Subscriber.STATUS_HOLD]
                    }
                },
                order: [['expiry_date', 'DESC']],
                as: 'Subscription',
                include: [
                    {
                        model: SubscriptionPackage.instance().getModel(),
                        as: 'SubscriptionPackage',
                        required: false
                    }
                ],
                required: false
            },
            {
                model: Hobby.instance().getModel(),
                as: 'Hobbies',
                required: false
            },
        ];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return [
            'uuid', 'firstname', 'lastname', 'name', 'username', 'email', 'mobile_no', 'password',
            'image_url', 'blured_image_url', 'is_mobile_verify', 'mobile_verifyAt', 'is_email_verify', 'email_verifyAt',
            'status', 'is_activated', 'is_blocked', 'is_special', 'block_reason', 'login_type', 'platform_type', 'platform_id', 'trail_expired_at',
            'dob', 'star_name', 'gender', 'is_visible', 'current_location', 'current_longitude', 'current_latitude', 'radius_unit',
            'stripe_customer_id', 'createdAt', 'updatedAt', 'deletedAt'
        ];
    }


    showColumns() {
        return [
            'id', 'uuid', 'user_type', 'firstname', 'lastname', 'name', 'username',
            'email', 'mobile_no', 'image_url', 'blured_image_url', 'is_mobile_verify', 'mobile_verifyAt', 'is_email_verify', 'email_verifyAt',
            'status', 'is_activated', 'login_type', 'platform_type', 'platform_id', 'trail_expired_at',
            'is_blocked', 'is_special', 'block_reason', 'createdAt', 'dob', 'star_name', 'gender', 'is_visible', 'current_location', 'current_longitude', 'current_latitude', 'radius_unit', 'stripe_customer_id', 'push_notification'
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [
            'id', 'user_type',
            'email', 'is_email_verify', 'email_verifyAt', 'is_mobile_verify', 'mobile_verifyAt',
            'login_type', 'platform_type', 'platform_id',
            'createdAt'
        ];
    }

    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} id
     */
    async indexQueryHook(query, request, id = {}) {
        query.include = this.includeIndex();
        
        const currentUser = request.user?.id;
        
        // Base where clause - exclude current user and only active users
        query.where = {
            user_type: ROLES.USER,
            deletedAt: null,
            email_verifyAt: {
                [Op.ne]: null
            }
        };
        
        // Exclude current user
        let excludedUserIds = [];
        if (currentUser) {
            excludedUserIds.push(currentUser);
        }
        
        // Search filter
        if (request.query.search){
            const searchQuery = request?.query?.search
            query.where = {
                ...query.where,
                [Op.or]: [
                    { firstname: { [Op.like]: `%${searchQuery}%` } },
                    { lastname: { [Op.like]: `%${searchQuery}%` } },
                    { name: { [Op.like]: `%${searchQuery}%` } },
                    { email: { [Op.like]: `%${searchQuery}%` } }
                ]
            }
        }

        if(request.query.is_blocked !== undefined){
            query.where.is_blocked = request.query.is_blocked === '1' ? true : false;
        }
        
        // Relationship filters
        if (currentUser) {
            const { my_blocked, my_friend, my_requested, request_by_me, my_ignored, ignored_by_me } = request.query;
            const UserRelationship = require("./UserRelationship");
            const UserBlock = require("./UserBlock");
            const { USER_RELATIONSHIP_ACTION_ENUM } = require("../config/enum");
            
            let filteredUserIds = null;
            
            // Get blocked user IDs
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
            
            // Handle my_blocked filter
            if (my_blocked === '1') {
                // Include only blocked users
                if (blockedUserIds.length > 0) {
                    filteredUserIds = blockedUserIds;
                } else {
                    // No blocked users, return empty result
                    filteredUserIds = [];
                }
            } else {
                // Exclude blocked users
                excludedUserIds = [...excludedUserIds, ...blockedUserIds];
            }
            
            // Build relationship filter conditions
            const relationshipFilterConditions = [];
            
            // Filter: my_friend - Both users have ACCEPTED status
            if (my_friend === '1') {
                relationshipFilterConditions.push({
                    user_one_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                    user_two_action: USER_RELATIONSHIP_ACTION_ENUM.ACCEPTED,
                    [Op.or]: [
                        { user_one_id: currentUser },
                        { user_two_id: currentUser }
                    ]
                });
            }
            
            // Filter: my_requested - Current user has REQUESTED status
            if (my_requested === '1') {
                relationshipFilterConditions.push({
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
                });
            }
            
            // Filter: request_by_me - Other user has REQUESTED status
            if (request_by_me === '1') {
                relationshipFilterConditions.push({
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
                });
            }
            
            // Filter: my_ignored - Current user has IGNORED status
            if (my_ignored === '1') {
                relationshipFilterConditions.push({
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
            
            // Filter: ignored_by_me - Other user has IGNORED status
            if (ignored_by_me === '1') {
                relationshipFilterConditions.push({
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
            
            // Apply relationship filters if any are specified
            if (relationshipFilterConditions.length > 0) {
                // Get user IDs that match the relationship filters
                const relationships = await db.user_relationships.findAll({
                    where: {
                        deletedAt: null,
                        [Op.and]: [
                            {
                                [Op.or]: [
                                    { user_one_id: currentUser },
                                    { user_two_id: currentUser }
                                ]
                            },
                            {
                                [Op.or]: relationshipFilterConditions
                            }
                        ]
                    },
                    attributes: ['user_one_id', 'user_two_id'],
                    raw: true
                });
                
                const relationshipUserIds = relationships.map(rel => {
                    return rel.user_one_id === currentUser ? rel.user_two_id : rel.user_one_id;
                });
                
                if (relationshipUserIds.length > 0) {
                    // Combine with existing filteredUserIds
                    if (filteredUserIds !== null) {
                        // Intersect with existing filter (e.g., blocked users)
                        filteredUserIds = filteredUserIds.filter(id => relationshipUserIds.includes(id));
                    } else {
                        filteredUserIds = relationshipUserIds;
                    }
                } else {
                    // No matching relationships, return empty result
                    filteredUserIds = [];
                }
            }
            
            // Apply final id filter
            if (filteredUserIds !== null) {
                // Filter by specific user IDs
                if (filteredUserIds.length > 0) {
                    query.where.id = {
                        [Op.in]: filteredUserIds.filter(id => !excludedUserIds.includes(id))
                    };
                } else {
                    // No matching users, return empty result
                    query.where.id = {
                        [Op.in]: []
                    };
                }
            } else if (excludedUserIds.length > 0) {
                // Exclude specific user IDs
                query.where.id = {
                    [Op.notIn]: excludedUserIds
                };
            }
        } else if (excludedUserIds.length > 0) {
            // Exclude current user if no other filters
            query.where.id = {
                [Op.notIn]: excludedUserIds
            };
        }
    }

    async singleQueryHook(query, request, id) {
        query.include = this.includeShow();
    }

    /**
     * Hook for manipulate data input before add data is execute
     * @param {adonis request object} request
     * @param {payload object} params
     */
    async beforeCreateHook(request, params) {
        params.user_type = ROLES.USER;
        params.uuid = params.uuid || uuidv4();
        if (params.mobile_no != null) {
            params.mobile_no = String(params.mobile_no).replace(/[^0-9]/g, '');
        }
        // params.username = params.name;
        params.password = generateHash(params.password)
        params.login_type = LOGIN_TYPE.CUSTOM
        params.platform_type = LOGIN_TYPE.CUSTOM
        params.platform_id = null
        params.createdAt = new Date();
        const getSetting = await Setting.instance().getLastRecord();
        if (!_.isEmpty(getSetting) && getSetting.trail_days > 0) {
            params.trail_expired_at = moment().add(getSetting.trail_days, 'days').toDate();
        }
    }

    /**
     * Hook for execute command after add public static function called
     * @param {saved record object} record
     * @param {controller request object} request
     * @param {payload object} params
     */
    async afterCreateHook(record, request, params) {
        const otp_record = {};
        if ((constants.EMAIL_VERIFICATION) && record.email) {
            otp_record.email = record.email;
        }

        if ((constants.SMS_VERIFICATION) && record.mobile_no) {
            otp_record.mobile_no = record.mobile_no;
        }
        if (!_.isEmpty(otp_record)) {
            await UserOTP.instance().createRecord(request, otp_record)
        }

        // return;
    }

    /**
 * Hook for manipulate data input before update data is execute
 * @param {adonis request object} request
 * @param {payload object} params
 * @param {integer} int
 */
    async beforeEditHook(request, params, id) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });

        if (request?.image_url) {
            params.image_url = request.image_url;
        }
    }

    async socialLogin(request) {
        let user;
        let params = request.body;

        if (!_.isEmpty(params.email)) {
            user = await this.getUserByEmail(params.email);
        }
        if (_.isEmpty(user)) {
            user = await this.getUserByPlatformID(params.platform_type, params.platform_id);
        }

        //add new user
        if (_.isEmpty(user)) {
            let password = randomstring.generate(8);
            const getSetting = await Setting.instance().getLastRecord();
            
            let param = {
                user_type: ROLES.USER,
                name: params.name,
                firstname: params.firstname || null,
                lastname: params.lastname || null,
                email: params.email,
                mobile_no: params.mobile_no,
                image_url: _.isEmpty(params.image_url) ? null : params.image_url,
                username: params.name,
                password: password,
                is_activated: true,
                is_email_verify: true,
                email_verifyAt: new Date(),
                is_mobile_verify: true,
                mobile_verifyAt: new Date(),
                login_type: params.platform_type,
                platform_type: request.body.platform_type,
                platform_id: request.body.platform_id,
                createdAt: new Date()
            }

            if (!_.isEmpty(getSetting) && getSetting.trail_days > 0) {
                param.trail_expired_at = moment().add(getSetting.trail_days, 'days').toDate();
            }

            user = await this.orm.create(param);

        } else {

            //update user
            let updateParams = {
                updated_at: new Date()
            };
            if (!_.isEmpty(params.name)) {
                user.name = updateParams.name = params.name
                user.username = updateParams.username = params.name
            }
            if (!_.isEmpty(params.firstname) && !_.isEmpty(params.lastname)) {
                user.firstname = updateParams.firstname = params.firstname
                user.lastname = updateParams.lastname = params.lastname
            }
            if (!_.isEmpty(params.image_url))
                user.image_url = updateParams.image_url = params.image_url

            await this.orm.update(updateParams, {
                where: {
                    id: user.id
                }
            })
        }
        return user;
    }


    async getUserByEmail(email) {
        let query = await this.orm.findOne({
            where: {
                email: email,
                deletedAt: null
            },
            include: this.includeShow()
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }

    async getUserByID(user_id) {
        let query = await this.orm.findOne({
            where: {
                id: user_id,
                deletedAt: null
            },
            include: this.includeShow()
        })
        // console.log("query", query);
        // console.log("query.toJSON()", query.toJSON());
        return !_.isEmpty(query) ? query.toJSON() : {};
    }

    async getUserByMobileNo(mobile_no) {
        let query = await this.orm.findOne({
            where: {
                mobile_no: mobile_no,
                deletedAt: null
            },
            include: this.includeShow()
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }
    async getUserByPlatformID(platform_type, platform_id) {
        let query = await this.orm.findOne({
            where: {
                platform_type: platform_type,
                platform_id: platform_id,
                deletedAt: null
            },
            order: [['createdAt', 'DESC']]
        })
        return !_.isEmpty(query) ? query.toJSON() : {};
    }

    async forgotPassword(record) {
        let resetPasswordToken = encodeURI(record.id + '|' + moment().valueOf());
        resetPasswordToken = Buffer.from(resetPasswordToken).toString('base64')
        await ResetPassword.instance().createRecord(record.email, resetPasswordToken)

        //send reset password email
        await emailHandler.forgotPassword(record.email, resetPasswordToken);
        return true;
    }

    async getUserByApiToken(api_token, type = API_TOKENS_ENUM.ACCESS) {
        let query = await this.orm.findOne({
            where: {
                user_type: ROLES.USER
            },
            include: [
                {
                    model: UserApiToken.instance().getModel(),
                    where: {
                        api_token: api_token,
                        type: type,
                        deletedAt: null
                    },
                    order: [['createdAt', 'DESC']]
                },
            ]
        })

        return _.isEmpty(query) ? {} : _.isEmpty(query.toJSON()?.user_api_tokens) ? {} : query.toJSON();
    }

    async updateUser(condition, data) {
        await this.orm.update(data, {
            where: condition
        });
        return true;
    }

    async verifySocial(request, user_id) {
        await this.orm.update(
            {
                email_verifyAt: new Date(),
                is_email_verify: true,
                mobile_verifyAt: new Date(),
                is_mobile_verify: true,
            },
            {
                where: {
                    id: user_id,
                    deletedAt: null
                }
            })
        return true;
    }

    async getResetPassReq(reset_password_token) {
        const token = await ResetPassword.instance().getRecordByResetPasswordToken(reset_password_token);
        if (_.isEmpty(token)) return {};

        let query = await this.orm.findOne({
            where: {
                email: token.email,
                deletedAt: null
            },
            raw: true
        })

        if (_.isEmpty(query)) return {}

        query.reset_passwords = token
        return query;
    }

    async updateResetPassword(user, params) {
        let new_password = generateHash(params.newPassword)
        await this.orm.update({
            password: new_password
        }, {
            where: {
                email: user.email
            }
        })
        await ResetPassword.instance().deleteResetPassToken(user.email, params.resetPassToken);
        return true;
    }


    async getMyProfile(request) {
        const record = await this.orm.findOne({
            where: {
                id: request.user.id,
                deletedAt: null
            },
            include: this.includeShow()
        })

        return _.isEmpty(record) ? {} : record.toJSON()
    }

    async validateUser(user_id) {
        const record = await this.orm.findOne({
            where: {
                id: user_id,
                user_type: ROLES.USER,
                is_activated: true,
                is_blocked: false,
                deletedAt: null
            }
        })
        return _.isEmpty(record) ? {} : record.toJSON()
    }

    async toggleNotification(user_id) {
        await this.orm.update({
            push_notification: Sequelize.literal('case when push_notification=0 then 1 else 0 end')
        }, {
            where: {
                id: user_id
            }
        })
        return;
    }

    /**
     * Hook for execute command after edit
     * @param {updated record object} record
     * @param {adonis request object} request
     * @param {payload object} params
     */
    async afterEditHook(record, request, params) {
        if (request.body?.social_accounts && request.body.social_accounts.length > 0) {
            await UserSocialAccount.instance().deleteRecordByCondition(request, {
                user_id: request.params.id,
            });

            for (const social_account of request.body.social_accounts) {
                const social_acounts_data = {
                    user_id: request.params.id,
                    account_type: social_account.type,
                    url: social_account.url
                }
                await UserSocialAccount.instance().createRecord(request, social_acounts_data);
            }
        }
        if (request.body?.hobbies && request.body.hobbies.length > 0) {
            await UserHobby.instance().deleteRecordByCondition(request, {
                user_id: request.params.id,
            });
            for (const hobby of request.body.hobbies) {
                // console.log("hobby", hobby)
                await UserHobby.instance().createRecord(request, {
                    user_id: request.params.id,
                    hobby_id: hobby
                });
            }
        }
        return record;
    }

    /**
     * Hook for execute command before delete
     * @param {adonis request object} request
     * @param {payload object} params
     * @param {integer} id
     */
    async beforeDeleteHook(request, params, id) {

    }

    /**
     * Hook for execute command after delete
     * @param {adonis request object} request
     * @param {payload object} params
     * @param {integer} id
     */
    async afterDeleteHook(request, params, id) {
        await UserApiToken.instance().deleteRecord(id);
        await UserOTP.instance().deleteRecord(request.user.email, request.user.mobile_no)
    }

    /**
     * Hook for manipulate query of datatable result
     * @param {current mongo query} query
     * @param {adonis request object} request
     */
    async datatable_query_hook(query, request) {

    }


}

module.exports = User;

const UserApiToken = require('./UserApiToken');
const UserOTP = require('./UserOTP');
const { subscribe } = require('../routes/test');


const _ = require("lodash")
const { LOGIN_TYPE, GENDER_ENUM, API_TOKENS_ENUM, UPLOAD_DIRECTORY, SOCIAL_ACCOUNT_TYPE_ENUM, RADIUS_UNIT_ENUM, SUBSCRIPTION_PACKAGE_TYPE_ENUM } = require("../../../config/enum.js");
const constants = require("../../../config/constants.js");
const { validateAll, compareHash, extractFields, generateHash, validateAsync, getUploadDirectoryPath } = require("../../../Helper/index.js");
const { v4: uuidv4 } = require('uuid');

const { Op } = require("sequelize");

const FileHandler = require("../../../Libraries/FileHandler/FileHandler.js");
const SocialUser = require("../../../Models/SocialUser.js");
const UserApiToken = require("../../../Models/UserApiToken.js");
const UserOTP = require("../../../Models/UserOTP.js");
const Subscription = require("../../../Models/Subscription.js");
const SubscriptionPackage = require("../../../Models/SubscriptionPackage.js");
const Stripe = require("stripe");

const RestController = require("../../RestController");

class UserController extends RestController {

    constructor(model = 'User') {
        super(model)
        this.resource = 'User';
        this.request; //adonis request obj
        this.response; //adonis response obj
        this.params = {}; // this is used for get parameters from url
    }


    async validation(action, id = 0) {
        let validator = [];
        let rules;
        let customMessages = {
            required: 'You forgot to give a :attribute',
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            same: ":attribute is not same as password"

        }

        switch (action) {
            case "store":
                rules = {
                    firstname: 'required|min:2|max:100',
                    lastname: 'max:100',
                    username: "required|min:2|max:45|unique:users,username",
                    dob: 'string',
                    star_name: 'string|min:2|max:100',
                    gender: 'integer|in:' + Object.values(GENDER_ENUM).join(','),
                    is_visible: 'in:0,1',
                    current_location: 'string|min:2|max:500',
                    current_longitude: 'float',
                    current_latitude: 'float',
                    email: 'required|email|unique:users,email|max:250',
                    hobbies: 'array',
                    "hobbies.*.hobby_id": 'required|integer',
                    mobile_no: [
                        'required',
                        'unique:users,mobile_no',
                        "max:18"
                    ],
                    password: 'required|min:8|max:30',
                    confirm_password: 'required|same:password',
                }

                validator = await validateAsync(this.request.body, rules, customMessages)
                break;
            case "update":
                // Use request.user.id for unique rule (profile update has no :id in URL, so params.id is undefined)
                const updateUserId = this.request.user?.id ?? this.params.id;
                rules = {
                    firstname: 'min:2|max:45',
                    lastname: 'max:45',
                    username: "min:2|max:45|unique:users,username,id," + updateUserId,
                    mobile_no: [
                        'unique:users,mobile_no,id,' + updateUserId,
                        "max:18"
                    ],
                    dob: 'string',
                    star_name: 'string|min:2|max:100',
                    gender: 'integer|in:' + Object.values(GENDER_ENUM).join(','),
                    is_visible: 'in:0,1',
                    current_location: 'string|min:2|max:500',
                    current_longitude: 'float',
                    current_latitude: 'float',
                    social_accounts: 'array',
                    hobbies: 'array',
                    "hobbies.*": 'required|integer|exists:hobbies,id',
                    radius_unit: 'string|in:' + Object.values(RADIUS_UNIT_ENUM).join(','),
                    "social_accounts.*.type": 'required|string|in:' + Object.values(SOCIAL_ACCOUNT_TYPE_ENUM).join(','),
                    "social_accounts.*.url": 'required|string|string',
                }
                validator = await validateAsync(this.request.body, rules, customMessages)
                break;
        }
        return validator;
    }

    async beforeUpdateLoadModel() {
        const params = this.request.body;

        this.params.id = this.request.user.id;
        if (!this.request.files?.length) return

        try {
            const fileObject = this.request.files;
            const image_url = await FileHandler.doUpload(fileObject[0], UPLOAD_DIRECTORY.USER)
            this.request.image_url = image_url
            return
        }
        catch (err) {
            this.__is_error = true;
            console.log(err)
            return this.sendError(
                "Failed to upload user image",
                {},
                500
            )
        }
    }

    async afterStoreLoadModel(record) {
        this.__collection = false;
        this.response_message = "User Created Successfully";

        // Generate Stripe customer ID after user creation
        try {
            if (process.env.STRIPE_SECRET && record && record.id) {
                const stripe = new Stripe(process.env.STRIPE_SECRET);
                
                // Create Stripe customer
                const customer = await stripe.customers.create({
                    email: record.email,
                    name: `${record.firstname || ''} ${record.lastname || ''}`.trim() || record.name,
                    metadata: {
                        user_id: record.id.toString()
                    }
                });
                
                // Update user record with Stripe customer ID
                const User = require("../../../Models/User");
                await User.instance().getModel().update(
                    { stripe_customer_id: customer.id },
                    { where: { id: record.id } }
                );
                
                // Update the record object for response
                record.stripe_customer_id = customer.id;
                
                console.log(`Stripe customer created for user ${record.id}: ${customer.id}`);
            }
        } catch (error) {
            console.error("Error creating Stripe customer:", error);
            // Don't fail user creation if Stripe customer creation fails
            // User can be created without Stripe customer, it can be created later if needed
        }
        // return {}
        return record;
    }

    async beforeDestroyLoadModel() {
        console.log('Before Destroy Load Model ')
        this.params.id = this.request.user.id
    }

    async login({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            let customMessages = {
                required: 'You forgot to give :attribute',
                email: "Invalid Email",
                'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            }

            let rules = {
                "email": 'required|email',
                "password": 'required',
                "device_type": "required|in:web,ios,android",
                "device_token": "required"
            }
            let validator = await validateAll(request.body, rules, customMessages);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error)
                return validation_error;

            let params = this.request.body;
            let user = await this.modal.getUserByEmail(params.email);

            if (_.isEmpty(user))
                return this.sendError(
                    'This email is not associated with any user',
                    {},
                    400
                );

            if (!compareHash(params.password, user.password))
                return this.sendError(
                    "Incorrect Password",
                    {},
                    400
                );

            if (user.login_type !== LOGIN_TYPE.CUSTOM) {
                return this.sendError(
                    "Email already registered from different platform.",
                    {},
                    403
                );
            }

            if (!user.is_activated) {
                return this.sendError(
                    "You have been de-activated by Admin. Kindly contact the administrator",
                    {},
                    403
                );
            }

            if (user.is_blocked) {
                return this.sendError(
                    "You have been blocked by Admin. Kindly contact the administrator.",
                    {},
                    403
                );
            }

            // Backfill uuid for existing users
            if (!user.uuid) {
                const newUuid = uuidv4();
                await this.modal.getModel().update(
                    { uuid: newUuid },
                    { where: { id: user.id } }
                );
                user.uuid = newUuid;
            }

            // If special user has no active subscription, auto-add yearly subscription
            if (user.is_special) {
                const now = new Date();
                const activeSubscription = await Subscription.instance().getModel().findOne({
                    where: {
                        user_id: user.id,
                        status: 1,
                        deletedAt: null,
                        end_date: { [Op.gte]: now },
                    },
                    order: [['end_date', 'DESC']],
                    raw: true,
                });

                if (!activeSubscription) {
                    const yearlyPackage = await SubscriptionPackage.instance().getModel().findOne({
                        where: {
                            deletedAt: null,
                            status: 1,
                            type: SUBSCRIPTION_PACKAGE_TYPE_ENUM.YEARLY,
                        },
                        order: [['duration_days', 'DESC'], ['id', 'DESC']],
                        raw: true,
                    });

                    if (yearlyPackage) {
                        const startDate = now;
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + (parseInt(yearlyPackage.duration_days, 10) || 365));

                        await Subscription.instance().createRecord(request, {
                            user_id: user.id,
                            package_id: yearlyPackage.id,
                            amount: parseFloat(yearlyPackage.price || 0),
                            start_date: startDate,
                            end_date: endDate,
                            status: 1,
                            stripe_subscription_id: null,
                            stripe_customer_id: user.stripe_customer_id || null,
                            stripe_payment_intent_id: null,
                        });
                    }
                }
            }

            if ((constants.SMS_VERIFICATION && !user.is_mobile_verify) || (constants.EMAIL_VERIFICATION && !user.is_email_verify)) {

                const payload = {}
                if (user.email) {
                    payload.email = user.email;
                }
                if (user.mobile_no) {
                    payload.mobile_no = user.mobile_no
                }
                await UserOTP.instance().createRecord(this.request, payload);
                // return this.sendError(
                //     "Email or mobile no is not verified.",
                //     payload,
                //     428
                // );
            }

            request.body.user_id = user.id
            await UserApiToken.instance().createRecord(
                request,
                extractFields(request.body, UserApiToken.instance().getFields())
            )

            // Check if user has Stripe customer ID, if not create one
            if (!user.stripe_customer_id && process.env.STRIPE_SECRET) {
                try {
                    const stripe = new Stripe(process.env.STRIPE_SECRET);
                    
                    // Create Stripe customer
                    const customer = await stripe.customers.create({
                        email: user.email,
                        name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.name,
                        metadata: {
                            user_id: user.id.toString()
                        }
                    });
                    
                    // Update user record with Stripe customer ID
                    await this.modal.getModel().update(
                        { stripe_customer_id: customer.id },
                        { where: { id: user.id } }
                    );
                    
                    // Update user object for response
                    user.stripe_customer_id = customer.id;
                    
                    console.log(`Stripe customer created for user ${user.id} on login: ${customer.id}`);
                } catch (error) {
                    console.error("Error creating Stripe customer on login:", error);
                    // Don't fail login if Stripe customer creation fails
                    // Continue with login without stripe_customer_id
                }
            }

            this.__is_paginate = false;
            await this.sendResponse(
                200,
                'User logged in successfully!',
                user
            );
            return;
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                'Internal server error. Please try again later.',
                {},
                500
            )
        }
    }


    async socialLogin({ request, response }) {
        this.request = request;
        this.response = response;
        const params = request.body;
        let socialUser;

        let customMessages = {
            required: 'You forgot to give :attribute',
            email: "Invalid Email",
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
        }

        let rules = {
            "email": 'email|max:50',
            "platform_id": "required|max:255",
            "platform_type": "required|in:facebook,google,apple",
            "device_type": "required|in:web,android,ios",
            "device_token": "required",

        }
        let validator = await validateAll(params, rules, customMessages);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;


        if (!_.isEmpty(params.email)) {
            const existing_user = await this.modal.getRecordByCondition(
                this.request,
                {
                    platform_id: params.platform_id,
                    platform_type: params.platform_type,
                    deletedAt: null
                }
            )
            if (!_.isEmpty(existing_user) && (existing_user.email !== params.email)) {
                return this.sendError(
                    "Invalid social details",
                    {},
                    400
                )
            }
            await SocialUser.instance().findOrCreateRecord(this.request, extractFields(params, SocialUser.instance().getFields()));
        } else {
            const saved_user = await SocialUser.instance().getUserRecord(params.platform_id, params.platform_type)
            if (!_.isEmpty(saved_user)) {
                params.email = saved_user.email;
                request.body.email = saved_user.email;
                request.body.name = saved_user.name
            }
        }
        if (!_.isEmpty(params.email)) {
            socialUser = await this.modal.getUserByEmail(params.email);
        }

        // if (_.isEmpty(socialUser)) {
        //     socialUser = await this.modal.getUserByPlatformID(params.platform_type, params.platform_id);
        // }

        if (_.isEmpty(socialUser) && !params.email) {
            return this.sendError(
                "Not able to sign up without email",
                {},
                403
            );
        }

        if (!_.isEmpty(socialUser)) {
            if (socialUser.login_type !== params.platform_type) {
                return this.sendError(
                    "Email already registered from different platform.",
                    {},
                    400
                );
            }

            if (!socialUser.is_activated) {
                return this.sendError(
                    "You have been de-activated by Admin. Kindly contact the administrator",
                    {},
                    403
                );
            }
            console.log("Block Status", socialUser.is_blocked)

            if (socialUser.is_blocked) {
                return this.sendError(
                    "You have been blocked by Admin. Kindly contact the administrator.",
                    {},
                    403
                );
            }
        }


        let user = await this.modal.socialLogin(request);

        // Backfill uuid for existing users
        if (user && !user.uuid) {
            const newUuid = uuidv4();
            await this.modal.getModel().update(
                { uuid: newUuid },
                { where: { id: user.id } }
            );
            user.uuid = newUuid;
        }

        // If special user has no active subscription, auto-add yearly subscription
        if (user && user.is_special) {
            const now = new Date();
            const activeSubscription = await Subscription.instance().getModel().findOne({
                where: {
                    user_id: user.id,
                    status: 1,
                    deletedAt: null,
                    end_date: { [Op.gte]: now },
                },
                order: [['end_date', 'DESC']],
                raw: true,
            });

            if (!activeSubscription) {
                const yearlyPackage = await SubscriptionPackage.instance().getModel().findOne({
                    where: {
                        deletedAt: null,
                        status: 1,
                        type: SUBSCRIPTION_PACKAGE_TYPE_ENUM.YEARLY,
                    },
                    order: [['duration_days', 'DESC'], ['id', 'DESC']],
                    raw: true,
                });

                if (yearlyPackage) {
                    const startDate = now;
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + (parseInt(yearlyPackage.duration_days, 10) || 365));

                    await Subscription.instance().createRecord(request, {
                        user_id: user.id,
                        package_id: yearlyPackage.id,
                        amount: parseFloat(yearlyPackage.price || 0),
                        start_date: startDate,
                        end_date: endDate,
                        status: 1,
                        stripe_subscription_id: null,
                        stripe_customer_id: user.stripe_customer_id || null,
                        stripe_payment_intent_id: null,
                    });
                }
            }
        }

        /*const invite_count = await Invite.instance().getInviteCount(user.id);
        if (invite_count < constants.MIN_INVITE_REQUIRED) {
            request.body.slug = user.slug
            request.body.type = API_TOKENS_ENUM.INVITE
            await UserApiToken.instance().createRecord(
                request,
                extractFields(request.body, UserApiToken.instance().getFields())
            )

            return this.sendError(
                "Please invite user to login.",
                { invite_count: invite_count, api_token: Buffer.from(this.request.api_token).toString('base64') },
                430
            );
        }*/


        //generate api token
        const userApiToken = UserApiToken.instance()
        user.user_id = user.id;
        await userApiToken.createRecord(request, extractFields(user, userApiToken.getFields()))

        // Check if user has Stripe customer ID, if not create one
        if (!user.stripe_customer_id && process.env.STRIPE_SECRET) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET);
                
                // Create Stripe customer
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.name,
                    metadata: {
                        user_id: user.id.toString()
                    }
                });
                
                // Update user record with Stripe customer ID
                await this.modal.getModel().update(
                    { stripe_customer_id: customer.id },
                    { where: { id: user.id } }
                );
                
                // Update user object for response
                user.stripe_customer_id = customer.id;
                
                console.log(`Stripe customer created for user ${user.id} on social login: ${customer.id}`);
            } catch (error) {
                console.error("Error creating Stripe customer on social login:", error);
                // Don't fail login if Stripe customer creation fails
                // Continue with login without stripe_customer_id
            }
        }

        this.__is_paginate = false;
        await this.sendResponse(
            200,
            "User logged in successfully",
            user
        );
        return;
    }

    async setNewPassword({ request, response }) {
        this.request = request;
        this.response = response;
        const user = this.request.user;
        const params = this.request.body

        let rules = {
            "new_password": 'required|min:8|max:30',
            "confirm_password": 'required|same:new_password',
        }
        let validator = await validateAll(params, rules);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;

        //update new password
        let update_params = {
            password: generateHash(params.new_password)
        }
        //update user
        await this.modal.updateUser({ email: user.email }, update_params);
        await UserApiToken.instance().deleteRecord(user.id)
        await UserOTP.instance().deleteRecord(user?.email, user?.mobile_no)

        this.__is_paginate = false;
        return this.sendResponse(
            200,
            'Password reset successfully',
            {}
        )
    }


    async forgotPassword({ request, response }) {
        this.request = request;
        this.response = response;
        let params = request.body;

        let rules = {
            "email": 'required',
        }
        let validator = await validateAll(params, rules);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;


        //get user by email
        let user = await this.modal.getUserByEmail(params.email);
        if (_.isEmpty(user))
            return this.sendError(
                'This email is not associated with any user.',
                {},
                400
            );
        try {
            await UserOTP.instance().createRecord(
                this.request,
                extractFields(user, UserOTP.instance().getFields())
            )
            const record = await this.modal.forgotPassword(user);
        }
        catch (err) {
            return this.sendError(
                'Failed to send mail',
                {},
                500
            )
        }

        this.__collection = false;
        this.__is_paginate = false;
        this.sendResponse(
            200,
            "Otp has been sent to your email",
            {}
        );
        return;
    }

    async changePassword({ request, response }) {
        this.request = request;
        this.response = response;
        //validation rules
        let rules = {
            "current_password": 'required',
            "new_password": 'required|min:8|max:30',
            "confirm_password": 'required|same:new_password',
        }
        let validator = await validateAll(request.body, rules);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;

        let user = this.request.user;
        let params = this.request.body;

        if (user.login_type !== LOGIN_TYPE.CUSTOM) {
            return this.sendError(
                'Not able to change password. Not a custom user',
                {},
                400
            )
        }

        //check old password
        let checkCurrentPass = await compareHash(params.current_password, user.password)
        if (!checkCurrentPass)
            return this.sendError(
                "Invalid current password",
                {},
                400
            );
        //check current and old password
        if (params.current_password == params.new_password)
            return this.sendError(
                "Current password is same as new password",
                {},
                400
            );
        //update new password
        let update_params = {
            password: generateHash(params.new_password)
        }
        //update user
        await this.modal.updateUser({ email: user.email }, update_params);

        //remove all api token except current api token
        await UserApiToken.instance().deleteRecord(user.id)

        this.__is_paginate = false;
        this.__collection = false;
        this.sendResponse(
            200,
            "Password updated successfully",
            {}
        );
        return;
    }


    async toggleNotification({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            await this.modal.toggleNotification(request.user.id);
            this.__is_paginate = false;
            this.__collection = false
            return await this.sendResponse(
                200,
                "Notification status updated successfully",
                {}
            )
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error. Please try again later.",
                {},
                500
            )

        }

    }


    async getMyProfile({ request, response }) {
        this.request = request;
        this.response = response;

        const user = await this.modal.getMyProfile(request);
        this.resource = 'MyProfile'
        this.__is_paginate = false;
        return await this.sendResponse(
            200,
            "Profile retreived successfully",
            user
        )

    }
    
    async getOtherProfile({ request, response }) {
        this.request = request;
        this.response = response;

        const user = await this.modal.getUserByID(request.params.id);
        this.resource = 'User'
        this.__is_paginate = false;
        return await this.sendResponse(
            200,
            "Profile retreived successfully",
            user
        )

    }


    async logout({ request, response }) {
        this.request = request;
        this.response = response;

        const id = request.user.id;
        const record = await UserApiToken.instance().deleteRecord(id);

        this.__is_paginate = false;
        this.__collection = false;

        return this.sendResponse(
            200,
            "User Logout Successfully",
            {}
        )
    }

    async uploadAttachments({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            if (!request.files?.length) {
                throw new Error("Files are required");
            }
            if (!request.body?.path) {
                throw new Error("path is required");
            }
            
            const fileObjects = request.files;
            // Check if blur is requested (via query param or body param)
            const createBlur = request.query?.blur === '1' || request.body?.blur === '1' || request.query?.include_blur === '1' || request.body?.include_blur === '1';
            const blurAmount = parseInt(request.query?.blur_amount || request.body?.blur_amount || '10', 10);
            let files;
            if (createBlur) {
                // Use blur functionality for images
                files = await FileHandler.doUploadWithBlur(fileObjects, request.body?.path, true, blurAmount);
            } else {
                // Use regular upload and normalize response format
                const uploadedFiles = await FileHandler.doUpload(fileObjects, request.body?.path);
                // Normalize response to always return objects with original_url
                if (Array.isArray(uploadedFiles)) {
                    files = uploadedFiles.map(url => ({ original_url: url }));
                } else {
                    files = { original_url: uploadedFiles };
                }
            }
            
            this.__collection = false;
            this.__is_paginate = false;
            return this.sendResponse(200, "Files uploaded successfully", files);
        }
        catch (err) {
            console.log(err)
            return this.sendError(
                err.message || "Failed to upload files",
                {},
                500
            )
        }
    }

    async updateDeviceToken({request, response}){
        try {
            this.request = request;
            this.response = response;
            let rules = {
                "device_type": "required",
                "device_token": "required"
            }
            let validator = await validateAll(request.body, rules);
            let validation_error = this.validateRequestParams(validator);
            if (this.__is_error)
                return validation_error;

            await UserApiToken.instance().updateDeviceToken(request);

            return this.sendResponse(200,"Device Token Updated Successfully",{})
        }catch (e) {
            console.log(e)
            return this.sendError(e.message,{},400)
        }
    }



}


module.exports = UserController;
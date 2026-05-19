const _ = require("lodash")
const { validateAsync, validateAll, compareHash, extractFields, generateHash, getUserDirectory } = require("../../../Helper");
const { LOGIN_TYPE,UPLOAD_DIRECTORY } = require("../../../config/enum");
const { Op } = require("sequelize");
const { ROLES } = require("../../../config/enum");
const UserApiToken = require("../../../Models/UserApiToken");
const Subscription = require("../../../Models/Subscription");
const User = require("../../../Models/User");
const supportTicket = require("../../../Models/supportTicket");
const RestController = require("../../RestController");
const FileHandler = require("../../../Libraries/FileHandler/FileHandler");
const { Sequelize } = require("../../../Database");
const moment = require("moment");
const db = require("../../../Database");
const { SAMPLE_PASSWORD } = require("../../../config/constants");

class UserController extends RestController {

    constructor() {
        super("Admin")
        this.resource = 'Admin';
        this.request;
        this.response;
        this.params = {};
    }

    async validation(action, id = 0) {
        let validator = [];
        let rules;
        let customMessages = {
            required: 'You forgot to give a :attribute',
            email: "Invalid Email",
            'regex.password': "Password must contain atleast one number and one special character and should be 6 to 16 character long",
            same: ":attribute is not same as password"

        }

        switch (action) {
            case "store":
                rules = {
                    email: 'required|email|unique:users,email',
                    password: 'required|min:8|max:30',
                    device_type: "required",
                    device_token: "required"
                }

                validator = await validateAsync(this.request.body, rules)

                break;
            case "update":

                break;
        }
        return validator;
    }

    async beforeUpdateLoadModel() {
        this.params.id = this.request.params.id || this.request.user.id;
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



    async login({ request, response }) {
        this.request = request;
        this.response = response;

        let customMessages = {
            required: 'You forgot to give :attribute',
        }

        let rules = {
            "email": 'required|email',
            "password": 'required',
            "device_type": "required",
            "device_token": "required"
        }
        let validator = await validateAll(request.body, rules, customMessages);
        let validation_error = this.validateRequestParams(validator);
        if (this.__is_error)
            return validation_error;

        let params = this.request.body;
        let user = await this.modal.getAdminByEmail(params.email);

        if (_.isEmpty(user))
            return this.sendError(
                'This email is not associated with any admin',
                {},
                400
            );

        if (!compareHash(params.password, user.password))
            return this.sendError(
                "Incorrect email or password",
                {},
                400
            );

        request.body.user_id = user.id
        await UserApiToken.instance().createRecord(
            request,
            extractFields(request.body, UserApiToken.instance().getFields())
        )

        this.__is_paginate = false;
        await this.sendResponse(
            200,
            'User logged in successfully!',
            user
        );
        return;
    }

    /**
     * POST /api/admin/users/mark-special
     * Body: { emails: string[] }
     *
     * Sets users.is_special = 1 for the provided emails.
     */
    async markSpecialUsers({ request, response }) {
        try {
            this.request = request;
            this.response = response;

            const rules = {
                emails: "required|array|min:1",
                "emails.*": "required|email",
            };
            const validator = await validateAsync(this.request.body, rules);
            if (!_.isEmpty(validator) && validator.fails()) {
                return this.sendError(
                    this.setValidatorMessagesResponse(validator),
                    {},
                    400
                );
            }

            const emails = (request.body.emails || [])
                .filter(v => typeof v === "string")
                .map(v => v.trim().toLowerCase())
                .filter(Boolean);

            const uniqueEmails = [...new Set(emails)];
            if (uniqueEmails.length === 0) {
                this.__is_paginate = false;
                return this.sendResponse(200, "No emails provided", { updated: 0, created: 0 });
            }

            const existingUsers = await db.users.findAll({
                where: {
                    deletedAt: null,
                    email: { [Op.in]: uniqueEmails },
                },
                attributes: ["id", "email"],
                raw: true,
            });

            const existingEmailSet = new Set(
                existingUsers.map(u => (u.email || "").trim().toLowerCase()).filter(Boolean)
            );

            const emailsToCreate = uniqueEmails.filter(e => !existingEmailSet.has(e));

            let updated = 0;
            if (existingUsers.length > 0) {
                const [affectedRows] = await db.users.update(
                    { is_special: 1 },
                    {
                        where: {
                            deletedAt: null,
                            email: { [Op.in]: uniqueEmails },
                        },
                    }
                );
                updated = affectedRows;
            }

            let created = 0;
            for (const email of emailsToCreate) {
                await User.instance().createRecord(this.request, {
                    email,
                    password: SAMPLE_PASSWORD,
                    is_special: 1,
                });
                created += 1;
            }

            this.__is_paginate = false;
            return this.sendResponse(200, "Users updated successfully", {
                updated,
                created,
            });
        } catch (err) {
            console.log(err);
            return this.sendError(
                err.message || "Internal server error. Please try again later.",
                {},
                500
            );
        }
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
            const record = await this.modal.forgotPassword(user);
        }
        catch (err) {
            return this.sendError(
                'Failed to send mail',
                {},
                500
            )
        }


        this.__is_paginate = false;
        this.sendResponse(
            200,
            "Reset password link has been sent to your email",
            []
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


    async getMyProfile({ request, response }) {
        this.request = request;
        this.response = response;

        this.resource = 'AdminProfile'
        this.__is_paginate = false;
        return await this.sendResponse(
            200,
            "Profile retreived successfully",
            this.request.user
        )

    }

    async logout({ request, response }) {
        this.request = request;
        this.response = response;

        const user_id = request.user.id;
        const record = await UserApiToken.instance().deleteRecord(user_id);

        this.__is_paginate = false;
        this.__collection = false;

        return this.sendResponse(
            200,
            "User Logout Successfully",
            {}
        )
    }

    /**
     * Update user details.
     * PUT or PATCH users/:id
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
    async updateUser({ request, response }) {
        try {
            this.request = request;
            this.response = response;
            this.resource = 'User';
            this.params = this.request.params;
            //validation
            if (_.isFunction(this.validation)) {
                let validator = await this.validation("updateUser", this.params.id);
                if (!_.isEmpty(validator) && validator.fails()) {
                    this.sendError(
                        this.setValidatorMessagesResponse(validator),
                        {},
                        400
                    )
                    return;
                }
            }
            //before update hook
            if (_.isFunction(this.beforeUpdateLoadModel)) {
                var hookResponse = await this.beforeUpdateLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            let record = await User.instance().updateRecord(
                this.request,
                extractFields(this.request.body, User.instance().getFields()),
                this.params.id
            );
            //before update hook
            if (_.isFunction(this.afterUpdateLoadModel)) {
                var afterHookResponse = await this.afterUpdateLoadModel(record);
                if (typeof afterHookResponse != 'undefined') {
                    record = afterHookResponse;
                }
            }
            this.__is_paginate = false;
            await this.sendResponse(
                200,
                this.response_message || "Record Updated Successfully",
                record
            );
            return;
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error.Please try again later",
                {},
                500
            )
        }

    }


    /**
     * Delete a user with id.
     * DELETE users/:id
     *
     * @param {object} ctx
     * @param {Request} ctx.request
     * @param {Response} ctx.response
     */
    async deleteUser({ request, response }) {
        try {
            let record = {};
            this.request = request;
            this.response = response;
            this.params = request.params;


            //before destroy hook
            if (_.isFunction(this.beforeDestroyLoadModel)) {
                var hookResponse = await this.beforeDestroyLoadModel();
                if (this.__is_error) {
                    return hookResponse;
                }
            }
            await this.modal.deleteRecord(this.request, this.request.body, this.params.id);
            //after destroy hook
            if (_.isFunction(this.afterDestoryLoadModel)) {
                var afterHookResponse = await this.afterDestoryLoadModel();
                if (typeof afterHookResponse != 'undefined') {
                    record = afterHookResponse;
                }
            }
            this.__is_paginate = false;
            await this.sendResponse(
                200,
                this.response_message || 'Delete record successfully!.',
                record
            );
            return;
        }
        catch (err) {
            console.log(err);
            return this.sendError(
                "Internal server error.Please try again later",
                {},
                500
            )
        }
    }

    async getDashboardStats({ request, response }) {
        this.request = request;
        this.response = response;

        try {
            // Get total users (only USER type, not deleted)
            const totalUsers = await User.instance().getModel().count({
                where: {
                    user_type: ROLES.USER,
                    deletedAt: null,
                    is_email_verify: {
                        [Op.eq]: true
                    }
                }
            });

            const supportTicketCount = await supportTicket.instance().getModel().count({
                where: {
                    deletedAt: null
                }
            });

            // supportTicketGrowthData = await this.getSupportTicketGrowthData();

            // Get total active subscriptions
            // Active subscriptions are those where current date is between start_date and end_date
            const currentDate = new Date();
            const totalActiveSubscriptions = await Subscription.instance().getModel().count({
                where: {
                    deletedAt: null,
                    start_date: {
                        [Op.lte]: currentDate
                    },
                    end_date: {
                        [Op.gte]: currentDate
                    }
                }
            });

            // Get user growth data (last 6 weeks)
            // const userGrowthData = await this.getUserGrowthData();
            const totalRevenue = await this.getTotalRevenue();

            const stats = {
                totalUsers: totalUsers || 0,
                totalActiveSubscriptions: totalActiveSubscriptions || 0,
                totalSupportTickets: supportTicketCount || 0,
                totalRevenue: totalRevenue || 0,
            };

            // Set resource to use Dashboard resource for formatting
            this.resource = 'Dashboard';
            this.__collection = true;
            this.__is_paginate = false;
            return await this.sendResponse(
                200,
                "Dashboard stats retrieved successfully",
                stats
            );
        } catch (error) {
            console.error("Dashboard stats error:", error);
            return this.sendError(
                "Failed to retrieve dashboard stats",
                {},
                500
            );
        }
    }

    async getUserGrowthData() {
        try {
            // Get data for last 6 weeks (6 data points, 7 days apart)
            const dataPoints = [];
            
            for (let i = 5; i >= 0; i--) {
                // Calculate date: 7 days * i weeks ago
                const targetDate = moment().subtract(i * 7, 'days');
                
                // Count users created up to this date (cumulative)
                const userCount = await User.instance().getModel().count({
                    where: {
                        user_type: ROLES.USER,
                        deletedAt: null,
                        email_verifyAt: {
                            [Op.ne]: null
                        },
                        createdAt: {
                            [Op.lte]: targetDate.endOf('day').toDate()
                        }
                    }
                });

                // Format date as "MMM D" (e.g., "Jan 1", "Jan 8")
                const dateLabel = targetDate.format('MMM D');
                
                dataPoints.push({
                    date: dateLabel,
                    users: userCount || 0
                });
            }

            return dataPoints;
        } catch (error) {
            console.error("User growth data error:", error);
            return [];
        }
    }

    async getTotalRevenue() {
        try {
      
            // Build where clause for total revenue
            const revenueWhere = {
              deletedAt: null
            };
      
            // Get total revenue (sum of all subscription amounts)
            const totalRevenueResult = await Subscription.instance().getModel().findAll({
              where: revenueWhere,
              attributes: [
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue']
              ],
              raw: true
            });
      
            const totalRevenue = totalRevenueResult && totalRevenueResult[0] && totalRevenueResult[0].totalRevenue 
              ? parseFloat(totalRevenueResult[0].totalRevenue) 
              : 0;
      
            return totalRevenue || 0;
        } catch (error) {
            console.error("Subscription stats error:", error);
            return 0.00;
        } 
    }

    /**
     * Dashboard graph API – returns 12‑month chart data only (optimized: 4 queries total).
     */
    async getDashboardGraph({ request, response }) {
        this.request = request;
        this.response = response;
        try {
            const graphData = await this.getGraphData();
            this.resource = 'Dashboard';
            this.__collection = true;
            this.__is_paginate = false;
            return await this.sendResponse(200, "Dashboard graph retrieved successfully", graphData);
        } catch (error) {
            console.error("Dashboard graph error:", error);
            return this.sendError("Failed to retrieve dashboard graph", {}, 500);
        }
    }

    /**
     * Get last 12 months graph data (optimized: 4 queries with GROUP BY instead of 48).
     * Returns: revenue, active_subscription, users, support_tickets each with { month: [12 values] }
     */
    async getGraphData() {
        try {
            const startOfRange = moment().subtract(11, 'months').startOf('month').toDate();
            const endOfRange = moment().endOf('month').toDate();

            // Normalize key so MySQL "02" and JS 2 both match (avoid current month data missing)
            const monthKey = (y, m) => `${Number(y)}-${Number(m)}`;

            // Calendar order: index 0 = January, 1 = February, ..., 11 = December (so Feb = index 1)
            // For each calendar month 1-12, pick the (year, month) that falls in our last-12-months range
            const monthKeys = [];
            const monthLabels = [];
            const currentYear = moment().year();
            const prevYear = currentYear - 1;
            for (let monthNum = 1; monthNum <= 12; monthNum++) {
                const currYearMonth = moment([currentYear, monthNum - 1, 1]);
                const prevYearMonth = moment([prevYear, monthNum - 1, 1]);
                const inRangeCurr = !currYearMonth.isBefore(moment(startOfRange)) && !currYearMonth.isAfter(moment(endOfRange));
                const inRangePrev = !prevYearMonth.isBefore(moment(startOfRange)) && !prevYearMonth.isAfter(moment(endOfRange));
                const y = inRangeCurr ? currentYear : prevYear;
                monthKeys.push({ y, m: monthNum });
                monthLabels.push(moment([y, monthNum - 1, 1]).format('MMM YYYY'));
            }

            const SubscriptionModel = Subscription.instance().getModel();
            const UserModel = User.instance().getModel();
            const supportTicketModel = supportTicket.instance().getModel();

            // 1) Revenue: one query grouped by year/month
            const revenueRows = await SubscriptionModel.findAll({
                where: {
                    deletedAt: null,
                    start_date: { [Op.gte]: startOfRange, [Op.lte]: endOfRange }
                },
                attributes: [
                    [Sequelize.fn('YEAR', Sequelize.col('start_date')), 'y'],
                    [Sequelize.fn('MONTH', Sequelize.col('start_date')), 'm'],
                    [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
                ],
                group: [Sequelize.fn('YEAR', Sequelize.col('start_date')), Sequelize.fn('MONTH', Sequelize.col('start_date'))],
                raw: true
            });
            const revenueByMonth = new Map(revenueRows.map(r => [monthKey(r.y, r.m), Math.round(parseFloat(r.total) || 0)]));
            const revenueMonth = monthKeys.map(({ y, m }) => revenueByMonth.get(monthKey(y, m)) ?? 0);

            // 2) Active subscriptions: one query fetch overlapping subscriptions, then count per month in JS
            const overlappingSubs = await SubscriptionModel.findAll({
                where: {
                    deletedAt: null,
                    start_date: { [Op.lte]: endOfRange },
                    end_date: { [Op.gte]: startOfRange }
                },
                attributes: ['start_date', 'end_date'],
                raw: true
            });
            const activeSubscriptionMonth = monthKeys.map(({ y, m }) => {
                const startOfMonth = moment().year(y).month(m - 1).startOf('month').toDate();
                const endOfMonth = moment().year(y).month(m - 1).endOf('month').toDate();
                return overlappingSubs.filter(s => new Date(s.start_date) <= endOfMonth && new Date(s.end_date) >= startOfMonth).length;
            });

            // 3) Users: one query grouped by year/month
            const userRows = await UserModel.findAll({
                where: {
                    user_type: ROLES.USER,
                    deletedAt: null,
                    is_email_verify: { [Op.eq]: true },
                    createdAt: { [Op.gte]: startOfRange, [Op.lte]: endOfRange }
                },
                attributes: [
                    [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'y'],
                    [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'm'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']
                ],
                group: [Sequelize.fn('YEAR', Sequelize.col('createdAt')), Sequelize.fn('MONTH', Sequelize.col('createdAt'))],
                raw: true
            });
            const usersByMonth = new Map(userRows.map(r => [monthKey(r.y, r.m), Number(r.cnt) || 0]));
            const usersMonth = monthKeys.map(({ y, m }) => usersByMonth.get(monthKey(y, m)) ?? 0);

            // 4) Support tickets: one query grouped by year/month
            const ticketRows = await supportTicketModel.findAll({
                where: {
                    deletedAt: null,
                    createdAt: { [Op.gte]: startOfRange, [Op.lte]: endOfRange }
                },
                attributes: [
                    [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'y'],
                    [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'm'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']
                ],
                group: [Sequelize.fn('YEAR', Sequelize.col('createdAt')), Sequelize.fn('MONTH', Sequelize.col('createdAt'))],
                raw: true
            });
            const ticketsByMonth = new Map(ticketRows.map(r => [monthKey(r.y, r.m), Number(r.cnt) || 0]));
            const supportTicketsMonth = monthKeys.map(({ y, m }) => ticketsByMonth.get(monthKey(y, m)) ?? 0);

            // Current month in calendar order: Jan=0, Feb=1, ..., Dec=11
            const currentMonthIndex = moment().month();

            return {
                current_month_index: currentMonthIndex,
                month_labels: monthLabels,
                revenue: { month: revenueMonth },
                active_subscription: { month: activeSubscriptionMonth },
                users: { month: usersMonth },
                support_tickets: { month: supportTicketsMonth }
            };
        } catch (error) {
            console.error("Graph data error:", error);
            return {
                current_month_index: 0,
                month_labels: [],
                revenue: { month: [] },
                active_subscription: { month: [] },
                users: { month: [] },
                support_tickets: { month: [] }
            };
        }
    }

}

module.exports = UserController
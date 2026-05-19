"use strict";

const _ = require("lodash");
const moment = require("moment");
const { baseUrl } = require("../Helper/index");
const db = require("../Database/index");
const constants = require("../config/constants");

class RestModel {

    constructor(orm) {
        this.orm = this.loadOrm(orm);
    }

    /**
     *
     * @param request
     * @param params
     * @returns {Promise<*>}
     */

    getModel() {
        return this.orm
    }

    static instance() {
        return new this()
    }

    async createRecord(request, params) {
        //before create hook
        try {
            console.log("Before creating record hook : ", params)
            if (_.isFunction(this.beforeCreateHook)) {
                await this.beforeCreateHook(request, params);
            }
            //insert record
            var record = await this.orm.create(params, {
                ...(request.transaction ? { transaction: request.transaction } : {})
            });
            console.log("Orm created Record : ", record.toJSON());
            //after create hook
            if (_.isFunction(this.afterCreateHook)) {
                await this.afterCreateHook(record, request, params);
            }
            //get record by id
            // var record = await this.getRecordBySlug(request, record.slug);

            return record.toJSON();
        }
        catch (err) {
            console.log("Create Record Model Error ", err)
            if (request.transaction) {
                await request.transaction.rollback()
                request.transaction = null;
            }
            throw new Error(err?.sqlMessage)
        }
    }

    async getRecords(request, params = {}) {
        const page = _.isEmpty(request.query.page) ? 0 : parseInt(request.query.page) - 1;
        const limit = _.isEmpty(request.query.limit) ? constants.PAGINATION_LIMIT : parseInt(request.query.limit);
        const orderBy = request?.query?.orderBy ? request.query.orderBy : "id";
        const order = request?.query?.order ? request.query.order : "DESC";
        const is_paginate = request?.query?.is_paginate && request?.query?.is_paginate == "false" ? false : true;

        let query = {
            where: {
                deletedAt: null,
            },
            attributes: this.showColumns(),
        }

        //query hook
        if (_.isFunction(this.indexQueryHook)) {
            await this.indexQueryHook(query, request, params);
        }

        query = {
            ...query,
            ...(is_paginate && { limit: limit, offset: page * limit }),
            order: [
                [orderBy, order]
            ]
        }

        const { rows, count } = await this.orm.findAndCountAll(query)
        request.query.total = count;
        return _.isEmpty(rows) ? [] : rows.map(item => item.toJSON());

    }

    /**
       *
       * @param request
     * @param id
       * @returns {Promise<*>}
       */

    async getRecordById(request, id) {
        let query = {
            where: {
                deletedAt: null,
            },
            attributes: this.showColumns(),
        }
        //query hook
        if (_.isFunction(this.singleQueryHook)) {
            await this.singleQueryHook(query, request, id);
        }

        //Add Slug Condition
        query = {
            ...query,
            where: {
                ...query.where,
                id: id
            }
        }

        //get record;
        console.log("Generated Query : ", query)
        let record = await this.orm.findOne(query)


        console.log('Get Record By Slug Result : ', record?.toJSON())
        if (!_.isEmpty(record)) {
            return record.toJSON();
        } else {
            return {};
        }
    }

    async getRecordBySlug(request, slug) {
        let query = {
            where: {
                deletedAt: null,
            },
            attributes: this.showColumns(),
        }
        //query hook
        if (_.isFunction(this.singleQueryHook)) {
            await this.singleQueryHook(query, request, slug);
        }

        //Add Slug Condition
        query = {
            ...query,
            where: {
                ...query.where,
                slug: slug
            }
        }

        //get record;
        console.log("Generated Query : ", query)
        let record = await this.orm.findOne(query)


        console.log('Get Record By Slug Result : ', record?.toJSON())
        if (!_.isEmpty(record)) {
            return record.toJSON();
        } else {
            return {};
        }
    }

    async getRecordByCondition(request, conditions) {
        let query = {
            where: conditions,
            attributes: this.showColumns(),
        }

        //query hook
        if (_.isFunction(this.conditionalQueryHook)) {
            await this.conditionalQueryHook(query, request);
        }

        console.log("Get Single Records Query : ", query)
        const record = await this.orm.findOne(query);
        return _.isEmpty(record) ? {} : record.toJSON();

    }

    async getRecordsByCondition(request, conditions) {
        let query = {
            where: conditions,
            attributes: this.showColumns(),
        }

        //query hook
        if (_.isFunction(this.conditionalQueryHook)) {
            await this.conditionalQueryHook(query, request);
        }
        query.raw = false;

        console.log("Get All Records Query : ", query)
        const record = (await this.orm.findAll(query)).map(item => item.get({ plain: true }));
        return _.isEmpty(record) ? [] : record;

    }

    /**
       *
       * @param request
       * @param params
       * @param id
       * @returns {Promise<*>}
       */
    async updateRecord(request, params, id) {
        //before update hook
        try {
            let record;
            if (_.isFunction(this.beforeEditHook)) {
                await this.beforeEditHook(request, params, id);
            }
            //update record
            if (!_.isEmpty(params)) {
                record = await this.orm.update(params, {
                    where: {
                        id: id
                    },
                    ...(request.transaction ? { transaction: request.transaction } : {})
                })
            }
            //After  update hook
            if (_.isFunction(this.afterEditHook)) {
                await this.afterEditHook(record, request, params);
            }

            record = await this.getRecordById(request, id);
            return record;
        }
        catch (err) {
            console.log("Update Record Model Error ", err)
            if (request.transaction) {
                await request.transaction.rollback()
                request.transaction = null;
            }
            throw new Error(err?.sqlMessage)
        }
    }

    /**
     *
     * @param request
     * @param params
     * @param id
     * @returns {Promise<void>}
     */
    async deleteRecord(request, params, id) {
        //before delete hook
        try {
            let slug_arr = [];
            if (_.isFunction(this.beforeDeleteHook)) {
                await this.beforeDeleteHook(request, params, id);
            }
            if (id == 'delete-record') {
                slug_arr = params.id
            }
            else if (Array.isArray(id)) {
                slug_arr = id
            }
            else {
                slug_arr.push(id);
            }
            //check soft delete
            if (_.isFunction(this.softdelete)) {
                if (this.softdelete()) {
                    await this.orm.update({
                        deletedAt: new Date()
                    }, {
                        where: {
                            id: slug_arr
                        },
                        ...(request.transaction ? { transaction: request.transaction } : {})
                    })
                } else {
                    await this.orm.destroy({
                        where: {
                            id: slug_arr
                        }
                    })
                }
            } else {
                await this.orm.destroy({
                    where: {
                        id: slug_arr
                    }
                })
            }
            //after delete hook
            if (_.isFunction(this.afterDeleteHook)) {
                await this.afterDeleteHook(request, params, id);
            }
            return true;
        }
        catch (err) {
            console.log("Delete Record Model Error ", err)
            if (request.transaction) {
                await request.transaction.rollback()
                request.transaction = null;
            }
            throw new Error(err?.sqlMessage)
        }
    }
    
    async deleteRecordByCondition(request, conditions) {
        await this.orm.destroy({
            where: {
                ...conditions
            }
        })
        return true;
    }


    async getCount(request, params = {}) {
        let query = {}
        query.where = {
            deletedAt: null
        }

        if (_.isFunction(this.countQueryHook)) {
            await this.countQueryHook(request, query, params);
        }

        const count = await this.orm.count(query);

        return (count || 0);
    }

    loadOrm(name) {
        return db[name];
    }

}
module.exports = RestModel;

const _ = require("lodash")
const { v4: uuidv4 } = require('uuid');

const RestModel = require("./RestModel")

class SocialUser extends RestModel {

    constructor() {
        super("social_user")
    }

    softdelete() {
        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return ['name', 'email', 'platform_type', 'platform_id'];
    }


    showColumns() {
        return [
            'name', 'email', 'platform_type', 'platform_id'
        ];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return [];
    }

    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {

    }

    /**
     * Hook for manipulate data input before add data is execute
     * @param {adonis request object} request
     * @param {payload object} params
     */
    async beforeCreateHook(request, params) {
        // await this.deleteRecord(params?.platform_id)
        params.createdAt = new Date();
    }

    /**
     * Hook for execute command after add public static function called
     * @param {saved record object} record
     * @param {controller request object} request
     * @param {payload object} params
     */
    async afterCreateHook(record, request, params) { }


    /**
     * Hook for manipulate data input before update data is execute
     * @param {adonis request object} request
     * @param {payload object} params
     * @param {string} slug
     */
    async beforeEditHook(request, params, slug) { }

    async findOrCreateRecord(request, params) {
        let user;
        user = (await this.orm.findOne({
            where: {
                email: params.email,
                platform_id: params.platform_id,
                platform_type: params.platform_type,
                deletedAt: null
            }
        }))?.toJSON()

        if (_.isEmpty(user)) {
            user = await this.createRecord(request, params)
        }

        return user;
    }


    async getUserRecord(platform_id, platform_type) {
        const record = await this.orm.findOne({
            where: {
                platform_id,
                platform_type,
                deletedAt: null
            },
            order: [['createdAt', 'desc']],
        })

        return _.isEmpty(record) ? {} : record.toJSON()

    }


    async deleteRecord(platform_id) {
        console.log("Delete User Record By Platform ID ", platform_id)
        const query = await this.orm.destroy({
            where: {
                platform_id: platform_id
            }
        })
        return true;

    }


}

module.exports = SocialUser;
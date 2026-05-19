const _ = require("lodash")

const RestModel = require("./RestModel");
const LookupData = require("./LookupData");

class Lookup extends RestModel {

    constructor() {
        super("lookups")
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
        return [];
    }



    showColumns() {
        return [
            'title', 'key', 'createdAt'
        ];
    }


    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = [
            {
                model: LookupData.instance().getModel(),
                required: false,
                as: "LookupData_LookupSlug",
                where: {
                    deletedAt: null
                }
            }
        ]
    }


    async getRecords(request, params = {}) {
        let query = {
            where: {
                deletedAt: null,
            },
            attributes: this.showColumns(),
        }

        await this.indexQueryHook(query, request, params);

        const records = await this.orm.findAll(query)
        return _.isEmpty(records) ? [] : records.map(item => item.toJSON());
    }
}

module.exports = Lookup;
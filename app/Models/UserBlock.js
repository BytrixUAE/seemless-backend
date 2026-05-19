
const _ = require("lodash");
const RestModel = require("./RestModel");
const db = require("../Database");

class UserBlock extends RestModel {

    constructor() {
        super("user_blocks");
    }

    softdelete() {
        return true;
    }
    
    includeShow(){
        return [];
    }
    
    includeIndex(){
        return [];
    }
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    getFields() {
        return ["user_id", "block_user_id", "reason", "updatedAt", "deletedAt"];
    }

    showColumns() {
        return ["id", "user_id", "block_user_id", "reason", "createdAt", "updatedAt", "deletedAt"];
    }

    exceptUpdateField() {
        return ["id", "user_id", "block_user_id"];
    }
    
    /**
     * Hook for manipulate query of index result
     * @param {current mongo query} query
     * @param {adonis request object} request
     * @param {object} slug
     */
    async indexQueryHook(query, request, slug = {}) {
        query.include = this.includeIndex();
    }
    async singleQueryHook(query, request, id){
        query.include = this.includeShow();
    }
    async beforeCreateHook(request, params) {
   
    }
    async beforeEditHook(request, params, slug) {
        let exceptUpdateField = this.exceptUpdateField();
        exceptUpdateField.filter(exceptField => {
            delete params[exceptField];
        });
    }

    /**
     * Check if userA is blocked by userB or vice versa
     * @param {number} userA - First user ID
     * @param {number} userB - Second user ID
     * @returns {Promise<boolean>} True if either user blocked the other
     */
    static async isBlocked(userA, userB) {
        const block = await db.user_blocks.findOne({
            where: {
                deletedAt: null,
                [db.Sequelize.Op.or]: [
                    {
                        user_id: userA,
                        block_user_id: userB
                    },
                    {
                        user_id: userB,
                        block_user_id: userA
                    }
                ]
            }
        });

        return !!block;
    }

    /**
     * Users the given user blocked, plus users who blocked the given user (active rows only).
     * @param {number} userId
     * @returns {Promise<number[]>}
     */
    static async getBlockedRelatedUserIds(userId) {
        const blockedByMe = await db.user_blocks.findAll({
            where: {
                deletedAt: null,
                user_id: userId,
            },
            attributes: ["block_user_id"],
            raw: true,
        });
        const blockedMe = await db.user_blocks.findAll({
            where: {
                deletedAt: null,
                block_user_id: userId,
            },
            attributes: ["user_id"],
            raw: true,
        });
        return [
            ...new Set([
                ...blockedByMe.map((b) => b.block_user_id),
                ...blockedMe.map((b) => b.user_id),
            ]),
        ];
    }

}

module.exports = UserBlock;
  
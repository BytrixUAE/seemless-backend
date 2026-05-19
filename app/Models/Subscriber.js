const _ = require("lodash");
const RestModel = require("./RestModel");
const User = require("./User");
const WebhookLog = require("./WebhookLog");
const UserSubscriptionEvent = require("./UserSubscriptionEvent");
const SubscriptionPackage = require("./SubscriptionPackage");
const { SUBSCRIPTION_PACKAGE_TYPE_ENUM, PLATFORMS } = require("../config/enum");
const {decode} = require('jsonwebtoken');
const {Op, fn} = require('sequelize');
const fetch = require('node-fetch');

/** Normalize req.body when middleware left it as Buffer/string (e.g. raw parser). */
function parseJsonBody(body) {
    if (body == null || body === '') return {};
    if (Buffer.isBuffer(body)) {
        try {
            return JSON.parse(body.toString('utf8'));
        } catch {
            return {};
        }
    }
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return {};
        }
    }
    if (typeof body === 'object') return body;
    return {};
}
const { google } = require('googleapis');
const path = require('path');
const moment = require('moment');
class Subscriber extends RestModel {
    constructor() {
        super("subscribers");
    }

    static MAP_TYPE_TO_DURATION_MONTHS = {
        [SUBSCRIPTION_PACKAGE_TYPE_ENUM.YEARLY]: 12,
        [SUBSCRIPTION_PACKAGE_TYPE_ENUM.MONTHLY]: 1,
        [SUBSCRIPTION_PACKAGE_TYPE_ENUM.WEEKLY]: 0, // handled as 7 days fallback below
    }

    static SUBSCRIPTION_RECOVERED = 1;
    static SUBSCRIPTION_RENEWED = 2;
    static SUBSCRIPTION_CANCELED = 3;
    static SUBSCRIPTION_PURCHASED = 4;
    static SUBSCRIPTION_ON_HOLD = 5;
    static SUBSCRIPTION_IN_GRACE_PERIOD = 6;
    static SUBSCRIPTION_RESTARTED = 7;
    static SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8;
    static SUBSCRIPTION_DEFERRED = 9;
    static SUBSCRIPTION_PAUSED = 10;
    static SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11;
    static SUBSCRIPTION_REVOKED = 12;
    static SUBSCRIPTION_EXPIRED = 13;

    static ANDROID_STATUSES = {
        1: "SUBSCRIPTION_RECOVERED",
        2: "SUBSCRIPTION_RENEWED",
        3: "SUBSCRIPTION_CANCELED",
        4: "SUBSCRIPTION_PURCHASED",
        5: "SUBSCRIPTION_ON_HOLD",
        6: "SUBSCRIPTION_IN_GRACE_PERIOD",
        7: "SUBSCRIPTION_RESTARTED",
        8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
        9: "SUBSCRIPTION_DEFERRED",
        10: "SUBSCRIPTION_PAUSED",
        11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
        12: "SUBSCRIPTION_REVOKED",
        13: "SUBSCRIPTION_EXPIRED"
    }


    static IOS_SUBSCRIBED = "SUBSCRIBED";
    static IOS_DID_RENEW = "DID_RENEW";
    static IOS_EXPIRED = "EXPIRED";
    static IOS_CANCEL = "CANCEL";
    static DID_CHANGE_RENEWAL_STATUS = "DID_CHANGE_RENEWAL_STATUS";
    static IOS_DID_CHANGE_RENEWAL_PREF = "DID_CHANGE_RENEWAL_PREF";

    static STATUS_IN_PROCESS = "in_process";
    static STATUS_ACTIVE = "active";
    static STATUS_CANCELLED = "cancelled";
    static STATUS_EXPIRE = "expired";
    static STATUS_HOLD = "hold";

    softdelete() {
        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */

    getFields() {
        return ["user_id", "package_id", "subscriber_id", "platform", "amount", "currency", "expiry_date", "transaction_reference", "type", "status", "data"];
    }

    showColumns() {
        return ["user_id", "package_id", "subscriber_id", "platform", "amount", "currency", "expiry_date", "transaction_reference", "type", "status", "data"];
    }

    /**
     * omit fields from update request
     */
    exceptUpdateField() {
        return ["id", "createdAt"];
    }

    async beforeCreateHook(request, params) {
        /* do all previous subscription expire */
        this.orm.update({status: Subscriber.STATUS_EXPIRE}, {
            where: {
                user_id: request.user.id,
                platform: request.body.platform
            }
        });

        params.status = request?.body?.platform == PLATFORMS.IOS ? Subscriber.STATUS_IN_PROCESS : Subscriber.STATUS_ACTIVE;
        params.user_id = request.user.id;
        params.data = JSON.stringify(request?.body?.data);
        params.expiry_date = this.getNextDateFromType(request?.body?.type);
        params.createdAt = new Date();
    }

    async getActiveSubscriber(user_id) {
        return this.orm.findOne({
            attributes: [`user_id`, `subscriber_id`, `amount`, `type`, `status`, 'platform','currency'],
            where: {
                user_id,
                expiry_date: {
                    [Op.gt]: fn('NOW')
                },
                status: {
                    [Op.notIn]: [Subscriber.STATUS_EXPIRE, Subscriber.STATUS_HOLD]
                }
            },
            raw: true,
            order: [['id', 'DESC']]
        });
    }

    async getSubscription(user_id) {
        const dateTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        let result = await this.orm.findOne({
            attributes: ["expiry_date"],
            where: {
                user_id: user_id,
                status: Subscriber.STATUS_ACTIVE,
            },
        });
        let trialDate = moment(result?.expiry_date).format("YYYY-MM-DD HH:mm:ss");
        if (trialDate > dateTime) {
            return true;
        }
        return false;
    }

    async getAllSubscriptions() {
        let record = await this.orm.findAll({
            attributes: [`subscriber_id`, `amount`, `type`, `status`],
            include: {
                model: User.instance().getModel(),
                attributes: ["name"],
                required: true,
            },
            order: [["createdAt", "DESC"]],
        });
        return record?.map((v) => v?.toJSON());
    }

    async handleAndroidSubscriptionWebHook(request) {
        try {
            let input = parseJsonBody(request?.body);
            const b64 = input?.message?.data;
            const decodedB64 = b64 ? Buffer.from(b64, 'base64').toString('utf8') : '{}';
            let subscriptionData = JSON.parse(decodedB64);
            if (input?.hasOwnProperty('subscription')) {
                let log = await WebhookLog.instance().createRecord(request, {
                    'data': JSON.stringify(input),
                    'platform': 'android',
                });
                subscriptionData = subscriptionData.subscriptionNotification;
                const userSubscription = await this.orm.findOne({
                    where: {
                        transaction_reference: subscriptionData.purchaseToken
                    },
                    order: [['id', 'DESC']]
                });
                switch (subscriptionData.notificationType) {
                    case Subscriber.SUBSCRIPTION_PURCHASED:
                        const subscriberId = input.subscription.split("/").pop();
                        const type = await this.mapProductIdToType(PLATFORMS.ANDROID, subscriberId);
                        await this.orm.update({
                            status: Subscriber.STATUS_ACTIVE,
                            subscriber_id: subscriberId,
                            type: type,
                            expiry_date: this.getNextDateFromType(type),
                            data: JSON.stringify(input)
                        }, {
                            where: {
                                transaction_reference: subscriptionData.purchaseToken
                            }
                        })
                        break;
                    case Subscriber.SUBSCRIPTION_CANCELED:
                        await this.orm.update({
                            status: Subscriber.STATUS_CANCELLED,
                        }, {
                            where: {
                                transaction_reference: subscriptionData.purchaseToken
                            }
                        })
                        break
                    case Subscriber.SUBSCRIPTION_EXPIRED:
                        await this.orm.update({
                            status: Subscriber.STATUS_EXPIRE,
                        }, {
                            where: {
                                transaction_reference: subscriptionData.purchaseToken
                            }
                        })
                        break
                    case Subscriber.SUBSCRIPTION_ON_HOLD:
                        await this.orm.update({
                            status: Subscriber.STATUS_HOLD,
                        }, {
                            where: {
                                transaction_reference: subscriptionData.purchaseToken
                            }
                        })
                        break
                    case Subscriber.SUBSCRIPTION_RENEWED:
                        if (userSubscription) {
                            await this.saveUserSubscription(userSubscription.user_id, subscriptionData.purchaseToken, userSubscription, subscriptionData)
                        }
                        break
                    default:
                        break
                }
                /* Keep Event History */
                if (userSubscription) {
                    await UserSubscriptionEvent.instance().createRecord(request, {
                        subscriber_id: userSubscription.subscriber_id,
                        user_id: userSubscription.user_id,
                        status: Subscriber.ANDROID_STATUSES[subscriptionData.notificationType],
                        data: JSON.stringify(subscriptionData)
                    });
                }

                return log;
            }
            return true;
        } catch (e) {
            await WebhookLog.instance().createRecord(request, {
                'data': e.message,
                'platform': 'android_error',
            })
        }
    }

    async handleAppleSubscriptionWebHook(request) {
        let input = request?.body
        await WebhookLog.instance().createRecord(request, {
            data: JSON.stringify(input),
            platform: 'ios',
        })
        const token = input.signedPayload
        if (token) {
            const decoded = decode(token)
            // console.log("decoded:",decoded)
            const notificationType = decoded.notificationType
            const transactionInfo = decode(decoded.data.signedTransactionInfo)
            const renewalInfo = decode(decoded.data.signedRenewalInfo)
            let userSubscription = await this.orm.findOne({
                where: {
                    transaction_reference: transactionInfo.originalTransactionId
                },
                order: [['id', 'DESC']]
            });

            switch (notificationType) {
                case Subscriber.IOS_SUBSCRIBED:
                    await this.orm.update({
                        status: Subscriber.STATUS_ACTIVE
                    }, {
                        where: {
                            transaction_reference: transactionInfo.originalTransactionId
                        }
                    });
                    break;
                case Subscriber.DID_CHANGE_RENEWAL_STATUS:
                    if (renewalInfo.autoRenewStatus == 0) {
                        await this.orm.update({
                            status: Subscriber.STATUS_CANCELLED
                        }, {
                            where: {
                                transaction_reference: transactionInfo.originalTransactionId
                            }
                        });
                    }
                    break
                case Subscriber.IOS_EXPIRED:
                    await this.orm.update({
                        status: Subscriber.IOS_EXPIRED
                    }, {
                        where: {
                            transaction_reference: transactionInfo.originalTransactionId
                        }
                    });
                    break
                case Subscriber.IOS_DID_RENEW:
                    if (userSubscription) {
                        await this.saveUserSubscription(userSubscription.user_id, transactionInfo.originalTransactionId, userSubscription, decoded, transactionInfo.price / 1000)
                    }
                    break;
                case Subscriber.IOS_DID_CHANGE_RENEWAL_PREF:
                    if (userSubscription) {
                        /* update subscription */
                        let type = Subscriber.MAP_PRODUCT_TO_TYPE[renewalInfo?.autoRenewProductId];
                        let params = {
                            subscriber_id: renewalInfo?.autoRenewProductId,
                            amount: renewalInfo?.renewalPrice / 1000,
                            type: type,
                            status: Subscriber.STATUS_ACTIVE,
                            expiry_date: this.getNextDate(Subscriber.MAP_PRODUCT_TO_DURATION[type]),
                            data: JSON.stringify(input)
                        }
                        await this.updateSubscription(userSubscription.id, params);
                    }
                    break
                default:
                    break
            }
            /* Keep Event History */
            if (userSubscription) {
                await UserSubscriptionEvent.instance().createRecord(request, {
                    subscriber_id: userSubscription.subscriber_id,
                    user_id: userSubscription.user_id,
                    status: notificationType,
                    data: JSON.stringify(input),
                });
            }
        }
    }

    async saveUserSubscription(userId, transactionReference, userSubscription, data, price) {
        await this.orm.update({status: Subscriber.STATUS_EXPIRE}, {
            where: {
                user_id: userId,
                platform: userSubscription.platform
            }
        });
        let input = {
            user_id: userId,
            subscriber_id: userSubscription.subscriber_id,
            amount: price,
            type: userSubscription.type,
            expiry_date: this.getNextDateFromType(userSubscription.type),
            transaction_reference: transactionReference,
            currency: userSubscription.currency,
            platform: userSubscription.platform,
            data: JSON.stringify(data),
            status: Subscriber.STATUS_ACTIVE,
        }
        await this.orm.create(input)
    }

    async updateSubscription(id, params) {
        await this.orm.update(params, {
            where: {
                id: id
            }
        })
    }

    async restoreAppleSubscription(request) {
        let subscription = await this.orm.findOne({
            attributes: [`subscriber_id`, `amount`, `type`, `status`, `platform`],
            where: {
                user_id: request?.user?.id,
                transaction_reference: request?.body?.transaction_reference,
                expiry_date: {
                    [Op.gt]: fn('NOW')
                },
                status: {
                    [Op.notIn]: [Subscriber.STATUS_EXPIRE, Subscriber.STATUS_HOLD]
                }
            },
            order: [['id', 'DESC']]
        });
        if (subscription) return subscription;

        const body = request?.body || {};
        const platform = body?.platform ? String(body.platform).toLowerCase() : PLATFORMS.IOS;
        const type = body?.type ? String(body.type).toLowerCase() : null;
        const expiry_date = body?.expiryDate || this.getNextDateFromType(type);
        let package_id = null;
        if (body?.subscriber_id) {
            const where = { deletedAt: null, status: 1, type: body?.type};
            if (platform === PLATFORMS.IOS) where.apple_product_id = body?.subscriber_id;
            if (platform === PLATFORMS.ANDROID) where.google_product_id = body?.subscriber_id;
            
            // console.log("where:",where);
            
            const pkg = await SubscriptionPackage.instance().getModel().findOne({
                where,
                attributes: ["id"],
                raw: true,
            });
            package_id = pkg?.id || null;
        }
        
        await this.orm.create({
            user_id: request?.user?.id,
            subscriber_id: body?.subscriber_id || null,
            platform,
            package_id,
            amount: body?.amount ?? null,
            currency: body?.currency ?? null,
            expiry_date,
            transaction_reference: body?.transaction_reference,
            type,
            status: Subscriber.STATUS_ACTIVE,
            data: body?.data != null ? JSON.stringify(body.data) : null,
        });

        return subscription = await this.orm.findOne({
            attributes: [`subscriber_id`, `amount`, `type`, `status`, `platform`],
            where: {
                user_id: request?.user?.id,
                transaction_reference: request?.body?.transaction_reference,
                expiry_date: {
                    [Op.gt]: fn('NOW')
                },
                status: {
                    [Op.notIn]: [Subscriber.STATUS_EXPIRE, Subscriber.STATUS_HOLD]
                }
            },
            order: [['id', 'DESC']]
        });

        // return created?.toJSON ? created.toJSON() : created;
    }

    async verifyAppleReceipt(receiptData, isSandbox = false) {
        const endpoint = isSandbox
            ? 'https://sandbox.itunes.apple.com/verifyReceipt'
            : 'https://buy.itunes.apple.com/verifyReceipt';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'receipt-data': receiptData,
                    'password': process.env.APPLE_SHARED_SECRET
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 21007){
                return this.verifyAppleReceipt(receiptData, true);
            }
            // console.log("data:",data)
            /* if status is true then the receipt is valid */
            // return data;
            return data.status === 0 ? true : false;
        } catch (error) {
            console.error('Error verifying receipt:', error.message);
            throw error;
        }
    }
    async verifyAndroidPurchase(purchaseToken) {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(),"app/config/pointnest-firebase-adminsdk.json"),
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });
        // Get an authenticated client
        const authClient = await auth.getClient();

        // Initialize the Google Play Android Publisher API
        const androidpublisher = google.androidpublisher({
            version: 'v3',
            auth: authClient,
        });

        // Make the API call to verify the subscription
        const response = await androidpublisher.purchases.subscriptions.get({
            packageName: 'com.cloudprofsolution.pointnest',
            subscriptionId: 'app_usage',
            token: purchaseToken,
        });
        return response.data;
    }

    async mapProductIdToType(platform, productId) {
        if (!productId) return null;
        const where = { deletedAt: null, status: 1 };
        if (platform === PLATFORMS.IOS) where.apple_product_id = productId;
        if (platform === PLATFORMS.ANDROID) where.google_product_id = productId;

        const pkg = await SubscriptionPackage.instance().getModel().findOne({
            where,
            attributes: ["type"],
            raw: true,
        });
        return pkg ? pkg.type : null;
    }

    getNextDateFromType(type) {
        const now = new Date();
        const months = Subscriber.MAP_TYPE_TO_DURATION_MONTHS[type];
        let end;
        if (type === SUBSCRIPTION_PACKAGE_TYPE_ENUM.WEEKLY) {
            end = new Date(now);
            end.setDate(end.getDate() + 7);
        } else if (months != null) {
            end = new Date(now);
            end.setMonth(end.getMonth() + months);
        } else {
            end = new Date(now);
            end.setMonth(end.getMonth() + 1);
        }
        end.setHours(23, 59, 59, 999);
        return end.toISOString();
    }

}

module.exports = Subscriber;

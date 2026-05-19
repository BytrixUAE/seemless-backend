
const { validateAll } = require("../../Helper");
const RestController = require("../RestController");
const Subscription = require("../../Models/Subscription");
const User = require("../../Models/User");
const StripeWebhook = require("../../Models/StripeWebhook");
const SubscriptionTransaction = require("../../Models/SubscriptionTransaction");
const SubscriptionPackage = require("../../Models/SubscriptionPackage");
const { ROLES } = require("../../config/enum");
const { Op, Sequelize } = require("../../Database");
const Stripe = require("stripe");
const moment = require("moment");
const db = require("../../Database");

class SubscriptionController extends RestController {
  constructor() {
    super('Subscription');
    this.resource = "Subscription";
    this.request; 
    this.response;
    this.params = {};
  }

  /**
   * This function is used for validate restfull request
   * @param $action
   * @param string $slug
   * @return validator response
   */
  async validation(action, slug = '') {
    let validator = [];
    let rules;
    switch (action) {
      case "store":
        rules = {
          "user_id": "required",
            "package_id": "required",
            "start_date": "required",
            "end_date": "required",
            // "amount": "required"
        }
        validator = await validateAll(this.request.body, rules)
        break;
      case "update":
        rules = {
           "user_id": "required",
            "package_id": "required",
            "start_date": "required",
            "end_date": "required"
        }
        validator = await validateAll(this.request.body, rules);
        break;
    }
    return validator;
  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async beforeIndexLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async afterIndexLoadModel() {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async beforeStoreLoadModel() {
    try {
      const { user_id } = this.request.body;
      
      if (!user_id) {
        return; // Let validation handle missing user_id
      }

      const currentDate = new Date();
      
      // Check if user already has an active subscription
      // Active subscription: status = 1 AND current date is between start_date and end_date
      const activeSubscription = await Subscription.instance().getModel().findOne({
        where: {
          user_id: user_id,
          status: 1, // Active status
          deletedAt: null,
          end_date: { [Op.gte]: currentDate }
        },
        order: [['end_date', 'DESC']] // Get the most recent one
      });

      // console.log(activeSubscription, 'activeSubscription');

      if (activeSubscription) {
        this.__is_error = true;
        return this.sendError(
          "User already has an active subscription. Please cancel the existing subscription before creating a new one.",
          {
            existing_subscription_id: activeSubscription.id,
            subscription_end_date: activeSubscription.end_date,
            subscription_start_date: activeSubscription.start_date
          },
          400
        );
      }
    } catch (error) {
      console.error("Error checking active subscription:", error);
      this.__is_error = true;
      return this.sendError(
        "Failed to validate subscription",
        {},
        500
      );
    }
  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   */
  async afterStoreLoadModel(record) {

  }

  /**
    * This function loads before a model load
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async beforeShowLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async afterShowLoadModel(record) {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeUpdateLoadModel() {

  }

  /**
    * This function loads before response send to client
    * @param {object} record
    * @param {adonis request object} this.request
    * @param {adonis response object} this.response
    * @param {adonis param object} this.params
    */
  async afterUpdateLoadModel(record) {

  }

  /**
   * This function loads before a model load
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async beforeDestroyLoadModel() {

  }

  /**
   * This function loads before response send to client
   * @param {object} record
   * @param {adonis request object} this.request
   * @param {adonis response object} this.response
   * @param {adonis param object} this.params
   */
  async afterDestoryLoadModel() {

  }

  /**
   * Get subscription statistics
   * GET subscription-stats
   * Query params: start_date, end_date (optional date filters)
   * 
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async getSubscriptionStats({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const currentDate = new Date();
      
      // Get date filters from query parameters
      const filterStartDate = request.query.start_date ? new Date(request.query.start_date) : null;
      const filterEndDate = request.query.end_date ? new Date(request.query.end_date) : null;

      // Build where clause for active subscriptions
      const activeSubscriptionsWhere = {
        deletedAt: null,
        status: 1
      };

      // If date filters are provided, filter subscriptions where their date range overlaps with filter range
      // A subscription overlaps if: subscription.start_date <= filterEndDate AND subscription.end_date >= filterStartDate
      if (filterStartDate && filterEndDate) {
        // Filter: subscription period overlaps with the provided date range
        Object.assign(activeSubscriptionsWhere, {
          start_date: { [Op.lte]: filterEndDate },
          end_date: { [Op.gte]: filterStartDate }
        });
      } else if (filterStartDate) {
        // Only start date provided: subscription ends on or after filter start date
        activeSubscriptionsWhere.end_date = {
          [Op.gte]: filterStartDate
        };
      } else if (filterEndDate) {
        // Only end date provided: subscription starts on or before filter end date
        activeSubscriptionsWhere.start_date = {
          [Op.lte]: filterEndDate
        };
      } else {
        // Default: active subscriptions are those where current date is between start_date and end_date
        activeSubscriptionsWhere.start_date = {
          [Op.lte]: currentDate
        };
        activeSubscriptionsWhere.end_date = {
          [Op.gte]: currentDate
        };
      }
      
      // Get active subscriptions count
      const activeSubscriptions = await Subscription.instance().getModel().count({
        where: activeSubscriptionsWhere
      });

      // Build where clause for trial users
      const trialUsersWhere = {
        user_type: ROLES.USER,
        deletedAt: null,
        trail_expired_at: {
          [Op.ne]: null
        },
        email_verifyAt: {
          [Op.ne]: null
        }
      };

      // If date filters are provided, filter trial users where their trial period overlaps with filter range
      // A trial period overlaps if: createdAt <= filterEndDate AND trail_expired_at >= filterStartDate
      if (filterStartDate && filterEndDate) {
        // Filter: trial period (createdAt to trail_expired_at) overlaps with the provided date range
        Object.assign(trialUsersWhere, {
          createdAt: { [Op.lte]: filterEndDate },
          trail_expired_at: { [Op.gte]: filterStartDate }
        });
      } else if (filterStartDate) {
        // Only start date: trial must end on or after filter start date
        trialUsersWhere.trail_expired_at = {
          [Op.gte]: filterStartDate
        };
      } else if (filterEndDate) {
        // Only end date: trial must start on or before filter end date
        trialUsersWhere.createdAt = {
          [Op.lte]: filterEndDate
        };
      } else {
        // Default: active trial users (trial not expired yet)
        trialUsersWhere.trail_expired_at = {
          [Op.gt]: currentDate
        };
      }

      // Get trial users count (active trial users)
      const trialUsers = await User.instance().getModel().count({
        where: trialUsersWhere
      });

      // Build where clause for total revenue
      const revenueWhere = {
        deletedAt: null
      };

      // If date filters are provided, filter subscriptions where their date range overlaps with filter range
      // A subscription overlaps if: subscription.start_date <= filterEndDate AND subscription.end_date >= filterStartDate
      if (filterStartDate && filterEndDate) {
        // Filter: subscription period overlaps with the provided date range
        Object.assign(revenueWhere, {
          start_date: { [Op.lte]: filterEndDate },
          end_date: { [Op.gte]: filterStartDate }
        });
      } else if (filterStartDate) {
        // Only start date provided: subscription ends on or after filter start date
        revenueWhere.end_date = {
          [Op.gte]: filterStartDate
        };
      } else if (filterEndDate) {
        // Only end date provided: subscription starts on or before filter end date
        revenueWhere.start_date = {
          [Op.lte]: filterEndDate
        };
      } else {
        // Default: all subscriptions (no date filter)
        // You can add default logic here if needed
      }

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

      const stats = {
        activeSubscriptions: activeSubscriptions || 0,
        trialUsers: trialUsers || 0,
        totalRevenue: totalRevenue || 0
      };

      this.__is_paginate = false;
      this.__collection = false;
      return await this.sendResponse(
        200,
        "Subscription stats retrieved successfully",
        stats
      );
    } catch (error) {
      console.error("Subscription stats error:", error);
      return this.sendError(
        "Failed to retrieve subscription stats",
        {},
        500
      );
    }
  }

  /**
   * Create Stripe subscription
   * POST /api/user/subscription/create-stripe-subscription
   * Body: { package_id, payment_method_id (required for mobile app) }
   * 
   * Mobile App Flow:
   * 1. Mobile app creates payment method using Stripe SDK
   * 2. Mobile app sends payment_method_id to this endpoint
   * 3. Backend creates subscription with payment method
   * 4. Returns client_secret if 3D Secure is needed
   * 5. Mobile app confirms payment
   * 6. Webhook updates subscription status
   */
  async createStripeSubscription({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const { package_id, payment_method_id } = request.body;
      const user = request.user;

      // Validate user is authenticated
      if (!user || !user.id) {
        return this.sendError("User authentication required", {}, 401);
      }

      // Check if user already has an active subscription
      // Active subscription: status = 1 AND current date is before end_date
      const currentDate = new Date();
      const activeSubscription = await Subscription.instance().getModel().findOne({
        where: {
          user_id: user.id,
          status: 1, // Active status
          deletedAt: null,
          end_date: { [Op.gte]: currentDate }
        },
        order: [['end_date', 'DESC']] // Get the most recent one
      });

      if (activeSubscription && activeSubscription.package_id == package_id) {
        return this.sendError(
          "User already has an active subscription. Please cancel the existing subscription before creating a new one.",
          {
            existing_subscription_id: activeSubscription.id,
            subscription_end_date: activeSubscription.end_date,
            subscription_start_date: activeSubscription.start_date
          },
          400
        );
      }

      // Validate input
      if (!package_id) {
        return this.sendError("Package ID is required", {}, 400);
      }

      if (!payment_method_id) {
        return this.sendError("Payment method ID is required. Please create a payment method using Stripe SDK first.", {}, 400);
      }

      // Get package details
      const packageData = await SubscriptionPackage.instance().getModel().findOne({
        where: {
          id: package_id,
          deletedAt: null,
          status: 1
        }
      });

      if (!packageData) {
        return this.sendError("Subscription package not found", {}, 404);
      }

      // Check if package has Stripe price ID
      if (!packageData.stripe_price_id) {
        return this.sendError("Stripe price ID not configured for this package", {}, 400);
      }

      // Initialize Stripe
      if (!process.env.STRIPE_SECRET) {
        return this.sendError("Stripe secret key not configured", {}, 500);
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET);

      // Get Stripe customer ID from user object
      if (!user.stripe_customer_id) {
        return this.sendError(
          "Stripe customer ID not found. Please log out and log in again to generate your customer ID.",
          {
            error_code: "STRIPE_CUSTOMER_ID_MISSING",
            suggestion: "Please log out and log in again, or contact support if the issue persists"
          },
          400
        );
      }
      
      const customerId = user.stripe_customer_id;
      
      // Verify payment method exists and get its details
      let paymentMethod;
      try {
        paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
      } catch (retrieveError) {
        return this.sendError(
          "Invalid payment method. Please create a new payment method.",
          {},
          400
        );
      }
      // console.log("paymentMethod", paymentMethod);
      // console.log("customerId", customerId);
      
      // Check if payment method was previously detached (cannot be reused)
      // Stripe doesn't allow reusing payment methods that were detached
      if (!paymentMethod.customer) {
        // Payment method is not attached - this is fine, we'll attach it
        console.log(`Payment method ${payment_method_id} is not attached to any customer, will attach to ${customerId}`);
      } else if (paymentMethod.customer !== customerId) {
        // Payment method is attached to a different customer
        // We should NOT detach it as that would make it unusable
        // Instead, return an error asking for a new payment method
        return this.sendError(
          "This payment method is attached to another customer. Please create a new payment method in the app.",
          {
            error_code: "PAYMENT_METHOD_ATTACHED_TO_OTHER_CUSTOMER",
            suggestion: "Create a fresh payment method using Stripe SDK"
          },
          400
        );
      }

      // Attach payment method to customer (required for subscription)
      // Only attach if not already attached to this customer
      if (!paymentMethod.customer || paymentMethod.customer !== customerId) {
        try {
          await stripe.paymentMethods.attach(payment_method_id, {
            customer: customerId,
          });
          console.log(`Payment method ${payment_method_id} attached to customer ${customerId}`);
        } catch (attachError) {
          // If already attached, that's fine
          if (attachError.message && attachError.message.includes('already been attached')) {
            console.log(`Payment method ${payment_method_id} already attached`);
          } else if (attachError.message && attachError.message.includes('previously used without being attached') || attachError.message.includes('was detached from a Customer')) {
            // Payment method was detached and cannot be reused
            console.error("Payment method cannot be reused:", attachError.message);
            return this.sendError(
              "This payment method cannot be reused. Please create a new payment method in the app and try again.",
              {
                error_code: "PAYMENT_METHOD_REUSED",
                suggestion: "Create a fresh payment method using Stripe SDK in your mobile app"
              },
              400
            );
          } else {
            console.error("Error attaching payment method:", attachError);
            return this.sendError(
              `Failed to attach payment method: ${attachError.message}`,
              {},
              400
            );
          }
        }
      } else {
        console.log(`Payment method ${payment_method_id} already attached to customer ${customerId}`);
      }

      // Set payment method as default for customer (for invoices)
      try {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: payment_method_id,
          },
        });
      } catch (updateError) {
        console.error("Error setting default payment method:", updateError);
        // Continue anyway, we'll use it directly in subscription
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = moment(startDate).add(packageData.duration_days, 'days').toDate();

      // Create Stripe subscription
      // Note: We don't save payment method by default (no card saving)
      const subscriptionData = {
        customer: customerId,
        items: [{
          price: packageData.stripe_price_id,
        }],
        default_payment_method: payment_method_id,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription' // save card
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: user.id.toString(),
          package_id: package_id.toString()
        }
      };

      const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

      // Get client_secret for 3D Secure. Stripe exposes it on the invoice as confirmation_secret (or via payments).
      let paymentIntent = null;
      let clientSecret = null;
      const invoiceId = typeof stripeSubscription.latest_invoice === 'string'
        ? stripeSubscription.latest_invoice
        : (stripeSubscription.latest_invoice && stripeSubscription.latest_invoice.id) || null;

      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ['confirmation_secret', 'payments.data.payment.payment_intent']
        });
        // Preferred: confirmation_secret contains the client_secret Stripe creates for the invoice
        if (invoice.confirmation_secret && invoice.confirmation_secret.client_secret) {
          clientSecret = invoice.confirmation_secret.client_secret;
        }
        // Get PaymentIntent id (for DB and response) from payments or by parsing client_secret
        const firstPayment = invoice.payments && invoice.payments.data && invoice.payments.data[0];
        const piRef = firstPayment && firstPayment.payment && firstPayment.payment.payment_intent;
        if (piRef) {
          const piId = typeof piRef === 'string' ? piRef : (piRef.id || piRef);
          paymentIntent = typeof piRef === 'object' && piRef.client_secret ? piRef : await stripe.paymentIntents.retrieve(piId);
          if (!clientSecret && paymentIntent && paymentIntent.client_secret) {
            clientSecret = paymentIntent.client_secret;
          }
        }
        if (clientSecret && !paymentIntent) {
          const piId = clientSecret.split('_secret_')[0] || null;
          if (piId && piId.startsWith('pi_')) {
            paymentIntent = await stripe.paymentIntents.retrieve(piId).catch(() => null);
          }
        }
      }

      // Create subscription record in database (pending status)
      const subscriptionRecord = await Subscription.instance().createRecord(request, {
        user_id: user.id,
        package_id: package_id,
        amount: parseFloat(packageData.price),
        start_date: startDate,
        end_date: endDate,
        status: 0, // Pending until webhook confirms
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        stripe_payment_intent_id: paymentIntent ? paymentIntent.id : null
      });

      this.__is_paginate = false;
      this.__collection = false;
      const requiresAction = stripeSubscription.status === 'incomplete' || stripeSubscription.status === 'incomplete_expired';
      const payload = {
        subscription_id: subscriptionRecord.id,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        client_secret: clientSecret,
        status: stripeSubscription.status,
        requires_action: requiresAction,
        payment_intent_id: paymentIntent ? paymentIntent.id : null
      };
      if (requiresAction && !clientSecret) {
        payload.client_secret_missing = true;
        payload.message = 'Payment intent not yet available; check back in a few seconds or complete payment in Stripe Customer Portal.';
      }
      return await this.sendResponse(200, "Subscription created successfully", payload);
    } catch (error) {
      console.error("Stripe subscription creation error:", error);
      return this.sendError(
        error.message || "Failed to create subscription",
        {},
        500
      );
    }
  }

  /**
   * Cancel subscription
   * POST /api/subscription/cancel
   * Body: { subscription_id: number, cancel_immediately: boolean (optional, default: false) }
   * 
   * cancel_immediately:
   *   - false: Cancel at period end (user keeps access until period ends)
   *   - true: Cancel immediately (access revoked right away)
   */
  async cancelSubscription({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const { subscription_id, cancel_immediately = false } = request.body;
      const user = request.user;

      if (!subscription_id) {
        return this.sendError("Subscription ID is required", {}, 400);
      }

      if (!process.env.STRIPE_SECRET) {
        return this.sendError("Stripe secret key not configured", {}, 500);
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET);

      // Find subscription in database
      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          id: subscription_id,
          user_id: user.id,
          deletedAt: null
        }
      });

      if (!subscription) {
        return this.sendError("Subscription not found or you don't have permission to cancel it", {}, 404);
      }

      if (!subscription.stripe_subscription_id) {
        return this.sendError("Subscription does not have a Stripe subscription ID", {}, 400);
      }

      // Check if already cancelled
      if (subscription.status === 0) {
        return this.sendError("Subscription is already cancelled", {}, 400);
      }

      // Cancel subscription in Stripe
      let canceledSubscription;
      try {
        if (cancel_immediately) {
          // Cancel immediately
          canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
          console.log(`Subscription ${subscription.id} cancelled immediately via API`);
        } else {
          // Cancel at period end (user keeps access until period ends)
          canceledSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
          });
          console.log(`Subscription ${subscription.id} will cancel at period end via API`);
        }
      } catch (stripeError) {
        console.error("Stripe cancellation error:", stripeError);
        return this.sendError(
          `Failed to cancel subscription: ${stripeError.message}`,
          {},
          500
        );
      }

      // Update subscription in database
      let updateData = {
        status: cancel_immediately ? 0 : 1 // Inactive if immediate, Active if at period end
      };

      if (cancel_immediately) {
        updateData.end_date = new Date();
      } else if (canceledSubscription.current_period_end) {
        // Update end_date to period end
        const periodEnd = Number(canceledSubscription.current_period_end);
        if (periodEnd) {
          updateData.end_date = new Date(periodEnd * 1000);
        }
      }

      await subscription.update(updateData);

      this.__is_paginate = false;
      this.__collection = false;
      return await this.sendResponse(
        200,
        cancel_immediately 
          ? "Subscription cancelled immediately" 
          : "Subscription will be cancelled at the end of the current period",
        {
          subscription_id: subscription.id,
          stripe_subscription_id: subscription.stripe_subscription_id,
          status: updateData.status,
          cancel_at_period_end: !cancel_immediately,
          end_date: updateData.end_date,
          message: cancel_immediately
            ? "Your subscription has been cancelled. Access will be revoked immediately."
            : `Your subscription will remain active until ${updateData.end_date ? new Date(updateData.end_date).toLocaleDateString() : 'period end'}. After that, it will be cancelled.`
        }
      );
    } catch (error) {
      console.error("Cancel subscription error:", error);
      return this.sendError(
        error.message || "Failed to cancel subscription",
        {},
        500
      );
    }
  }

  /**
   * Upgrade subscription to a different package
   * POST /api/subscription/upgrade
   * Body: { package_id: number, subscription_id?: number (optional, uses active subscription if not provided) }
   */
  async upgradeSubscription({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const { package_id, subscription_id } = request.body;
      const user = request.user;

      // Validate user is authenticated
      if (!user || !user.id) {
        return this.sendError("User authentication required", {}, 401);
      }

      // Validate input
      if (!package_id) {
        return this.sendError("Package ID is required", {}, 400);
      }

      // Initialize Stripe
      if (!process.env.STRIPE_SECRET) {
        return this.sendError("Stripe secret key not configured", {}, 500);
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET);

      // Get Stripe customer ID from user object
      if (!user.stripe_customer_id) {
        return this.sendError(
          "Stripe customer ID not found. Please log out and log in again to generate your customer ID.",
          {
            error_code: "STRIPE_CUSTOMER_ID_MISSING",
            suggestion: "Please log out and log in again, or contact support if the issue persists"
          },
          400
        );
      }

      // Find active subscription
      const currentDate = new Date();
      let subscription;
      
      if (subscription_id) {
        // Use provided subscription_id
        subscription = await Subscription.instance().getModel().findOne({
          where: {
            id: subscription_id,
            user_id: user.id,
            deletedAt: null
          }
        });

        if (!subscription) {
          return this.sendError("Subscription not found or you don't have permission to upgrade it", {}, 404);
        }
      } else {
        // Find active subscription automatically
        subscription = await Subscription.instance().getModel().findOne({
          where: {
            user_id: user.id,
            status: 1, // Active status
            deletedAt: null,
            end_date: { [Op.gte]: currentDate }
          },
          order: [['end_date', 'DESC']] // Get the most recent one
        });

        if (!subscription) {
          return this.sendError(
            "No active subscription found. Please create a subscription first.",
            {},
            404
          );
        }
      }

      // Check if subscription is active
      if (subscription.status !== 1) {
        return this.sendError(
          "Subscription is not active. Only active subscriptions can be upgraded.",
          {
            current_status: subscription.status
          },
          400
        );
      }

      // Check if upgrading to the same package
      if (subscription.package_id == package_id) {
        return this.sendError(
          "You are already subscribed to this package. Please choose a different package to upgrade.",
          {
            current_package_id: subscription.package_id,
            requested_package_id: package_id
          },
          400
        );
      }

      // Get new package details
      const newPackage = await SubscriptionPackage.instance().getModel().findOne({
        where: {
          id: package_id,
          deletedAt: null,
          status: 1
        }
      });

      if (!newPackage) {
        return this.sendError("Subscription package not found", {}, 404);
      }

      // Check if package has Stripe price ID
      if (!newPackage.stripe_price_id) {
        return this.sendError("Stripe price ID not configured for this package", {}, 400);
      }

      // Check if subscription has Stripe subscription ID
      if (!subscription.stripe_subscription_id) {
        return this.sendError(
          "Subscription does not have a Stripe subscription ID. Cannot upgrade.",
          {},
          400
        );
      }

      // Retrieve current Stripe subscription
      let stripeSubscription;
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id, {
          expand: ['items.data.price.product']
        });
      } catch (stripeError) {
        console.error("Error retrieving Stripe subscription:", stripeError);
        return this.sendError(
          "Failed to retrieve subscription from Stripe. Please try again later.",
          {},
          500
        );
      }

      // Check if Stripe subscription is active
      if (!['active', 'trialing'].includes(stripeSubscription.status)) {
        return this.sendError(
          `Cannot upgrade subscription. Current status: ${stripeSubscription.status}`,
          {
            stripe_status: stripeSubscription.status
          },
          400
        );
      }

      // Get the subscription item ID (first item)
      const subscriptionItemId = stripeSubscription.items.data[0]?.id;
      if (!subscriptionItemId) {
        return this.sendError("No subscription items found", {}, 400);
      }

      // Update Stripe subscription with new price
      // Stripe will automatically handle proration (charging/crediting the difference)
      try {
        const updatedStripeSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            items: [{
              id: subscriptionItemId,
              price: newPackage.stripe_price_id,
            }],
            proration_behavior: 'always_invoice', // Create invoice immediately for the difference
            metadata: {
              user_id: user.id.toString(),
              package_id: package_id.toString(),
              upgraded_from_package_id: subscription.package_id.toString()
            }
          },
          {
            expand: ['latest_invoice.payment_intent']
          }
        );

        console.log("Stripe subscription upgraded:", {
          subscription_id: subscription.stripe_subscription_id,
          old_package: subscription.package_id,
          new_package: package_id,
          stripe_status: updatedStripeSubscription.status
        });

        // Calculate new end date based on remaining time + new package duration
        // Option 1: Extend from current end_date
        const currentEndDate = new Date(subscription.end_date);
        const newEndDate = moment(currentEndDate).add(newPackage.duration_days, 'days').toDate();

        // Update database subscription record
        await subscription.update({
          package_id: package_id,
          amount: parseFloat(newPackage.price),
          end_date: newEndDate,
          // Keep start_date as is (don't change subscription start)
          // Status remains active (1)
        });

        // Get payment intent if invoice was created
        let paymentIntent = null;
        let clientSecret = null;
        const invoice = updatedStripeSubscription.latest_invoice;
        
        if (invoice && typeof invoice === 'object' && invoice.payment_intent) {
          if (typeof invoice.payment_intent === 'string') {
            paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
          } else {
            paymentIntent = invoice.payment_intent;
          }
          clientSecret = paymentIntent.client_secret;
        }

        this.__is_paginate = false;
        this.__collection = false;
        return await this.sendResponse(
          200,
          "Subscription upgraded successfully",
          {
            subscription_id: subscription.id,
            stripe_subscription_id: updatedStripeSubscription.id,
            old_package_id: subscription.package_id,
            new_package_id: package_id,
            new_amount: parseFloat(newPackage.price),
            new_end_date: newEndDate,
            stripe_status: updatedStripeSubscription.status,
            client_secret: clientSecret, // May be needed for 3D Secure if payment required
            requires_action: clientSecret ? true : false,
            payment_intent_id: paymentIntent ? paymentIntent.id : null,
            message: "Your subscription has been upgraded. " + 
                     (clientSecret 
                       ? "Please confirm the payment to complete the upgrade." 
                       : "The upgrade is complete.")
          }
        );
      } catch (updateError) {
        console.error("Error updating Stripe subscription:", updateError);
        return this.sendError(
          `Failed to upgrade subscription: ${updateError.message}`,
          {
            error_code: updateError.code || "STRIPE_UPDATE_ERROR"
          },
          500
        );
      }
    } catch (error) {
      console.error("Upgrade subscription error:", error);
      return this.sendError(
        error.message || "Failed to upgrade subscription",
        {},
        500
      );
    }
  }

  /**
   * Handle Stripe webhook events
   * POST /web/stripe-webhook
   * Note: This endpoint must receive raw body for signature verification
   */
  async handleStripeWebhook({ request, response }) {
    this.request = request;
    this.response = response;

    let webhookRecord = null;

    try {
      if (!process.env.STRIPE_SECRET) {
        console.error("Stripe secret key not configured");
        return response.status(500).send("Stripe secret key not configured");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET);
      const sig = request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return response.status(400).send("Webhook secret not configured");
      }

      if (!sig) {
        console.error("Stripe signature header missing");
        return response.status(400).send("Stripe signature header missing");
      }

      // Get raw body (should be Buffer from express.raw() middleware)
      const rawBody = request.body;
      
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        console.error("Raw body is required for webhook signature verification");
        return response.status(400).send("Raw body required");
      }
      
      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Extract object information
      const objectType = event.data.object.object || null;
      const objectId = event.data.object.id || null;
      
      // Find related subscription if applicable
      let subscriptionId = null;
      let subscriptionIdStr = null;
      
      if (objectType === 'subscription' && objectId) {
        subscriptionIdStr = objectId;
      } else if (event.data.object.subscription) {
        // Direct subscription field
        subscriptionIdStr = typeof event.data.object.subscription === 'string'
          ? event.data.object.subscription
          : event.data.object.subscription.id;
      } else if (event.data.object.parent && event.data.object.parent.subscription_details) {
        // Newer Stripe API structure: parent.subscription_details.subscription
        subscriptionIdStr = event.data.object.parent.subscription_details.subscription;
      } else if (event.data.object.lines && event.data.object.lines.data && event.data.object.lines.data.length > 0) {
        // Fallback: check lines data
        const firstLine = event.data.object.lines.data[0];
        if (firstLine.parent && firstLine.parent.subscription_item_details && firstLine.parent.subscription_item_details.subscription) {
          subscriptionIdStr = firstLine.parent.subscription_item_details.subscription;
        }
      }

      if (subscriptionIdStr) {
        const subscription = await Subscription.instance().getModel().findOne({
          where: {
            stripe_subscription_id: subscriptionIdStr,
            deletedAt: null
          }
        });
        subscriptionId = subscription ? subscription.id : null;
      }

      // STORE WEBHOOK DATA BEFORE PROCESSING
      try {
        // Prepare payload - limit size to prevent database issues
        let payloadString = null;
        try {
          const eventString = JSON.stringify(event);
          // Limit payload to reasonable size (e.g., 1MB)
          if (eventString.length < 1000000) {
            payloadString = eventString;
          } else {
            payloadString = JSON.stringify({
              id: event.id,
              type: event.type,
              created: event.created,
              livemode: event.livemode,
              message: "Payload truncated due to size"
            });
          }
        } catch (payloadError) {
          console.error("Error stringifying event payload:", payloadError);
          payloadString = JSON.stringify({ id: event.id, type: event.type, error: "Failed to stringify payload" });
        }

        const webhookData = {
          event_id: event.id,
          event_type: event.type || null,
          object_type: objectType || null,
          object_id: objectId || null,
          livemode: event.livemode ? 1 : 0,
          api_version: event.api_version || null,
          request_id: event.request ? event.request.id : null,
          payload: payloadString,
          processed: 0, // Not processed yet
          processing_error: null,
          subscription_id: subscriptionId || null,
          created_at: new Date(),
          updated_at: new Date()
        };

        console.log(`Attempting to save webhook event ${event.id} with data:`, {
          event_id: webhookData.event_id,
          event_type: webhookData.event_type,
          subscription_id: webhookData.subscription_id,
          payload_length: payloadString ? payloadString.length : 0
        });

        // Use database model directly to avoid RestModel filtering issues
        webhookRecord = await db.stripe_webhooks.create(webhookData);
        console.log(`✅ Webhook event ${event.id} saved to database successfully! Record ID: ${webhookRecord.id}`);
      } catch (dbError) {
        // If event already exists (duplicate), find it
        if (dbError.name === 'SequelizeUniqueConstraintError' || dbError.message?.includes('Duplicate entry')) {
          try {
            webhookRecord = await db.stripe_webhooks.findOne({
              where: { event_id: event.id }
            });
            console.log(`Webhook event ${event.id} already exists (duplicate), skipping save`);
          } catch (findError) {
            console.error("Error finding existing webhook:", findError);
          }
        } else {
          console.error("Error saving webhook to database:", dbError);
          console.error("Error details:", {
            message: dbError.message,
            sqlMessage: dbError.sqlMessage,
            name: dbError.name,
            stack: dbError.stack
          });
          // Continue processing even if save fails
        }
      }

      console.log(`Received webhook event: ${event.type} (ID: ${event.id})`);

      // NOW PROCESS THE EVENT
      let processingError = null;
      try {
        switch (event.type) {
          case 'customer.subscription.created':
            await this.handleSubscriptionCreated(event.data.object);
            break;

          case 'customer.subscription.updated':
            await this.handleSubscriptionUpdate(event.data.object);
            break;

          case 'customer.subscription.deleted':
            await this.handleSubscriptionCancelled(event.data.object);
            break;

          case 'invoice.payment_succeeded':
            await this.handlePaymentSucceeded(event.data.object);
            break;
          
          case 'invoice.paid':
            await this.handlePaymentSucceeded(event.data.object);
            break;

          case 'invoice.payment_failed':
            await this.handlePaymentFailed(event.data.object);
            break;

          case 'customer.subscription.trial_will_end':
            // Handle trial ending soon
            console.log(`Trial ending soon for subscription: ${event.data.object.id}`);
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        // Mark as processed successfully
        // if (webhookRecord) {
        //   await webhookRecord.update({
        //     processed: 1,
        //     processing_error: null
        //   });
        // }
      } catch (processingErr) {
        processingError = processingErr.message;
        console.error(`Error processing webhook event ${event.id}:`, processingErr);
        
        // Mark as failed
        // if (webhookRecord) {
        //   await StripeWebhook.instance().updateRecord(request, {
        //     processed: 0,
        //     processing_error: processingError
        //   });
        // }
      }

      // Return a response to acknowledge receipt of the event
      return response.json({ received: true, event_id: event.id });
    } catch (error) {
      console.error("Webhook error:", error);
      
      // Update webhook record with error if it exists
      // if (webhookRecord) {
      //   try {
      //     await webhookRecord.update({
      //       processed: 0,
      //       processing_error: error.message
      //     });
      //   } catch (updateError) {
      //     console.error("Error updating webhook record:", updateError);
      //   }
      // }
      
      return response.status(500).send(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Handle subscription created event
   */
  async handleSubscriptionCreated(stripeSubscription) {
    try {
      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          stripe_subscription_id: stripeSubscription.id,
          deletedAt: null
        }
      });

      if (!subscription) {
        console.log(`Subscription not found for Stripe subscription: ${stripeSubscription.id}`);
        return;
      }

      // Update subscription status based on Stripe status
      let status = 0; // Pending
      if (stripeSubscription.status === 'active') {
        status = 1; // Active
      }

      // Update dates from Stripe - ensure timestamps are numbers
      const periodStartRaw = stripeSubscription.current_period_start;
      const periodEndRaw = stripeSubscription.current_period_end;
      
      console.log(`Processing dates for subscription ${stripeSubscription.id}:`, {
        current_period_start: periodStartRaw,
        current_period_end: periodEndRaw,
        type_start: typeof periodStartRaw,
        type_end: typeof periodEndRaw
      });
      
      const periodStart = periodStartRaw ? Number(periodStartRaw) : null;
      const periodEnd = periodEndRaw ? Number(periodEndRaw) : null;
      
      if (!periodStart || !periodEnd || isNaN(periodStart) || isNaN(periodEnd)) {
        console.error(`Invalid period dates for subscription ${stripeSubscription.id}:`, {
          current_period_start: periodStartRaw,
          current_period_end: periodEndRaw,
          parsed_start: periodStart,
          parsed_end: periodEnd
        });
        return; // Don't update if dates are invalid
      }
      
      const startDate = new Date(periodStart * 1000);
      const endDate = new Date(periodEnd * 1000);
      
      console.log(`Converted dates for subscription ${subscription.id}:`, {
        start_date: startDate,
        end_date: endDate,
        start_timestamp: startDate.getTime(),
        end_timestamp: endDate.getTime()
      });

      await subscription.update({
        status: status,
        start_date: startDate,
        end_date: endDate
      });

      // Set trail_expired_at to null for the user since they now have an active subscription
      if (subscription.user_id) {
        try {
          await User.instance().getModel().update(
            { trail_expired_at: null },
            { where: { id: subscription.user_id } }
          );
          console.log(`User ${subscription.user_id} trail_expired_at set to null after subscription creation`);
        } catch (userUpdateError) {
          console.error(`Error updating user trail_expired_at for user ${subscription.user_id}:`, userUpdateError);
        }
      }

      console.log(`Subscription ${subscription.id} created: status=${status}`);
    } catch (error) {
      console.error("Error handling subscription created:", error);
    }
  }

  /**
   * Handle subscription updated event
   * Handles subscription status changes, renewals, and period updates
   */
  async handleSubscriptionUpdate(stripeSubscription) {
    try {
      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          stripe_subscription_id: stripeSubscription.id,
          deletedAt: null
        }
      });

      if (!subscription) {
        console.log(`Subscription not found for Stripe subscription: ${stripeSubscription.id}`);
        return;
      }

      // Update subscription status based on Stripe status
      let status = 0; // Inactive/Pending
      if (stripeSubscription.status === 'active') {
        status = 1; // Active
      } else if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
        status = 0; // Inactive
      } else if (stripeSubscription.status === 'past_due') {
        status = 0; // Past due
      } else if (stripeSubscription.status === 'incomplete' || stripeSubscription.status === 'incomplete_expired') {
        status = 0; // Pending payment
      }

      // Note: Don't update subscription start_date and end_date from webhook
      // Subscription dates should be managed separately, not from webhook updates
      // Only update status and other non-date fields

      let updateData = {
        status: status
      };

      // Handle cancellation at period end
      if (stripeSubscription.cancel_at_period_end === true && stripeSubscription.status === 'active') {
        // Subscription is active but will cancel at period end
        // Keep it active until period end
        updateData.status = 1; // Keep active
        console.log(`⚠️ Subscription ${subscription.id} will cancel at period end`);
      }

      await subscription.update(updateData);

      // Set trail_expired_at to null for the user when subscription becomes active
      if (status === 1 && subscription.user_id) {
        try {
          await User.instance().getModel().update(
            { trail_expired_at: null },
            { where: { id: subscription.user_id } }
          );
          console.log(`User ${subscription.user_id} trail_expired_at set to null after subscription update to active`);
        } catch (userUpdateError) {
          console.error(`Error updating user trail_expired_at for user ${subscription.user_id}:`, userUpdateError);
        }
      }

      console.log(`Subscription ${subscription.id} updated: status=${status}, stripe_status=${stripeSubscription.status}`);
    } catch (error) {
      console.error("Error handling subscription update:", error);
    }
  }

  /**
   * Handle subscription cancelled event
   * Handles both immediate cancellations and cancellations at period end
   */
  async handleSubscriptionCancelled(stripeSubscription) {
    try {
      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          stripe_subscription_id: stripeSubscription.id,
          deletedAt: null
        }
      });

      if (subscription) {
        // Check if cancellation is immediate or at period end
        const cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end === true;
        const canceledAtTimestamp = stripeSubscription.canceled_at ? Number(stripeSubscription.canceled_at) : null;
        const canceledAt = canceledAtTimestamp ? new Date(canceledAtTimestamp * 1000) : null;
        
        let updateData = {
          status: 0 // Inactive
        };

        if (cancelAtPeriodEnd && stripeSubscription.current_period_end) {
          // Subscription will remain active until period end
          // Update end_date to when subscription will actually end
          const periodEnd = Number(stripeSubscription.current_period_end);
          if (periodEnd) {
            updateData.end_date = new Date(periodEnd * 1000);
            console.log(`⚠️ Subscription ${subscription.id} will cancel at period end: ${updateData.end_date}`);
          }
        } else {
          // Immediate cancellation
          if (canceledAt) {
            updateData.end_date = canceledAt;
          }
          console.log(`❌ Subscription ${subscription.id} cancelled immediately`);
        }

        await subscription.update(updateData);
        console.log(`Subscription ${subscription.id} cancellation processed. Status: Inactive, End Date: ${updateData.end_date}`);
      } else {
        console.log(`Subscription not found for Stripe subscription: ${stripeSubscription.id}`);
      }
    } catch (error) {
      console.error("Error handling subscription cancellation:", error);
    }
  }

  /**
   * Handle payment succeeded event
   * This handles both initial payments and recurring subscription renewals
   */
  async handlePaymentSucceeded(invoice) {
    try {
      // Extract subscription ID from multiple possible locations
      let subscriptionIdStr = null;
      
      // Check direct subscription field
      if (invoice.subscription) {
        subscriptionIdStr = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id;
      }
      // Check parent.subscription_details.subscription (newer Stripe API structure)
      else if (invoice.parent && invoice.parent.subscription_details && invoice.parent.subscription_details.subscription) {
        subscriptionIdStr = invoice.parent.subscription_details.subscription;
      }
      // Check lines data for subscription (fallback)
      else if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
        const firstLine = invoice.lines.data[0];
        if (firstLine.parent && firstLine.parent.subscription_item_details && firstLine.parent.subscription_item_details.subscription) {
          subscriptionIdStr = firstLine.parent.subscription_item_details.subscription;
        }
      }

      if (!subscriptionIdStr) {
        console.log("Invoice is not associated with a subscription");
        return; // Not a subscription invoice
      }

      console.log(`Processing invoice.payment_succeeded for subscription: ${subscriptionIdStr}, invoice: ${invoice.id}`);

      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          stripe_subscription_id: subscriptionIdStr,
          deletedAt: null
        }
      });

      if (!subscription) {
        console.log(`❌ Subscription not found for stripe_subscription_id: ${subscriptionIdStr}`);
        console.log(`Available subscriptions:`, await Subscription.instance().getModel().findAll({
          where: { deletedAt: null },
          attributes: ['id', 'stripe_subscription_id', 'user_id'],
          limit: 5
        }).then(subs => subs.map(s => ({ id: s.id, stripe_subscription_id: s.stripe_subscription_id, user_id: s.user_id }))));
        return;
      }

      console.log(`✅ Found subscription: ID=${subscription.id}, user_id=${subscription.user_id}, stripe_subscription_id=${subscription.stripe_subscription_id}`);

      // Check if this is a renewal (recurring payment) or initial payment
      const isRenewal = invoice.billing_reason === 'subscription_cycle' || 
                       invoice.billing_reason === 'subscription_update';
      const isInitialPayment = invoice.billing_reason === 'subscription_create';

      // Prepare update data
      // Note: Don't update subscription start_date and end_date from invoice payment
      // because invoice.period_start and invoice.period_end are the same (both are invoice creation time)
      // Subscription dates should only be updated from customer.subscription.updated webhook
      let updateData = {
        status: 1, // Active
        stripe_payment_intent_id: invoice.payment_intent || subscription.stripe_payment_intent_id
      };

      await subscription.update(updateData);

      // Reload subscription to get latest dates after update
      await subscription.reload();

      // Save transaction record
      try {
        const transactionData = {
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          amount: parseFloat((invoice.amount_paid || invoice.total || 0) / 100),
          currency: invoice.currency || 'usd',
          payment_type: isRenewal ? 'renewal' : 'initial',
          billing_reason: invoice.billing_reason || null,
          status: 'succeeded',
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id: invoice.payment_intent || null,
          stripe_charge_id: invoice.charge || null,
          // Use subscription's start_date and end_date for the transaction period
          period_start: subscription.start_date || null,
          period_end: subscription.end_date || null,
          payment_date: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
          metadata: JSON.stringify({
            invoice_number: invoice.number,
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf
          })
        };

        console.log(`Attempting to save transaction for invoice ${invoice.id}:`, {
          subscription_id: transactionData.subscription_id,
          user_id: transactionData.user_id,
          amount: transactionData.amount,
          stripe_invoice_id: transactionData.stripe_invoice_id
        });

        // Check if transaction already exists (prevent duplicates)
        const existingTransaction = await db.subscription_transactions.findOne({
          where: {
            stripe_invoice_id: invoice.id,
            deletedAt: null
          }
        });

        if (!existingTransaction) {
          const savedTransaction = await db.subscription_transactions.create(transactionData);
          console.log(`💳 Transaction saved successfully! ID: ${savedTransaction.id}, subscription: ${subscription.id}, invoice: ${invoice.id}`);
        } else {
          console.log(`Transaction already exists for invoice ${invoice.id}, skipping duplicate`);
        }
      } catch (transactionError) {
        console.error(`❌ Error saving transaction for invoice ${invoice.id}:`, transactionError);
        console.error(`Transaction error details:`, {
          message: transactionError.message,
          sqlMessage: transactionError.sqlMessage,
          name: transactionError.name,
          errors: transactionError.errors,
          stack: transactionError.stack
        });
        // Don't fail the whole process if transaction save fails
      }

      // Set trail_expired_at to null for the user since payment succeeded
      if (subscription.user_id) {
        try {
          await User.instance().getModel().update(
            { trail_expired_at: null },
            { where: { id: subscription.user_id } }
          );
          console.log(`User ${subscription.user_id} trail_expired_at set to null after payment succeeded`);
        } catch (userUpdateError) {
          console.error(`Error updating user trail_expired_at for user ${subscription.user_id}:`, userUpdateError);
        }
      }

      if (isRenewal) {
        console.log(`✅ Subscription ${subscription.id} renewed successfully. Invoice: ${invoice.id}, Amount: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);
      } else if (isInitialPayment) {
        console.log(`✅ Initial payment succeeded for subscription ${subscription.id}. Invoice: ${invoice.id}, Amount: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);
      } else {
        console.log(`✅ Payment succeeded for subscription ${subscription.id}. Invoice: ${invoice.id}, Amount: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Error handling payment succeeded:", error);
    }
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(invoice) {
    try {
      // Extract subscription ID from multiple possible locations
      let subscriptionIdStr = null;
      
      if (invoice.subscription) {
        subscriptionIdStr = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id;
      } else if (invoice.parent && invoice.parent.subscription_details && invoice.parent.subscription_details.subscription) {
        subscriptionIdStr = invoice.parent.subscription_details.subscription;
      } else if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
        const firstLine = invoice.lines.data[0];
        if (firstLine.parent && firstLine.parent.subscription_item_details && firstLine.parent.subscription_item_details.subscription) {
          subscriptionIdStr = firstLine.parent.subscription_item_details.subscription;
        }
      }

      if (!subscriptionIdStr) {
        console.log("Invoice is not associated with a subscription");
        return; // Not a subscription invoice
      }

      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          stripe_subscription_id: subscriptionIdStr,
          deletedAt: null
        }
      });

      if (subscription) {
        await subscription.update({
          status: 0 // Inactive due to payment failure
        });

        // Save failed transaction record
        try {
          const transactionData = {
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            amount: parseFloat((invoice.amount_due || invoice.total || 0) / 100),
            currency: invoice.currency || 'usd',
            payment_type: 'initial', // Could be renewal, but we don't have billing_reason in failed invoices
            billing_reason: invoice.billing_reason || null,
            status: 'failed',
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent || null,
            stripe_charge_id: invoice.charge || null,
            payment_date: new Date(),
            failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
            metadata: JSON.stringify({
              invoice_number: invoice.number,
              attempt_count: invoice.attempt_count
            })
          };

          // Check if transaction already exists
          const existingTransaction = await db.subscription_transactions.findOne({
            where: {
              stripe_invoice_id: invoice.id,
              deletedAt: null
            }
          });

          if (!existingTransaction) {
            await db.subscription_transactions.create(transactionData);
            console.log(`💳 Failed transaction saved for subscription ${subscription.id}, invoice: ${invoice.id}`);
          }
        } catch (transactionError) {
          console.error(`Error saving failed transaction for invoice ${invoice.id}:`, transactionError);
        }

        console.log(`Payment failed for subscription ${subscription.id}, invoice: ${invoice.id}`);
      } else {
        console.log(`Subscription not found for invoice subscription: ${subscriptionIdStr}`);
      }
    } catch (error) {
      console.error("Error handling payment failed:", error);
    }
  }

  /**
   * Handle invoice_payment.paid event
   * This event is sent when an invoice payment is successfully paid (newer Stripe API)
   * Event structure: { object: { invoice: "in_xxx", payment: { payment_intent: "pi_xxx", type: "payment_intent" } } }
   */
  async handleInvoicePaymentPaid(invoicePayment, stripe) {
    try {
      console.log(`Processing invoice_payment.paid event, invoice: ${invoicePayment.invoice}`);
      
      if (!invoicePayment.invoice) {
        console.log("Invoice payment event has no invoice field");
        return;
      }

      // Retrieve the invoice to get subscription ID
      let invoice;
      try {
        invoice = await stripe.invoices.retrieve(invoicePayment.invoice, {
          expand: ['subscription']
        });
        console.log(`Retrieved invoice ${invoice.id}, subscription: ${invoice.subscription}`);
      } catch (invoiceError) {
        console.error("Error retrieving invoice for invoice_payment.paid:", invoiceError);
        return;
      }

      if (!invoice.subscription) {
        console.log("Invoice is not associated with a subscription");
        return; // Not a subscription invoice
      }

      const subscriptionIdStr = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription.id;

      console.log(`Looking for subscription with stripe_subscription_id: ${subscriptionIdStr}`);

      const subscription = await Subscription.instance().getModel().findOne({
        where: {
          stripe_subscription_id: subscriptionIdStr,
          deletedAt: null
        }
      });

      if (subscription) {
        // Get payment intent ID from invoice payment
        const paymentIntentId = invoicePayment.payment?.payment_intent || null;
        
        // Update subscription to active
        await subscription.update({
          status: 1, // Active
          stripe_payment_intent_id: paymentIntentId || subscription.stripe_payment_intent_id
        });

        // Set trail_expired_at to null for the user since payment succeeded
        if (subscription.user_id) {
          try {
            await User.instance().getModel().update(
              { trail_expired_at: null },
              { where: { id: subscription.user_id } }
            );
            console.log(`User ${subscription.user_id} trail_expired_at set to null after invoice_payment.paid`);
          } catch (userUpdateError) {
            console.error(`Error updating user trail_expired_at for user ${subscription.user_id}:`, userUpdateError);
          }
        }

        console.log(`✅ Invoice payment succeeded for subscription ${subscription.id} (DB ID), stripe_subscription_id: ${subscriptionIdStr}, invoice: ${invoice.id}, payment_intent: ${paymentIntentId}`);
      } else {
        console.log(`❌ Subscription not found for stripe_subscription_id: ${subscriptionIdStr}`);
        console.log(`Available subscriptions in DB:`, await Subscription.instance().getModel().findAll({
          where: { deletedAt: null },
          attributes: ['id', 'stripe_subscription_id', 'user_id'],
          limit: 10
        }).then(subs => subs.map(s => ({ id: s.id, stripe_subscription_id: s.stripe_subscription_id, user_id: s.user_id }))));
      }
    } catch (error) {
      console.error("Error handling invoice payment paid:", error);
    }
  }

  /**
   * Handle charge.succeeded event
   * This event is sent when a charge is successfully completed
   * Note: This is mainly for logging/audit purposes as invoice.payment_succeeded is the primary event
   */
  async handleChargeSucceeded(charge, stripe) {
    try {
      console.log(`Charge succeeded: ${charge.id}, amount: ${charge.amount}, customer: ${charge.customer}`);
      
      // If charge has payment_intent, we can optionally update subscription
      if (charge.payment_intent) {
        // This is mainly for logging - invoice.payment_succeeded is the primary event for subscriptions
        console.log(`Charge ${charge.id} associated with payment_intent: ${charge.payment_intent}`);
      }
    } catch (error) {
      console.error("Error handling charge succeeded:", error);
    }
  }

  /**
   * Get transactions for authenticated user
   * GET /api/subscription/transactions
   * Query params: 
   *   - subscription_id (optional): Filter by specific subscription
   *   - status (optional): Filter by status (succeeded, failed, etc.)
   *   - payment_type (optional): Filter by payment type (initial, renewal, etc.)
   *   - limit (optional): Number of records per page
   *   - page (optional): Page number
   */
  async getUserTransactions({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const user = request.user;
      const { subscription_id, status, payment_type, limit = 20, page = 1, search = '' } = request.query;

      // Build where clause
      const whereClause = {
        user_id: user.id,
        deletedAt: null
      };

      if (subscription_id) {
        whereClause.subscription_id = subscription_id;
      }

      if (status) {
        whereClause.status = status;
      }

      if (payment_type) {
        whereClause.payment_type = payment_type;
      }

      if (search) {
        const searchConditions = [];
        
        // For integer fields, check if search is numeric
        const searchNum = parseInt(search);
        if (!isNaN(searchNum)) {
          searchConditions.push(
            { user_id: searchNum },
            { subscription_id: searchNum }
          );
        }
        
        // For string fields, use LIKE
        searchConditions.push(
          { stripe_invoice_id: { [Op.like]: `%${search}%` } },
          { stripe_payment_intent_id: { [Op.like]: `%${search}%` } }
        );
        
        whereClause[Op.or] = searchConditions;
      }

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Get transactions with pagination (using Subscription + SubscriptionPackage associations)
      const TransactionModel = SubscriptionTransaction.instance().getModel();
      const { count, rows: transactions } = await TransactionModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.subscriptions,
            as: 'TransactionSubscription',
            attributes: ['id', 'stripe_subscription_id', 'status', 'amount', 'start_date', 'end_date'],
            include: [
              {
                model: db.subscription_packages,
                as: 'SubscriptionPackage',
                attributes: ['id', 'name', 'price', 'duration_days', 'type']
              }
            ]
          },
          {
            model: db.users,
            as: 'User',
            // attributes: ['id', 'firstname', 'lastname', 'email']
          }
        ],
        order: [['payment_date', 'DESC'], ['createdAt', 'DESC']],
        limit: limitNum,
        offset: offset
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limitNum);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      this.__is_paginate = false;
      this.__collection = false;
      return await this.sendResponse(
        200,
        "Transactions retrieved successfully",
        {
          transactions: transactions,
          pagination: {
            current_page: parseInt(page),
            per_page: limitNum,
            total: count,
            total_pages: totalPages,
            has_next_page: hasNextPage,
            has_prev_page: hasPrevPage
          }
        }
      );
    } catch (error) {
      console.error("Error getting user transactions:", error);
      return this.sendError(
        error.message || "Failed to retrieve transactions",
        {},
        500
      );
    }
  }
  
  async getAllUserTransactions({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const { subscription_id, status, payment_type, limit = 20, page = 1, search = '' } = request.query;

      // Build where clause
      const whereClause = {
        // user_id: user.id,
        deletedAt: null
      };

      if (subscription_id) {
        whereClause.subscription_id = subscription_id;
      }

      if (status) {
        whereClause.status = status;
      }

      if (payment_type) {
        whereClause.payment_type = payment_type;
      }

      if (search) {
        const searchConditions = [];
        
        // For integer fields, check if search is numeric
        const searchNum = parseInt(search);
        if (!isNaN(searchNum)) {
          searchConditions.push(
            { user_id: searchNum },
            { subscription_id: searchNum }
          );
        }
        
        // For string fields, use LIKE
        searchConditions.push(
          { stripe_invoice_id: { [Op.like]: `%${search}%` } },
          { stripe_payment_intent_id: { [Op.like]: `%${search}%` } }
        );
        
        whereClause[Op.or] = searchConditions;
      }

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Get transactions with pagination
      const { count, rows: transactions } = await db.subscription_transactions.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.subscriptions,
            as: 'TransactionSubscription',
            attributes: ['id', 'stripe_subscription_id', 'status', 'amount', 'start_date', 'end_date'],
            include: [
              {
                model: db.subscription_packages,
                as: 'SubscriptionPackage',
                attributes: ['id', 'name', 'price', 'duration_days', 'type']
              }
            ]
          },
          {
            model: db.users,
            as: 'User',
            // attributes: ['id', 'firstname', 'lastname', 'email']
          }
        ],
        order: [['id', 'DESC']],
        limit: limitNum,
        offset: offset,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limitNum);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      this.__is_paginate = false;
      this.__collection = false;
      return await this.sendResponse(
        200,
        "Transactions retrieved successfully",
        {
          transactions: transactions,
          pagination: {
            current_page: parseInt(page),
            per_page: limitNum,
            total: count,
            total_pages: totalPages,
            has_next_page: hasNextPage,
            has_prev_page: hasPrevPage
          }
        }
      );
    } catch (error) {
      console.error("Error getting user transactions:", error);
      return this.sendError(
        error.message || "Failed to retrieve transactions",
        {},
        500
      );
    }
  }

  /**
   * Create payment method from card details
   * POST /api/user/payment/create-payment-method
   * Body: {
   *   card_number: string (required),
   *   exp_month: number (required),
   *   exp_year: number (required),
   *   cvc: string (required),
   *   cardholder_name: string (required),
   *   email: string (optional)
   * }
   * 
   * Returns: payment_method_id (pm_xxx) that can be used for subscriptions
   */
  async createPaymentMethod({ request, response }) {
    this.request = request;
    this.response = response;

    try {
      const { card_number, exp_month, exp_year, cvc, cardholder_name, email } = request.body;
      const user = request.user;

      // Validate required fields
      if (!card_number) {
        return this.sendError("Card number is required", {}, 400);
      }
      if (!exp_month) {
        return this.sendError("Expiry month is required", {}, 400);
      }
      if (!exp_year) {
        return this.sendError("Expiry year is required", {}, 400);
      }
      if (!cvc) {
        return this.sendError("CVC is required", {}, 400);
      }
      if (!cardholder_name) {
        return this.sendError("Cardholder name is required", {}, 400);
      }

      // Validate expiry month (1-12)
      const expMonthNum = parseInt(exp_month);
      if (isNaN(expMonthNum) || expMonthNum < 1 || expMonthNum > 12) {
        return this.sendError("Invalid expiry month. Must be between 1 and 12", {}, 400);
      }

      // Validate expiry year (should be current year or future)
      const expYearNum = parseInt(exp_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(expYearNum) || expYearNum < currentYear) {
        return this.sendError("Invalid expiry year. Card must not be expired", {}, 400);
      }

      // Validate card number (basic check - should be 13-19 digits)
      const cardNumberClean = card_number.replace(/\s+/g, '');
      if (!/^\d{13,19}$/.test(cardNumberClean)) {
        return this.sendError("Invalid card number format", {}, 400);
      }

      // Validate CVC (3-4 digits)
      if (!/^\d{3,4}$/.test(cvc)) {
        return this.sendError("Invalid CVC. Must be 3 or 4 digits", {}, 400);
      }

      if (!process.env.STRIPE_SECRET) {
        return this.sendError("Stripe secret key not configured", {}, 500);
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET);

      // Get or create Stripe customer for the user
      let customerId = user.stripe_customer_id;
      
      if (!customerId) {
        // Create Stripe customer if doesn't exist
        const customer = await stripe.customers.create({
          email: email || user.email,
          name: cardholder_name,
          metadata: {
            user_id: user.id.toString()
          }
        });
        customerId = customer.id;

        // Save customer ID to user
        await User.instance().getModel().update(
          { stripe_customer_id: customerId },
          { where: { id: user.id } }
        );
        console.log(`Stripe customer created for user ${user.id}: ${customerId}`);
      }

      // Create payment method in Stripe
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardNumberClean,
          exp_month: expMonthNum,
          exp_year: expYearNum,
          cvc: cvc
        },
        billing_details: {
          name: cardholder_name,
          email: email || user.email
        }
      });

      // Attach payment method to customer (required for subscriptions)
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      console.log(`Payment method ${paymentMethod.id} created and attached to customer ${customerId}`);

      this.__is_paginate = false;
      this.__collection = false;
      return await this.sendResponse(
        200,
        "Payment method created successfully",
        {
          payment_method_id: paymentMethod.id,
          customer_id: customerId,
          card: {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year
          },
          billing_details: paymentMethod.billing_details
        }
      );
    } catch (error) {
      console.error("Error creating payment method:", error);
      
      // Handle Stripe-specific errors
      if (error.type === 'StripeCardError') {
        return this.sendError(
          error.message || "Card validation failed",
          {
            error_code: error.code,
            decline_code: error.decline_code
          },
          400
        );
      } else if (error.type === 'StripeInvalidRequestError') {
        return this.sendError(
          error.message || "Invalid payment method data",
          {},
          400
        );
      }

      return this.sendError(
        error.message || "Failed to create payment method",
        {},
        500
      );
    }
  }

}
module.exports = SubscriptionController;
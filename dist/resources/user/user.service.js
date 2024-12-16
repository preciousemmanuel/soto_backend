"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("./user.model"));
const helpers_1 = require("@/utils/helpers");
const token_1 = require("@/utils/helpers/token");
const token_2 = require("@/utils/helpers/token");
const base_enum_1 = require("@/utils/enums/base.enum");
const httpcode_1 = require("@/utils/constants/httpcode");
const wallet_model_1 = __importDefault(require("../business/wallet.model"));
const cart_model_1 = __importDefault(require("../order/cart.model"));
const mail_service_1 = __importDefault(require("../mail/mail.service"));
const transactionLog_model_1 = __importDefault(require("../transaction/transactionLog.model"));
const orderDetails_model_1 = __importDefault(require("../order/orderDetails.model"));
const product_model_1 = __importDefault(require("../product/product.model"));
const paginate_1 = require("@/utils/helpers/paginate");
const otp_model_1 = __importDefault(require("./otp.model"));
const date_fns_1 = require("date-fns");
class UserService {
    constructor() {
        this.user = user_model_1.default;
        this.wallet = wallet_model_1.default;
        this.Cart = cart_model_1.default;
        this.Otp = otp_model_1.default;
        this.TransactionLog = transactionLog_model_1.default;
        this.OrderDetail = orderDetails_model_1.default;
        this.Product = product_model_1.default;
        this.mailService = new mail_service_1.default();
    }
    createUser(createUser) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const userExist = yield this.user.findOne({
                    $or: [
                        { Email: createUser.Email.toLowerCase() },
                        { PhoneNumber: createUser.PhoneNumber },
                    ],
                });
                if (userExist) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "User With These Details Already Exists",
                    };
                }
                else {
                    const full_name_split = createUser.FullName.split(" ");
                    console.log("🚀 ~ UserService ~ full_name_split:", full_name_split);
                    const hashedPassword = yield (0, token_2.hashPassword)(createUser.Password);
                    const createdUser = yield this.user.create({
                        FirstName: full_name_split.length > 0 ? full_name_split[0].toLowerCase() : "",
                        LastName: full_name_split.length > 1 ? full_name_split[1].toLowerCase() : "",
                        Email: createUser.Email.toLowerCase(),
                        PhoneNumber: createUser.PhoneNumber,
                        Password: hashedPassword,
                        SignupChannel: createUser === null || createUser === void 0 ? void 0 : createUser.SignupChannel,
                        UserType: createUser === null || createUser === void 0 ? void 0 : createUser.UserType,
                    });
                    const token = (0, token_1.createToken)(createdUser);
                    const wallet = (yield this.wallet.findOne({ user: createdUser._id })) ||
                        (yield this.wallet.create({
                            user: createdUser._id,
                        }));
                    const cart = (yield this.Cart.findOne({ user: createdUser._id })) ||
                        (yield this.Cart.create({
                            user: createdUser._id,
                            grand_total: 0,
                            total_amount: 0,
                        }));
                    createdUser.Token = token;
                    createdUser.wallet = wallet._id;
                    createdUser.cart = cart._id;
                    yield createdUser.save();
                    responseData = {
                        status: base_enum_1.StatusMessages.success,
                        code: httpcode_1.HttpCodes.HTTP_CREATED,
                        message: "User Created Successfully",
                        data: createdUser,
                    };
                }
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    addShippingAddress(addShippingAddress, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            const full_address = addShippingAddress.address +
                ", " +
                addShippingAddress.city +
                ", " +
                addShippingAddress.state +
                ", " +
                addShippingAddress.country;
            try {
                user.ShippingAddress = Object.assign(Object.assign({ full_address: full_address, address: addShippingAddress.address, city: addShippingAddress.city, state: addShippingAddress.state }, ((addShippingAddress === null || addShippingAddress === void 0 ? void 0 : addShippingAddress.postal_code) && {
                    postal_code: addShippingAddress.postal_code,
                })), { country: addShippingAddress.country });
                yield user.save();
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Shipping Address Added Successfully",
                    data: user,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    getProfile(user) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Profile Retreived Successfully",
                    data: user,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ getProfile ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    getVendorDashboard(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            let responseData;
            try {
                const { user, timeFrame, custom } = payload;
                let start;
                let end;
                let backDater;
                let backDaterBackTrack;
                let input = new Date();
                const unremitted_aggregate = yield this.OrderDetail.aggregate([
                    {
                        $match: {
                            vendor: user._id,
                            status: base_enum_1.OrderStatus.DELIVERED,
                            is_remitted: false,
                        },
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_unremitted: { $sum: "$total_price" },
                        },
                    },
                ]);
                const total_unremitted = unremitted_aggregate.length > 0
                    ? (_a = unremitted_aggregate[0]) === null || _a === void 0 ? void 0 : _a.total_unremitted
                    : 0;
                const total_in_stock_aggregate = yield this.Product.aggregate([
                    {
                        $match: {
                            vendor: user._id,
                            is_verified: true,
                            is_deleted: false,
                        },
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$product_quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_in_stock: { $sum: "$total_price" },
                        },
                    },
                ]);
                const total_in_stock = total_in_stock_aggregate.length > 0
                    ? (_b = total_in_stock_aggregate[0]) === null || _b === void 0 ? void 0 : _b.total_in_stock
                    : 0;
                backDater = yield (0, helpers_1.backDaterForChart)({ input, format: timeFrame });
                if (timeFrame) {
                    switch (timeFrame) {
                        case base_enum_1.Timeline.YESTERDAY:
                            backDater = yield (0, helpers_1.backDaterForChart)({ input, format: timeFrame });
                            break;
                        default:
                            break;
                    }
                }
                const arrayFilter = backDater.array;
                const pipeline = [
                    {
                        $facet: arrayFilter.reduce((acc, filter) => {
                            const { start, end, day, month } = filter;
                            const filterStage = {
                                is_remitted: true,
                                createdAt: {
                                    $gte: start,
                                    $lte: end,
                                },
                            };
                            acc[`${day || month || "time_frame"}`] = [
                                { $match: filterStage },
                                {
                                    $addFields: {
                                        total_price: { $multiply: ["$unit_price", "$quantity"] },
                                    },
                                },
                                {
                                    $group: {
                                        _id: null,
                                        total_price_value: { $sum: "$total_price" },
                                    },
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        start,
                                        end,
                                        day: day || null,
                                        month: month || null,
                                        total_price_value: "$total_price_value",
                                    },
                                },
                            ];
                            return acc;
                        }, {}),
                    },
                ];
                let income_stat_agg = [];
                yield this.OrderDetail.aggregate(pipeline)
                    .then((result) => {
                    income_stat_agg = result[0];
                })
                    .catch((e) => {
                    console.log("🚀 ~ UNABLE TO RUN INCOME STAT AGGREGATE:", e);
                });
                const unremitted_aggregate_backtrack = yield this.OrderDetail.aggregate([
                    {
                        $match: {
                            vendor: user._id,
                            status: base_enum_1.OrderStatus.DELIVERED,
                            is_remitted: false,
                        },
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_unremitted: { $sum: "$total_price" },
                        },
                    },
                ]);
                const total_unremitted_backtrack = unremitted_aggregate_backtrack.length > 0
                    ? (_c = unremitted_aggregate_backtrack[0]) === null || _c === void 0 ? void 0 : _c.total_unremitted
                    : 0;
                const total_in_stock_aggregate_backtrack = yield this.Product.aggregate([
                    {
                        $match: {
                            vendor: user._id,
                            is_verified: true,
                            status: base_enum_1.ProductMgtOption.APPROVED,
                            is_deleted: false,
                        },
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$product_quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_in_stock: { $sum: "$total_price" },
                        },
                    },
                ]);
                const total_in_stock_backtrack = total_in_stock_aggregate_backtrack.length > 0
                    ? (_d = total_in_stock_aggregate_backtrack[0]) === null || _d === void 0 ? void 0 : _d.total_in_stock
                    : 0;
                backDater = yield (0, helpers_1.backDaterForChart)({ input, format: timeFrame });
                if (timeFrame) {
                    switch (timeFrame) {
                        case base_enum_1.Timeline.YESTERDAY:
                            backDater = yield (0, helpers_1.backDaterForChart)({ input, format: timeFrame });
                            break;
                        default:
                            break;
                    }
                }
                const arrayFilter_backtrack = backDater.array;
                const pipeline_backtrack = [
                    {
                        $facet: arrayFilter_backtrack.reduce((acc, filter) => {
                            const { start, end, day, month } = filter;
                            const filterStage = {
                                is_remitted: true,
                                createdAt: {
                                    $gte: start,
                                    $lte: end,
                                },
                            };
                            acc[`${day || month || "time_frame"}`] = [
                                { $match: filterStage },
                                {
                                    $addFields: {
                                        total_price: { $multiply: ["$unit_price", "$quantity"] },
                                    },
                                },
                                {
                                    $group: {
                                        _id: null,
                                        total_price_value: { $sum: "$total_price" },
                                    },
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        start,
                                        end,
                                        day: day || null,
                                        month: month || null,
                                        total_price_value: "$total_price_value",
                                    },
                                },
                            ];
                            return acc;
                        }, {}),
                    },
                ];
                let income_stat_agg_backtrack = [];
                yield this.OrderDetail.aggregate(pipeline_backtrack)
                    .then((result) => {
                    income_stat_agg_backtrack = result[0];
                })
                    .catch((e) => {
                    console.log("🚀 ~ UNABLE TO RUN INCOME STAT AGGREGATE:", e);
                });
                const unremitted = total_unremitted || 0;
                const unremitted_backtrack = total_unremitted_backtrack || 0;
                const total_unremitted_percentage = Math.ceil(((unremitted - unremitted_backtrack) / unremitted) * 100);
                const in_stock = total_in_stock || 0;
                const in_stock_backtrack = total_in_stock_backtrack || 0;
                const total_in_stock_percentage = Math.ceil(((in_stock - in_stock_backtrack) / in_stock) * 100);
                const dashboard = {
                    user,
                    total_unremitted,
                    total_unremitted_percentage,
                    total_in_stock,
                    total_in_stock_percentage,
                    income_stat_agg,
                };
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Vendor Overview Retreived Successfully",
                    data: dashboard,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ getProfile ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    getVendorInventory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let responseData;
            try {
                const { user, limit, page } = payload;
                var records = yield (0, paginate_1.getPaginatedRecords)(this.OrderDetail, {
                    limit,
                    page,
                    data: {
                        vendor: user._id,
                        status: base_enum_1.OrderStatus.DELIVERED,
                    },
                    populateObj: {
                        path: "buyer",
                        select: "FirstName LastName ProfileImage ShippingAddress",
                    },
                });
                const total_sold_aggregate = yield this.OrderDetail.aggregate([
                    {
                        $match: {
                            vendor: user._id,
                            status: base_enum_1.OrderStatus.DELIVERED,
                        },
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_sold: { $sum: "$quantity" },
                        },
                    },
                ]);
                const total_sold = total_sold_aggregate.length > 0
                    ? (_a = total_sold_aggregate[0]) === null || _a === void 0 ? void 0 : _a.total_sold
                    : 0;
                const total_in_stock_aggregate = yield this.Product.aggregate([
                    {
                        $match: {
                            vendor: user._id,
                            is_verified: true,
                            is_deleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_in_stock: { $sum: "$product_quantity" },
                        },
                    },
                ]);
                const total_in_stock = total_in_stock_aggregate.length > 0
                    ? (_b = total_in_stock_aggregate[0]) === null || _b === void 0 ? void 0 : _b.total_in_stock
                    : 0;
                const inventory = {
                    total_products: total_in_stock + total_sold,
                    total_sold,
                    total_in_stock,
                    inventory_records: records,
                };
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Vendor Inventory Retreived Successfully",
                    data: inventory,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ getVendorInventory ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    getSalesAnalytics(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            let responseData;
            try {
                const today = new Date();
                let last_month = new Date();
                last_month.setMonth(new Date(today).getMonth() - 1);
                const thisMonthFilter = {
                    vendor: user === null || user === void 0 ? void 0 : user._id,
                    createdAt: {
                        $gte: (0, date_fns_1.startOfMonth)(today),
                        $lte: (0, date_fns_1.endOfMonth)(today),
                    },
                };
                const lastMonthFilter = {
                    vendor: user === null || user === void 0 ? void 0 : user._id,
                    createdAt: {
                        $gte: (0, date_fns_1.startOfMonth)(last_month),
                        $lte: (0, date_fns_1.endOfMonth)(last_month),
                    },
                };
                const total_sold_aggregate_this_month = yield this.OrderDetail.aggregate([
                    {
                        $match: Object.assign(Object.assign({}, thisMonthFilter), { status: base_enum_1.OrderStatus.DELIVERED }),
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_sold: { $sum: "$quantity" },
                            total_price: { $sum: "$total_price" },
                        },
                    },
                ]);
                const total_sold_aggregate_last_month = yield this.OrderDetail.aggregate([
                    {
                        $match: Object.assign(Object.assign({}, lastMonthFilter), { status: base_enum_1.OrderStatus.DELIVERED }),
                    },
                    {
                        $addFields: {
                            total_price: { $multiply: ["$unit_price", "$quantity"] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total_sold: { $sum: "$quantity" },
                            total_price: { $sum: "$total_price" },
                        },
                    },
                ]);
                const total_sales_this_month = total_sold_aggregate_this_month.length > 0
                    ? (_a = total_sold_aggregate_this_month[0]) === null || _a === void 0 ? void 0 : _a.total_sold
                    : 0;
                const total_revenue_this_month = total_sold_aggregate_this_month.length > 0
                    ? (_b = total_sold_aggregate_this_month[0]) === null || _b === void 0 ? void 0 : _b.total_price
                    : 0;
                const total_sold_last_month = total_sold_aggregate_last_month.length > 0
                    ? (_c = total_sold_aggregate_last_month[0]) === null || _c === void 0 ? void 0 : _c.total_sold
                    : 0;
                const total_revenue_last_month = total_sold_aggregate_last_month.length > 0
                    ? (_d = total_sold_aggregate_last_month[0]) === null || _d === void 0 ? void 0 : _d.total_price
                    : 0;
                const revenue_increase = Math.round(((total_revenue_this_month - total_revenue_last_month) /
                    total_revenue_last_month) *
                    100);
                const salses_increase = Math.round(((total_sales_this_month - total_sold_last_month) /
                    total_sold_last_month) *
                    100);
                const salesAnalytics = {
                    revenue: {
                        total: total_revenue_this_month,
                        percentage: revenue_increase,
                    },
                    sales: {
                        total: total_sales_this_month,
                        percentage: salses_increase,
                    },
                    best_seller: {
                        total: 0,
                        percentage: 0,
                    },
                };
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Sales Analytics Retreived Successfully",
                    data: salesAnalytics,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ getSalesAnalytics ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    userLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const user = yield this.user
                    .findOne({
                    $or: [
                        {
                            Email: login.email_or_phone_number.toLowerCase(),
                            UserType: login.userType,
                        },
                        {
                            PhoneNumber: login.email_or_phone_number.toLowerCase(),
                            UserType: login.userType,
                        },
                    ],
                })
                    .populate("business")
                    .populate("wallet")
                    .populate("cart");
                if (!user) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "Incorrect Username Or Password",
                    };
                    return responseData;
                }
                const isPasswordCorrect = yield (0, token_1.comparePassword)(login.password, user === null || user === void 0 ? void 0 : user.Password);
                if (isPasswordCorrect === false) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "Incorrect Username Or Password",
                    };
                    return responseData;
                }
                const token = (0, token_1.createToken)(user);
                user.Token = token;
                yield user.save();
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "User Login Successful",
                    data: user,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    changePasswordRequest(changePasswordDto) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const user = yield this.user.findOne({
                    $or: [
                        {
                            Email: changePasswordDto.email_or_phone_number.toLowerCase(),
                        },
                        {
                            PhoneNumber: changePasswordDto.email_or_phone_number.toLowerCase(),
                        },
                    ],
                });
                if (!user) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "User Not Found",
                    };
                    return responseData;
                }
                const oneTimePassword = yield (0, token_1.generateOtpModel)(base_enum_1.OtpPurposeOptions.CHANGE_PASSWORD, user, user === null || user === void 0 ? void 0 : user.Email);
                this.mailService.sendOtpMail({
                    email: user.Email,
                    otp: oneTimePassword.otp,
                    first_name: user.FirstName,
                });
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Otp Generated Successfully",
                    data: oneTimePassword,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    validateOtp(otp, otp_purpose) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const otpValiationResponse = yield (0, token_1.isOtpCorrect)(otp, otp_purpose);
                return otpValiationResponse;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    newPasswordChange(new_password, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            try {
                const hashed_password = yield (0, token_2.hashPassword)(new_password);
                user.Password = hashed_password;
                yield user.save();
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Password Changed Successflly",
                    data: user,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    newPasswordReset(new_password, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseData;
            let user;
            try {
                const otpModel = yield this.Otp.findOne({
                    otp,
                    purpose: base_enum_1.OtpPurposeOptions.CHANGE_PASSWORD,
                });
                if (!otpModel) {
                    responseData = {
                        status: base_enum_1.StatusMessages.error,
                        code: httpcode_1.HttpCodes.HTTP_BAD_REQUEST,
                        message: "Incorrect Otp",
                        data: null,
                    };
                }
                user = yield this.user.findById(otpModel === null || otpModel === void 0 ? void 0 : otpModel.user);
                const hashed_password = yield (0, token_2.hashPassword)(new_password);
                user.Password = hashed_password;
                yield user.save();
                yield this.Otp.deleteOne({
                    _id: otpModel === null || otpModel === void 0 ? void 0 : otpModel._id,
                });
                responseData = {
                    status: base_enum_1.StatusMessages.success,
                    code: httpcode_1.HttpCodes.HTTP_OK,
                    message: "Password Reset Successflly",
                    data: null,
                };
                return responseData;
            }
            catch (error) {
                console.log("🚀 ~ UserService ~ login ~ error:", error);
                responseData = {
                    status: base_enum_1.StatusMessages.error,
                    code: httpcode_1.HttpCodes.HTTP_SERVER_ERROR,
                    message: error.toString(),
                };
                return responseData;
            }
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.user.findOne({ userId: id }).select("-passwword");
                if (user) {
                    return user;
                }
                return null;
                // throw new Error("user does not exist");
            }
            catch (error) {
                console.log("notforur", error);
                throw new Error(error.toString());
            }
        });
    }
    updateFcmToken(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.user.findOneAndUpdate({ userId }, {
                    fcmToken: token,
                }, { new: true });
                return data;
            }
            catch (error) {
                console.log("dsdsddsad", error);
                //logger.log("error",`cannotcreateusername ${JSON.stringify(error)}`);
                throw new Error("unable to update fcmtoken");
            }
        });
    }
}
exports.default = UserService;

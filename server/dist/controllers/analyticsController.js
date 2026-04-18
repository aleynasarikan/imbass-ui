"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = exports.getTimeseries = exports.getWeekly = void 0;
const analyticsService = __importStar(require("../services/analyticsService"));
const catchAsync_1 = require("../utils/catchAsync");
exports.getWeekly = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await analyticsService.getWeeklyAnalytics();
    res.json(data);
});
exports.getTimeseries = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { filter } = req.query; // '24h', '7d', 'All'
    const data = await analyticsService.getTimeseriesAnalytics(filter);
    res.json(data);
});
exports.getSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await analyticsService.getSummaryAnalytics();
    res.json(data);
});

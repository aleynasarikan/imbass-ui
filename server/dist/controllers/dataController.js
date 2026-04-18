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
exports.applyCampaign = exports.createCampaign = exports.getCampaignsDashboard = exports.getCampaigns = exports.getInfluencers = void 0;
const dataService = __importStar(require("../services/dataService"));
const catchAsync_1 = require("../utils/catchAsync");
exports.getInfluencers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await dataService.getInfluencers();
    res.json(data);
});
exports.getCampaigns = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await dataService.getCampaigns();
    res.json(data);
});
exports.getCampaignsDashboard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const data = await dataService.getCampaignsDashboard();
    res.json(data);
});
exports.createCampaign = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }
    const { id: userId, role: userRole } = req.user;
    if (userRole === 'INFLUENCER') {
        return res.status(403).json({ message: 'Only Agencies, Brands, and Producers can create campaigns' });
    }
    const campaign = await dataService.createCampaign(userId, title);
    res.status(201).json(campaign);
});
exports.applyCampaign = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params; // campaign id
    const { id: userId, role: userRole } = req.user;
    if (userRole !== 'INFLUENCER') {
        return res.status(403).json({ message: 'Only Influencers can apply to campaigns' });
    }
    const application = await dataService.applyCampaign(id, userId);
    res.status(201).json(application);
});

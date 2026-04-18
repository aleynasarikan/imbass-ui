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
const express_1 = require("express");
const dataController = __importStar(require("../controllers/dataController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/influencers', auth_1.requireAuth, dataController.getInfluencers);
router.get('/campaigns', auth_1.requireAuth, dataController.getCampaigns);
router.get('/campaigns/dashboard', auth_1.requireAuth, dataController.getCampaignsDashboard);
router.post('/campaigns', auth_1.requireAuth, dataController.createCampaign);
router.post('/campaigns/:id/apply', auth_1.requireAuth, dataController.applyCampaign);
exports.default = router;

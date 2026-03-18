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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeAgency = exports.completeInfluencer = exports.getStatus = void 0;
const onboardingService = __importStar(require("../services/onboardingService"));
const catchAsync_1 = require("../utils/catchAsync");
exports.getStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const status = await onboardingService.getOnboardingStatus(req.user.id);
    res.json(status);
});
exports.completeInfluencer = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    await onboardingService.completeInfluencerOnboarding(req.user.id, req.body);
    res.json({ message: 'Influencer onboarding completed' });
});
exports.completeAgency = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    await onboardingService.completeAgencyOnboarding(req.user.id, req.body);
    res.json({ message: 'Agency onboarding completed' });
});

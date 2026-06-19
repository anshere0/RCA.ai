"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_js_1 = __importDefault(require("../db/client.js"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/incidents/:id/report:
 *   get:
 *     summary: Retrieve RCAReport for a specific incident ID, or its status if pending
 */
router.get('/:id/report', async (req, res, next) => {
    try {
        const { id } = req.params;
        const incident = await client_js_1.default.incident.findUnique({
            where: { id },
            include: {
                report: {
                    include: {
                        actionItems: true,
                    },
                },
            },
        });
        if (!incident) {
            res.status(404).json({ error: 'Incident not found' });
            return;
        }
        if (incident.status !== 'COMPLETED') {
            res.json({
                incidentId: incident.id,
                status: incident.status,
                message: `Incident analysis is currently in status: ${incident.status}`,
            });
            return;
        }
        if (!incident.report) {
            res.status(404).json({ error: 'Report not generated yet' });
            return;
        }
        res.json(incident.report);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;

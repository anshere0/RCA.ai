"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const ingestion_js_1 = require("../services/ingestion.js");
const contextAssembler_js_1 = require("../services/contextAssembler.js");
const llmReasoning_js_1 = require("../services/llmReasoning.js");
const reportGenerator_js_1 = require("../services/reportGenerator.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const prisma = new client_1.PrismaClient();
// In-memory store for MVP (replace with Redis later)
const pendingJobs = new Map();
const reportCache = new Map();
// POST /api/incidents — create and analyze
router.post("/", upload.single("logFile"), async (req, res) => {
    try {
        const incident = (0, ingestion_js_1.normalizeAlert)({
            rawText: req.body.alertText,
            serviceName: req.body.serviceName,
            severity: req.body.severity,
        });
        pendingJobs.set(incident.id, "processing");
        res.json({ incidentId: incident.id, status: "processing" });
        // Process in background
        const rawLogs = req.file
            ? req.file.buffer.toString("utf-8")
            : "No logs provided";
        (0, contextAssembler_js_1.assembleContext)(incident, rawLogs, req.body.repoOwner, req.body.repoName)
            .then((context) => (0, llmReasoning_js_1.generateRCA)(context))
            .then((rca) => (0, reportGenerator_js_1.saveReport)(incident, rca))
            .then((result) => {
            reportCache.set(incident.id, result);
            pendingJobs.set(incident.id, "done");
        })
            .catch((err) => {
            console.error("RCA failed:", err);
            pendingJobs.set(incident.id, "error");
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// GET /api/incidents/:id/report — poll for results
router.get("/:id/report", async (req, res) => {
    const { id } = req.params;
    const status = pendingJobs.get(id);
    if (!status)
        return res.status(404).json({ error: "Incident not found" });
    if (status === "processing")
        return res.json({ status: "processing" });
    if (status === "error")
        return res.json({ status: "error" });
    const cached = reportCache.get(id);
    if (cached)
        return res.json({ status: "done", data: cached });
    const report = await prisma.rCAReport.findFirst({
        where: { incidentId: id },
        include: { actionItems: true },
    });
    res.json({ status: "done", data: report });
});
// GET /api/incidents — list all
router.get("/", async (_req, res) => {
    const incidents = await prisma.incident.findMany({
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { reports: { select: { confidenceScore: true } } },
    });
    res.json(incidents);
});
exports.default = router;

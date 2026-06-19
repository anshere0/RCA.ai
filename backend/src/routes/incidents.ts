import { Router, Request, Response } from "express";
import multer from "multer";
import { normalizeAlert } from "../services/ingestion.js";
import { assembleContext } from "../services/contextAssembler.js";
import { generateRCA } from "../services/llmReasoning.js";
import { saveReport } from "../services/reportGenerator.js";
import { PrismaClient } from "@prisma/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const prisma = new PrismaClient();

// In-memory store for MVP (replace with Redis later)
const pendingJobs = new Map<string, "processing" | "done" | "error">();
const reportCache = new Map<string, any>();

// POST /api/incidents — create and analyze
router.post(
  "/",
  upload.single("logFile"),
  async (req: Request, res: Response) => {
    try {
      const incident = normalizeAlert({
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

      assembleContext(
        incident,
        rawLogs,
        req.body.repoOwner,
        req.body.repoName
      )
        .then((context) => generateRCA(context))
        .then((rca) => saveReport(incident, rca))
        .then((result) => {
          reportCache.set(incident.id, result);
          pendingJobs.set(incident.id, "done");
        })
        .catch((err) => {
          console.error("RCA failed:", err);
          pendingJobs.set(incident.id, "error");
        });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// GET /api/incidents/:id/report — poll for results
router.get("/:id/report", async (req: Request, res: Response) => {
  const { id } = req.params;
  const status = pendingJobs.get(id);

  if (!status) return res.status(404).json({ error: "Incident not found" });
  if (status === "processing") return res.json({ status: "processing" });
  if (status === "error") return res.json({ status: "error" });

  const cached = reportCache.get(id);
  if (cached) return res.json({ status: "done", data: cached });

  const report = await prisma.rCAReport.findFirst({
    where: { incidentId: id },
    include: { actionItems: true, incident: true },
  });

  res.json({ status: "done", data: report });
});

// GET /api/incidents — list all
router.get("/", async (_req: Request, res: Response) => {
  const incidents = await prisma.incident.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { reports: { select: { confidenceScore: true } } },
  });
  res.json(incidents);
});

export default router;

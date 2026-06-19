import { PrismaClient } from "@prisma/client";
import { RCAOutput } from "./llmReasoning.js";
import { NormalizedIncident } from "./ingestion.js";

const prisma = new PrismaClient();

export async function saveReport(
  incident: NormalizedIncident,
  rca: RCAOutput
) {
  const savedIncident = await prisma.incident.upsert({
    where: { id: incident.id },
    update: {},
    create: {
      id: incident.id,
      serviceName: incident.serviceName,
      severity: incident.severity,
      status: "resolved",
      startedAt: incident.startedAt,
      rawAlertText: incident.rawAlertText,
      source: incident.source,
    },
  });

  const report = await prisma.rCAReport.create({
    data: {
      incidentId: savedIncident.id,
      timeline: JSON.stringify(rca.timeline),
      rootCause: rca.rootCause.summary,
      blastRadius: JSON.stringify(rca.blastRadius),
      confidenceScore: rca.confidenceScore,
      modelUsed: "llama-3.3-70b-versatile",
    },
  });

  await prisma.actionItem.createMany({
    data: rca.actionItems.map((item) => ({
      reportId: report.id,
      incidentId: savedIncident.id,
      title: item.title,
      description: item.description,
      severity: item.severity,
      status: "open",
    })),
  });

  return { incident: savedIncident, report, actionItems: rca.actionItems };
}

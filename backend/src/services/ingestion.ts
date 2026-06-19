import { z } from "zod";
import crypto from "crypto";

const AlertSchema = z.object({
  rawText: z.string().min(1),
  serviceName: z.string().optional(),
  severity: z.enum(["P0", "P1", "P2", "P3"]).optional(),
});

export type NormalizedIncident = {
  id: string;
  serviceName: string;
  severity: "P0" | "P1" | "P2" | "P3";
  startedAt: Date;
  rawAlertText: string;
  source: "manual" | "webhook";
  errorType: string;
};

export function normalizeAlert(input: unknown): NormalizedIncident {
  const parsed = AlertSchema.parse(input);
  const text = parsed.rawText.toLowerCase();

  const serviceName =
    parsed.serviceName ||
    (text.match(/(\w+[-_]?\w*)\s+service/)?.[1] ?? "unknown-service");

  const severity =
    parsed.severity ||
    (text.includes("down") || text.includes("outage")
      ? "P0"
      : text.includes("slow") || text.includes("degraded")
      ? "P1"
      : "P2");

  const errorType = text.includes("timeout")
    ? "timeout"
    : text.includes("500") || text.includes("crash")
    ? "crash"
    : text.includes("memory")
    ? "memory-leak"
    : "degradation";

  return {
    id: crypto.randomUUID(),
    serviceName,
    severity,
    startedAt: new Date(),
    rawAlertText: parsed.rawText,
    source: "manual",
    errorType,
  };
}

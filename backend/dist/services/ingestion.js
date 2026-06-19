"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAlert = normalizeAlert;
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const AlertSchema = zod_1.z.object({
    rawText: zod_1.z.string().min(1),
    serviceName: zod_1.z.string().optional(),
    severity: zod_1.z.enum(["P0", "P1", "P2", "P3"]).optional(),
});
function normalizeAlert(input) {
    const parsed = AlertSchema.parse(input);
    const text = parsed.rawText.toLowerCase();
    const serviceName = parsed.serviceName ||
        (text.match(/(\w+[-_]?\w*)\s+service/)?.[1] ?? "unknown-service");
    const severity = parsed.severity ||
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
        id: crypto_1.default.randomUUID(),
        serviceName,
        severity,
        startedAt: new Date(),
        rawAlertText: parsed.rawText,
        source: "manual",
        errorType,
    };
}

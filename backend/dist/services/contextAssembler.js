"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleContext = assembleContext;
const logAnalyzer_js_1 = require("./logAnalyzer.js");
const deployFetcher_js_1 = require("./deployFetcher.js");
async function assembleContext(incident, rawLogs, repoOwner, repoName) {
    const [logResult, deploys] = await Promise.all([
        Promise.resolve((0, logAnalyzer_js_1.analyzeLogs)(rawLogs, incident.serviceName, incident.startedAt)),
        repoOwner && repoName && process.env.GITHUB_TOKEN
            ? (0, deployFetcher_js_1.fetchRecentDeploys)(repoOwner, repoName, incident.startedAt, process.env.GITHUB_TOKEN)
            : Promise.resolve([]),
    ]);
    const suspectDeploy = deploys.find((d) => d.isSuspect) ?? null;
    return {
        incident,
        logSummary: {
            totalLines: logResult.totalLines,
            errorCount: logResult.errorCount,
            warnCount: logResult.warnCount,
            firstErrorAt: logResult.firstErrorAt,
            patterns: logResult.patterns,
            topAnomalousLines: logResult.topLines
                .slice(0, 20)
                .map((l) => `[${l.index}] ${l.level} ${l.message}`),
        },
        deploys,
        suspectDeploy,
        assembledAt: new Date(),
    };
}

import { NormalizedIncident } from "./ingestion.js";
import { analyzeLogs } from "./logAnalyzer.js";
import { fetchRecentDeploys, Deploy } from "./deployFetcher.js";

export type IncidentContext = {
  incident: NormalizedIncident;
  logSummary: {
    totalLines: number;
    errorCount: number;
    warnCount: number;
    firstErrorAt: string | null;
    patterns: { message: string; count: number }[];
    topAnomalousLines: string[];
  };
  deploys: Deploy[];
  suspectDeploy: Deploy | null;
  assembledAt: Date;
};

export async function assembleContext(
  incident: NormalizedIncident,
  rawLogs: string,
  repoOwner?: string,
  repoName?: string
): Promise<IncidentContext> {
  const [logResult, deploys] = await Promise.all([
    Promise.resolve(analyzeLogs(rawLogs, incident.serviceName, incident.startedAt)),
    repoOwner && repoName && process.env.GITHUB_TOKEN
      ? fetchRecentDeploys(repoOwner, repoName, incident.startedAt, process.env.GITHUB_TOKEN)
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

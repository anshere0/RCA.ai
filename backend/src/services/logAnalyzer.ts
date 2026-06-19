export type LogLine = {
  index: number;
  raw: string;
  timestamp: string;
  level: string;
  message: string;
  anomalyScore: number;
};

export type LogAnalysisResult = {
  topLines: LogLine[];
  firstErrorAt: string | null;
  totalLines: number;
  errorCount: number;
  warnCount: number;
  patterns: { message: string; count: number }[];
};

export function analyzeLogs(
  rawLogs: string,
  serviceName: string,
  incidentTime: Date
): LogAnalysisResult {
  const lines = rawLogs.split("\n").filter((l) => l.trim().length > 0);
  const totalLines = lines.length;

  // Parse each line
  const parsed: LogLine[] = lines.map((raw, index) => {
    const levelMatch = raw.match(/\b(ERROR|FATAL|WARN|WARNING|INFO|DEBUG)\b/i);
    const timeMatch = raw.match(
      /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/
    );
    const level = levelMatch?.[1]?.toUpperCase() ?? "INFO";
    const timestamp = timeMatch?.[0] ?? "";

    // Anomaly scoring
    let score = 0;
    if (level === "ERROR" || level === "FATAL") score += 0.4;
    else if (level === "WARN" || level === "WARNING") score += 0.3;
    if (raw.toLowerCase().includes(serviceName.toLowerCase())) score += 0.2;
    if (timestamp) {
      const logTime = new Date(timestamp).getTime();
      const incTime = incidentTime.getTime();
      const diffMins = Math.abs(logTime - incTime) / 60000;
      if (diffMins <= 5) score += 0.1;
    }

    return {
      index,
      raw,
      timestamp,
      level,
      message: raw.slice(0, 200),
      anomalyScore: Math.min(score, 1),
    };
  });

  // Deduplicate patterns
  const patternMap = new Map<string, number>();
  parsed.forEach((line) => {
    const key = line.message.slice(0, 80);
    patternMap.set(key, (patternMap.get(key) ?? 0) + 1);
  });
  const patterns = [...patternMap.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));

  // Top 60 by anomaly score
  const topLines = [...parsed]
    .sort((a, b) => b.anomalyScore - a.anomalyScore)
    .slice(0, 60);

  const errorLines = parsed.filter(
    (l) => l.level === "ERROR" || l.level === "FATAL"
  );
  const firstErrorAt = errorLines[0]?.timestamp ?? null;

  return {
    topLines,
    firstErrorAt,
    totalLines,
    errorCount: errorLines.length,
    warnCount: parsed.filter(
      (l) => l.level === "WARN" || l.level === "WARNING"
    ).length,
    patterns,
  };
}

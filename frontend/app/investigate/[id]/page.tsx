"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { pollReport } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const LOADING_STEPS = [
  { label: "Parsing logs", icon: "📄" },
  { label: "Scoring anomalies", icon: "📊" },
  { label: "Checking deploys", icon: "🚀" },
  { label: "AI reasoning", icon: "🤖" },
  { label: "Building report", icon: "📋" },
];

const SEVERITY_COLOR: Record<string, string> = {
  P0: "bg-red-500",
  P1: "bg-orange-500",
  P2: "bg-yellow-500",
  P3: "bg-blue-500",
};

export default function InvestigatePage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<"processing"|"done"|"error">("processing");
  const [report, setReport] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState(0);

  // Animate loading steps
  useEffect(() => {
    if (status !== "processing") return;
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Poll for report
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await pollReport(id);
        if (res.status === "done") {
          setReport(res.data);
          setStatus("done");
        } else if (res.status === "error") {
          setStatus("error");
        }
      } catch {}
    };
    const interval = setInterval(poll, 2000);
    poll();
    return () => clearInterval(interval);
  }, [id]);

  function copyMarkdown() {
    if (!report) return;
    const rca = report.report ?? report;
    const md = `# RCA Report\n\n## Root Cause\n${rca.rootCause}\n\n## Confidence\n${rca.confidenceScore}/100`;
    navigator.clipboard.writeText(md);
    alert("Copied to clipboard!");
  }

  if (status === "processing") {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <h2 className="text-2xl font-bold text-blue-400">Investigating...</h2>
          <div className="space-y-3">
            {LOADING_STEPS.map((step, i) => (
              <div
                key={step.label}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500
                  ${i < stepIndex ? "bg-green-500/20 text-green-400"
                    : i === stepIndex ? "bg-blue-500/20 text-blue-400 animate-pulse"
                    : "bg-gray-800/50 text-gray-600"}`}
              >
                <span className="text-xl">{step.icon}</span>
                <span className="font-medium">{step.label}</span>
                {i < stepIndex && <span className="ml-auto">✓</span>}
                {i === stepIndex && (
                  <span className="ml-auto text-xs">Running...</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm">
            Incident ID: <code className="text-gray-400">{id}</code>
          </p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">❌ Investigation failed</p>
          <p className="text-gray-500">Check backend logs for details.</p>
          <Link href="/" className="text-blue-400 underline">← Try again</Link>
        </div>
      </main>
    );
  }

  const rca = report?.report ?? report;
  const incident = report?.incident;
  const actionItems = report?.actionItems ?? [];

  let timeline = [];
  let blastRadius: any = {};
  try { timeline = JSON.parse(rca?.timeline ?? "[]"); } catch {}
  try { blastRadius = JSON.parse(rca?.blastRadius ?? "{}"); } catch {}

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-gray-500 hover:text-white text-sm">← New Investigation</Link>
            <h1 className="text-3xl font-bold mt-1">
              {incident?.serviceName ?? "Incident"} RCA
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {incident?.severity && (
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${SEVERITY_COLOR[incident.severity]}`}>
                {incident.severity}
              </span>
            )}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {rca?.confidenceScore ?? "?"}
              </div>
              <div className="text-xs text-gray-500">confidence</div>
            </div>
          </div>
        </div>

        {/* Root Cause */}
        <Card className="bg-red-950/30 border-red-800 p-6 text-white">
          <h2 className="text-red-400 font-bold text-lg mb-2">🔴 Root Cause</h2>
          <p className="text-white text-lg">{rca?.rootCause}</p>
          {rca?.confidenceReasoning && (
            <p className="text-gray-400 text-sm mt-2 italic">
              {rca.confidenceReasoning}
            </p>
          )}
        </Card>

        {/* Timeline */}
        {timeline.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 p-6 text-white">
            <h2 className="font-bold text-lg mb-4 text-white">📅 Timeline</h2>
            <div className="space-y-3">
              {timeline.map((item: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <span className="text-blue-400 font-mono text-sm w-16 shrink-0">
                    {item.time}
                  </span>
                  <div className="flex-1 pb-3 border-b border-gray-800">
                    <p className="text-gray-200">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Blast Radius */}
        {blastRadius?.servicesAffected && (
          <Card className="bg-gray-900 border-gray-800 p-6 text-white">
            <h2 className="font-bold text-lg mb-4 text-white">💥 Blast Radius</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {blastRadius.estimatedUsersAffected}
                </div>
                <div className="text-xs text-gray-500 mt-1">Users Affected</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {blastRadius.duration}
                </div>
                <div className="text-xs text-gray-500 mt-1">Duration</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {blastRadius.servicesAffected?.length ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Services Down</div>
              </div>
            </div>
            {blastRadius.servicesAffected?.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {blastRadius.servicesAffected.map((s: string) => (
                  <span key={s} className="bg-gray-700 px-3 py-1 rounded-full text-sm text-white">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 p-6 text-white">
            <h2 className="font-bold text-lg mb-4 text-white">✅ Action Items</h2>
            <div className="space-y-3">
              {actionItems.map((item: any, i: number) => (
                <div key={i} className="flex gap-3 items-start bg-gray-800 rounded-lg p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 text-white
                    ${item.severity === "P0" ? "bg-red-500"
                      : item.severity === "P1" ? "bg-orange-500"
                      : "bg-yellow-500"}`}>
                    {item.severity}
                  </span>
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                    {item.suggestedOwner && (
                      <p className="text-blue-400 text-xs mt-1">
                        Owner: {item.suggestedOwner}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Export */}
        <div className="flex gap-3">
          <button
            onClick={copyMarkdown}
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-white"
          >
            📋 Copy Markdown
          </button>
          
          <Link
            href="/dashboard"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-white flex items-center justify-center"
          >
            📊 View All Incidents
          </Link>
        </div>

      </div>
    </main>
  );
}

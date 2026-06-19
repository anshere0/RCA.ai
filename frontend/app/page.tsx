"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createIncident } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SEVERITY_COLORS: Record<string, string> = {
  P0: "bg-red-500",
  P1: "bg-orange-500",
  P2: "bg-yellow-500",
  P3: "bg-blue-500",
};

export default function Home() {
  const router = useRouter();
  const [alertText, setAlertText] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [severity, setSeverity] = useState<"P0"|"P1"|"P2"|"P3">("P1");
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [logFile, setLogFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setLogFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".log", ".txt"] },
    maxFiles: 1,
  });

  async function handleInvestigate() {
    if (!alertText.trim()) {
      setError("Please describe what broke.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const id = await createIncident({
        alertText, serviceName, severity,
        repoOwner, repoName,
        logFile: logFile ?? undefined,
      });
      router.push(`/investigate/${id}`);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            RCA Copilot
          </h1>
          <p className="text-gray-400">
            Paste an alert. Get a root cause analysis in 60 seconds.
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800 p-6 space-y-4">
          {/* Alert input */}
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 
                       text-white placeholder-gray-500 resize-none focus:outline-none 
                       focus:border-blue-500 h-32"
            placeholder='Describe what broke... e.g. "Payment service returning 500 errors, started around 2 AM"'
            value={alertText}
            onChange={(e) => setAlertText(e.target.value)}
          />

          {/* Service + Severity row */}
          <div className="grid grid-cols-2 gap-4">
            <input
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 
                         text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Service name (optional)"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
            <div className="flex gap-2">
              {(["P0","P1","P2","P3"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all
                    ${severity === s
                      ? SEVERITY_COLORS[s] + " text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* GitHub repo row */}
          <div className="grid grid-cols-2 gap-4">
            <input
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 
                         text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="GitHub owner (optional)"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
            />
            <input
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 
                         text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="GitHub repo name (optional)"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
            />
          </div>

          {/* Log file dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive
                ? "border-blue-500 bg-blue-500/10"
                : logFile
                ? "border-green-500 bg-green-500/10"
                : "border-gray-700 hover:border-gray-500"
              }`}
          >
            <input {...getInputProps()} />
            {logFile ? (
              <p className="text-green-400">✓ {logFile.name} ({(logFile.size/1024).toFixed(1)} KB)</p>
            ) : (
              <p className="text-gray-500">
                Drop a .log or .txt file here, or click to upload
              </p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button
            onClick={handleInvestigate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 text-lg font-semibold"
          >
            {loading ? "Starting investigation..." : "🔍 Investigate"}
          </Button>
        </Card>

        <p className="text-center text-gray-600 text-sm">
          No logs? Just describe the incident — the AI will still reason about it.
        </p>
      </div>
    </main>
  );
}

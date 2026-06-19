"use client";
import { useEffect, useState } from "react";
import { listIncidents } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const SEVERITY_COLOR: Record<string, string> = {
  P0: "text-red-400", P1: "text-orange-400",
  P2: "text-yellow-400", P3: "text-blue-400",
};

export default function Dashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listIncidents().then((data) => {
      setIncidents(data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Incident Dashboard</h1>
          <Link href="/" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm text-white">
            + New Investigation
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center text-white">
            <p className="text-gray-500">No incidents yet.</p>
            <Link href="/" className="text-blue-400 underline mt-2 block">
              Investigate your first incident →
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Link key={inc.id} href={`/investigate/${inc.id}`}>
                <Card className="bg-gray-900 border-gray-800 p-4 hover:border-gray-600 
                                 transition-colors cursor-pointer text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{inc.serviceName}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(inc.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {inc.reports?.[0]?.confidenceScore && (
                        <span className="text-blue-400 text-sm font-medium">
                          {inc.reports[0].confidenceScore}% confidence
                        </span>
                      )}
                      <span className={`font-bold ${SEVERITY_COLOR[inc.severity]}`}>
                        {inc.severity}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

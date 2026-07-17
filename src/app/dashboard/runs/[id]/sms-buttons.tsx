"use client";

import { useTransition, useState } from "react";
import { MessageSquare } from "lucide-react";
import { sendDayBeforeNotifications, sendCompletedNotifications } from "../sms-actions";

interface SmsResult {
  sent?: number;
  skipped?: number;
  total?: number;
  details?: { name: string; status: "sent" | "skipped"; reason?: string }[];
  error?: string;
}

interface SmsButtonsProps {
  runId: string;
  runStatus: string;
}

export function SmsButtons({ runId, runStatus }: SmsButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SmsResult | null>(null);

  function handleDayBefore() {
    if (!confirm("Send 'windows being cleaned' texts to all customers on this run?")) return;
    startTransition(async () => {
      const res = await sendDayBeforeNotifications(runId);
      setResult(res);
    });
  }

  function handleCompleted() {
    if (!confirm("Send 'windows cleaned, payment due' texts to all completed customers?")) return;
    startTransition(async () => {
      const res = await sendCompletedNotifications(runId);
      setResult(res);
    });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">SMS Notifications</h3>
      <div className="flex flex-wrap gap-2">
        {(runStatus === "planned" || runStatus === "in_progress") && (
          <button
            onClick={handleDayBefore}
            disabled={pending}
            className="inline-flex items-center gap-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            {pending ? "Sending..." : "Text: Coming Soon"}
          </button>
        )}
        {runStatus === "completed" && (
          <button
            onClick={handleCompleted}
            disabled={pending}
            className="inline-flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            {pending ? "Sending..." : "Text: Done + Payment Due"}
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-3">
          {result.error ? (
            <p className="text-sm text-red-600">{result.error}</p>
          ) : (
            <>
              <p className="text-sm text-green-600 font-medium mb-2">
                Sent {result.sent} of {result.total} ({result.skipped} skipped)
              </p>
              {result.details && result.details.length > 0 && (
                <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                  {result.details.map((d, i) => (
                    <div key={i} className={`flex items-center gap-2 ${d.status === "sent" ? "text-green-700" : "text-gray-500"}`}>
                      <span>{d.status === "sent" ? "✓" : "—"}</span>
                      <span>{d.name}</span>
                      {d.reason && <span className="text-gray-400">({d.reason})</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

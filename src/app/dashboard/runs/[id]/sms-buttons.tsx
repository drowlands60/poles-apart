"use client";

import { useTransition, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp, Check } from "lucide-react";
import { sendDayBeforeNotifications, sendCompletedNotifications, sendSingleNotification } from "../sms-actions";

interface SmsResult {
  sent?: number;
  skipped?: number;
  total?: number;
  details?: { name: string; status: "sent" | "skipped"; reason?: string }[];
  error?: string;
}

interface RunCustomerSms {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  sms_opt_in: boolean;
  sms_day_before_sent: boolean;
  sms_completed_sent: boolean;
}

interface SmsButtonsProps {
  runId: string;
  runStatus: string;
  customers: RunCustomerSms[];
}

export function SmsButtons({ runId, runStatus, customers }: SmsButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SmsResult | null>(null);
  const [showList, setShowList] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  function handleDayBefore() {
    if (!confirm("Send 'coming tomorrow' texts to all customers on this run?")) return;
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

  const dayBeforeSentCount = customers.filter((c) => c.sms_day_before_sent).length;
  const completedSentCount = customers.filter((c) => c.sms_completed_sent).length;

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
            {pending ? "Sending..." : "Text: Coming Tomorrow"}
            {dayBeforeSentCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                <Check className="w-3 h-3" />{dayBeforeSentCount}
              </span>
            )}
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
            {completedSentCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                <Check className="w-3 h-3" />{completedSentCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Fresh send result */}
      {result && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          {result.error ? (
            <p className="text-sm text-red-600">{result.error}</p>
          ) : (
            <>
              <p className={`text-sm font-medium mb-2 ${result.sent ? "text-green-600" : "text-amber-600"}`}>
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

      {/* Customer SMS status list */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          onClick={() => setShowList(!showList)}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Customer text status
          {showList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showList && (
          <div className="mt-2 text-xs space-y-1 max-h-48 overflow-y-auto">
            {customers.map((c) => {
              const canSend = c.phone && c.sms_opt_in;
              const skipReason = !c.phone ? "no phone" : !c.sms_opt_in ? "opted out" : null;
              return (
                <div key={c.customer_id} className="flex items-center gap-2 py-0.5">
                  <span className="text-gray-900 flex-1">{c.first_name} {c.last_name}</span>
                  {canSend ? (
                    <>
                      <button
                        onClick={() => {
                          if (c.sms_day_before_sent) return;
                          setSendingId(`${c.customer_id}-soon`);
                          startTransition(async () => {
                            await sendSingleNotification(runId, c.customer_id, "day_before");
                            setSendingId(null);
                          });
                        }}
                        disabled={pending || c.sms_day_before_sent}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${c.sms_day_before_sent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"} disabled:cursor-default`}
                        title={c.sms_day_before_sent ? "Already sent" : "Send 'coming tomorrow' text"}
                      >
                        {sendingId === `${c.customer_id}-soon` ? "…" : c.sms_day_before_sent ? <Check className="w-3 h-3" /> : null}
                        Tomorrow
                      </button>
                      <button
                        onClick={() => {
                          if (c.sms_completed_sent) return;
                          setSendingId(`${c.customer_id}-done`);
                          startTransition(async () => {
                            await sendSingleNotification(runId, c.customer_id, "completed");
                            setSendingId(null);
                          });
                        }}
                        disabled={pending || c.sms_completed_sent}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${c.sms_completed_sent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700 cursor-pointer"} disabled:cursor-default`}
                        title={c.sms_completed_sent ? "Already sent" : "Send 'done + payment due' text"}
                      >
                        {sendingId === `${c.customer_id}-done` ? "…" : c.sms_completed_sent ? <Check className="w-3 h-3" /> : null}
                        Done
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">{skipReason}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

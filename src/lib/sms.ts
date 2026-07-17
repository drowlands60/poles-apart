import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

function getClient() {
  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }
  return twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  const client = getClient();

  if (!client) {
    console.log(`[SMS STUB] To: ${to} | Body: ${body}`);
    return { success: true, sid: "stub-no-twilio-configured" };
  }

  // Ensure UK format
  const formattedTo = to.startsWith("+") ? to : `+44${to.replace(/^0/, "")}`;

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error(`[SMS ERROR] To: ${to} | Error: ${error}`);
    return { success: false, error };
  }
}

export function buildDayBeforeMessage(customerFirstName: string, scheduledDate: string): string {
  const date = new Date(scheduledDate + "T00:00:00");
  const dayStr = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return `Hi ${customerFirstName}, just to let you know your windows will be cleaned on ${dayStr}. Thanks, Poles Apart.`;
}

export function buildCompletedMessage(customerFirstName: string, price: number): string {
  return `Hi ${customerFirstName}, your windows have been cleaned today. Payment of £${price.toFixed(2)} is now due. Thanks, Poles Apart.`;
}

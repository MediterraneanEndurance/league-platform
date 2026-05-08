import { leagueConfig } from "@/lib/league-config";

type ApplicationStatusEmail = {
  email: string;
  displayName: string;
  status: "approved" | "rejected";
  reason?: string;
};

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function emailBody({ displayName, status, reason }: ApplicationStatusEmail) {
  if (status === "approved") {
    return {
      subject: "MEL Race Control: Driver application approved",
      text: [
        `Hello ${displayName},`,
        "",
        "Race Control has approved your Mediterranean Endurance League driver application.",
        "Your public driver profile can now appear in the paddock once entry lists are published.",
        "",
        "Next steps:",
        "- Watch the Discord channels for briefing notes.",
        "- Confirm your class and car selection before race week.",
        "- Keep your evidence and steward-report links ready after each event.",
        "",
        "Welcome to the grid.",
        `MEL Race Control`,
      ].join("\n"),
    };
  }

  return {
    subject: "MEL Race Control: Driver application feedback",
    text: [
      `Hello ${displayName},`,
      "",
      "Race Control has reviewed your Mediterranean Endurance League driver application and needs changes before approval.",
      "",
      "Review feedback:",
      reason || "Please review your application details and submit an updated entry.",
      "",
      "You can return to the platform, update the relevant details, and submit again when ready.",
      leagueConfig.siteUrl,
      "",
      "MEL Race Control",
    ].join("\n"),
  };
}

export async function sendApplicationStatusEmail(message: ApplicationStatusEmail) {
  if (!isEmailConfigured()) {
    return { sent: false, skipped: true };
  }

  const body = emailBody(message);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: message.email,
      subject: body.subject,
      text: body.text,
      reply_to: process.env.RESEND_REPLY_TO_EMAIL || undefined,
    }),
  });

  return { sent: response.ok, skipped: false };
}

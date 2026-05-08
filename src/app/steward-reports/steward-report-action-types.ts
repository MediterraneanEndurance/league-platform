export type StewardReportActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export const emptyStewardReportState: StewardReportActionState = { ok: false, message: "" };

export type ResultImportActionState = {
  ok: boolean;
  message: string;
  summary?: {
    batchId?: string;
    importedRows: number;
    championshipId?: string;
    replaceMode: boolean;
    warnings: number;
  };
};

export const emptyResultImportState: ResultImportActionState = { ok: false, message: "" };

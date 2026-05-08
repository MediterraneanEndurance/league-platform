export type AdminApplicationActionState = {
  ok: boolean;
  message: string;
};

export const emptyAdminApplicationState: AdminApplicationActionState = {
  ok: false,
  message: "",
};

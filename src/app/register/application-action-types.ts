export type ApplicationActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export const emptyApplicationState: ApplicationActionState = {
  ok: false,
  message: "",
};

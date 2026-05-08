export type AuthActionState = {
  ok: boolean;
  message: string;
};

export const emptyAuthActionState: AuthActionState = {
  ok: false,
  message: "",
};

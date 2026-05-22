export interface Iuser {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
}


export type ILoginPayload = {
  email: string;
  password: string;
};

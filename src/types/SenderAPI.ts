export type SenderAPIData = {
  to: string;
  code: string;
  name: string;
};

export interface ISenderAPI {
  send: (data: SenderAPIData) => Promise<void>;
}

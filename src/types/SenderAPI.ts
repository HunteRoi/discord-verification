export interface SenderAPIData {
  /**
   * The code to send.
   *
   * @type {string}
   */
  code: string;

  /**
   * The user name for message customization.
   *
   * @type {string}
   */
  name: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;
}

/**
 * The contract of a sender service.
 *
 * @export
 * @interface ISenderAPI
 */
export interface ISenderAPI {
  /**
   * Sends data to a user via a specific flow.
   *
   * @param {SenderAPIData} data
   * @memberof ISenderAPI
   */
  send(data: SenderAPIData): Promise<void>;
}

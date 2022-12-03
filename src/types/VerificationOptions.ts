import { IUser } from '.';

/**
 * The {@link VerificationManager} options.
 *
 * @export
 * @interface VerificationOptions
 * @template TUser
 */
export interface VerificationOptions<TUser extends IUser> {
  /**
   * The options related to the code generation.
   *
   * @type {{
   *     charactersWhitelist?: string;
   *     length: number;
   *   }}
   * @memberof VerificationOptions
   */
  codeGenerationOptions: {
    /**
     * The whitelist of characters used to generate the code.
     *
     * @type {string}
     */
    charactersWhitelist?: string;

    /**
     * The required length of the code.
     *
     * @type {number}
     */
    length: number;
  };

  /**
   * The maximum number of calls before resending the code to the user via the communication service.
   *
   * @type {number}
   * @memberof VerificationOptions
   */
  maxNbCodeCalledBeforeResend: number;

  /**
   * Formats the message sent when calling the communication service throws an error.
   *
   * @param {TUser} user
   * @param {unknown} error
   * @return {string} the message
   * @memberof VerificationOptions
   */
  errorMessage(user: TUser, error: unknown): string;

  /**
   * Formats the message sent for the first time when the user's code has just been sent.
   *
   * @param {TUser} user
   * @return {string} the message
   * @memberof VerificationOptions
   */
  pendingMessage(user: TUser): string;

  /**
   * Formats the message sent once the user tries to generate a code when it's already sent to them.
   *
   * @param {TUser} user
   * @return {string} the message
   * @memberof VerificationOptions
   */
  alreadyPendingMessage(user: TUser): string;

  /**
   * Formats the message sent once the user tries to generate a code when they are already verified.
   *
   * @param {TUser} user
   * @return {string} the message
   * @memberof VerificationOptions
   */
  alreadyActiveMessage(user: TUser): string;

  /**
   * Formats the message sent once the code is checked and valid.
   *
   * @param {TUser| undefined | null} user
   * @param {string} validCode
   * @return {string} the message
   * @memberof VerificationOptions
   */
  validCodeMessage(user: TUser | undefined | null, validCode: string): string;

  /**
   * Formats the message sent once the code is checked and invalid.
   *
   * @param {TUser| undefined | null} user
   * @param {string} invalidCode
   * @return {string} the message
   * @memberof VerificationOptions
   */
  invalidCodeMessage(user: TUser | undefined | null, invalidCode: string): string;
}

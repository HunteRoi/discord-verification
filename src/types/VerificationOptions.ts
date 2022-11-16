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
   * The message sent for the first time when the user's code has just been sent.
   *
   * @memberof VerificationOptions
   */
  pendingMessage: (user: TUser) => string;

  /**
   * The message sent once the user tries to generate a code when it's already sent to them.
   *
   * @memberof VerificationOptions
   */
  alreadyPendingMessage: (user: TUser) => string;

  /**
   * The message sent once the user tries to generate a code when they are already verified.
   *
   * @memberof VerificationOptions
   */
  alreadyActiveMessage: (user: TUser) => string;

  /**
   * The message sent once the code is checked and valid.
   *
   * @memberof VerificationOptions
   */
  validCodeMessage: (user: TUser, validCode: string) => string;

  /**
   * The message sent once the code is checked and invalid.
   *
   * @memberof VerificationOptions
   */
  invalidCodeMessage: (user: TUser, invalidCode: string) => string;
}

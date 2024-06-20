/**
 * The events emitted by the {@link VerificationManager} on specific actions.
 *
 * @export
 * @enum {number}
 */
export enum VerificationManagerEvents {
    codeCreate = "codeCreate",
    codeVerify = "codeVerify",

    userCreate = "userCreate",
    userAwait = "userAwait",
    userActive = "userActive",

    error = "error",
}

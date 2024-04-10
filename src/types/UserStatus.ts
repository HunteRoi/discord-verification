/**
 * The different user statuses (either pending or active).
 *
 * @export
 * @enum {number}
 */
export enum UserStatus {
    /**
     * The user verification is pending.
     */
    pending = 0,

    /**
     * The user is verified and active.
     */
    active = 1,
}

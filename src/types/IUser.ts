import type { Snowflake } from "discord.js";

import type { UserStatus } from "./UserStatus.js";

/**
 * Represents a user.
 *
 * @export
 * @interface IUser
 */
export interface IUser {
    /**
     * The data used to send the code. Could be an email, a phone number or any
     * complex information. Type should match what is expected from the sender API.
     *
     * @type {*}
     * @memberof IUser
     */
    // biome-ignore lint: any data could be sent
    data: any;

    /**
     * The generated code to verify that user.
     *
     * @type {string | null | undefined}
     * @memberof IUser
     */
    code?: string | null;

    /**
     * The used code that verified the user.
     *
     * @type {string | null | undefined}
     * @memberof IUser
     */
    activatedCode?: string | null;

    /**
     * The timestamp marking the activation of the user.
     *
     * @type {EpochTimeStamp | null | undefined}
     * @memberof IUser
     */
    activationTimestamp?: EpochTimeStamp | null;

    /**
     * The user name.
     *
     * @type {string}
     * @memberof IUser
     */
    username: string;

    /**
     * The user Discord ID.
     *
     * @type {Snowflake}
     * @memberof IUser
     */
    userid: Snowflake;

    /**
     * The status of the user.
     *
     * @type {UserStatus}
     * @memberof IUser
     */
    status: UserStatus;

    /**
     * The number of times the generation of a code for that user is initiated.
     *
     * @type {number}
     * @memberof IUser
     */
    nbCodeCalled: number;

    /**
     * The number of times the verification of a code for that user is initiated.
     *
     * @type {number}
     * @memberof IUser
     */
    nbVerifyCalled: number;
}

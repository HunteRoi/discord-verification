import type { Snowflake } from "discord.js";

import type { IUser } from ".";

/**
 * The contract of a storing service.
 *
 * @export
 * @interface IStoringSystem
 * @template TUser
 */
export interface IStoringSystem<TUser extends IUser> {
    /**
     * Reads the storing system to get the user based on its unique identifier.
     *
     * @param {Snowflake} userid
     * @return {Promise<TUser| undefined | null>} the user or nothing
     * @memberof IStoringSystem
     */
    read(userid: Snowflake): Promise<TUser | undefined | null>;

    /**
     * Reads the storing system to get the user based on filters.
     *
     * @param {Map<string, any>} filters
     * @return {(Promise<TUser| undefined | null>)} the user or nothing
     * @memberof IStoringSystem
     */
    // biome-ignore lint: a filter could be anything
    readBy(filters: Map<string, any>): Promise<TUser | undefined | null>;
    readBy(
        callback: (user: TUser, index: number | string) => boolean,
    ): Promise<TUser | undefined | null>;
    readBy(
        argument: // biome-ignore lint: a filter could be anything
        Map<string, any> | ((user: TUser, index: number | string) => boolean),
    ): Promise<TUser | undefined | null>;

    /**
     * Writes a user into the storing system.
     *
     * @param {TUser} user
     * @memberof IStoringSystem
     */
    write(user: TUser): Promise<void>;
}

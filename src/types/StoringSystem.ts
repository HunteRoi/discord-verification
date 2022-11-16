import { Snowflake } from 'discord.js';

import { IUser } from '.';

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
   * @return {Promise<TUser>} the user
   * @memberof IStoringSystem
   */
  read(userid: Snowflake): Promise<TUser>;

  /**
   * Reads the storing system to get the user based on a predicate.
   *
   * @param {(user: TUser, index: number | string) => boolean} callback
   * @return {Promise<TUser>} the user
   * @memberof IStoringSystem
   */
  readBy(callback: (user: TUser, index: number | string) => boolean): Promise<TUser>;

  /**
   * Writes a user into the storing system.
   *
   * @param {TUser} user
   * @memberof IStoringSystem
   */
  write(user: TUser): Promise<void>;
}

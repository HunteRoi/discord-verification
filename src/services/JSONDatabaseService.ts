import { Snowflake } from 'discord.js';
import { Config, JsonDB } from 'node-json-db';

import { IStoringSystem, IUser } from '../types';

export type UserModel = IUser;

/**
 * The JSON file storing system. Used to store the users.
 *
 * @export
 * @class JSONDatabaseService
 * @implements {IStoringSystem<UserModel>}
 */
export class JSONDatabaseService implements IStoringSystem<UserModel> {
  readonly #database: JsonDB;
  readonly #rootPath: string;

  /**
   * Creates an instance of JSONDatabaseService.
   * @param {string} filePath
   * @memberof JSONDatabaseService
   */
  constructor(filePath: string) {
    this.#rootPath = '/users';
    this.#database = new JsonDB(new Config(filePath, true, true, '/'));
  }

  /**
   * Creates the tables if they do not exist yet.
   *
   * @memberof JSONDatabaseService
   */
  init() {
    if (!this.#database.exists(this.#rootPath)) {
      this.#database.push(this.#rootPath, []);
    }
  }

  /**
   * @inherit
   * @param {Snowflake} userid
   * @return {Promise<UserModel>} the user
   * @memberof JSONDatabaseService
   */
  read(userid: Snowflake): Promise<UserModel> {
    return this.#database.find<UserModel>(this.#rootPath, (user: UserModel) => user.userid === userid);
  }

  /**
   * @inherit
   * @param {((user: IUser, index: number | string) => boolean)} callback
   * @return {Promise<UserModel>} the user
   * @memberof JSONDatabaseService
   */
  readBy(callback: (user: IUser, index: number | string) => boolean): Promise<UserModel> {
    return this.#database.find<UserModel>(this.#rootPath, callback);
  }

  /**
   * @inherit
   * @param {UserModel} user
   * @memberof JSONDatabaseService
   */
  async write(user: UserModel): Promise<void> {
    const index = await this.#database.getIndex(this.#rootPath, user.userid, 'userid');
    await this.#database.push(`${this.#rootPath}[${index !== -1 ? index.toString() : ''}]`, user, true);
  }
}

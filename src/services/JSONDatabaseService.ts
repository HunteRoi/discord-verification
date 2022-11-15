import { Snowflake } from 'discord.js';
import { Config, JsonDB } from 'node-json-db';

import { IStoringSystem, IUser } from '../types';

type UserModel = IUser;

export class JSONDatabaseService implements IStoringSystem<UserModel> {
  readonly #database: JsonDB;
  readonly #rootPath: string;

  constructor(filePath: string) {
    this.#rootPath = '/users';
    this.#database = new JsonDB(new Config(filePath, true, true, '/'));
  }

  init() {
    if (!this.#database.exists(this.#rootPath)) {
      this.#database.push(this.#rootPath, []);
    }
  }

  read(userid: Snowflake): Promise<UserModel> {
    return this.#database.find<UserModel>(this.#rootPath, (user: UserModel) => user.userid === userid);
  }

  readBy(callback: (user: IUser, index: number | string) => boolean): Promise<UserModel> {
    return this.#database.find<UserModel>(this.#rootPath, callback);
  }

  async write(user: UserModel): Promise<void> {
    const index = await this.#database.getIndex(this.#rootPath, user.userid, 'userid');
    await this.#database.push(`${this.#rootPath}[${index !== -1 ? index.toString() : ''}]`, user, true);
  }
}

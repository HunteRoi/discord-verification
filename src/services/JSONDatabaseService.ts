import { Snowflake } from 'discord.js';
import { Config, JsonDB } from 'node-json-db';

import { IStoringSystem, IUser } from '../types';

type UserModel = IUser;

export class JSONDatabaseService implements IStoringSystem<UserModel> {
  private readonly database: JsonDB;

  constructor(filePath: string) {
    this.database = new JsonDB(new Config(filePath, true, true, '/'));
  }

  init() {
    if (!this.database.exists('/users')) {
      this.database.push('/users', []);
    }
  }

  read(userid: Snowflake): Promise<UserModel> {
    return this.database.find<UserModel>('/users', (user: UserModel) => user.userid === userid);
  }

  async write(user: UserModel): Promise<void> {
    const index = await this.database.getIndex('/users', user.userid, 'userid');
    await this.database.push(`/users[${index !== -1 ? index.toString() : ''}]`, user, true);
  }
}

import { Snowflake } from 'discord.js';

import { IUser } from '.';

export interface IStoringSystem<TUser extends IUser> {
  read: (userid: Snowflake) => Promise<TUser>;
  write: (user: TUser) => Promise<void>;
}

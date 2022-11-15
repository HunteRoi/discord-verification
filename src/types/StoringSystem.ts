import { Snowflake } from 'discord.js';

import { IUser } from '.';

export interface IStoringSystem<TUser extends IUser> {
  read: (userid: Snowflake) => Promise<TUser>;
  readBy: (callback: (user: TUser, index: number | string) => boolean) => Promise<TUser>;
  write: (user: TUser) => Promise<void>;
}

import { Snowflake } from 'discord.js';

import { IUser } from '.';

export interface IStoringSystem<T extends IUser> {
	read: (userid: Snowflake) => Promise<T>;
	write: (user: T) => Promise<void>;
}

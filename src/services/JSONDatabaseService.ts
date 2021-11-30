import { Snowflake } from 'discord.js';
import { JsonDB } from 'node-json-db';

import { IStoringSystem, IUser } from '../types';

export class JSONDatabaseService implements IStoringSystem<IUser> {
	private readonly database: JsonDB;

	constructor(filePath: string) {
		this.database = new JsonDB(filePath, true, true, '/');
	}

	init() {
		if (!this.database.exists('/users')) {
			this.database.push('/users', []);
		}
	}

	async read(userid: Snowflake): Promise<IUser> {
		const user = this.database.find<IUser>(
			'/users',
			(user: IUser) => user.userid === userid
		);
		return new Promise((resolve, reject) => resolve(user));
	}

	async write(user: IUser) {
		const index = this.database.getIndex('/users', user.userid, 'userid');
		this.database.push(
			`/users[${index !== -1 ? index.toString() : ''}]`,
			user,
			true
		);
	}
}

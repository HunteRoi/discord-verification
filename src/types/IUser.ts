import { Snowflake } from 'discord.js';

import { UserStatus } from '.';

export interface IUser {
  data: any;
  code: string;
  activatedCode?: string;
  username: string;
  userid: Snowflake;
  status: UserStatus;
  nbCodeCalled: number;
  nbVerifyCalled: number;
}

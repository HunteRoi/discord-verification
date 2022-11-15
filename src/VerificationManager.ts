import { Client, Snowflake } from 'discord.js';
import EventEmitter from 'events';

import { CodeGeneratorService } from './services';
import {
  VerificationOptions,
  ISenderAPI,
  IStoringSystem,
  IUser,
  UserStatus,
} from './types';
import { VerificationManagerEvents } from './VerificationManagerEvents';

export class VerificationManager<TUser extends IUser> extends EventEmitter {
  private readonly options: VerificationOptions<TUser>;
  private readonly storingSystem: IStoringSystem<TUser>;
  private readonly senderAPI: ISenderAPI;
  private readonly codeGenerator: CodeGeneratorService;

  public readonly client: Client;

  constructor(
    client: Client,
    storingSystem: IStoringSystem<TUser>,
    senderAPI: ISenderAPI,
    options: VerificationOptions<TUser> = {
      codeGenerationOptions: {
        length: 6,
      },
      maxNbCodeCalledBeforeResend: 3,
      pendingMessage: (user: TUser) =>
        `The verification code has just been sent to ${user.data}.`,
      alreadyPendingMessage: (user: TUser) =>
        `You already have a verification code pending! It was sent to ${user.data}.`,
      alreadyActiveMessage: (user: TUser) =>
        `You are already verified with the email ${user.data}!`,
      validCodeMessage: (user: TUser, validCode: string) =>
        `Your code ${validCode} is valid! Welcome ${user.username}!`,
      invalidCodeMessage: (user: TUser, invalidCode: string) =>
        `Your code ${invalidCode} is invalid!`,
    }
  ) {
    super();

    if (!client) throw 'Client is required';
    if (!storingSystem) throw 'StoringSystem is required';
    if (!senderAPI) throw 'SenderAPI is required';
    this.validateOptions(options);

    this.client = client;
    this.options = options;
    this.storingSystem = storingSystem;
    this.senderAPI = senderAPI;
    this.codeGenerator = new CodeGeneratorService(
      this.options.codeGenerationOptions.charactersWhitelist
    );
  }

  private validateOptions(options: VerificationOptions<TUser>) {
    if (!options) throw "'options' is required";

    if (!options.codeGenerationOptions || !options.codeGenerationOptions.length) {
      options.codeGenerationOptions = { ...(options.codeGenerationOptions ?? {}), length: 6 };
    }
    if (!options.maxNbCodeCalledBeforeResend) {
      options.maxNbCodeCalledBeforeResend = 3;
    }
    if (!options.pendingMessage) {
      options.pendingMessage = (user: TUser) => `The verification code has just been sent to ${user.data}.`;
    }
    if (!options.alreadyPendingMessage) {
      options.alreadyPendingMessage = (user: TUser) => `You already have a verification code pending! It was sent to ${user.data}.`;
    }
    if (!options.alreadyActiveMessage) {
      options.alreadyActiveMessage = (user: TUser) => `An account is already verified with this data!`;
    }
    if (!options.validCodeMessage) {
      options.validCodeMessage = (user: TUser, validCode: string) => `Your code ${validCode} is valid! Welcome ${user.username}!`;
    }
    if (!options.invalidCodeMessage) {
      options.invalidCodeMessage = (user: TUser, invalidCode: string) => `Your code ${invalidCode} is invalid!`;
    }
  }

  async sendCode(userid: Snowflake, data: any): Promise<string> {
    let user: TUser = (await this.storingSystem.read(userid)) ?? (await this.storingSystem.readBy((user: TUser) => user.data === data));
    this.emit(VerificationManagerEvents.storingSystemCall);

    if (!user) {
      const discordUser = await this.client.users.fetch(userid);
      const code = this.codeGenerator.generateCode(
        this.options.codeGenerationOptions.length
      );
      this.emit(VerificationManagerEvents.codeCreate, code);

      user = {
        userid,
        username: discordUser.username,
        data,
        status: UserStatus.pending,
        code,
        nbCodeCalled: 1,
        nbVerifyCalled: 0,
      } as TUser;

      await this.storingSystem.write(user);
      this.emit(VerificationManagerEvents.userCreate, user);
      this.emit(VerificationManagerEvents.storingSystemCall);

      await this.senderAPI.send({
        to: data,
        name: user.username,
        code,
      });
      this.emit(VerificationManagerEvents.senderCall);

      this.emit(VerificationManagerEvents.userAwait, user);
      return this.options.pendingMessage(user);
    } else if (user && user.userid === userid && user.status === UserStatus.pending) {
      user.nbCodeCalled++;
      if (user.nbCodeCalled % this.options.maxNbCodeCalledBeforeResend === 0) {
        await this.senderAPI.send({
          to: user.data,
          name: user.username,
          code: user.code,
        });
        this.emit(VerificationManagerEvents.senderCall);
      }

      await this.storingSystem.write(user);
      this.emit(VerificationManagerEvents.storingSystemCall);

      this.emit(VerificationManagerEvents.userAwait, user);
      return this.options.alreadyPendingMessage(user);
    } else {
      this.emit(VerificationManagerEvents.userActive, user);
      return this.options.alreadyActiveMessage(user);
    }
  }

  async verifyCode(userid: string, code: string): Promise<string> {
    let isVerified = false;

    let user: TUser = await this.storingSystem.read(userid);
    this.emit(VerificationManagerEvents.storingSystemCall);

    if (user) {
      user.nbVerifyCalled++;

      isVerified = user.status === UserStatus.pending && user.code === code.trim();
      if (isVerified) {
        user.status = UserStatus.active;
        user.activatedCode = user.code;
        user.code = null;
      }

      await this.storingSystem.write(user);
      this.emit(VerificationManagerEvents.storingSystemCall);
    }

    this.emit(
      VerificationManagerEvents.codeVerify,
      user,
      userid,
      code,
      isVerified
    );

    return isVerified
      ? this.options.validCodeMessage(user, code)
      : this.options.invalidCodeMessage(user, code);
  }
}

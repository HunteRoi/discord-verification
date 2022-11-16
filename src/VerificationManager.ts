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

/**
 * The manager handling verification (generating, sending and verifying the user's code).
 *
 * @export
 * @class VerificationManager
 * @extends {EventEmitter}
 * @template TUser
 */
export class VerificationManager<TUser extends IUser> extends EventEmitter {
  private readonly options: VerificationOptions<TUser>;
  private readonly storingSystem: IStoringSystem<TUser>;
  private readonly senderAPI: ISenderAPI;
  private readonly codeGenerator: CodeGeneratorService;

  /**
   * The Discord client instance.
   *
   * @type {Client}
   * @memberof VerificationManager
   */
  public readonly client: Client;

  /**
   * Creates an instance of VerificationManager.
   * @param {Client} client
   * @param {IStoringSystem<TUser>} storingSystem
   * @param {ISenderAPI} senderAPI
   * @param {VerificationOptions<TUser>} [options={
   *     codeGenerationOptions: {
   *          length: 6
   *     },
   *     maxNbCodeCalledBeforeResend: 3,
   *     pendingMessage: (user: TUser) => `The verification code has just been sent to ${user.data}.`,
   *     alreadyPendingMessage: (user: TUser) => `You already have a verification code pending! It was sent to ${user.data}.`,
   *     alreadyActiveMessage: (user: TUser) => `You are already verified with the email ${user.data}!`,
   *     validCodeMessage: (user: TUser, validCode: string) => `Your code ${validCode} is valid! Welcome ${user.username}!`,
   *     invalidCodeMessage: (user: TUser, invalidCode: string) => `Your code ${invalidCode} is invalid!`
   *   }]
   * @memberof VerificationManager
   */
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

  /**
   * Sends the code via the communication service to the user based on the provided data.
   * Saves the user, their code and their data into the database.
   *
   * @param {Snowflake} userid
   * @param {*} data
   * @return {Promise<string>} the result of the operation as a string, based on the result of the call to one of the manager's options' methods.
   * @memberof VerificationManager
   */
  async sendCode(userid: Snowflake, data: any): Promise<string> {
    let user: TUser = (await this.storingSystem.read(userid)) ?? (await this.storingSystem.readBy((user: TUser) => user.data === data));

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

      await this.senderAPI.send({
        ...data,
        name: user.username,
        code
      });

      this.emit(VerificationManagerEvents.userAwait, user);
      return this.options.pendingMessage(user);
    } else if (user && user.userid === userid && user.status === UserStatus.pending) {
      user.nbCodeCalled++;
      if (user.nbCodeCalled % this.options.maxNbCodeCalledBeforeResend === 0) {
        await this.senderAPI.send({
          ...user.data,
          name: user.username,
          code: user.code,
        });
      }

      await this.storingSystem.write(user);

      this.emit(VerificationManagerEvents.userAwait, user);
      return this.options.alreadyPendingMessage(user);
    } else {
      this.emit(VerificationManagerEvents.userActive, user);
      return this.options.alreadyActiveMessage(user);
    }
  }

  /**
   * Verifies the provided code for the provided user.
   * Increments the number of tries of that specific users.
   *
   * @param {string} userid
   * @param {string} code
   * @return {Promise<string>} the result of the operation as a string, based on the result of the call to one of the manager's options' methods.
   * @memberof VerificationManager
   */
  async verifyCode(userid: string, code: string): Promise<string> {
    let isVerified = false;

    let user: TUser = await this.storingSystem.read(userid);

    if (user) {
      user.nbVerifyCalled++;

      isVerified = user.status === UserStatus.pending && user.code === code.trim();
      if (isVerified) {
        user.status = UserStatus.active;
        user.activatedCode = user.code;
        user.activationTimestamp = Date.now();
        user.code = null;
      }

      await this.storingSystem.write(user);
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

/**
 * Emitted when a code is generated for a user.
 *
 * @event VerificationManager#codeCreate
 * @param {string} code
 * @example
 * manager.on(VerificationManagerEvents.codeCreate, (code) => {});
 */

/**
 * Emitted when a code is verified for a user.
 *
 * @event VerificationManager#codeVerify
 * @param {TUser} user
 * @param {Snowflake} userid
 * @param {string} code
 * @param {boolean} isVerified
 * @example
 * manager.on(VerificationManagerEvents.codeVerify, (user, userid, code, isVerified) => {});
 */

/**
 * Emitted when a user is created and stored.
 *
 * @event VerificationManager#userCreate
 * @param {TUser} user
 * @example
 * manager.on(VerificationManagerEvents.userCreate, (user) => {});
 */

/**
 * Emitted when a user is waiting for verification.
 * Firstly emitted once the code is generated and the user is created and stored.
 * Then emitted when the user tries to generate a new code while an existing one is pending.
 *
 * @event VerificationManager#userAwait
 * @param {TUser} user
 * @example
 * manager.on(VerificationManagerEvents.userAwait, (user) => {});
 */

/**
 * Emitted when a user is already verified.
 *
 * @event VerificationManager#userActive
 * @param {TUser} user
 * @example
 * manager.on(VerificationManagerEvents.userActive, (user) => {});
 */

import { Client, Intents, Snowflake, Constants } from 'discord.js';
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
			useInteraction: true,
			codeGenerationOptions: {
				length: 6,
			},
			maxNbCodeCalledBeforeResend: 3,
			pendingMessage: (user: TUser) =>
				`The verification code has just been sent.`,
			alreadyPendingMessage: (user: TUser) =>
				`You already have a verification code pending.`,
			alreadyActiveMessage: (user: TUser) =>
				'Your email has already been verified!',
			validCodeMessage: (user: TUser) =>
				`Hey, your code is valid! Welcome ${user.username}!`,
			invalidCodeMessage: (user: TUser, invalidCode: string) =>
				`Your code ${invalidCode} is invalid!`,
		}
	) {
		super();

		if (!client) throw 'Client is required';
		if (!storingSystem) throw 'StoringSystem is required';
		if (!senderAPI) throw 'SenderAPI is required';
		this.validateOptions(options);

		const intents = new Intents(client.options.intents);
		if (!intents.has(Intents.FLAGS.GUILDS)) {
			throw 'GUILDS intent is required to use this package!';
		}

		if (options.usePrivateMessages) {
			if (!intents.has(Intents.FLAGS.DIRECT_MESSAGES)) {
				throw 'DIRECT_MESSAGES intent is required to use this package!';
			}
			if (
				!this.client.options.partials.includes(Constants.PartialTypes.MESSAGE)
			) {
				throw 'MESSAGE partial is required to use this package with DM!';
			}
		} else if (
			!options.useInteraction &&
			!intents.has(Intents.FLAGS.GUILD_MESSAGES)
		) {
			throw 'GUILD_MESSAGES intent is required to use this package!';
		}

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

		if (!options.codeGenerationOptions) {
			options.codeGenerationOptions = { length: 6 };
		}
		if (!options.codeGenerationOptions.length) {
			options.codeGenerationOptions.length = 6;
		}
		if (!options.maxNbCodeCalledBeforeResend) {
			options.maxNbCodeCalledBeforeResend = 3;
		}
		if (!options.pendingMessage) {
			options.pendingMessage = (user: TUser) =>
				`The verification code has just been sent.`;
		}
		if (!options.alreadyPendingMessage) {
			options.alreadyPendingMessage = (user: TUser) =>
				`You already have a verification code pending.`;
		}
		if (!options.alreadyActiveMessage) {
			options.alreadyActiveMessage = (user: TUser) =>
				'Your email has already been verified!';
		}
		if (!options.validCodeMessage) {
			options.validCodeMessage = (user: TUser) =>
				`Hey, your code is valid! Welcome ${user.username}!`;
		}
		if (!options.invalidCodeMessage) {
			options.invalidCodeMessage = (user: TUser, invalidCode: string) =>
				`Your code ${invalidCode} is invalid!`;
		}
	}

	async sendCode(userid: Snowflake, data: any): Promise<string> {
		let user: TUser = await this.storingSystem.read(userid);
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
		} else if (user && user.status === UserStatus.pending) {
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
			this.emit(VerificationManagerEvents.userAwait, user);
			return this.options.alreadyActiveMessage(user);
		}
	}

	async verifyCode(userid: string, code: string): Promise<string> {
		let isVerified = false;

		let user: IUser = await this.storingSystem.read(userid);
		this.emit(VerificationManagerEvents.storingSystemCall);

		if (user) {
			user.nbVerifyCalled++;

			isVerified =
				user.status !== UserStatus.active && user.code === code.trim();
			if (isVerified) {
				user.status = UserStatus.active;
				user.activatedCode = user.code;
				user.code = null;
			}

			await this.storingSystem.write(user as TUser);
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
			? this.options.validCodeMessage(user as TUser)
			: this.options.invalidCodeMessage(user as TUser, code);
	}
}

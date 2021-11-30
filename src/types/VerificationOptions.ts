import { IUser } from '.';

export interface VerificationOptions<TUser extends IUser> {
	useInteraction: boolean;

	usePrivateMessages?: boolean;

	codeGenerationOptions: {
		charactersWhitelist?: string;
		length: number;
	};

	maxNbCodeCalledBeforeResend: number;

	pendingMessage: (user: TUser) => string;

	alreadyPendingMessage: (user: TUser) => string;

	alreadyActiveMessage: (user: TUser) => string;

	validCodeMessage: (user: TUser) => string;

	invalidCodeMessage: (user: TUser, invalidCode: string) => string;
}

import { MailDataRequired, MailService } from '@sendgrid/mail';

import { ISenderAPI, SenderAPIData } from '../types';

type SendGridOptions = {
	apiKey: string;
	mailData: MailDataRequired;
};

export class SendGridService implements ISenderAPI {
	private readonly options: SendGridOptions;
	private readonly mailService: MailService;

	constructor(options: SendGridOptions) {
		if (!options || !options.apiKey) {
			throw `Cannot instanciate a MailService.
			 That means you might have forgotten to add options including the apiKey.`;
		}

		this.options = options;
		this.mailService = new MailService();
		this.mailService.setApiKey(this.options.apiKey);
	}

	async send({ to, name, code }: SenderAPIData) {
		const message = {
			...this.options.mailData,
			to,
		} as MailDataRequired;

		if (this.options.mailData.templateId) {
			message.templateId = this.options.mailData.templateId;
			message.dynamicTemplateData = { code, name };
		}

		try {
			await this.mailService.send(message, false);
		} catch (error) {
			console.error(error);
		}
	}
}

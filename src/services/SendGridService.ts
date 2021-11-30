import { MailDataRequired, MailService } from '@sendgrid/mail';

import { ISenderAPI, ISenderAPIData } from '../types';

interface SendGridData extends ISenderAPIData {
	toEmail: string;
	username: string;
	code: string;
}

type SendGridOptions = {
	apiKey: string;
	mailData: MailDataRequired;
};

export class SendGridService implements ISenderAPI<SendGridData> {
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

	async send({ toEmail, username, code }: SendGridData) {
		const message = {
			...this.options.mailData,
			to: toEmail,
		} as MailDataRequired;

		if (this.options.mailData.templateId) {
			message.templateId = this.options.mailData.templateId;
			message.dynamicTemplateData = { code, name: username };
		}

		try {
			await this.mailService.send(message, false);
		} catch (error) {
			console.error(error);
		}
	}
}

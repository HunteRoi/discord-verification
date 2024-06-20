import { type MailDataRequired, MailService } from "@sendgrid/mail";

import type { ISenderAPI, SenderAPIData } from "../types/index.js";

export type SendGridMailData = MailDataRequired;
export interface SendGridOptions {
    /**
     * SendGrid API key.
     *
     * @type {string}
     */
    apiKey: string;

    /**
     * Mail data used by SendGrid for customization and stuff.
     * See @sendgrid/mail docs for more information.
     *
     * @type {SendGridMailData}
     */
    mailData: SendGridMailData;
}

/**
 * The SendGrid communication service. Used to send the code via email.
 *
 * @export
 * @class SendGridService
 * @implements {ISenderAPI}
 */
export class SendGridService implements ISenderAPI {
    readonly #options: SendGridOptions;
    readonly #mailService: MailService;

    /**
     * Creates an instance of SendGridService.
     * @param {SendGridOptions} options
     * @memberof SendGridService
     */
    constructor(options: SendGridOptions) {
        if (!options || !options.apiKey) {
            throw `Cannot instanciate a MailService.
			 That means you might have forgotten to add options including the apiKey.`;
        }

        this.#options = options;
        this.#mailService = new MailService();
        this.#mailService.setApiKey(this.#options.apiKey);
    }

    /**
     * @inherit
     * @param {SenderAPIData} { name, code, ...data } The required data to send information through SendGrid.
     * @memberof SendGridService
     */
    async send({ name, code, ...data }: SenderAPIData) {
        const message = {
            ...this.#options.mailData,
            ...data,
        } as SendGridMailData;

        if (this.#options.mailData.templateId) {
            message.templateId = this.#options.mailData.templateId;
            message.dynamicTemplateData = { code, name };
        }

        try {
            await this.#mailService.send(message, false);
        } catch (error) {
            console.error(error);
            throw error; // forces the VerificationManager flow to stop and return an error message.
        }
    }
}

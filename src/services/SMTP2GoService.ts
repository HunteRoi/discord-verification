import SMTP2GOApi from "smtp2go-nodejs";
import type { ISenderAPI, SenderAPIData } from "../types/index.js";

// exported from SMTP2Go-NodeJS because the typings are wrong
export type Address = {
    email: string;
    name?: string;
};

export type SMTP2GoMailData = {
    templateId: string;
    dynamicTemplateData?: Map<string, string>;
    to?: string | Address;
    from: string | Address;
    subject?: string;
};
export interface SMTP2GoOptions {
    /**
     * SMTP2Go API key.
     *
     * @type {string}
     */
    apiKey: string;

    /**
     * Mail data used by SMTP2Go for customization and stuff.
     *
     * @type {SMTP2GoMailData}
     */
    mailData: SMTP2GoMailData;
}

/**
 * The SMTP2Go communication service. Used to send the code via email.
 *
 * @export
 * @class SMTP2GoService
 * @implements {ISenderAPI}
 */
export class SMTP2GoService implements ISenderAPI {
    readonly #options: SMTP2GoOptions;

    /**
     * Creates an instance of SMTP2GoService.
     * @param {SMTP2GoOptions} options
     * @memberof SMTP2GoService
     */
    constructor(options: SMTP2GoOptions) {
        if (!options || !options.apiKey) {
            throw `Cannot instanciate SMTP2GoService. That means you might have forgotten to add options.`;
        }
        this.#options = options;
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
        } as SMTP2GoMailData;

        if (!message.to)
            throw new Error("The target email has not been found.");

        if (typeof message.to === "string") message.to = { email: message.to };
        if (typeof message.from === "string")
            message.from = { email: message.from };

        message.subject ??= "Code IODA";
        message.templateId ??= this.#options.mailData.templateId;
        message.dynamicTemplateData ??= new Map([
            ["code", code],
            ["name", name],
        ]);

        try {
            const api = SMTP2GOApi.default(this.#options.apiKey);
            const mailService = api
                .mail()
                .to(message.to)
                .from(message.from)
                .subject(message.subject)
                .template(message.templateId, message.dynamicTemplateData);
            const result = await api.client().consume(mailService);
            console.debug(result);
        } catch (error) {
            console.error(error);
            throw error; // forces the VerificationManager flow to stop and return an error message.
        }
    }
}

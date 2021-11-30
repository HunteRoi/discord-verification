const { Client, Intents, Constants } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const synchronizeSlashCommands = require('discord-sync-commands');
const { join } = require('path');

const {
	VerificationManager,
	VerificationManagerEvents,
	JSONDatabaseService,
	SendGridService,
} = require('../lib');

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGES,
	],
	partials: [Constants.PartialTypes.MESSAGE],
});
synchronizeSlashCommands(
	client,
	[
		new SlashCommandBuilder()
			.setName('code')
			.setDescription('Generates a code and then sends it to the given email')
			.addStringOption((option) =>
				option
					.setName('email')
					.setDescription('The email to which the code is sent')
					.setRequired(true)
			),
		new SlashCommandBuilder()
			.setName('verify')
			.setDescription(
				'Verifies the provided code and grants access to the rest of the server'
			)
			.addStringOption((option) =>
				option
					.setName('code')
					.setDescription('The code sent by email')
					.setRequired(true)
			),
	],
	{ guild: 'GUILD_ID' }
);

const db = new JSONDatabaseService(join(__dirname, 'db.json'));
db.init();

const sgMail = new SendGridService({
	apiKey: 'SENDGRID_API_KEY',
	mailData: {
		from: 'EMAIL',
		templateId: 'SENDGRID_TEMPLATE_ID',
	},
});

const manager = new VerificationManager(client, db, sgMail);

client.once('ready', () => {
	console.log('Connected!');
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isCommand()) {
		await interaction.deferReply({ ephemeral: true });

		let feedback = 'Unknown command!';
		switch (interaction.commandName) {
			case 'code':
				feedback = await manager.sendCode(
					interaction.user.id,
					interaction.options.getString('email', true) // !! PLEASE ADD CHECKS TO VALIDATE THE FIELD
				);
				break;

			case 'verify':
				feedback = await manager.verifyCode(
					interaction.user.id,
					interaction.options.getString('code', true)
				);
				break;

			// you can also add other commands such as one to change the data field for users who mistyped it in the first place
		}

		await interaction.editReply(feedback);
	}
});

manager.on(VerificationManagerEvents.codeCreate, (code) => {
	console.log('A code has just been created!', code);
});
manager.on(
	VerificationManagerEvents.codeVerify,
	(user, userid, code, isVerified) =>
		console.log(
			`A user (${userid}) has ${
				isVerified ? 'successfully verified' : 'unsuccessfully tried to verify'
			} the code ${code}.`
		)
);
manager.on(VerificationManagerEvents.userCreate, (user) =>
	console.log('A user has just been created!')
);
manager.on(VerificationManagerEvents.userAwait, (user) =>
	console.log('A user is waiting to verify their code!')
);
manager.on(VerificationManagerEvents.senderCall, () =>
	console.log('Sender API called!')
);
manager.on(VerificationManagerEvents.storingSystemCall, () =>
	console.log('Storing system called!')
);

client.login('TOKEN');

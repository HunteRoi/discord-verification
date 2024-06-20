import { join } from 'node:path';
import synchronizeSlashCommands from 'discord-sync-commands';
import { Client, IntentsBitField, SlashCommandBuilder } from 'discord.js';

import { VerificationManager, VerificationManagerEvents } from '../lib/index.js';
import { JSONDatabaseService } from '../lib/services/JSONDatabaseService.js';
import { SendGridService } from '../lib/services/SendGridService.js';

function anonymizeEmail(email: string) {
  return email.slice(0, 2) + '\\*'.repeat(email.slice(3, email.indexOf('@')).length) + email.slice(email.indexOf('@'));
}

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
  ]
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
  { guildId: 'GUILD_ID' }
);

const db = new JSONDatabaseService(join(import.meta.dirname, 'db.json'));
db.init();

const sgMail = new SendGridService({
  apiKey: 'SENDGRID_API_KEY',
  mailData: {
    from: 'EMAIL',
    templateId: 'SENDGRID_TEMPLATE_ID',
  },
});

const manager = new VerificationManager(client, db, sgMail,
  {
    codeGenerationOptions: {
      length: 6,
    },
    maxNbCodeCalledBeforeResend: 3,
    errorMessage: (user, error: Error) => `Could not send the code to ${anonymizeEmail(user.data.to)} because of the following error: ${error.message}!`,
    pendingMessage: (user) =>
      `The verification code has just been sent to ${anonymizeEmail(user.data.to)}.`,
    alreadyPendingMessage: (user) =>
      `You already have a verification code pending! It was sent to ${anonymizeEmail(user.data.to)}.`,
    alreadyActiveMessage: (user) =>
      "An account is already verified with this data!",
    validCodeMessage: (user, validCode) =>
      `Your code ${validCode} is valid! Welcome ${user?.username}!`,
    invalidCodeMessage: (user, invalidCode) =>
      `Your code ${invalidCode} is invalid!`,
  });

client.once('ready', () => {
  console.log('Connected!');
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await interaction.deferReply({ ephemeral: true });

    let feedback = 'Unknown command!';
    switch (interaction.commandName) {
      case 'code':
        feedback = await manager.sendCode(interaction.user.id, {
          to: interaction.options.getString('email', true) // !! PLEASE ADD CHECKS TO VALIDATE THE FIELD
        });
        break;

      case 'verify':
        feedback = await manager.verifyCode(interaction.user.id, interaction.options.getString('code', true));
        break;

      // you can also add other commands such as one to change the data field for users who mistyped it in the first place
    }

    await interaction.editReply(feedback);
  }
});

manager.on(VerificationManagerEvents.codeCreate, (code) => console.log('A code has just been created!', code));
manager.on(VerificationManagerEvents.codeVerify, (user, userid, code, isVerified) =>
  console.log(`The user ${user?.username} (${userid}) has ${isVerified ? 'successfully verified' : 'unsuccessfully tried to verify'} the code ${code}.`)
);
manager.on(VerificationManagerEvents.userCreate, (user) => console.log(`The user ${user?.username} has just been created!`));
manager.on(VerificationManagerEvents.userAwait, (user) => console.log(`The user ${user?.username} is waiting to verify their code!`));
manager.on(VerificationManagerEvents.userActive, (user) => console.log(`The user ${user?.username} is already active!`));
manager.on(VerificationManagerEvents.error, (user, error) => console.error('An error occured', user, error));

client.login('TOKEN');

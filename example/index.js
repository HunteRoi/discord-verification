const { Client, IntentsBitField, Partials, SlashCommandBuilder } = require('discord.js');
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
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.GuildMessages,
  ],
  partials: [Partials.Message],
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

const manager = new VerificationManager(client, db, sgMail,
  {
    pendingMessage: (user) =>
      `The verification code has just been sent to ${user.data}.`,
    alreadyPendingMessage: (user) =>
      `You already have a verification code pending! It was sent to ${user.data}.`,
    alreadyActiveMessage: (user) =>
      `An account is already verified with this data!`,
    validCodeMessage: (user, validCode) =>
      `Your code ${validCode} is valid! Welcome ${user.username}!`,
    invalidCodeMessage: (user, invalidCode) =>
      `Your code ${invalidCode} is invalid!`,
  });

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
      `The user ${user?.username} (${userid}) has ${
        isVerified ? 'successfully verified' : 'unsuccessfully tried to verify'
      } the code ${code}.`
    )
);
manager.on(VerificationManagerEvents.userCreate, (user) =>
  console.log(`The user ${user?.username} has just been created!`)
);
manager.on(VerificationManagerEvents.userAwait, (user) =>
  console.log(`The user ${user?.username} is waiting to verify their code!`)
);
manager.on(VerificationManagerEvents.userActive, (user) =>
  console.log(`The user ${user?.username} is already active!`)
);
manager.on(VerificationManagerEvents.senderCall, () =>
  console.log('Sender API called!')
);
manager.on(VerificationManagerEvents.storingSystemCall, () =>
  console.log('Storing system called!')
);

client.login('TOKEN');

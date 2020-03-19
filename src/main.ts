import { App } from '@slack/bolt';

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

app.event('app_home_opened', async ({ event }) => {
  console.log('app_home_opened', event);
});
app.event('channel_archive', async ({ event }) => {
  console.log('channel_archive', event);
});
app.event('channel_created', async ({ event }) => {
  console.log('channel_created', event);
});
app.event('channel_deleted', async ({ event }) => {
  console.log('channel_deleted', event);
});
app.event('channel_left', async ({ event }) => {
  console.log('channel_left', event);
});
app.event('channel_rename', async ({ event }) => {
  console.log('channel_rename', event);
});
app.event('channel_shared', async ({ event }) => {
  console.log('channel_shared', event);
});
app.event('channel_unarchive', async ({ event }) => {
  console.log('channel_unarchive', event);
});
app.event('channel_unshared', async ({ event }) => {
  console.log('channel_unshared', event);
});
app.event('message.channels', async ({ event }) => {
  console.log('message.channels', event);
});

(async (): Promise<void> => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();

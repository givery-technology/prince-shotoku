import { App } from '@slack/bolt';
import { AppHomeOpened } from './interface';
import { stripMargin } from '../helpers/string.helper';
import { Config } from '../interfaces';

export const app_home_opened = (app: App, config: Config): AppHomeOpened =>
  async ({ event, context }): Promise<void> => {
    console.log('app_home_opened', event);
    await app.client.views.publish({
      token: context.botToken,
      user_id: event.user,
      view: {
        type: 'home',
        title: {
          type: 'plain_text',
          text: '聖徳太子',
        },
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: stripMargin`聖徳太子は全ての公開チャンネルの内容を聞き入れるボットです。
          |聞いた内容は <#${config.owner_channel_id}> にまとまってます。 (*ミュート推奨*)
          |`,
          },
        }],
      },
    });
  };

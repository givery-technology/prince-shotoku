export const channel_msg = {
  archived: (channelId: string) => `<#${channelId}> が閉じられたようですね`,
  unarchived: (channelId: string) => `<#${channelId}> が再開したようですね`,
  created: (channelId: string) => `<#${channelId}> が新しくできたようですね`,
  deleted: 'どこかでチャンネルが削除されたようですね',
  renamed: (channelName: string) => `どこかで名前が *${channelName}* に変更されたようですね`,
  shared: (channelId: string) => `<#${channelId}> がどこかのチームと共有されたようですね`,
  unshared: (channelId: string) => `<#${channelId}> が他チームとの共有を止めたようですね`,
};

export const error_msg = { };

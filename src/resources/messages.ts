export const channel_msg = {
  archived: (channelId: string): string => `<#${channelId}> が閉じられたようですね`,
  unarchived: (channelId: string) : string=> `<#${channelId}> が再開したようですね`,
  created: (channelId: string): string => `<#${channelId}> が新しくできたようですね`,
  deleted: 'どこかでチャンネルが削除されたようですね',
  renamed: (channelName: string): string => `どこかで名前が *${channelName}* に変更されたようですね`,
  shared: (channelId: string): string => `<#${channelId}> がどこかのチームと共有されたようですね`,
  unshared: (channelId: string): string => `<#${channelId}> が他チームとの共有を止めたようですね`,
};

export const error_msg = { };

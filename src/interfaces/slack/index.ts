export interface Profile {
  real_name: string;
  display_name: string;
  avatar_hash: string;
  image_24: string;
  image_32: string;
  image_48: string;
  image_72: string;
  image_192: string;
  image_512: string;
  image_1024?: string;
}

export interface User {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  profile?: Profile;
  is_admin: boolean;
  is_owner: boolean;
  is_bot: boolean;
  is_app_user: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  name_normalized: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_archived: boolean;
  is_shared: boolean;
  is_member: boolean;
  is_private: boolean;
  is_mpim: boolean;
}

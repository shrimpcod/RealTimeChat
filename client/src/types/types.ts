export interface UserType {
    id: string;
    username: string;
    email?: string;
    avatar_url?: string | null;
    is_online?: boolean;
    last_seen?: string | null;
}

export interface MessageType {
    id: number | string;
    chat_id: string;
    sender_id: string;
    content_type: string;
    text_content?: string | null;
    file_url?: string | null;
    is_edited?: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface LastMessageType {
    id: number | string;
    text_content?: string | null;
    sender_id?: string | null;
    created_at: string;
    content_type: string;
}

export interface ChatType {
    id: string;
    name: string;
    type: 'private' | 'group';
    created_by_user_id?: string | null;
    created_at: string;
    updated_at: string;
    participants: UserType[];
    last_message: LastMessageType | null;
    unreadCount: number;
    last_read_at?: string | null;
    //chat_avatar_url?: string | null; Надо подумать над этим, чтоб для групповых чатов была картинка какая то
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Array<{msg: string, path?: string, value?: any, [key: string]: any}>
}

export interface AuthApiResponse{
    token: string;
    user: UserType;
}

export interface ChangePasswordType{
    oldPassword: string;
    newPassword: string;
}

export interface UserStatusPayload {
    userId: string;
    is_online: boolean;
    last_seen: string;
}


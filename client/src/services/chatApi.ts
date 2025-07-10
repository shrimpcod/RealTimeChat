import {request} from "./api";
import type {ChatType, MessageType} from "../types/types";

interface MessageResponse {
    messages: MessageType[];
    firstUnreadId: string | number | null;
}

export const chatApiService = {
    getChats: (): Promise<ChatType[]> => request<ChatType[]>('/chats/', 'GET'),
    createChat: (receiverId: string): Promise<ChatType> => request<ChatType>('/chats/', 'POST', {receiverId}),
    deleteChat: (chatId: string): Promise<{msg: string}> => request<{msg: string}>(`/chats/${chatId}`, 'DELETE'),

    getChatMessages: (chatId: string): Promise<MessageResponse> => request<MessageResponse>(`/chats/${chatId}/messages`, 'GET'),
    markChatAsRead: (chatId: string): Promise<{chatId: string; last_read_at: string}> =>
        request<{ chatId: string; last_read_at: string }>(`/chats/${chatId}/mark-as-read`, 'POST'),
    editMessage: (chatId: string, messageId: number | string, newText: string): Promise<MessageType> =>
        request<MessageType>(`/chats/${chatId}/messages/${messageId}`, 'PUT', {text: newText}),
    deleteMessage: (chatId: string, messageId: number | string): Promise<{msg: string}> =>
        request<{msg: string}>(`/chats/${chatId}/messages/${messageId}`, 'DELETE'),

}
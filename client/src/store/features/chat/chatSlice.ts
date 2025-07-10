import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {AppDispatch, RootState} from "../../store";
import { chatApiService } from "../../../services/chatApi";
import {ChatType, ApiError, MessageType, UserStatusPayload} from "../../../types/types";
import {logout as authLogoutAction} from '../auth/authSlice'

interface ChatState {
    chats: ChatType[];
    activeChatId: string | null;
    messages: MessageType[];
    messagesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    messagesError: string | null;
    firstUnreadMessageId: string | number | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: ChatState = {
    chats: [],
    activeChatId: null,
    status: 'idle',
    error: null,
    messages: [],
    messagesStatus: 'idle',
    messagesError: null,
    firstUnreadMessageId: null,
}

export const fetchChats = createAsyncThunk<
    ChatType[],
    void,
    {rejectValue: ApiError}
>(
    'chat/fetchChats',
    async (_, {rejectWithValue}) => {
        try {
            const chats = await chatApiService.getChats()
            return chats
        } catch (err) {
            return rejectWithValue(err as ApiError)
        }
    }
)

export const createNewChat = createAsyncThunk<
    ChatType,
    string,
    {rejectValue: ApiError}
>(
    'chat/createNewChat',
    async (receiverId, {rejectWithValue}) => {
        try {
            const newChat = await chatApiService.createChat(receiverId);
            return newChat
        } catch (err) {
            return rejectWithValue(err as ApiError)
        }
    }
)

export const fetchMessages = createAsyncThunk<
    { messages: MessageType[]; firstUnreadId: MessageType['id'] | null; chatId: string },
    string,
    {rejectValue: ApiError, state: RootState}
>(
    'chat/fetchMessages',
    async (chatId, {rejectWithValue}) => {
        try{
            const response = await chatApiService.getChatMessages(chatId);
            console.log(response.firstUnreadId)
            return {chatId, messages: response.messages, firstUnreadId: response.firstUnreadId}
        } catch (err) {
            return rejectWithValue(err as ApiError)
        }
    }
)

export const processNewMessage = createAsyncThunk<
    MessageType,
    MessageType,
    {state: RootState, dispatch: AppDispatch}
>(
    'chat/processNewMessage',
    async(newMessage, {getState, dispatch}) => {
        const state = getState();
        const currentUserId = state.auth.user?.id;
        const activeChatId = state.chat.activeChatId

        let unreadIncrement = 0;
        if(newMessage.sender_id !== currentUserId && newMessage.chat_id !== activeChatId){
            unreadIncrement = 1;
        }

        dispatch(addNewMessageAndUpdateChatList({
            message: newMessage,
            unreadIncrement,
            isActiveChat: newMessage.chat_id === activeChatId,
            currentUserId: currentUserId,
        }))
        return newMessage;
    }
)

export const processChatUpdate = createAsyncThunk<
    void,
    ChatType,
    {state: RootState; dispatch: AppDispatch}
>(
    'chat/processChatUpdate',
    async(updatedChat, {getState, dispatch}) => {
        const state = getState();
        const currentUserId = state.auth.user?.id;

        let unreadIncrement = 0;
        if (updatedChat.last_message && updatedChat.last_message.sender_id !== currentUserId) {
            unreadIncrement = 1;
        }
        dispatch(updateChatInList({
            updatedChat,
            unreadIncrement
        }))
    }
)


export const markChatRead = createAsyncThunk<
    {chatId: string; last_read_at: string},
    string,
    {rejectValue: ApiError}
>(
    'chat/markChatRead',
    async (chatId, {rejectWithValue}) => {
        console.log(`markChatRead thunk: ЗАПУЩЕН для chatId: ${chatId}`);
        try{
            const response = await chatApiService.markChatAsRead(chatId)
            console.log(`markChatRead thunk: УСПЕШНЫЙ ответ от API:`, response);
            return response
        } catch (err) {
            console.error(`markChatRead thunk: ОШИБКА API запроса:`, err);
            return rejectWithValue(err as ApiError)
        }
    })

export const deleteChat = createAsyncThunk<
    string,
    string,
    {rejectValue: ApiError}
>(
    'chat/deleteChat',
    async (chatId, {rejectWithValue}) => {
        try{
            await chatApiService.deleteChat(chatId);
            return chatId
        } catch (err) {
            return rejectWithValue(err as ApiError)
        }
    }
)

export const deleteMessage = createAsyncThunk<
    {chatId: string; messageId: number | string; msg: string},
    {chatId: string; messageId: number | string},
    {rejectValue: ApiError}
>(
    'chat/deleteMessage',
    async ({chatId, messageId}, {dispatch, rejectWithValue}) => {
        dispatch(removeMessageFromList({chatId, messageId}))
        try{
            const data = await chatApiService.deleteMessage(chatId, messageId)
            return {chatId, messageId, msg: data.msg}
        } catch (err) {
            console.error("Ошибка удаления сообщения на сервере:", err);
            return rejectWithValue(err as ApiError);
        }
    }
)

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveChatId: (state, action: PayloadAction<string | null>) => {
            if(state.activeChatId !== action.payload) {
                state.activeChatId = action.payload
                state.messages = [];
                state.messagesStatus = 'idle';
                state.messagesError = null;
                state.firstUnreadMessageId = null;
            } else if (action.payload && state.messagesStatus !== 'succeeded' && state.messagesStatus !== 'loading') {
                state.messagesStatus = 'idle';
            }
        },
        addNewMessageAndUpdateChatList: (
            state,
            action: PayloadAction<{
                message: MessageType,
                unreadIncrement: number,
                isActiveChat: boolean,
                currentUserId?: string | null,
        }>
        ) => {
            const {message, unreadIncrement, isActiveChat} = action.payload;
            if (isActiveChat){
                if(!state.messages.find(msg => msg.id === message.id)) {
                    state.messages.push(message)
                    console.log('chatSlice: Сообщение добавлено в messages активного чата.');
                }
            }

            const chatIndex = state.chats.findIndex(chat => chat.id === message.chat_id)
            if (chatIndex !== -1){
                const targetChat = state.chats[chatIndex]
                targetChat.last_message = {
                    id: message.id,
                    text_content: message.text_content,
                    sender_id: message.sender_id,
                    created_at: message.created_at,
                    content_type: message.content_type,
                }
                targetChat.updated_at = message.created_at

                if(unreadIncrement > 0){
                    targetChat.unreadCount = (targetChat.unreadCount || 0) + unreadIncrement
                    console.log(`chatSlice: Увеличен unreadCount для чата ${message.chat_id} до ${targetChat.unreadCount}`);
                }

                const updatedChat = state.chats.splice(chatIndex, 1)[0]
                updatedChat.last_message = targetChat.last_message
                updatedChat.unreadCount = targetChat.unreadCount
                updatedChat.updated_at = targetChat.updated_at
                state.chats.unshift(updatedChat)
                console.log(`chatSlice: Чат ${message.chat_id} перемещен наверх списка.`);
            } else {
                console.warn(`chatSlice: addNewMessageAndUpdateChatList, чат ${message.chat_id} не найден в state.chats. Возможно, нужно загрузить чаты.`);
            }
        },
        updateChatInList: (state, action: PayloadAction<{
            updatedChat: ChatType,
            unreadIncrement: number,
        }>) => {
            const { updatedChat, unreadIncrement } = action.payload;
            console.log('chatSlice (updateChatInList): Попытка обновить чат в списке. ID:', updatedChat.id);
            const chatIndex = state.chats.findIndex(chat => chat.id === updatedChat.id)

            if(chatIndex !== -1){
                console.log(`chatSlice (updateChatInList): Найден существующий чат на позиции ${chatIndex}.`);
                const existingChat = state.chats[chatIndex]

                const newChatData = {
                    ...existingChat,
                    ...updatedChat,
                    unreadCount: (existingChat.unreadCount || 0) + unreadIncrement,
                };

                state.chats.splice(chatIndex, 1)
                state.chats.unshift(newChatData)
                console.log(`chatSlice (updateChatInList): Чат ${updatedChat.id} обновлен и перемещен. Новый unreadCount: ${newChatData.unreadCount}`);
            } else {
                console.log(`chatSlice (updateChatInList): Чат ${updatedChat.id} не найден. Добавляем как новый.`);
                state.chats.unshift({
                    ...updatedChat,
                    unreadCount: unreadIncrement,
                });
            }
        },
        resetUnreadCountForChat: (state, action: PayloadAction<string>) => {
            const chatIndex = state.chats.findIndex(chat => chat.id === action.payload);
            if (chatIndex !== -1) {
                state.chats[chatIndex].unreadCount = 0;
                state.chats[chatIndex].last_read_at = new Date().toISOString();
            }
        },
        addChatToList: (state, action: PayloadAction<ChatType>) => {
            const newChat = action.payload;
            const existingChatIndex = state.chats.findIndex(chat => chat.id === newChat.id);
            if (existingChatIndex === -1) {
                state.chats.unshift(newChat);
            }
        },
        removeChatFromList: (state, action: PayloadAction<{chatId: string}>) => {
            const {chatId} = action.payload;
            state.chats = state.chats.filter(chat => chat.id !== chatId);
            if(state.activeChatId === chatId){
                state.activeChatId = null;
                state.messages = []
                state.messagesStatus = 'idle'
            }
        },
        updateMessageInList: (state, action: PayloadAction<MessageType>) => {
            const updatedMessage = action.payload;

            if (state.activeChatId === updatedMessage.chat_id) {
                const msgIndex = state.messages.findIndex(m => m.id === updatedMessage.id);
                if (msgIndex !== -1) {
                    state.messages[msgIndex] = updatedMessage;
                    console.log(`chatSlice: Сообщение ${updatedMessage.id} обновлено в списке.`);
                }
            }
        },
        removeMessageFromList: (state, action: PayloadAction<{chatId: string; messageId: number | string}>) => {
            const {chatId, messageId} = action.payload;
            if(state.activeChatId === chatId){
                state.messages = state.messages.filter(m => m.id !== messageId);
            }

        },

        updateUserStatusInChats: (state, action: PayloadAction<UserStatusPayload>) => {
            const {userId, is_online, last_seen} = action.payload;

            state.chats.forEach(chat => {
                const participant = chat.participants.find(p => p.id === userId);
                if (participant){
                    participant.is_online = is_online;
                    participant.last_seen = last_seen;
                    console.log(`chatSlice: Статус пользователя ${userId} в чате ${chat.id} обновлен на is_online=${is_online}`);
                }
            })
        }
    },
    extraReducers: (builder)=> {
        builder
            .addCase(fetchChats.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchChats.fulfilled, (state, action: PayloadAction<ChatType[]>) => {
                state.status = 'succeeded'
                state.chats = action.payload
            })
            .addCase(fetchChats.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.payload?.message || 'Не удалось загрузить чаты'
            })
            .addCase(createNewChat.pending, (state) => {
                state.error = null
            })
            .addCase(createNewChat.fulfilled, (state, action: PayloadAction<ChatType>) => {
                const existingChatIndex = state.chats.findIndex(chat => chat.id === action.payload.id)
                if (existingChatIndex !== -1) {
                    state.chats[existingChatIndex] = action.payload
                } else {
                    state.chats.unshift(action.payload)
                }
                state.activeChatId = action.payload.id
            })
            .addCase(createNewChat.rejected, (state, action) => {
                state.error = action.payload?.message || 'Не удалось создать чат'
            })

            .addCase(fetchMessages.pending, (state, action) => {
                if (state.activeChatId === action.meta.arg) {
                    state.messagesStatus = 'loading';
                    state.messagesError = null;
                    state.firstUnreadMessageId = null;
                }
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                if (state.activeChatId === action.payload.chatId) {
                    state.messagesStatus = 'succeeded';
                    state.messages = action.payload.messages;
                    state.firstUnreadMessageId = action.payload.firstUnreadId;
                }
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                if (state.activeChatId === action.meta.arg) {
                    state.messagesStatus = 'failed';
                    state.messagesError = action.payload?.message || 'Не удалось загрузить сообщения';
                    state.firstUnreadMessageId = null;
                }
            })

            .addCase(markChatRead.fulfilled, (state, action) => {
                const { chatId, last_read_at } = action.payload;
                const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].unreadCount = 0;
                    state.chats[chatIndex].last_read_at = last_read_at;
                    console.log(`chatSlice: unreadCount для чата ${chatId} сброшен в 0.`);
                }
                if (state.activeChatId === chatId) {
                    state.firstUnreadMessageId = null;
                }
            })
            .addCase(markChatRead.rejected, (state, action) => {
                console.error("Ошибка пометки чата как прочитанного:", action.payload?.message);
            })

            .addCase(processNewMessage.rejected, (state, action) => {
                console.error("Ошибка обработки нового сообщения (processNewMessage):", action.error.message);
            })

            .addCase(authLogoutAction, (state) => {
                state.chats = initialState.chats;
                state.activeChatId = initialState.activeChatId;
                state.status = 'idle';
                state.error = null
            })

            .addCase(deleteChat.fulfilled, (state, action: PayloadAction<string>) => {
                const chatId = action.payload
                state.chats = state.chats.filter(chat => chat.id !== chatId)
                if (state.activeChatId === chatId) {
                    state.activeChatId = null;
                    state.messages = [];
                    state.messagesStatus = 'idle';
                }
            })
            .addCase(deleteChat.rejected, (state, action) => {
                console.error("Ошибка удаления чата:", action.payload?.message);
                state.error = action.payload?.message || "Не удалось удалить чат";
            })
            .addCase(deleteMessage.rejected, (state, action) => {
                state.error = action.payload?.message || "Не удалось удалить сообщение";
            });
    }
});

export const {
    setActiveChatId,
    addNewMessageAndUpdateChatList,
    resetUnreadCountForChat,
    updateChatInList,
    removeChatFromList,
    addChatToList,
    updateMessageInList,
    removeMessageFromList,
    updateUserStatusInChats
} = chatSlice.actions;

export const selectAllChats = (state: RootState) => state.chat.chats;
export const selectActiveChatId = (state: RootState) => state.chat.activeChatId;
export const selectChatById = (chatId?: string | null) => (state: RootState) => // chatId теперь опциональный
    chatId ? state.chat.chats.find(chat => chat.id === chatId) : null;
export const selectChatsStatus = (state: RootState) => state.chat.status;
export const selectChatsError = (state: RootState) => state.chat.error;

export const selectChatMessages = (state: RootState) => state.chat.messages;
export const selectMessagesStatus = (state: RootState) => state.chat.messagesStatus;
export const selectMessagesError = (state: RootState) => state.chat.messagesError;
export const selectFirstUnreadMessageId = (state: RootState) => state.chat.firstUnreadMessageId;

export default chatSlice.reducer;




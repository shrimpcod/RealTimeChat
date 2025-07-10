import {io, Socket} from 'socket.io-client'
import type {ChatType, MessageType} from '../types/types'
import {store} from '../store/store'
import {
    processNewMessage,
    processChatUpdate,
    removeChatFromList,
    addChatToList,
    removeMessageFromList,
    updateMessageInList,
    updateUserStatusInChats
} from "../store/features/chat/chatSlice";
import {logout, selectAuthToken} from "../store/features/auth/authSlice";

let socket: Socket | null = null;
const SOCKET_URL = 'http://localhost:3001';

const setupSocketListeners = () => {
    if (!socket) return
    socket.offAny()

    socket.on("connect", () => console.log("SocketService: Подключен, ID:", socket?.id))
    socket.on("disconnect", (reason: Socket.DisconnectReason) => console.log("SocketService: Отключен:", reason))
    socket.on("connect_error", (err: any) => {
        console.error("SocketService: Ошибка подключения:", err.message);
        if (err.message.toLowerCase().includes("auth")){
            console.warn("SocketService: Ошибка аутентификации WebSocket. Выход...");
            store.dispatch(logout());
        }
    })
    socket.on("newMessage", (newMessage: MessageType) => {
        console.log('SocketService: Получено новое сообщение:', newMessage);
        store.dispatch(processNewMessage(newMessage));
    })
    socket.on("chatUpdate", (updatedChat: ChatType) => {
        console.log('SocketService: ПОЛУЧЕНО ОБНОВЛЕНИЕ ЧАТА (chatUpdate):', updatedChat);
        store.dispatch(processChatUpdate(updatedChat))
    })
    socket.on("createChat", (newChat: ChatType) => {
        console.log(`SocketService: Получено событие createChat для чата ${newChat.id}`);
        store.dispatch(addChatToList(newChat));
    })
    socket.on("deleteChat", (data: {chatId: string}) => {
        console.log(`SocketService: Получено событие chatDeleted для чата ${data.chatId}`);
        store.dispatch(removeChatFromList(data));
    })
    socket.on("deleteMessage", ({messageId, chatId}) => {
        console.log(`SocketService: Получено событие chatDeleted для чата ${chatId}${messageId}`);
        store.dispatch(removeMessageFromList({chatId: chatId, messageId: messageId}));
    })
    socket.on("messageEdited", (updatedMessage: MessageType) => {
        console.log('SocketService: Получено обновление сообщения (messageEdited):', updatedMessage);
        store.dispatch(updateMessageInList(updatedMessage));
    });
    socket.on('userStatusChanged', (statusPayload: { userId: string, is_online: boolean, last_seen: string }) => {
        console.log('SocketService: Получено обновление статуса пользователя:', statusPayload);
        store.dispatch(updateUserStatusInChats(statusPayload));
    });
}
export const socketService = {
    connect: (): Socket | null => {
        const token = selectAuthToken(store.getState())
        if(!token){
            console.warn("SocketService: Нет токена, подключение отменено.")
            socketService.disconnect();
            return null;
        }

        if (socket && socket.connected){
            if(socket.auth && (socket.auth as any).token !== token){
                console.log("SocketService: Токен изменился, переподключаемся...");
                socketService.disconnect();
            } else {
                console.log('SocketService: Уже подключен с актуальным токеном.');
                return socket;
            }
        }

        if(!socket){
            console.log(`SocketService: Создание нового подключения к ${SOCKET_URL}`);
            socket = io(SOCKET_URL, {
                auth: { token },
                autoConnect: false
            });
            setupSocketListeners();
        }

        if (!socket.connected) {
            socket.connect();
        }

        return socket;
    },
    disconnect: () => {
        if(socket){
            console.log("SocketService: Отключение...")
            socket.disconnect();
            socket = null;
        }
    },
    emit: (eventName: string, data?: any, ack?: (...args: any[]) => void)=> {
        if (socket && socket.connected) {
            console.log(`SocketService: Отправка события '${eventName}' с данными:`, data);
            socket.emit(eventName, data, ack)
        } else {
            console.warn(`SocketService: Socket не подключен. Не удалось отправить событие: ${eventName}`, data);
            const token = selectAuthToken(store.getState());
            if (token && (!socket || !socket.connected)) {
                console.log("SocketService: Попытка переподключения перед отправкой события...");
                socketService.connect()?.emit(eventName, data, ack);
            } else if (!token) {
                console.error("SocketService: Нет токена для переподключения.");
            }
        }
    },
    joinChatRoom: (chatId: string, callback?: (response: {status?: string, error?: string, message?: string}) => void) => {
        console.log(`SocketService: Попытка присоединиться к комнате ${chatId}`);
        socketService.emit('joinChatRoom', chatId, (response) => {
            console.log(`SocketService: Ответ от сервера на joinChatRoom ${chatId}:`, response); // <--- ЛОГ
            if (callback) callback(response);
        });
    },
    leaveChatRoom: (chatId: string, callback?: (response: { status?: string, error?: string, message?: string }) => void) => {
        socketService.emit('leaveChatRoom', chatId, callback);
    },
    getSocketInstance: (): Socket | null => socket,
}
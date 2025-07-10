require('dotenv').config()
const express = require('express')
const http = require('http')
const {Server} = require('socket.io')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const db = require('./db/knex');

const JWT_SECRET = process.env.JWT_SECRET

if(!JWT_SECRET){
    console.error("FATAL ERROR: JWT_SECRET is not defined in server.js for Socket.IO. Ensure it's loaded from .env")
    process.exit(1)
}

const app = express()
app.use(cors({
    origin: '*',
}))
app.use(express.json())
app.use(express.static('public'))

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"],
    }
})

const PORT = process.env.PORT || 3001

const attachIoToReq = ( req, res, next) => {
    req.io = io
    next()
}

const authRoutes = require('./routes/auth.routes')
const chatRoutes = require('./routes/chat.routes')
const userRoutes = require('./routes/user.routes.js');
const {callback} = require("pg/lib/native/query");

app.use('/api/auth', authRoutes)
app.use('/api/chats', attachIoToReq, chatRoutes);
app.use('/api/users', userRoutes);

io.use(async (socket, next) => {
    const token = socket.handshake.query.token || socket.handshake.auth.token;
    if(!token){
        console.log('Socket.IO Auth: No token provided')
        return next(new Error('Authentication error: No token provided'))
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded.user;
        if(socket.user && socket.user.id){
            await db('users').where({id: socket.user.id}).update({is_online: true, last_seen: new Date()});
            console.log(`Socket.IO Auth: User ${socket.user.username} (ID: ${socket.user.id}) connected and set to online.`);
        }
        next()
    } catch (err){
        console.error('Socket.IO Auth Error: ', err.message);
        let authError = new Error('Authentication error: Invalid token');
        if(err.name === 'TokenExpiredError'){
            authError = new Error('Authentication error: Token expired');
        }
        next(authError);
    }
})


io.on("connection", (async (socket) => {
    if (!socket.user){
        console.warn(`Socket ${socket.id} подключился, но не аутентифицирован. Этого не должно происходить.`);
        socket.disconnect(true);
        return;
    }

    const currentUserId = socket.user.id;

    console.log(`Пользователь ${socket.user.username} (Socket ID: ${socket.id}) успешно подключился и аутентифицирован.`)
    socket.join(socket.user.id.toString())
    console.log(`Пользователь ${socket.user.username} подключился к комнате: ${socket.user.id.toString()}`);

    try {
        const userChats = await db('chat_participants')
            .where({user_id: currentUserId})
            .select('chat_id')

        const chatIds = userChats.map(chat => chat.chat_id)
        if (chatIds.length > 0){
            const otherParticipants = await db('chat_participants')
                .whereIn('chat_id', chatIds)
                .whereNot('user_id', currentUserId)
                .distinct('user_id')

            const statusPayload = {
                userId: currentUserId,
                is_online: true,
                last_seen: new Date(),
            }

            otherParticipants.forEach(p => {
                io.to(p.user_id.toString()).emit('userStatusChanged', statusPayload)
                console.log(`Отправлено userStatusChanged (online) пользователю ${p.user_id} о пользователе ${currentUserId}`);
            })
        }
    } catch (error) {
        console.error("Ошибка при оповещении о статусе 'online':", error);
    }

    socket.on('disconnect', async (reason) => {
        if(!socket.user || !socket.user.id) return; // Упрощаем проверку

        const disconnectedUserId = socket.user.id;

        try {
            const lastSeenTime = new Date();
            await db('users').where({ id: disconnectedUserId }).update({ is_online: false, last_seen: lastSeenTime });
            console.log(`Пользователь ${socket.user.username} отключился. Status set to offline.`);

            const userChats = await db('chat_participants').where({ user_id: disconnectedUserId }).select('chat_id');
            const chatIds = userChats.map(c => c.chat_id);

            if (chatIds.length > 0) {
                const otherParticipants = await db('chat_participants')
                    .whereIn('chat_id', chatIds)
                    .whereNot('user_id', disconnectedUserId)
                    .distinct('user_id');

                const statusPayload = {
                    userId: disconnectedUserId,
                    is_online: false,
                    last_seen: lastSeenTime,
                };

                otherParticipants.forEach(p => {
                    io.to(p.user_id.toString()).emit('userStatusChanged', statusPayload);
                    console.log(`Отправлено userStatusChanged (offline) пользователю ${p.user_id} о пользователе ${disconnectedUserId}`);
                });
            }
        } catch(dbError) {
            console.error(`Ошибка при обработке отключения для ${disconnectedUserId}:`, dbError);
        }
    })

    socket.on('sendMessage', async (messageData, callback) => {
        console.log(`Сервер: Получено событие 'sendMessage' от ${socket.user?.username} (Socket ID: ${socket.id})`);
        console.log("Сервер: Данные сообщения:", messageData);

        if (!socket.user || !socket.user.id) {
            console.error("Попытка отправки сообщения от неаутентифицированного сокета.");
            if (typeof callback === 'function') callback({ error: 'Invalid message data' })
            return;
        }

        const { chatId, text } = messageData;

        if (!chatId || !text || text.trim() === "") {
            console.error("Некорректные данные сообщения:", messageData);
            if (typeof callback === 'function') callback({ error: "Invalid message data" });
            return;
        }

        try {
            const senderId = socket.user.id; // Определяем ID отправителя сразу для ясности

            const participant = await db('chat_participants')
                .where({ chat_id: chatId, user_id: senderId })
                .first();

            if (!participant) {
                console.error(`Пользователь ${senderId} не является участником чата ${chatId}. Отправка сообщения отклонена.`);
                if (typeof callback === 'function') callback({ error: "Not a member of this chat" });
                return;
            }

            const [newMessage] = await db('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    text_content: text,
                })
                .returning('*');

            if (!newMessage) {
                console.error("Сервер: Сообщение не было создано в БД.")
                if (typeof callback === 'function') callback({ error: "Failed to save message to database" });
                return;
            }

            console.log("Сервер: Сообщение успешно сохранено в БД:", newMessage);

            const roomName = chatId.toString();
            console.log(`Сервер: Отправка 'newMessage' в комнату ${roomName} сообщение:`, newMessage);
            io.to(roomName).emit("newMessage", newMessage);

            const receivers = await db('chat_participants')
                .where({ chat_id: chatId })
                .andWhereNot('user_id', senderId)
                .select('user_id');

            if (receivers.length > 0) {
                const chatDetails = await db('chats').where({ id: chatId }).first();
                if (chatDetails) {
                    const baseChatUpdatePayload = {
                        ...chatDetails,
                        last_message: newMessage,
                        participants: await db('chat_participants')
                            .join('users', 'users.id', 'chat_participants.user_id')
                            .where('chat_id', chatId)
                            .select('users.id', 'users.username', 'users.avatar_url', 'users.is_online', 'users.last_seen')
                    };

                    console.log(`Сервер: Подготовка 'chatUpdate' для ${receivers.length} получателей чата ${chatId}`);

                    receivers.forEach((receiver) => {
                        const userSpecificPayload = { ...baseChatUpdatePayload };

                        if (userSpecificPayload.type === 'private') {
                            const senderUser = userSpecificPayload.participants.find(p => p.id === senderId);
                            if (senderUser) {
                                userSpecificPayload.name = senderUser.username;
                            }
                        }
                        const userRoomName = receiver.user_id.toString();
                        io.to(userRoomName).emit('chatUpdate', userSpecificPayload);
                    });
                }
            }

            if (typeof callback === 'function') {
                console.log("Сервер: Отправка подтверждения (ack) клиенту.");
                callback({ status: "ok", message: newMessage });
            }
        } catch (err) {
            console.error("Ошибка при обработке sendMessage:", err.message, err.stack);
            if (typeof callback === 'function') callback({ error: "Server error while sending message" });
        }
    });

    socket.on('editMessage', async ({messageId, newText}, callbacck) => {
        try {
            if (!socket.user || !socket.user.id) {
                if (typeof callback === 'function') callback({ error: 'Authentication required' })
                return;
            }

            if(!messageId || !newText || newText.trim() === ''){
                if (typeof callback === 'function') callback({error: 'Invalid data'});
                return;
            }

            const userId = socket.user.id;

            const message = await db('messages').where({id: messageId}).first();

            if (!message){
                if (typeof callback === 'function') callback ({error: 'Message not found'})
                return;
            }

            if (message.sender_id !== userId) {
                console.warn(`Попытка редактирования чужого сообщения! User: ${userId}, Message Sender: ${message.sender_id}`);
                if (typeof callback === 'function') callback({ error: 'Permission denied' });
                return;
            }

            const [updatedMessage] = await db('messages')
                .where({id: messageId})
                .update({
                    text_content: newText.trim(),
                    is_edited: true,
                    updated_at: new Date(),
                })
                .returning('*')

            const roomName = message.chat_id.toString();
            io.to(roomName).emit('messageEdited', updatedMessage);

            console.log(`Сообщение ${messageId} отредактировано пользователем ${socket.user.username}`);
            if (typeof callback === 'function') callback({ status: 'ok', message: updatedMessage });
        } catch (err) {
            console.error("Ошибка при редактировании сообщения:", err);
            if (typeof callback === 'function') callback({ error: 'Server error' });
        }
    })

    socket.on('joinChatRoom', async (chatId, ack) => {
        console.log(`Сервер: Пользователь ${socket.user?.username} пытается присоединиться к комнате ${chatId}`);
        if (!socket.user || !socket.user.id) {
            if (typeof ack === 'function') ack({ error: 'Not authenticated' });
            return;
        }

        try{
            const participant = await db('chat_participants')
                .where({ chat_id: chatId, user_id: socket.user.id })
                .first();

            if (participant) {
                socket.join(chatId.toString());
                console.log(`Сервер: Пользователь ${socket.user.username} УСПЕШНО присоединился к комнате ${chatId.toString()}`);
                if (typeof ack === 'function') ack({ status: 'ok', message: `Joined chat room ${chatId}` });
                await db('chat_participants')
                    .where({ chat_id: chatId, user_id: socket.user.id })
                    .update({ last_read_at: new Date() });
                console.log(`Сервер: Обновлен last_read_at для пользователя ${socket.user.username} в чате ${chatId}`);
            } else {
                console.warn(`User ${socket.user.username} tried to join chat room ${chatId} but is not a participant.`);
                if (typeof ack === 'function') ack({ error: 'Not a member of this chat' });
            }

        } catch (err) {
            console.error(`Error joining chat room ${chatId} for user ${socket.user.username}:`, error);
            if (typeof ack === 'function') ack({ error: 'Server error' });
        }
    })

    socket.on('leaveChatRoom', (chatId, ack) => {
        if (!socket.user || !socket.user.id) {
            if (typeof ack === 'function') ack({ error: 'Not authenticated' });
            return;
        }
        socket.leave(chatId.toString());
        console.log(`User ${socket.user.username} left chat room: ${chatId.toString()}`);
        if (typeof ack === 'function') ack({ status: 'ok', message: `Left chat room ${chatId}` });
    });
}))

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`)
})
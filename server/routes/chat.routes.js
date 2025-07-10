const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const db = require('../db/knex')
const { check, validationResult } = require('express-validator');

router.post(
    '/',
    [
        authMiddleware,
        check('receiverId', 'Необходимо выбрать второго участника чата').not().isEmpty().isUUID()
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const io = req.io
        const senderId = req.user.id;
        const {receiverId} = req.body;

        if(senderId === receiverId){
            return res.status(400).json({errors: [{msg: 'Нельзя создать чат с самим собой'}]});
        }

        try{
            const receiverExists = await db('users').where({id: receiverId}).first();
            if(!receiverExists){
                return res.status(400).json({errors: [{msg: 'Пользователь-получатель не найден'}]})
            }

            const existingChat = await db('chats as c')
                .innerJoin('chat_participants as cp1', 'cp1.chat_id', 'c.id')
                .innerJoin('chat_participants as cp2', 'cp2.chat_id', 'c.id')
                .where('c.type', 'private')
                .andWhere(function(){
                    this.where(function(){
                        this.where('cp1.user_id', senderId).andWhere('cp2.user_id', receiverId)
                    }).orWhere(function() {
                        this.where('cp1.user_id', receiverId).andWhere('cp2.user_id', senderId);
                    })
                })
                .select('c.id', 'c.type', 'c.created_at', 'c.updated_at')
                .first()

            if(existingChat){
                const participants = await db('chat_participants as cp')
                    .join('users as u', 'u.id', 'cp.user_id')
                    .where('cp.chat_id', existingChat.id)
                    .select('u.id', 'u.username', 'u.avatar_url', 'u.is_online', 'u.last_seen')
                return res.status(200).json({...existingChat, participants});
            }

            let newChatId;
            await db.transaction(async trx => {
                const [chat] = await trx('chats')
                    .insert({
                        type: 'private',
                        created_by_user_id: null,
                    })
                    .returning('id')
                newChatId = chat.id
                await trx('chat_participants').insert([
                    {chat_id: newChatId, user_id: senderId},
                    {chat_id: newChatId, user_id: receiverId},
                ])
            })

            const createdChat = await db('chats').where({id: newChatId}).first();
            const participants = await db('chat_participants as cp')
                .join('users as u', 'u.id', 'cp.user_id')
                .where('cp.chat_id', newChatId)
                .select('u.id', 'u.username', 'u.email', 'u.avatar_url', 'u.is_online', 'u.last_seen')

            const chatPayload = {
                ...createdChat,
                participants: participants,
                last_message: null,
                unread_count: 0,
            };


            if (chatPayload.type === 'private') {
                const payloadForReceiver = {...chatPayload}
                const senderInfo = participants.find(p => p.id === senderId);
                if (senderInfo) {
                    payloadForReceiver.name = senderInfo.username;
                }

                const receiverRoomName = receiverId.toString();
                io.to(receiverRoomName).emit('createChat', payloadForReceiver);

                const payloadForSender = {...chatPayload}
                const receiverInfo = participants.find(p => p.id === receiverId);
                if(receiverInfo) {
                    payloadForSender.name = receiverInfo.username;
                }
                res.status(201).json(payloadForSender);
            } else {
                res.status(201).json(chatPayload);
                participants.forEach(p => {
                    io.to(p.id.toString()).emit('createChat', chatPayload);
                });
            }

        } catch (err){
            console.error('Ошибка при создании чата: ', err.message, err.stack);
            res.status(500).send('Ошибка сервера при создании чата')
        }
    }
)

router.get(
    '/',
    authMiddleware,
    async (req, res) => {
        const currentUserId = req.user.id;
        try{
            const userChatEntries = await db('chat_participants')
                .where({user_id: currentUserId})
                .select('chat_id', 'last_read_at')

            if (userChatEntries.length === 0){
                return res.json([])
            }

            const chatIds = userChatEntries.map(entry => entry.chat_id)

            const userLastReadMap = userChatEntries.reduce((acc, entry) => {
                acc[entry.chat_id] = entry.last_read_at;
                return acc
            }, {})

            const chats = await db('chats')
                .whereIn('id', chatIds)
                .orderBy('updated_at', 'desc')

            const chatsWithDetails = await Promise.all(
                chats.map(async (chat) => {

                    const participants = await db('chat_participants as cp')
                        .join('users as u', 'u.id', 'cp.user_id')
                        .where('cp.chat_id', chat.id)
                        .whereNot('u.id', chat.type === 'private' ? currentUserId : null)
                        .select('u.id', 'u.username', 'u.email', 'u.avatar_url', 'u.is_online', 'u.last_seen')

                    const lastMessage = await db('messages')
                        .where({chat_id: chat.id})
                        .orderBy('created_at', 'desc')
                        .first(['id', 'text_content', 'sender_id', 'created_at', 'content_type', 'file_url'])

                    let unreadCount = 0;
                    if(lastMessage){
                        const lastReadTimeForThisChat = userLastReadMap[chat.id];
                        if (lastReadTimeForThisChat){
                            unreadCount = await db('messages')
                                .where('chat_id', chat.id)
                                .andWhere('created_at', '>', lastReadTimeForThisChat)
                                .andWhereNot('sender_id', currentUserId)
                                .count('* as count')
                                .first()
                            unreadCount = parseInt(unreadCount.count, 10)
                        } else {
                            unreadCount = await db('messages')
                                .where('chat_id', chat.id)
                                .andWhereNot('sender_id', currentUserId)
                                .count('* as count')
                                .first()
                            unreadCount = parseInt(unreadCount.count, 10)
                        }
                    }

                    let chatName = chat.name
                    if(chat.type === 'private' && participants.length > 0){
                        const otherParticipants = participants.find(p => p.id !== currentUserId)
                        if(otherParticipants){
                            chatName = otherParticipants.username
                        }
                    }

                    return {
                        ...chat,
                        name: chatName,
                        participants,
                        last_message: lastMessage || null,
                        unreadCount: unreadCount,
                    }
                })
            )

            res.json(chatsWithDetails)
        } catch (err) {
            console.error("Ошибка при получении списка чатов:", err.message, err.stack);
            res.status(500).send('Ошибка сервера при получении списка чатов');
        }
    }
)

router.get(
    '/:chatId/messages',
    [
        authMiddleware,
        check('chatId', 'Неверный ID чата').isUUID(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const {chatId} = req.params;
        const userId = req.user.id;

        try{
            const participant = await db('chat_participants')
                .where({chat_id: chatId, user_id: userId})
                .first()

            if (!participant){
                return res.status(403).json({msg: 'Доступ к сообщениям этого чата запрещен'})
            }

            const messages = await db('messages')
                .where({chat_id: chatId})
                .orderBy('created_at', 'asc')
                // TODO: Реализовать пагинацию (offset, limit) .limit(50)
                .select('*')

            let firstUnreadId = null;
            const lastReadTime = participant.last_read_at ? new Date(participant.last_read_at).getTime() : 0;
            for (const msg of messages) {
                if(new Date(msg.created_at).getTime() > lastReadTime && msg.sender_id.toString()!== userId.toString()){
                    firstUnreadId = msg.id
                    break;
                }
            }

            console.log("!!! Unread MSG", firstUnreadId)

            res.json({
                messages: messages,
                firstUnreadId: firstUnreadId
            });

        } catch (err) {
            console.error(`Ошибка при получении сообщений для чата ${chatId}: `, err.message);
            res.status(500).send('Ошибка сервера')
        }
    }
)

router.post('/:chatId/mark-as-read', authMiddleware, async (req, res) => {
    const {chatId} = req.params;
    const userId = req.user.id;

    try{
        const [updatedEntry] = await db('chat_participants')
            .where({chat_id: chatId, user_id: userId})
            .update({last_read_at: new Date()})
            .returning(['chat_id', 'user_id', 'last_read_at'])

        if(!updatedEntry){
            return res.status(404).json({msg: 'Запись участника чата не найдена или вы не участник'})
        }

        res.status(200).json({
            msg: 'Чат помечен как прочитанный',
            chatId: updatedEntry.chat_id,
            last_read_at: updatedEntry.last_read_at,
        })
    } catch (err) {
        console.error('Ошибка при пометке чата как прочитанного:', error);
        res.status(500).send('Ошибка сервера');
    }
})

router.delete(
    '/:chatId',
    authMiddleware,
    async (req, res) => {
        const io = req.io
        const {chatId} = req.params
        const userId = req.user.id;

        try {
            const participant = await db('chat_participants')
                .where({chat_id: chatId, user_id: userId})
                .first()
            if (!participant){
                return res.status(403).json({ msg: 'Доступ запрещен.' });
            }
            const allParticipants = await db('chat_participants')
                .where({chat_id: chatId})
                .select('user_id')
            await db('chats').where({id: chatId}).del()
            allParticipants.forEach(p => {
                const userRoomName = p.user_id.toString()
                io.to(userRoomName).emit('deleteChat', {chatId})
                console.log(`Сервер: Отправлено событие chatDeleted для чата ${chatId} пользователю ${userRoomName}`);
            })
            res.status(200).json({ msg: 'Чат успешно удален' });
        } catch (error){
            console.error(`Ошибка удаления чата ${chatId}:`, error);
            res.status(500).send('Ошибка сервера');
        }
    }
)

router.put(
    '/:chatId/messages/:messageId',
    [
        authMiddleware,
        check('text', 'Текст сообщения не может быть пустым').not().isEmpty().trim(),
    ],
    async (req, res) => {
        const {chatId, messageId} = req.params
        const {text} = req.body
        const userId = req.user.id;
        const io = req.io

        try{
            const message = await db('messages').where({id: messageId, chat_id: chatId}).first()
            if(!message){
                return res.status(404).json({msg: 'Сообщение не найдено'})
            }
            if(message.sender_id !== userId){
                return res.status(403).json({msg: 'Вы не можете редактировать это сообщение'})
            }

            const [updatedMessage] = await db('messages')
                .where({id: messageId})
                .update({text_content: text, updated_at: new Date()})
                .returning('*')

            const roomName = chatId.toString()
            io.to(roomName).emit('updateMessage', updatedMessage)
            console.log(`Сервер: Отправлено 'messageUpdated' в комнату ${roomName}`);
            res.json(updatedMessage);
        } catch (error) {
            console.error('Ошибка реадктирования сообщения: ', error);
            res.status(500).send('Ошибка сервера');
        }
    }
)

router.delete(
    '/:chatId/messages/:messageId',
    authMiddleware,
    async (req, res) => {
        const {chatId, messageId} = req.params
        const userId = req.user.id;
        const io = req.io

        try {
            const message = await db('messages')
                .where({id: messageId, chat_id: chatId}).first()
            if (!message){
                return res.status(404).json({msg: 'Сообщение не найдено'})
            }
            if (message.sender_id !== userId){
                return res.status(403).json({msg: 'Вы не можете удалить это сообщение'});
            }
            await db('messages').where({id: messageId}).del()

            const roomName = chatId.toString()
            io.to(roomName).emit('deleteMessage', {messageId, chatId})
            res.status(200).json({ msg: 'Сообщение успешно удалено' });
        } catch (error) {
            console.error('Ошибка удаления сообщения:', error);
            res.status(500).send('Ошибка сервера');
        }
    }
)
module.exports = router;

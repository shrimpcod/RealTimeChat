import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../ChatWindow/ChatWindow';
//import type {ChatType} from "../../types/types";
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    fetchMessages,
    selectChatById,
    setActiveChatId,
    selectMessagesStatus, selectChatMessages, selectActiveChatId
} from '../../store/features/chat/chatSlice';

//import styles from './ChatWindowPage.module.css';

function ChatWindowPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const currentChat = useAppSelector(selectChatById(chatId));
    const messages = useAppSelector(selectChatMessages)
    const messagesStatus = useAppSelector(selectMessagesStatus);
    const activeChatId = useAppSelector(selectActiveChatId);

    useEffect(() => {
        if (chatId) {
            if (activeChatId !== chatId){
                dispatch(setActiveChatId(chatId));
            }
        } else {
            console.error("ChatWindowPage: chatId отсутствует, перенаправление на главную.");
            navigate('/');
        }
    }, [chatId, dispatch, activeChatId]);

    useEffect(() => {
        if (activeChatId && (messagesStatus === 'idle' || (messages.length > 0 && messages[0]?.chat_id !== activeChatId))){
            console.log(`ChatWindowPage: Диспатч fetchMessages(${activeChatId})`);
            dispatch(fetchMessages(activeChatId));
        }
    }, [activeChatId, dispatch, messagesStatus, messages]);

    const handleGoBack = () => {
        navigate('/');
    };

    if (!currentChat) {
        if (messagesStatus === 'loading' && !chatId) {
            return <div>Загрузка данных чата... (ChatWindowPage)</div>;
        }
        console.warn(`ChatWindowPage: Чат с ID ${chatId} не найден в store.`);
        return <div>Чат не найден. Возможно, он был удален или вы не являетесь участником.</div>;
    }

    return (
        <ChatWindow
            chat={currentChat}
            onGoBack={handleGoBack}
            isMobile={true}
        />
    );
}

export default ChatWindowPage;
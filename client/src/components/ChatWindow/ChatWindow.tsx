import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from "react-router-dom";
import styles from './ChatWindow.module.css';

import InputMessage from '../InputMessage/InputMessage';
import MessageItem from '../MessageItem/MessageItem';
import MessageEditorBar from "../MessageEditorBar/MessageEditorBar";
import UserInfoSidebar from "../UserInfoSidebar/UserInfoSidebar";
import SearchHeader from "../SearchHeader/SearchHeader";
import SearchResultsBar from '../SearchResultsBar/SearchResultsBar';
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import ContextMenu, { ContextMenuOption } from "../ContextMenu/ContextMenu";

import type { ChatType, MessageType } from '../../types/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import {
    fetchMessages,
    markChatRead,
    selectChatMessages,
    selectMessagesStatus,
    selectMessagesError,
    selectActiveChatId,
    deleteMessage,
    selectFirstUnreadMessageId,
} from '../../store/features/chat/chatSlice';
import { selectCurrentUser } from '../../store/features/auth/authSlice';

import { socketService } from '../../services/socketService';
import { getFullAvatarUrl } from "../../utils/avatarUtils";
import { IoArrowBack} from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";
import {CiCircleMore} from "react-icons/ci";
import { FaArrowDown } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";

interface ChatWindowProps {
    chat: ChatType;
    onGoBack?: () => void;
    isMobile: boolean;
}

function ChatWindow({ chat, onGoBack, isMobile }: ChatWindowProps) {
    // --- 1. Секция хуков и получения данных из Redux ---
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const messages = useAppSelector(selectChatMessages);
    const messagesStatus = useAppSelector(selectMessagesStatus);
    const messagesError = useAppSelector(selectMessagesError);
    const currentUser = useAppSelector(selectCurrentUser);
    const activeChatId = useAppSelector(selectActiveChatId);
    const firstUnreadMessageId = useAppSelector(selectFirstUnreadMessageId);

    // --- 2. Секция Refs ---
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const messageRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());
    const initialScrollDone = useRef(false); // Флаг для отслеживания начального скролла
    const isAtBottomRef = useRef(true); // Флаг для отслеживания позиции пользователя

    // --- 3. Секция состояний (State) ---
    const [contextMenu, setContextMenu] = useState<{ message: MessageType, position: { x: number, y: number } } | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
    const [messageToEdit, setMessageToEdit] = useState<MessageType | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showFloatingButtons, setShowFloatingButtons] = useState(false);

    // Состояния для поиска
    const [isSearchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MessageType[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);

    // --- 4. Секция обработчиков событий и функций ---

    // Функция для прокрутки к сообщению
    const scrollToMessage = useCallback((
        messageId: string | number,
        block: 'start' | 'center' | 'end' = 'start',
        behavior: 'smooth' | 'auto' = 'smooth'
    ) => {
        const element = messageRefs.current.get(messageId);
        const container = messagesContainerRef.current;
        const header = headerRef.current;

        if (!element || !container) {
            console.warn("scrollToMessage: Целевой элемент или контейнер не найден.");
            return;
        }

        const headerHeight = header ? header.offsetHeight : 60;
        const containerVisibleHeight = container.clientHeight;
        const elementHeight = element.offsetHeight;

        // Позиция элемента относительно начала всего прокручиваемого контента
        const elementPosition = element.offsetTop;

        let scrollToPosition: number;

        // 2. Вычисляем конечную позицию скролла
        switch (block) {
            case 'center':
                scrollToPosition = elementPosition - (containerVisibleHeight / 2) + (elementHeight / 2);
                scrollToPosition -= headerHeight / 2;
                break;

            case 'end':
                const desiredBottomOffset = 20;
                scrollToPosition = elementPosition - containerVisibleHeight + elementHeight + desiredBottomOffset;
                break;

            case 'start':
            default:
                const desiredTopOffset = 10;
                scrollToPosition = elementPosition - headerHeight - desiredTopOffset;
                break;
        }

        const maxScrollTop = container.scrollHeight - containerVisibleHeight;
        scrollToPosition = Math.max(0, Math.min(scrollToPosition, maxScrollTop));

        container.scrollTo({
            top: scrollToPosition,
            behavior: behavior
        });
    }, []);

    // Обработчики для сообщений
    const handleSendMessage = (text: string) => {
        if (text.trim() && activeChatId) {
            socketService.emit('sendMessage', { chatId: activeChatId, text: text.trim() });
        }
    };
    const handleConfirmEdit = (newText: string) => {
        if (!messageToEdit) return;
        if (newText.trim() !== messageToEdit.text_content) {
            socketService.emit('editMessage', { messageId: messageToEdit.id, newText: newText.trim() });
        }
        setMessageToEdit(null);
    };
    const confirmDeleteMessage = () => {
        if (messageToDelete) {
            dispatch(deleteMessage({ chatId: messageToDelete.chat_id, messageId: messageToDelete.id }));
        }
        setMessageToDelete(null);
    };
    const handleCancelEdit = () => setMessageToEdit(null);

    // Обработчики для UI
    const handleContextMenu = (event: React.MouseEvent, message: MessageType) => {
        event.preventDefault();
        setContextMenu({ message, position: { x: event.clientX - 180, y: event.clientY } });
    };
    const handleSidebarOpen = () => {
        isMobile ? navigate(`/chat/${chat.id}/info`) : setSidebarOpen(true);
    };

    // Обработчики для поиска
    const handleStartSearch = () => setSearchMode(true);
    const handleCloseSearch = () => {
        setSearchMode(false);
        setSearchQuery('');
        setSearchResults([]);
    };
    const handleNavigateResults = (direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? currentResultIndex + 1 : currentResultIndex - 1;
        if (newIndex >= 0 && newIndex < searchResults.length) {
            setCurrentResultIndex(newIndex);
            scrollToMessage(searchResults[newIndex].id, 'start', 'smooth');
        }
    };

    // Обработчики для скрола
    const handleSimpleScrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleSummarizeAndScroll = () => {
        const unreadMessages = firstUnreadMessageId
            ? messages.slice(messages.findIndex(m => m.id === firstUnreadMessageId))
            : [];

        if (unreadMessages.length > 0) {
            console.log("ОТПРАВКА НА СУММАРИЗАЦИЮ:", unreadMessages.map(m => m.text_content));
            alert(`Здесь будет вызов GPT для ${unreadMessages.length} сообщений.`);
            //API-сервис
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- 5. Секция эффектов (useEffect) ---

    // Загрузка сообщений и подписка на сокет-комнату
    useEffect(() => {
        if (chat?.id) {
            if (messagesStatus === 'idle' || chat.id !== activeChatId) {
                dispatch(fetchMessages(chat.id));
            }
            socketService.joinChatRoom(chat.id);
            return () => {
                socketService.leaveChatRoom(chat.id);
            };
        }
    }, [chat?.id, dispatch, activeChatId]);

    // Хук №1: ТОЛЬКО для начальной прокрутки при загрузке чата
    useEffect(() => {
        if (messagesStatus === 'succeeded' && !initialScrollDone.current) {
            if (firstUnreadMessageId) {
                setTimeout(() => scrollToMessage(firstUnreadMessageId, 'end', 'auto'), 100);
            } else {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
            }
            initialScrollDone.current = true;
        }
        if (activeChatId !== chat.id) {
            initialScrollDone.current = false;
        }
    }, [messagesStatus, firstUnreadMessageId, activeChatId, chat.id, scrollToMessage]);

    // Хук №2: Логика для кнопки "вниз" и пометки чата прочитанным
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
            isAtBottomRef.current = atBottom;
            setShowFloatingButtons(!atBottom)

            if (atBottom && chat.unreadCount > 0) {
                dispatch(markChatRead(chat.id));
            }
        };

        container.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    }, [chat.id, chat.unreadCount, dispatch]);

    // Хук №3: Скролл при получении НОВОГО сообщения
    useEffect(() => {
        if (initialScrollDone.current && isAtBottomRef.current) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [messages]);

    // Логика поиска
    useEffect(() => {
        if (!isSearchMode) return;

        if (searchQuery.trim().length > 2) {
            const results = [...messages].filter(msg =>
                msg.text_content?.toLowerCase().includes(searchQuery.toLowerCase())
            ).reverse();

            setSearchResults(results);
            const newIndex = 0;
            setCurrentResultIndex(newIndex);

            if (results.length > 0) {
                setTimeout(() => scrollToMessage(results[newIndex].id, 'start', 'smooth'), 50);
            }
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, isSearchMode, messages]); // Добавляем messages, чтобы поиск был по актуальным данным

    if (!chat) {
        return <div className={styles.noChatActive}>Чат не выбран.</div>;
    }

    const companion = chat.type === 'private' ? chat.participants.find(p => p.id !== currentUser?.id) : undefined;
    const fullAvatarUrl = getFullAvatarUrl(companion);
    const getMessageMenuOptions = (message: MessageType): ContextMenuOption[] => {
        const options: ContextMenuOption[] = [];
        if (message.sender_id === currentUser?.id) {
            options.push({ label: 'Редактировать', action: () => { setMessageToEdit(message); setContextMenu(null); } });
            options.push({ label: 'Удалить', action: () => { setMessageToDelete(message); setContextMenu(null); }, className: styles.dangerAction });
        }
        options.push({ label: 'Копировать текст', action: () => { navigator.clipboard.writeText(message.text_content || ''); setContextMenu(null); } });
        return options;
    };

    return (
        <div className={`${styles.chatWindowContainer} ${isMobile ? styles.mobileFullScreen : ''}`}>
            <header className={`${styles.header} ${isSearchMode && isMobile ? styles.searchModeActive : ''}`} ref={headerRef}>
                {isMobile && onGoBack &&
                    <button onClick={onGoBack} className={styles.backButtonMobile}>
                        <IoArrowBack size={22} />
                    </button>}
                <div className={styles.headerProfile} onClick={handleSidebarOpen}>
                    <img src={fullAvatarUrl} alt={chat.name} className={styles.headerAvatar} />
                    <div className={styles.headerInfo}>
                        <div className={styles.headerName}>{chat.name}</div>
                        {companion && <div className={styles.headerStatus}>{companion.is_online ? 'онлайн' : 'не в сети'}</div>}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    {isSearchMode ? (
                        <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onClose={handleCloseSearch} />
                    ) : (
                        <>
                            <button title="Поиск по чату" onClick={handleStartSearch}><IoIosSearch size={24} /></button>
                            <button title="Дополнительно" onClick={handleSidebarOpen}><CiCircleMore size={26} /></button>
                        </>
                    )}
                </div>
            </header>

            <div className={styles.messagesArea} ref={messagesContainerRef}>
                {messagesStatus === 'loading' && <p className={styles.systemMessage}>Загрузка...</p>}
                {messagesStatus === 'failed' && <p className={styles.systemMessage}>Ошибка: {messagesError}</p>}
                <div className={styles.messageList}>
                    {messages.map(msg => (
                        <div key={msg.id}>
                            {msg.id === firstUnreadMessageId && <div className={styles.firstUnreadMarker}>Непрочитанные сообщения</div>}
                            <MessageItem
                                message={msg}
                                onContextMenu={(e) => handleContextMenu(e, msg)}
                                ref={el => el ? messageRefs.current.set(msg.id, el) : messageRefs.current.delete(msg.id)}
                                isHighlighted={isSearchMode && searchResults[currentResultIndex]?.id === msg.id}
                            />
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className={styles.floatingButtonsContainer}>
                {showFloatingButtons && firstUnreadMessageId && (
                    <button
                        className={styles.summarizeButton}
                        onClick={handleSummarizeAndScroll}
                        title="Суммаризировать и перейти в конец"
                    >
                        <FaWandMagicSparkles />
                        <span>Суммаризировать</span>
                    </button>
                )}

                {showFloatingButtons && (
                    <button
                        className={styles.scrollDownButton}
                        onClick={handleSimpleScrollToBottom}
                        title="К последним сообщениям"
                    >
                        <FaArrowDown />
                        {chat.unreadCount > 0 && <span className={styles.unreadBadge}>{chat.unreadCount}</span>}
                    </button>
                )}
            </div>

            <div className={styles.inputArea}>
                {isSearchMode && searchQuery.trim().length > 2 && (
                    <SearchResultsBar
                        foundCount={searchResults.length}
                        currentIndex={currentResultIndex}
                        onNavigate={handleNavigateResults}
                    />
                )}

                {messageToEdit &&
                    <MessageEditorBar
                        message={messageToEdit}
                        onCancel={handleCancelEdit}
                    />
                }

                <InputMessage
                    editingMessage={messageToEdit}
                    onSaveEdit={handleConfirmEdit}
                    onSendMessage={handleSendMessage}
                />
            </div>

            {contextMenu &&
                <ContextMenu
                    options={getMessageMenuOptions(contextMenu.message)}
                    position={contextMenu.position} onClose={() => setContextMenu(null)}
                />
            }

            {messageToDelete &&
                <ConfirmationModal
                    message="Вы уверены, что хотите удалить это сообщение?"
                    onConfirm={confirmDeleteMessage} onCancel={() => setMessageToDelete(null)}
                    confirmText = "Удалить"
                    cancelText = "Отмена"
                    isDanger={true}
                />
            }

            <UserInfoSidebar user={companion} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
    );
}

export default ChatWindow;
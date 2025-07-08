import styles from './ChatsList.module.css';
import {ChatType, UserType} from "../../types/types";
import {useAppDispatch, useAppSelector} from "../../store/hooks";
import {selectCurrentUser} from "../../store/features/auth/authSlice";
import {deleteChat, selectActiveChatId} from "../../store/features/chat/chatSlice";
import {getFullAvatarUrl} from "../../utils/avatarUtils";
import {useState} from "react";
import ContextMenu, { ContextMenuOption } from '../ContextMenu/ContextMenu';
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";

interface ChatsListProps {
    chats: ChatType[];
    onSelectChat: (chat: Pick<ChatType, 'id' | 'name'>) => void;
}

function ChatsList({chats, onSelectChat}: ChatsListProps) {
    const currentUser = useAppSelector(selectCurrentUser);
    const activeChatId = useAppSelector(selectActiveChatId);
    const dispatch = useAppDispatch();

    const [contextMenu, setContextMenu] = useState<{ chat: ChatType; position: { x: number; y: number } } | null>(null);
    const [chatToDelete, setChatToDelete] = useState<ChatType | null>(null);

    const handleContextMenu = (event: React.MouseEvent<HTMLLIElement>, chat: ChatType) => {
        event.preventDefault();
        setContextMenu({ chat, position: { x: event.clientX, y: event.clientY } });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const confirmDelete = () => {
        if (chatToDelete) {
             dispatch(deleteChat(chatToDelete.id));
        }
        setChatToDelete(null);
    };

    const getMenuOptionsForChat = (chat: ChatType): ContextMenuOption[] => {
        const options: ContextMenuOption[] = []

        options.push({
            label: 'Удалить',
            action: () =>  setChatToDelete(chat),
            className: styles.dangerAction,
        })

        if (chat.type === 'group'){
            options.unshift({
                label: 'Изменить',
                action: () => console.log(`TODO: Изменить чат ${chat.id}`),
            })
            if (chat.created_by_user_id !== currentUser?.id) {
                options.push({
                    label: 'Покинуть чат',
                    action: () => console.log(`TODO: Покинуть чат ${chat.id}`),
                });
            }
        }
        return options;
    }

    if (!chats || chats.length === 0) {
        return (
            <div className={styles.noChatsMessage}>
               <p>
                   <span>У вас пока нет чатов </span>
               </p>
            </div>
        )
    }

    const getParticipantById = (participants: UserType[], senderId: string) => {
        return participants.find((participant) => participant.id === senderId);
    }

    return (
        <div className={styles.chatsListContainer}>
            <ul className={styles.list}>
                {chats.map(chat => {

                    let displayName = chat.name;
                    let userForAvatar: {avatar_url?: string | null} | null = null;

                    if (chat.type === 'private' && currentUser) {
                        const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
                        if (otherParticipant) {
                            displayName = otherParticipant.username;
                            userForAvatar = otherParticipant
                        }
                    }

                    let displayAvatar = getFullAvatarUrl(userForAvatar)

                    let lastMessageSenderPrefix = ''
                    if (chat.last_message && chat.last_message.sender_id && currentUser){
                        if (chat.last_message.sender_id === currentUser.id) {
                            lastMessageSenderPrefix = 'Вы: '
                        } else if (chat.type === 'group'){
                            const sender = getParticipantById(chat.participants, chat.last_message.sender_id)
                            if (sender) {
                                lastMessageSenderPrefix = `${sender.username}: `
                            }
                        }
                    }

                    return (
                        <li
                            key={chat.id}
                            onContextMenu={(e) => handleContextMenu(e, chat)}
                            // TODO: Добавить обработчики для долгого нажатия на мобильных
                            className={`${styles.chatItem} ${chat.id === activeChatId ? styles.chatItemActive : ''} ${contextMenu?.chat.id === chat.id ? styles.highlightedForMenu : ''}`}
                            onClick={() => onSelectChat(chat)}
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && onSelectChat(chat)}
                        >
                            <img
                                src={displayAvatar || "/images/unknown.jpg"}
                                alt={`Аватар ${displayName}`}
                                className={styles.avatar}
                            />
                            <div className={styles.chatInfo}>
                                <div className={styles.chatName}>{displayName}</div>
                                {chat.last_message?.text_content ? (
                                    <div className={styles.lastMessagePreview}>
                                        <span className={styles.senderPrefix}>{lastMessageSenderPrefix}</span>
                                        {chat.last_message.text_content}
                                    </div>
                                ): (
                                    <div className={styles.lastMessagePreview}>Нет сообщений</div>
                                )}
                            </div>
                            <div className={styles.metaInfo}>
                                {chat.last_message?.created_at && (
                                    <span className={styles.timestamp}>
                                        {new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {typeof chat.unreadCount === "number" && chat.unreadCount > 0 && (
                                    <span className={styles.unreadBadge}>{chat.unreadCount}</span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {contextMenu && (
                <ContextMenu
                    options={getMenuOptionsForChat(contextMenu.chat)}
                    position={contextMenu.position}
                    onClose={handleCloseContextMenu}
                />
            )}

            {chatToDelete && (
                <ConfirmationModal
                    message={`Вы уверены, что хотите удалить чат "${chatToDelete.name}"? Это действие необратимо.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setChatToDelete(null)}
                    confirmText={"Удалить"}
                    cancelText={"Отмена"}
                    isDanger={true}
                />
            )}
        </div>
    );
}

export default ChatsList;
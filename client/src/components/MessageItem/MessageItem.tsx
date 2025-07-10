import React, { forwardRef } from 'react';
import styles from './MessageItem.module.css';
import type { MessageType } from '../../types/types';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/features/auth/authSlice';
// import { IoCheckmarkDone } from 'react-icons/io5';

interface MessageItemProps {
    message: MessageType;
    onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
    isHighlighted: boolean;
}

const MessageItem = forwardRef<HTMLDivElement, MessageItemProps>(({ message, onContextMenu, isHighlighted }, ref) => {
    const currentUser = useAppSelector(selectCurrentUser);
    const isOwnMessage = message.sender_id === currentUser?.id;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit'});
    };

    return (
        <div
            ref={ref}
            className={`${styles.messageWrapper} ${isOwnMessage ? styles.wrapperOwn : styles.wrapperTheirs}`}
        >
            <div
                className={`${styles.messageBubble} ${isOwnMessage ? styles.bubbleOwn : styles.bubbleTheirs} ${isHighlighted ? styles.highlighted : ''}`}
                onContextMenu={onContextMenu}
            >
                <div className={styles.messageText}>{message.text_content}</div>
                <div className={styles.messageInfo}>
                    {message.is_edited && (
                        <span className={styles.editedLabel}>изм.</span>
                    )}
                    <span className={styles.messageTime}>
                        {formatTime(message.created_at)}
                    </span>
                    {/*{isOwnMessage && (*/}
                    {/*    <span className={styles.messageCheckMarks}>*/}
                    {/*        /!* Здесь можно добавить логику для одной или двух галочек *!/*/}
                    {/*        <IoCheckmarkDone size={16} />*/}
                    {/*    </span>*/}
                    {/*)}*/}
                </div>
            </div>
        </div>
    );
});

export default MessageItem;
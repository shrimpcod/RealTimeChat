import React from 'react';
import styles from './MessageEditorBar.module.css';
import type { MessageType } from '../../types/types';
import { FaPencilAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface MessageEditorBarProps {
    message: MessageType;
    onCancel: () => void;
}

const MessageEditorBar: React.FC<MessageEditorBarProps> = ({ message, onCancel }) => {
    return (
        <div className={styles.editorBar}>
            <div className={styles.icon}>
                <FaPencilAlt size={18} />
            </div>
            <div className={styles.content}>
                <div className={styles.title}>Редактирование сообщения</div>
                <div className={styles.text}>{message.text_content}</div>
            </div>
            <button onClick={onCancel} className={styles.cancelButton} aria-label="Отменить редактирование">
                <IoClose size={24} />
            </button>
        </div>
    );
};

export default MessageEditorBar;
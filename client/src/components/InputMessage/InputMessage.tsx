import React, { useState, useEffect } from "react";
import styles from './InputMessage.module.css';
import type { MessageType } from '../../types/types';
import { IoSend } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";

interface InputMessageProps {
    editingMessage: MessageType | null;
    onSaveEdit: (newText: string) => void;
    onSendMessage: (text: string) => void;
}

function InputMessage({ editingMessage, onSaveEdit, onSendMessage }: InputMessageProps) {
    const [text, setText] = useState('');

    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.text_content || '');
        } else {
            setText('');
        }
    }, [editingMessage]);

    const handleSubmit = () => {
        const trimmedText = text.trim();
        if (trimmedText === "") {
            return;
        }

        if (editingMessage) {
            onSaveEdit(trimmedText);
        } else {
            onSendMessage(trimmedText);
        }

        setText("");
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={styles.inputMessage}>
            <div className={styles.wrapper}>
                <textarea
                    className={styles.input}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите сообщение..."
                    rows={1}
                />
                <button
                    className={`${styles.button} ${editingMessage ? styles.saveButton : ''}`}
                    onClick={handleSubmit}
                    disabled={text.trim() === ""}
                    aria-label={editingMessage ? "Сохранить" : "Отправить"}
                >
                    {editingMessage ? <FaCheck size={16} /> : <IoSend size={18} />}
                </button>
            </div>
        </div>
    );
}

export default InputMessage;

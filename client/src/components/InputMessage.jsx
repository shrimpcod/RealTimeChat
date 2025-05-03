import { useState } from "react";
// import '../styles/styles.css'; // Стили пока не трогаем

function InputMessage({ onSendData }) {
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        // Логика отправки остается прежней
        if (message.trim() !== "") {
            onSendData(message);
            setMessage("");
        } else {
            console.log("Пустое сообщение");
        }
    };

    // Обработка отправки по Enter (опционально, но часто бывает полезно)
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Определяем имя основного БЛОКА
    const block = "input-message"; // Основной блок для всего компонента

    return (
        // БЛОК: input-message (замена input_message-container)
        // Часто внешний div можно убрать, если сам блок - это форма или группа контролов
        <div className={block}>
            {/* ЭЛЕМЕНТ: input-message__wrapper (замена message-container) */}
            <div className={`${block}__wrapper`}>
                {/* ЭЛЕМЕНТ: input-message__input (замена message-input) */}
                <input
                    className={`${block}__input`}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown} // Добавили обработку Enter
                    placeholder="Введите сообщение..." // Добавили плейсхолдер
                />
                {/* ЭЛЕМЕНТ: input-message__button (замена message-button) */}
                <button
                    className={`${block}__button`}
                    onClick={handleSendMessage}
                >
                    Send {/* Можно заменить на иконку или более подходящий текст */}
                </button>
            </div>
        </div>
    );
}

export default InputMessage;

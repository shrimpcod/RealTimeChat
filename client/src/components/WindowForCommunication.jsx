import { useState } from "react";
// import '../styles/styles.css'; // Стили пока не трогаем
import InputMessage from "./InputMessage.jsx"; // Предполагаем, что InputMessage - это отдельный БЭМ-блок

function WindowForCommunication() { // Имя компонента пока оставляем, как есть
    const [messages, setMessages] = useState([]);

    const handleDataFromChild = (message) => {
        console.log("Данные получены от ребенка");
        // Добавим проверку, чтобы не добавлять пустые сообщения, если они пустые после trim
        const trimmedMessage = message.trim();
        if (trimmedMessage) {
            setMessages((prevMessages) => [...prevMessages, trimmedMessage]);
        }
    };

    const block = "chat-window";

    return (
        <div className={block}>
            <div className={`${block}__output`}>
                <div className={`${block}__message-list`}>
                    {messages.length === 0 ? (
                        <p className={`${block}__empty-state`}>Сообщений пока нет</p>
                    ) : (
                        messages.map((message, index) => (
                            // ЭЛЕМЕНТ: chat-window__message (замена message-block)
                            // Можно также добавить МОДИФИКАТОР, если нужно различать сообщения,
                            // например, chat-window__message--own или chat-window__message--incoming
                            <div key={index} className={`${block}__message`}>
                                {message}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <InputMessage onSendData={handleDataFromChild} />
        </div>
    );
}

export default WindowForCommunication;
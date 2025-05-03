import {useEffect, useState} from 'react'
import './App.css'


function App() {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])

    const handleSendMessage = () => {
        if (message.trim() !== "") {
            setMessages((prevMessages) => [...prevMessages, message.trim()])
            setMessage("")
        } else {
            console.log("Пустое сообщение")
        }
    }

    return (
        <>
            <h2>Чат в реальном времени</h2>
            <div className="app-container">
                <input
                    className="app-input"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)} />
                <button
                    className="app-button"
                    onClick={handleSendMessage}>
                    Отправить
                </button>
            </div>
            <div className="messages-list">
                {
                    messages.map((message, index) => (
                        <div key={index} className="app-message-block">
                            {message}
                        </div>
                    ))
                }
            </div>
        </>
    )
}

export default App

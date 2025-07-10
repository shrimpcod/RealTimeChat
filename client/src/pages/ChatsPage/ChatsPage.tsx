import {useEffect, useState} from "react";
import {useParams, useNavigate} from 'react-router-dom';
import styles from './ChatsPage.module.css';
import Search from '../../components/SearchComponent/SearchComponent'
import ChatsList from '../../components/ChatsList/ChatsList'
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import useIsMobile from "../../hooks/useIsMobile";
import { ChatType, UserType } from '../../types/types'
import {useAppDispatch, useAppSelector} from "../../store/hooks";
import {
    fetchChats,
    selectAllChats,
    selectChatsStatus,
    selectChatById,
    setActiveChatId,
    selectChatsError,
    createNewChat
} from "../../store/features/chat/chatSlice";
import {selectCurrentUser, selectIsAuthenticated} from "../../store/features/auth/authSlice";
import CreateNewChatModal from "../../components/CreateNewChatModal/CreateNewChatModal"

import { FaPlus } from 'react-icons/fa';

const NoChatSelected = () => {
    return (
        <div className={styles.noChatSelected}>Выберите чат для начала общения</div>
    )
}

function ChatsPage() {

    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {chatId: activeChatIdFromUrl} = useParams<{ chatId?: string }>();
    const isMobile = useIsMobile();

    const chats = useAppSelector(selectAllChats);
    const chatStatus = useAppSelector(selectChatsStatus);
    const chatError = useAppSelector(selectChatsError);
    const currentUser = useAppSelector(selectCurrentUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);

    useEffect(() => {
        if(isAuthenticated && chatStatus === 'idle'){
            dispatch(fetchChats())
        }
    }, [chats, dispatch])

    useEffect(() => {
        let payloadForAction: string | null;
        if (typeof activeChatIdFromUrl === 'string'){
            payloadForAction = activeChatIdFromUrl;
        } else {
            payloadForAction = null;
        }
        dispatch(setActiveChatId(payloadForAction));
    }, [activeChatIdFromUrl, dispatch]);

    const selectedChatForDesktop = useAppSelector(selectChatById(activeChatIdFromUrl));

    const handleSelectChat = (chat: Pick<ChatType, 'id'>) => {
        navigate(`/chat/${chat.id}`)
    }

    const handleGoBack = () => {
        navigate('/');
    }

    const handleOpenUserSearchModal = () => setIsUserSearchModalOpen(true);
    const handleCloseUserSearchModal = () => setIsUserSearchModalOpen(false);
    const handleUserSelectedForNewChat = async (selectedUser: UserType)=> {
        try{
            const resultAction = await dispatch(createNewChat(selectedUser.id))
            if (createNewChat.fulfilled.match(resultAction)){
                const newChat = resultAction.payload
                setIsUserSearchModalOpen(false);
                navigate(`/chat/${newChat.id}`)
            } else {
                alert(`Не удалось создать чат: ${resultAction.payload?.message || 'Ошибка сервера'}`);
            }
        } catch (error) {
            console.error("Ошибка при создании чата:", error);
            alert("Произошла ошибка")
        }
    }

    if (isMobile) {
        if (chatStatus === 'loading') return <div className={styles.chatsPageMobileContainer}><p>Загрузка чатов...</p></div>;
        if (chatStatus === 'failed') return <div className={styles.chatsPageMobileContainer}><p>Ошибка: {chatError}</p></div>;

        return (
            <div className={styles.chatsPageMobileContainer}>
                <div className={styles.mobileHeaderControls}>
                    <Search placeholder="Поиск чатов..." />
                    <button onClick={handleOpenUserSearchModal} className={styles.newChatButtonMobile} title="Новый чат">
                        <FaPlus size={18}/>
                    </button>
                </div>

                <ChatsList
                    chats={chats}
                    onSelectChat={handleSelectChat}
                />

                {isUserSearchModalOpen && currentUser && (
                    <CreateNewChatModal
                        currentUser={currentUser}
                        onClose={handleCloseUserSearchModal}
                        onUserSelect={handleUserSelectedForNewChat}
                    />
                )}
            </div>
        );
    }

    if (chatStatus === 'loading' && !chats.length) {
        return (
            <div className={styles.chatsPageDesktopContainer}>
                <div className={styles.leftPanel}>
                    <p>Загрузка...</p>
                </div>
                <div className={styles.rightPanel}>
                    <NoChatSelected />
                </div>
            </div>
        )
    }

    if (chatStatus === 'failed' && !chats.length) {
        return (
            <div className={styles.chatsPageDesktopContainer}>
                <div className={styles.leftPanel}>
                    <p>Ошибка: {chatError}</p>
                </div>
                <div className={styles.rightPanel}>
                    <NoChatSelected />
                </div>
            </div>
        )
    }

    return (
        <div className={styles.chatsPageDesktopContainer}>
            <div className={styles.leftPanel}>
                <div className={styles.leftPanelHeader}>
                    <Search placeholder="Поиск чатов..." />
                    <button onClick={handleOpenUserSearchModal} className={styles.newChatButton} title="Новый чат">
                        <FaPlus size={18}/>
                    </button>
                </div>
                <ChatsList
                    chats={chats}
                    onSelectChat={handleSelectChat}
                />
            </div>
            <div className={styles.rightPanel}>
                {selectedChatForDesktop ? (
                    <ChatWindow
                        chat={selectedChatForDesktop}
                        isMobile={false}
                        onGoBack={handleGoBack}
                    />
                ) : (
                    <NoChatSelected />
                )}
            </div>
            {isUserSearchModalOpen && currentUser && (
                <CreateNewChatModal
                    currentUser={currentUser}
                    onClose={handleCloseUserSearchModal}
                    onUserSelect={handleUserSelectedForNewChat}
                />
            )}
        </div>
    )
}

export default ChatsPage;

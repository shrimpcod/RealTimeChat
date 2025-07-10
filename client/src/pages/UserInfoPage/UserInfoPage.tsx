import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectChatById } from '../../store/features/chat/chatSlice';
import { selectCurrentUser } from '../../store/features/auth/authSlice';
import UserInfoSidebar from '../../components/UserInfoSidebar/UserInfoSidebar';
import styles from './UserInfoPage.module.css';

function UserInfoPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    const currentChat = useAppSelector(selectChatById(chatId));
    const currentUser = useAppSelector(selectCurrentUser);

    const companion = currentChat?.participants.find(p => p.id !== currentUser?.id);

    const handleGoBack = () => {
        navigate(`/chat/${chatId}`);
    };

    if (!companion) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.error}>Информация о пользователе недоступна.</div>
                <button onClick={() => navigate('/')}>На главную</button>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <UserInfoSidebar
                user={companion}
                isOpen={true}
                onClose={handleGoBack}
                className={styles.fullPageSidebar}
            />
        </div>
    );
}

export default UserInfoPage;
import styles from './Dashboard.module.css';
import { useAppSelector} from "../../store/hooks";
import {selectCurrentUser} from "../../store/features/auth/authSlice";
import {useNavigate} from "react-router-dom";
import { FaUserCircle, FaCommentDots} from 'react-icons/fa';
import {getFullAvatarUrl} from "../../utils/avatarUtils";
import LogoutButton from "../logoutButton/LogoutButton";


function Dashboard() {
    const navigate = useNavigate();

    const currentUser = useAppSelector(selectCurrentUser);



    const handleProfileClick = () => {
        navigate('/profile');
    };

    const handleChatsClick = () => {
        navigate('/');
    };

    const fullAvatarUrl = getFullAvatarUrl(currentUser)

    return (
        <div className={styles.dashboard}>
            <div className={styles.topIcons}>
                <button
                    className={`${styles.iconButton} ${styles.profileButton}`}
                    title = {currentUser?.username || 'Профиль'}
                    onClick={handleProfileClick}
                >
                    {currentUser?.avatar_url
                        ? (
                            <img
                                className={styles.avatarImage}
                                src={fullAvatarUrl}
                                alt={currentUser.username || 'Аватар'}
                            />
                        )
                        : (
                            <FaUserCircle size={28} className={styles.avatarImage}/>
                        )
                    }
                </button>
                <button
                    className={`${styles.iconButton} ${styles.chatsIcon}`}
                    title="Чаты"
                    onClick={handleChatsClick}
                >
                    <FaCommentDots size={32} />
                </button>
            </div>

            <LogoutButton className={styles.iconButton} size={32}/>
        </div>
    );
}

export default Dashboard;
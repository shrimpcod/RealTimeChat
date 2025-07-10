import {useLocation, useNavigate} from "react-router-dom";
import {useAppSelector} from "../../store/hooks";
import {selectCurrentUser} from "../../store/features/auth/authSlice";
import { FaUserCircle, FaCommentDots } from 'react-icons/fa';
import styles from './MobileDashboard.module.css';
import {getFullAvatarUrl} from "../../utils/avatarUtils";

function MobileDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useAppSelector(selectCurrentUser);

    const isActive = (path: string) =>
        location.pathname === path || (path === '/' && location.pathname.startsWith('/chat/'));

    const fullAvatarUrl = getFullAvatarUrl(currentUser)

    return (
        <div className={styles.mobileDashboard}>
            <button
                className={`${styles.navButton} ${isActive('/') || isActive('/chats') ? styles.active : ''}`}
                onClick={() => navigate('/')}
                title="Чаты"
            >
                <FaCommentDots size={24} />
                <span>Чаты</span>
            </button>
            <button
                className={`${styles.navButton} ${isActive('/profile') ? styles.active : ''}`}
                onClick={() => navigate('/profile')}
                title="Профиль"
            >
                {currentUser?.avatar_url ? (
                    <img src={fullAvatarUrl} alt="Профиль" className={styles.avatarImage} />
                ) : (
                    <FaUserCircle size={24} />
                )}
                <span>Профиль</span>
            </button>
        </div>
    )
}

export default MobileDashboard;
import React from 'react'
import styles from './UserInfoSidebar.module.css'
import {IoClose} from 'react-icons/io5'
import type {UserType} from '../../types/types'
import { getFullAvatarUrl } from '../../utils/avatarUtils';

interface UserInfoSideBarProps {
    user: UserType | undefined;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

const UserInfoSidebar: React.FC<UserInfoSideBarProps> = ({user, isOpen, onClose, className}) => {
    if (!user) {
        return null;
    }
    const fullAvatarUrl = getFullAvatarUrl(user)

    const formatLastSeen = (dateString: string)=> {
        if (!dateString) return 'давно';
        const date = new Date(dateString)
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return (
        <div className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${className || ''}`}>
            <header className={styles.header}>
                <h3 className={styles.title}>Информация</h3>
                <button onClick={onClose} className={styles.closeButton} aria-label="Закрыть">
                    <IoClose size={24} />
                </button>
            </header>

            <div className={styles.content}>
                <div className={styles.profileSection}>
                    <img src={fullAvatarUrl} alt={user.username} className={styles.avatar} />
                    <h4 className={styles.username}>{user.username}</h4>
                    <div className={styles.status}>
                        {user.is_online ? (
                            <span className={styles.online}>● онлайн</span>
                        ) : (
                            <span className={styles.offline}>
                                был(а) в сети {formatLastSeen(user.last_seen)}
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email</span>
                        <span className={styles.infoValue}>{user.email}</span>
                    </div>
                </div>

                {/* Место для будущих секций: "Общие медиа", "Файлы" и т.д. */}
                <div className={styles.mediaSection}>
                    <h5 className={styles.sectionTitle}>Общие медиа</h5>
                    <div className={styles.placeholder}>Пока здесь пусто</div>
                </div>
            </div>
        </div>
    );
}

export default UserInfoSidebar;
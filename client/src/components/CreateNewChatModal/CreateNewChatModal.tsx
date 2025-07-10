import {useState, useEffect, useCallback} from "react";
import styles from './CreateNewChatModal.module.css'
import {userApiService} from '../../services/userApi'
import type {UserType} from '../../types/types'
import useDebounce from '../../hooks/useDebounce'

interface UserSearchModalProps {
    currentUser: UserType,
    onClose : () => void,
    onUserSelect: (user: UserType) => void,
}

function CreateNewChatModal({currentUser, onClose, onUserSelect}: UserSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<UserType[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    const fetchUsers = useCallback(async (query: string) => {
        if (!query.trim()){
            setSearchResults([])
            setIsLoading(false)
        }
        setIsLoading(true)
        setError(null)

        try{
            const users = await userApiService.searchUsers(query)
            setSearchResults(users.filter(user => user.id !== currentUser.id))
        } catch (err: any) {
            console.error("Ошибка поиска пользователей: ", err)
            setIsLoading(err.message || "Не удалось найти пользователей")
            setSearchResults([])
        } finally {
            setIsLoading(false)
        }
    }, [currentUser.id])

    useEffect(() => {
        if (debouncedSearchTerm) {
            fetchUsers(debouncedSearchTerm)
        } else {
            setSearchResults([])
        }
    }, [debouncedSearchTerm, fetchUsers])

    const handleUserClick = (user: UserType) => {
        onUserSelect(user)
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>Создать чат</h3>
                <input
                    type="search"
                    placeholder="Введите имя пользователя или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                    autoFocus
                />
                {isLoading && <p className={styles.loadingMessage}>Поиск...</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}

                {searchResults.length > 0 && !isLoading && (
                    <ul className={styles.resultsList}>
                        {searchResults.map((user) => (
                            <li key={user.id} onClick={() => handleUserClick(user)} className={styles.resultItem}>
                                <img
                                    src={user.avatar_url || '/images/unknown.jpg'}
                                    alt={user.username}
                                    className={styles.avatar}
                                />
                                <span className={styles.username}>{user.username}</span>
                            </li>
                        ))}
                    </ul>
                )}
                {!isLoading && !error && searchResults.length === 0 && debouncedSearchTerm && (
                    <p className={styles.noResultsMessage}>Пользователи не найдены.</p>
                )}
                {!isLoading && !debouncedSearchTerm && (
                    <p className={styles.noResultsMessage}>Начните вводить имя или email.</p>
                )}

                <button onClick={onClose} className={styles.closeButton}>
                    Отмена
                </button>
            </div>
        </div>
    );
}

export default CreateNewChatModal

import React from 'react';
import styles from './SearchHeader.module.css';
import { IoClose } from 'react-icons/io5';

interface SearchHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onClose: () => void;
}
//TODO: добавить дебаунс для поиска
const SearchHeader: React.FC<SearchHeaderProps> = ({
                                                       searchQuery,
                                                       onSearchChange,
                                                       onClose,
                                                   }) => {
    return (
        <div className={styles.searchHeader}>
            <input
                type="text"
                placeholder="Поиск в чате..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className={styles.searchInput}
            />
            <button onClick={onClose} className={styles.closeButton} aria-label="Закрыть поиск">
                <IoClose size={24} />
            </button>
        </div>
    );
};

export default SearchHeader;
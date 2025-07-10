import React from 'react';
import styles from './SearchResultsBar.module.css';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface SearchResultsBarProps {
    foundCount: number;
    currentIndex: number;
    onNavigate: (direction: 'up' | 'down') => void;
}

const SearchResultsBar: React.FC<SearchResultsBarProps> = ({
                                                               foundCount,
                                                               currentIndex,
                                                               onNavigate,
                                                           }) => {
    if (foundCount === 0) {
        return (
            <div className={`${styles.searchBar} ${styles.notFound}`}>
                Совпадений не найдено
            </div>
        );
    }

    return (
        <div className={styles.searchBar}>
            <span className={styles.counter}>
                {`${currentIndex + 1} из ${foundCount}`}
            </span>
            <div className={styles.navButtons}>
                <button
                    onClick={() => onNavigate('up')}
                    disabled={currentIndex >= foundCount - 1}
                    className={styles.navButton}
                    aria-label="Предыдущий результат">
                    <FaArrowUp />
                </button>
                <button
                    onClick={() => onNavigate('down')}
                    disabled={currentIndex <= 0}
                    className={styles.navButton}
                    aria-label="Следующий результат">
                    <FaArrowDown />
                </button>
            </div>
        </div>
    );
};

export default SearchResultsBar;
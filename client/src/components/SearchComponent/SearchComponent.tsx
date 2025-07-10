import styles from './SearchComponent.module.css'
import React from "react";

interface SearchComponentProps {
    onSearch?: (searchTerm: string) => void;
    placeholder?: string;
    initialValue?: string;
}

//TODO: реализовать поиск по по участникам чата, по названию чата, собщений в чате, поиск чатов по сообщениям.

function SearchComponent({
    onSearch,
    placeholder = "Поиск...",
    initialValue = ""
}: SearchComponentProps) {
    const [searchTerm, setSearchTerm] = React.useState(initialValue);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm);
        if (onSearch) {
            //TODO: добавить дебаунс
            onSearch(newSearchTerm);
        }
    }

    return (
        <form className={styles.searchContainer} role="search">
            <input
                type="search"
                placeholder = {placeholder}
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleChange}
                aria-label={placeholder}
            />
        </form>
    )
}

export default SearchComponent
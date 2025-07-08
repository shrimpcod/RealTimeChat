import React, {useEffect, useRef} from "react";
import styles from "./ContextMenu.module.css";

export interface ContextMenuOption {
    label: string;
    action: () => void;
    className?: string;
}

interface ContextMenuProps {
    options: ContextMenuOption[];
    position: {x: number; y: number};
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({options, position, onClose}) => {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)){
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        const handleKeyDown = (event: KeyboardEvent) => {
            if(event.key === 'Escape'){
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose]);

    return (
        <div className={styles.contextMenuOverlay} onClick={onClose}>
            <div
                ref={menuRef}
                className={styles.contextMenu}
                style={{ top: `${position.y}px`, left: `${position.x}px` }}
                onClick={(e) => e.stopPropagation()}
            >
                <ul className={styles.optionsList}>
                    {options.map((option, index) => (
                        <li key={index} className={styles.optionItem}>
                            <button
                                onClick={() => {
                                    option.action();
                                    onClose();
                                }}
                                className={`${styles.optionButton} ${option.className}`} //option.label === 'Удалить чат' ? styles.dangerAction : ''
                            >
                                {option.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default ContextMenu;
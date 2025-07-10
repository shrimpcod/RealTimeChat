import {Outlet} from 'react-router-dom'
import Dashboard from '../components/Dashboard/Dashboard';
import MobileDashboard from '../components/MobileDashboard/MobileDashborad';
import styles from './ChatLayout.module.css';
import {useAppSelector} from "../store/hooks";
import {selectActiveChatId} from "../store/features/chat/chatSlice";

function ChatLayout() {
    const activeChatId = useAppSelector(selectActiveChatId);
    return (
        <div className={styles.chatLayoutContainer}> {/* Используем класс из модуля */}
            <Dashboard />

            <main className={styles.mainContentWrapper}>
                <div className={styles.contentArea}>
                    <Outlet />
                </div>
            </main>
            {!activeChatId && (<MobileDashboard />)}
        </div>
    );
}

export default ChatLayout;
import {Routes, Route, Navigate} from 'react-router-dom'
import './styles/App.css';
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ChatLayout from './layouts/ChatLayout'
import ChatsPage from "./pages/ChatsPage/ChatsPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";

import {useAppDispatch, useAppSelector} from "./store/hooks";
import {
    fetchCurrentUser,
    selectAuthToken,
    selectIsAuthenticated,
    selectSessionRestoreStatus
} from "./store/features/auth/authSlice";
import useIsMobile from "./hooks/useIsMobile"
import {useEffect} from "react";
import {socketService} from "./services/socketService";
import ChatWindowPage from "./components/ChatWindowPage/ChatWindowPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import UserInfoPage from "./pages/UserInfoPage/UserInfoPage";

function App() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isMobile = useIsMobile();
    const sessionStatus = useAppSelector(selectSessionRestoreStatus)
    const token = useAppSelector(selectAuthToken);

    useEffect(() => {
        if (token){
            socketService.connect()
        } else {
            socketService.disconnect();
        }
    }, [token]);

    useEffect(() => {
        if(token && sessionStatus === 'idle'){
            dispatch(fetchCurrentUser())
        }
    }, [dispatch, sessionStatus, token]);

    return (
        <Routes>
            {!isAuthenticated && (
                <>
                    <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
                    <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            )}

            {isAuthenticated && (
                <>
                    <Route path="/" element={ <ChatLayout /> }>
                        <Route index element={<ChatsPage />} />
                        <Route path="chat/:chatId" element={isMobile ? <ChatWindowPage /> : <ChatsPage/>} />
                        <Route path="chat/:chatId/info" element={isMobile ? <UserInfoPage /> : <Navigate to="/" />} />
                        <Route path="profile" element={<ProfilePage />} />
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </>
            )}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App

import {authService} from "../../services/authApi";
import {logout} from "../../store/features/auth/authSlice";
import {useAppDispatch} from "../../store/hooks";
import {FaSignOutAlt} from "react-icons/fa";

interface LogoutButtonProps {
    className?: string;
    size?: number
}

function LogoutButton({className = '', size}: LogoutButtonProps){
    const dispatch = useAppDispatch();
    const handleLogout = async () => {
        try{
            await authService.logout();
        } catch (error) {
            console.error('Ошибка при вызове серверного logout: ', error);
        }
        dispatch(logout());
    }
    return (
        <button
            onClick={handleLogout}
            className={className}
            title="Выйти"
        >
            <FaSignOutAlt size={size} />
        </button>
    )
}

export default LogoutButton
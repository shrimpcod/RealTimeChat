import {useState, FormEvent, useEffect} from "react";
import {Link, useNavigate} from "react-router-dom";
import {ApiError, authService} from "../../services/authApi.js";
import  styles from './Auth.module.css'
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
    setCredentials,
    setLoading,
    setValidationError,
    clearAuthErrors,
    selectAuthIsLoading,
    selectAuthFieldErrors,
    selectAuthGeneralError

} from "../../store/features/auth/authSlice";

function RegisterPage() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const navigate = useNavigate()
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectAuthIsLoading)
    const fieldErrors = useAppSelector(selectAuthFieldErrors)
    const generalError = useAppSelector(selectAuthGeneralError)

    useEffect(() => {
        dispatch(clearAuthErrors());
    }, [dispatch]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        dispatch(setLoading(true))
        try{
            const data = await authService.register({email, username, password})
            dispatch(setCredentials({user: data.user, token: data.token}))
            navigate('/')
        } catch (err: any){
            const apiError = err as ApiError
            dispatch(setValidationError({errors: apiError.errors, message: apiError.message}));
            console.error('Ошибка регистрации:', err);
        }
    }
    return (
        <div className={styles.authContainer}>
            <h2>Регистрация</h2>
            {generalError && (<p className={styles.errorMessage}>{generalError}</p>)}
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="username">Имя пользователя</label>
                    <input
                        className={`${styles.inputField} ${fieldErrors?.username ? styles.inputError : ''}`}
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => dispatch(clearAuthErrors())}
                    />
                    {fieldErrors?.username && (<p className={styles.fieldErrorMessage}>{fieldErrors.username}</p>)}
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="email">Почта</label>
                    <input
                        className={`${styles.inputField} ${fieldErrors?.email ? styles.inputError : ''}`}
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => dispatch(clearAuthErrors())}
                    />
                    {fieldErrors?.email && (<p className={styles.fieldErrorMessage}>{fieldErrors.email}</p>)}
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="password">Пароль</label>
                    <input
                        className={`${styles.inputField} ${fieldErrors?.password ? styles.inputError : ''}`}
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => dispatch(clearAuthErrors())}
                    />
                    {fieldErrors?.password && (<p className={styles.fieldErrorMessage}>{fieldErrors.password}</p>)}
                </div>
                <button
                    className={styles.submitButton}
                    disabled={isLoading}
                    type="submit">
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>
            <p className={styles.switchAuth}>
                Уже есть аккаунт? <Link to="/login" className={styles.switchAuthLink}>Войти</Link>
            </p>
        </div>
    )
}

export default RegisterPage;

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {ApiError, authService} from '../../services/authApi';
import styles from './Auth.module.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    setCredentials,
    setLoading,
    setValidationError,
    clearAuthErrors,
    selectAuthIsLoading,
    selectAuthFieldErrors,
    selectAuthGeneralError
} from '../../store/features/auth/authSlice';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectAuthIsLoading);
    const fieldErrors = useAppSelector(selectAuthFieldErrors);
    const generalError = useAppSelector(selectAuthGeneralError);

    useEffect(() => {
        dispatch(clearAuthErrors());
    }, [dispatch]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(setLoading(true));
        try {
            const data = await authService.login({ email, password });
            dispatch(setCredentials({ user: data.user, token: data.token }));
            navigate('/');
        } catch (err: any) {
            const apiError = err as ApiError;
            dispatch(setValidationError({errors: apiError.errors, message: apiError.message}));
            console.error('Ошибка регистрации:', err);
        }
    };

    return (
        <div className={styles.authContainer}>
            <h2>Вход</h2>
            {generalError && (<p className={styles.errorMessage}>{generalError}</p>)}
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="email">Email:</label>
                    <input
                        className={`${styles.inputField} ${fieldErrors?.email ? styles.inputError : ''}`}
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => dispatch(clearAuthErrors())}
                        disabled={isLoading}
                    />
                    {fieldErrors?.email && (<p className={styles.fieldErrorMessage}>{fieldErrors.email}</p>)}
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="password">Пароль:</label>
                    <input
                        className={`${styles.inputField} ${fieldErrors?.password ? styles.inputError : ''}`}
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => dispatch(clearAuthErrors())}
                        disabled={isLoading}
                    />
                    {fieldErrors?.password && (<p className={styles.fieldErrorMessage}>{fieldErrors.password}</p>)}
                </div>
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading}
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            <p className={styles.switchAuth}>
                Нет аккаунта? <Link to="/register" className={styles.switchAuthLink}>Зарегистрироваться</Link>
            </p>
        </div>
    );
}

export default LoginPage;
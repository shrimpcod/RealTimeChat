// src/pages/auth/RegisterPage.tsx

import { Link } from 'react-router-dom';
import { authService } from '../../services/authApi';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthFormLayout } from '../../layouts/auth/AuthFormLayout';
import { AuthInput } from '../../components/AuthInput/Authinput';

function RegisterPage() {
    const {
        formData,
        isLoading,
        fieldErrors,
        generalError,
        handleChange,
        handleFocus,
        handleSubmit,
    } = useAuthForm({ email: '', username: '', password: '' }, authService.register);

    return (
        <AuthFormLayout
            title="Регистрация"
            generalError={generalError}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            buttonText="Зарегистрироваться"
            footer={
                <>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </>
            }
        >
            <AuthInput
                label="Имя пользователя"
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                onFocus={handleFocus}
                error={fieldErrors?.username}
                disabled={isLoading}
            />
            <AuthInput
                label="Почта"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleFocus}
                error={fieldErrors?.email}
                disabled={isLoading}
            />
            <AuthInput
                label="Пароль"
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={handleFocus}
                error={fieldErrors?.password}
                disabled={isLoading}
            />
        </AuthFormLayout>
    );
}

export default RegisterPage;

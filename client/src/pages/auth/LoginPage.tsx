import { Link } from 'react-router-dom';
import { authService } from '../../services/authApi';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthFormLayout } from '../../layouts/auth/AuthFormLayout';
import { AuthInput } from '../../components/AuthInput/Authinput';

function LoginPage() {
    const {
        formData,
        isLoading,
        fieldErrors,
        generalError,
        handleChange,
        handleFocus,
        handleSubmit,
    } = useAuthForm({ email: '', password: '' }, authService.login);

    return (
        <AuthFormLayout
            title="Вход"
            generalError={generalError}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            buttonText="Войти"
            footer={
                <>
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </>
            }
        >
            <AuthInput
                label="Email:"
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
                label="Пароль:"
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

export default LoginPage;
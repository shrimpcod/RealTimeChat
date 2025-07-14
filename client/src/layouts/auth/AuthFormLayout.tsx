import styles from './AuthFormLayout.module.css';
import React from "react";

interface AuthFormLayoutProps {
    title: string;
    generalError: string | null;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    buttonText: string;
    footer: React.ReactNode;
    children: React.ReactNode;
}

export const AuthFormLayout = ({
                                   title,
                                   generalError,
                                   onSubmit,
                                   isLoading,
                                   buttonText,
                                   footer,
                                   children
}: AuthFormLayoutProps) => {

    return (
        <div className={styles.authContainer}>
            <h2>{title}</h2>
            {generalError && (<p className={styles.errorMessage}>{generalError}</p>)}
            <form onSubmit={onSubmit}>
                {children}
                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                    {isLoading ? 'Загрузка...' : buttonText}
                </button>
            </form>
            <p className={styles.switchAuth}>{footer}</p>
        </div>
    );
};
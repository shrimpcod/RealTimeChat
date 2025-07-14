import styles from "./AuthInput.module.css"
import React from "react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const AuthInput = ({ label, id, error, ...props }: AuthInputProps) => {
    const inputClasses = `${styles.inputField} ${error ? styles.inputError : ''}`;
    return (
        <div className={styles.formGroup}>
            <label htmlFor={id}>{label}</label>
            <input id={id} className={inputClasses} {...props} />
            {error && <p className={styles.fieldErrorMessage}>{error}</p>}
        </div>
    );
};
import { useState, FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    setCredentials,
    setLoading,
    setValidationError,
    clearAuthErrors,
    selectAuthIsLoading,
    selectAuthFieldErrors,
    selectAuthGeneralError,
} from '../store/features/auth/authSlice';
import type { ApiError } from '../types/types';

type SubmitFunction<T> = (credentials: T) => Promise<{user: any; token: string}>;

export function useAuthForm<T>(initialState: T, submitFn: SubmitFunction<T>) {
    const [formData, setFormData] = useState(initialState);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isLoading = useAppSelector(selectAuthIsLoading);
    const fieldErrors = useAppSelector(selectAuthFieldErrors);
    const generalError = useAppSelector(selectAuthGeneralError);

    useEffect(() => {
        dispatch(clearAuthErrors());
    }, [dispatch])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    }

    const handleFocus = () => {
        dispatch(clearAuthErrors());
    }

    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(setLoading(true));
        try {
            const data = await submitFn(formData);
            dispatch(setCredentials({user: data.user, token: data.token }));
            navigate('/');
        } catch (error: any) {
            const apiError = error as ApiError;
            dispatch(setValidationError({errors: apiError.errors, message: apiError.message}));
            console.error('Ошибка аутентификации:', error);
        }
    }, [dispatch, navigate, formData, submitFn])

    return {
        formData,
        isLoading,
        fieldErrors,
        generalError,
        handleChange,
        handleFocus,
        handleSubmit,
    };
}
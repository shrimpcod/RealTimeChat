import type {ApiError} from "../types/types";

const BASE_URL = 'http://localhost:3001/api';

interface CustomHeaders {
    'Content-Type'?: string;
    'Authorization'?: string;
    'x-auth-token'?: string;
    [key: string]: string | undefined
}

export async function request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data: any = null
): Promise<T> {

    const headers: CustomHeaders = {
        'Content-Type': 'application/json',
    }

    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers: headers as HeadersInit
    }

    if(data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config)
        const responseData: any = await response.json().catch(() => ({}));

        if(!response.ok) {
            const message = responseData.errors && Array.isArray(responseData.errors)
                ? responseData.errors.map((e: {msg: string}) => e.msg).join(', ')
                : (responseData.msg || `Ошибка сервера: ${response.status}`)

            const apiError: ApiError = {
                status: response.status,
                message,
                errors: responseData.errors && Array.isArray(responseData.errors)
                    ? responseData.errors
                    : [{msg: message}]
            }

            return Promise.reject(apiError);
        }
        return responseData as T;
    } catch (err: any) {
        console.error('API Request Error:', err);
        const networkError: ApiError = {
            status: 0,
            message: err.message || 'Сетевая ошибка или сервер недоступен',
        };
        throw networkError;
    }
}
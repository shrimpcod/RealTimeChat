import {request} from "./api";
import {UserType, AuthApiResponse} from "../types/types";

interface UserCredentials {
    email: string
    password: string
}

interface UserRegistrationData extends UserCredentials {
    username: string
}

interface LogoutResponse {
    msg: string,
}

export const authService = {
    login: (credentials: UserCredentials): Promise<AuthApiResponse> => request<AuthApiResponse>('/auth/login', 'POST', credentials),
    register: (userData: UserRegistrationData): Promise<AuthApiResponse> => request<AuthApiResponse>('/auth/register', 'POST', userData),
    logout: (): Promise<LogoutResponse> => request<LogoutResponse>('/auth/logout', 'POST'),
    getMe: (): Promise<UserType> => request<UserType>('/auth/me', 'GET'),
}
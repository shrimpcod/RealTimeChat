import {request} from './api'
import type {UserType, ChangePasswordType} from "../types/types";

export const userApiService = {
    searchUsers: (query: string): Promise<UserType[]> => request<UserType[]>(`/users/search?q=${encodeURIComponent(query)}`, 'GET'),
    getUserProfile: (userId: string): Promise<UserType> => request<UserType>(`/users/${userId}`, 'GET'),
    updateUserProfile: (profileData: Partial<UserType>): Promise<UserType> => request<UserType>('/users/me', 'PUT', profileData),
    uploadAvatar: (formData: FormData): Promise<UserType> => {
        const token = localStorage.getItem('token')
        const headers: HeadersInit = {}
        if(token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return fetch('http://localhost:3001/api/users/me/avatar', {
            method: 'POST',
            headers,
            body: formData,
        }).then(async res => {
            const data = await res.json()
            if(!res.ok){
                return Promise.reject(res)
            }
            return data
        })
    },

    changePassword: (passwordData: ChangePasswordType): Promise<{msg: string}> => request<{msg: string}>('/users/me/change-password', 'POST', passwordData),
    deleteProfile: (): Promise<{msg: string}> => request<{msg: string}>('/users/me/delete-profile', 'DELETE'),
}
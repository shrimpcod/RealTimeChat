import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {AppDispatch, RootState} from "../../store";
import {ApiError, UserType, ChangePasswordType} from "../../../types/types";
import {authService} from "../../../services/authApi";
import {userApiService} from "../../../services/userApi";

export interface FieldValidationError {
    type?: string;
    value?: string;
    msg?: string;
    path?: string;
    location?: string;
}

export interface ValidationErrorsMap {
    [key: string]: string | undefined;
}

interface AuthState {
    user: UserType | null;
    token: string | null;
    isAuthenticated: boolean;
    sessionRestoreStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    isLoading: boolean;
    fieldErrors: ValidationErrorsMap | null;
    generalError: string | null;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    sessionRestoreStatus: 'idle',
    isLoading: false,
    fieldErrors: null,
    generalError: null
}

export const fetchCurrentUser = createAsyncThunk<
    UserType,
    void,
    {rejectValue: ApiError}
>(
    'auth/fetchCurrentUser',
    async (_, {rejectWithValue}) => {
        try{
            const userData = await authService.getMe()
            return userData as UserType
        } catch (error) {
            localStorage.removeItem('token');
            return rejectWithValue(error as ApiError);
        }
    })

export const updateProfile = createAsyncThunk<
    UserType,
    Partial<Pick<UserType, 'username' | 'email'>>,
    { rejectValue: ApiError }
>(
    'auth/updateProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            const updatedUser = await userApiService.updateUserProfile(profileData);
            return updatedUser;
        } catch (err) {
            return rejectWithValue(err as ApiError);
        }
    }
);

export const uploadUserAvatar = createAsyncThunk<
    UserType,
    FormData,
    {rejectValue: ApiError}
>(
    'auth/uploadUserAvatar',
    async (formData, {rejectWithValue}) => {
        try{
            const updatedUser = await userApiService.uploadAvatar(formData);
            return updatedUser;
        } catch (err) {
            return rejectWithValue(err as ApiError);
        }
    }
)

export const changePassword = createAsyncThunk<
    {msg: string},
    ChangePasswordType,
    { rejectValue: ApiError }
>(
    'auth/changePassword',
    async (passwordData, { rejectWithValue }) => {
        try{
            return await userApiService.changePassword(passwordData);
        } catch (err) {
            return rejectWithValue(err as ApiError);
        }
    }
)

export const deleteProfile = createAsyncThunk<
    {msg: string},
    void,
    {rejectValue: ApiError, dispatch: AppDispatch}
>(
    'auth/deleteProfile',
    async(_, {dispatch, rejectWithValue}) => {
        try{
            const response = await userApiService.deleteProfile()
            dispatch(logout())
            return response;
        } catch (err) {
            return rejectWithValue (err as ApiError);
        }
    }
)

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
            state.fieldErrors = null
            state.generalError = null
        },
        setCredentials: (state, action: PayloadAction<{user: User, token: string}>) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.isAuthenticated = true
            state.isLoading = false
            state.fieldErrors = null
            state.generalError = null
            localStorage.setItem('token', action.payload.token)
        },
        setValidationError: (state, action: PayloadAction<{errors?: FieldValidationError[], message?: string}>) => {
            state.isLoading = false
            state.fieldErrors = null
            state.generalError = null

            if (action.payload.errors && action.payload.errors.length > 0) {
                state.fieldErrors = action.payload.errors.reduce((acc, err) => {
                    if(err.path){
                        acc[err.path] = err.msg
                    }
                    return acc
                }, {} as ValidationErrorsMap)

                const generalMessages = action.payload.errors
                    .filter(err => !err.path)
                    .map(err => err.msg)

                if (generalMessages.length > 0) {
                    state.generalError = generalMessages.join('\n')
                } else if (!Object.keys(state.fieldErrors).length && action.payload.message) {
                    state.generalError = action.payload.message
                }
            } else if (action.payload.message){
                state.generalError = action.payload.message
            }
        },
        clearAuthErrors: (state) => {
            state.fieldErrors = null
            state.generalError = null
        },
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.isLoading = false
            state.fieldErrors = null
            state.generalError = null
            localStorage.removeItem('token')
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.sessionRestoreStatus = 'loading'
                state.generalError = null
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.sessionRestoreStatus = 'succeeded'
                state.user = action.payload
                state.isAuthenticated = true
                state.generalError = null
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.sessionRestoreStatus = 'failed'
                state.user = null
                state.isAuthenticated = false
                state.token = null
                state.generalError = action.payload?.message || 'Не удалось восстановить сессию'
            })

            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true
                state.generalError = null
            })
            .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserType>) => {
                state.isLoading = false
                state.user = action.payload
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false
                state.generalError = action.payload?.message || 'Не удалось обновить профиль'
            })

            .addCase(uploadUserAvatar.pending, (state) => {
                state.isLoading = true
            })
            .addCase(uploadUserAvatar.fulfilled, (state, action: PayloadAction<UserType>) => {
                state.isLoading = false
                state.user = action.payload
            })
            .addCase(uploadUserAvatar.rejected, (state, action) => {
                state.isLoading = false
                state.generalError = action.payload?.message || 'Не удалось загрузить аватар'
            })

            .addCase(changePassword.pending, (state) => {
                state.isLoading = true
                state.generalError = null
                state.fieldErrors = null
            })

            .addCase(changePassword.fulfilled, (state) => {
                state.isLoading = false
                //TODO: Показать сообщение об успехе и  в других компонентах изменений тоже это сделать
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false;
                if (action.payload?.errors) {
                    state.fieldErrors = action.payload.errors.reduce((acc, err) => {
                        if(err.path) acc[err.path] = err.msg;
                        return acc;
                    }, {} as ValidationErrorsMap);
                } else {
                    state.generalError = action.payload?.message || 'Не удалось сменить пароль';
                }
            })

            .addCase(deleteProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.generalError = action.payload?.message || 'Не удалось удалить профиль';
            });
    }
})

export const {
    setLoading,
    setCredentials,
    setValidationError,
    clearAuthErrors,
    logout
} = authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthToken = (state: RootState) => state.auth.token
export const selectAuthIsLoading = (state: RootState) => state.auth.isLoading
export const selectSessionRestoreStatus = (state: RootState) => state.auth.sessionRestoreStatus;
export const selectAuthFieldErrors = (state: RootState) => state.auth.fieldErrors;
export const selectAuthGeneralError = (state: RootState) => state.auth.generalError;

export default authSlice.reducer
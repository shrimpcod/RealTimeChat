import React, {useState, useRef, ChangeEvent, useEffect} from 'react'
import styles from './ProfilePage.module.css'
import { useAppDispatch, useAppSelector} from "../../store/hooks";
import {
    selectCurrentUser,
    updateProfile,
    uploadUserAvatar,
    selectAuthIsLoading,
    selectAuthGeneralError,
    selectAuthFieldErrors,
    clearAuthErrors,
    changePassword,
    deleteProfile,
} from "../../store/features/auth/authSlice";
import useIsMobile from "../../hooks/useIsMobile";
import {useNavigate} from "react-router-dom";
import {FaCamera} from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";
import {getFullAvatarUrl} from "../../utils/avatarUtils";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

const ChangePasswordForm = ({ onCancel }: { onCancel: () => void }) => {
    const dispatch = useAppDispatch();
    const fieldErrors = useAppSelector(selectAuthFieldErrors);
    const generalError = useAppSelector(selectAuthGeneralError);
    const isLoading = useAppSelector(selectAuthIsLoading);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        // Очищаем ошибки при монтировании формы
        return () => { dispatch(clearAuthErrors()); };
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearAuthErrors());
        const result = await dispatch(changePassword({ oldPassword, newPassword }));
        if (changePassword.fulfilled.match(result)) {
            alert("Пароль успешно изменен!");
            onCancel(); // Закрываем форму
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.changePasswordForm}>
            {generalError && <p className={styles.formErrorMessage}>{generalError}</p>}
            <div className={styles.formGroup}>
                <label htmlFor="oldPassword">Старый пароль</label>
                <input id="oldPassword" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required disabled={isLoading} />
                {fieldErrors?.oldPassword && <small className={styles.fieldErrorMessage}>{fieldErrors.oldPassword}</small>}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль</label>
                <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={isLoading} />
                {fieldErrors?.newPassword && <small className={styles.fieldErrorMessage}>{fieldErrors.newPassword}</small>}
            </div>

            <div className={styles.formActions}>
                <button type="submit" className={`${styles.actionButton} ${styles.saveButton}`} disabled={isLoading}>
                    {isLoading ? '...' : 'Сменить'}
                </button>
                <button type="button" className={`${styles.actionButton} ${styles.cancelButton}`} onClick={onCancel} disabled={isLoading}>
                    Отмена
                </button>
            </div>

        </form>
    );
};

function ProfilePage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const currentUser = useAppSelector(selectCurrentUser);
    const isLoading = useAppSelector(selectAuthIsLoading)
    const isMobile = useIsMobile();
    const generalError = useAppSelector(selectAuthGeneralError)

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            dispatch(clearAuthErrors());
        }
    }, [dispatch]);

    useEffect(() => {
        if(currentUser) {
            setUsername(currentUser.username);
            setEmail(currentUser.email || '');
        }
    }, [currentUser]);

    if(!currentUser) {
        return <div>Загрузка профиля...</div>
    }

    const handleSave = () => {
        const dataToUpdate: {username?: string, email?: string} = {}
        if(username.trim() && username !== currentUser.username) {
            dataToUpdate.username = username.trim()
        }
        if(email.trim() && email !== currentUser.email) {
            dataToUpdate.email = email
        }
        if(Object.keys(dataToUpdate).length > 0){
            dispatch(updateProfile(dataToUpdate))
                .unwrap()
                .then(() => {
                    setIsEditing(false);
                })
                .catch((err) => {
                    console.error("Ошибка обновления профиля (поймана в компоненте):", err);
                })
        } else {
            setIsEditing(false);
        }
    }

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        if(generalError){
            dispatch(clearAuthErrors());
        }
        setter(value);
    }

    const handleCancel = () => {
        setUsername(currentUser.username)
        setEmail(currentUser.email || '')
        setIsEditing(false);
        if(generalError){
            dispatch(clearAuthErrors());
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
        if(generalError){
            dispatch(clearAuthErrors());
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if(file){
            const formData = new FormData();
            formData.append('avatar', file);
            dispatch(uploadUserAvatar(formData))
        }
    }

    const handleDeleteProfile = () => dispatch(deleteProfile());

    const fullAvatarUrl = getFullAvatarUrl(currentUser)

    return (
        <div className={styles.profilePageContainer}>
            <header className={styles.header}>
                {isMobile && (
                    <button onClick={()=> navigate(-1)} className={styles.backButton} aria-label='Назад'>
                        <IoMdArrowRoundBack size={28} />
                    </button>
                )}
                <h2>Профиль</h2>
                {isMobile && (
                    <LogoutButton
                        className={styles.backButton}
                        size={26}
                    />
                )}
            </header>
            <div className={styles.content}>
                <div className={styles.avatarContainer}>
                    <img
                        src={fullAvatarUrl}
                        alt={`Аватар: ${currentUser.username}`}
                        className={styles.profileAvatar}
                    />
                    <button onClick={handleAvatarClick} className={styles.avatarEditButton} aria-label='Сменить фото'>
                        <FaCamera />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        disabled={isLoading}
                        onChange={handleFileChange}
                    />
                </div>

                <div className={styles.profileInfo}>
                    {generalError && <p className={styles.errorMessage}>{generalError}</p>}
                    {isEditing ? (
                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="username">Имя пользователя</label>
                                <input id="username" type="text" value={username} onChange={(e) => handleInputChange(setUsername, e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email</label>
                                <input id="email" type="email" value={email} onChange={(e) => handleInputChange(setEmail, e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.viewInfo}>
                            <h2>{currentUser.username}</h2>
                            <p>{currentUser.email}</p>
                        </div>
                    )}

                    <div className={`${styles.profileActions} ${isChangingPassword ? styles.notVisible : ''}`}>
                        {isEditing ? (
                            <>
                                <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={handleCancel} disabled={isLoading}>
                                    Отмена
                                </button>
                            </>
                        ) : (
                            <button className={`${styles.actionButton} ${styles.editButton}`} onClick={() => { setIsEditing(true); setIsChangingPassword(false); }}>
                                Редактировать профиль
                            </button>
                        )}
                    </div>
                </div>

                <div className={`${styles.securitySection} ${isEditing ? styles.notVisible : ''}`}>
                    {isChangingPassword ? (
                        <ChangePasswordForm onCancel={() => setIsChangingPassword(false)} />
                    ) : (
                        <button className={`${styles.actionButton} ${styles.changePasswordButton}`} onClick={() => { setIsChangingPassword(true); setIsEditing(false); }}>
                            Сменить пароль
                        </button>
                    )}
                </div>

                <div className={`${styles.dangerZone} ${isEditing || isChangingPassword ? styles.notVisible : ''}`}>
                    <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={() => setShowDeleteConfirm(true)}>
                        Удалить профиль
                    </button>
                </div>
            </div>

            {showDeleteConfirm && (
                <ConfirmationModal
                    message="Вы уверены, что хотите удалить свой профиль? Это действие необратимо."
                    onConfirm={handleDeleteProfile}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmText={"Удалить"}
                    cancelText={"Отмена"}
                    isDanger={true}
                />
            )}

        </div>
    )
}

export default ProfilePage;
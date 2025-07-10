export const getFullAvatarUrl = (user: {avatar_url?: string | null} | null | undefined) => {
    const API_BASE_URL = 'http://localhost:3001';
    const defaultAvatar = '/images/unknown.jpg'

    if(user && user.avatar_url){
        if(user.avatar_url.startsWith('http')){
            return user.avatar_url;
        }
        return `${API_BASE_URL}${user.avatar_url}`;
    }
    return defaultAvatar;
}
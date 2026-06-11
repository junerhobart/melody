const YOUTUBE_URL = /^https?:\/\/(www\.|music\.|m\.)?(youtube\.com|youtu\.be)\//i;
const SPOTIFY_URL = /^https?:\/\/(open\.)?spotify\.com\//i;
const SOUNDCLOUD_URL = /^https?:\/\/(www\.|m\.|on\.)?soundcloud\.com\//i;
const APPLE_MUSIC_URL = /^https?:\/\/music\.apple\.com\//i;
const DIRECT_MEDIA_URL = /^https?:\/\/\S+\.(mp3|ogg|oga|wav|flac|m4a|aac|opus|webm)(\?\S*)?$/i;

export const isYouTubeUrl = (query: string) => YOUTUBE_URL.test(query);
export const isSpotifyUrl = (query: string) => SPOTIFY_URL.test(query);
export const isSoundCloudUrl = (query: string) => SOUNDCLOUD_URL.test(query);
export const isAppleMusicUrl = (query: string) => APPLE_MUSIC_URL.test(query);
export const isDirectMediaUrl = (query: string) => DIRECT_MEDIA_URL.test(query);

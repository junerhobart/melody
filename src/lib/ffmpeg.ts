import ffmpegStatic from 'ffmpeg-static';

export function resolveFfmpegPath(): string | undefined {
  if (typeof ffmpegStatic === 'string' && ffmpegStatic.length > 0) {
    return ffmpegStatic;
  }
  return undefined;
}

/** yt-dlp streaming is slower but survives datacenter IPs and broken innertube streams. */
export function shouldUseYoutubeDl(): boolean {
  if (process.env.USE_YOUTUBE_DL === '1') return true;
  if (process.env.USE_YOUTUBE_DL === '0') return false;
  return process.env.NODE_ENV === 'production';
}

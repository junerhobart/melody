import {
  AppleMusicExtractor,
  AttachmentExtractor,
  SoundCloudExtractor,
  SpotifyExtractor,
} from '@discord-player/extractor';
import type { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';

/**
 * Youtubei is the only YouTube extractor — never load DefaultExtractors,
 * which would register the built-in one and conflict with it.
 * Spotify/Apple resolve metadata only (no API creds — track links work,
 * playlist resolution is best-effort) and bridge to a YouTube stream.
 */
export async function registerExtractors(player: Player): Promise<void> {
  await player.extractors.register(YoutubeiExtractor, {
    overrideBridgeMode: 'ytmusic',
    generateWithPoToken: true,
    streamOptions: { useClient: 'WEB' },
  });

  await player.extractors.register(SoundCloudExtractor, {});
  await player.extractors.register(AttachmentExtractor, {});
  await player.extractors.register(SpotifyExtractor, {});
  await player.extractors.register(AppleMusicExtractor, {});
}

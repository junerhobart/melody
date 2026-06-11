import { QueryType, type SearchQueryType } from 'discord-player';

import {
  isAppleMusicUrl,
  isDirectMediaUrl,
  isSoundCloudUrl,
  isSpotifyUrl,
  isYouTubeUrl,
} from './url-patterns';

type SearchEngine = SearchQueryType | `ext:${string}`;

export type ResolvedQuery = {
  query: string;
  searchEngine: SearchEngine;
  /** Retried once when the primary engine finds nothing (text search only). */
  fallbackEngine?: SearchEngine;
  /** Shown in the ephemeral reply so the user knows what matched. */
  sourceLabel: string;
};

export function resolvePlayQuery(raw: string): ResolvedQuery {
  const query = raw.trim();

  if (isYouTubeUrl(query)) {
    return { query, searchEngine: QueryType.AUTO, sourceLabel: 'YouTube' };
  }
  if (isSpotifyUrl(query)) {
    return { query, searchEngine: QueryType.AUTO, sourceLabel: 'Spotify → YouTube' };
  }
  if (isSoundCloudUrl(query)) {
    return { query, searchEngine: QueryType.AUTO, sourceLabel: 'SoundCloud' };
  }
  if (isAppleMusicUrl(query)) {
    return { query, searchEngine: QueryType.AUTO, sourceLabel: 'Apple Music → YouTube' };
  }
  if (isDirectMediaUrl(query)) {
    return { query, searchEngine: QueryType.AUTO, sourceLabel: 'Direct link' };
  }

  return {
    query,
    searchEngine: QueryType.YOUTUBE_SEARCH,
    fallbackEngine: QueryType.SOUNDCLOUD_SEARCH,
    sourceLabel: 'Search',
  };
}

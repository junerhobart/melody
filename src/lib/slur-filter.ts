/**
 * Slur filter for /play. Blocks query input and resolved track titles.
 *
 * ANTI_SLUR_MODE:
 *   off      — disabled
 *   users    — only IDs in ANTI_SLUR_USER_IDS (default mode)
 *   everyone — all users
 */

type SlurMode = 'off' | 'users' | 'everyone';

function resolveMode(): SlurMode {
  const raw = (process.env.ANTI_SLUR_MODE ?? 'off').toLowerCase();
  if (raw === 'users' || raw === 'everyone') return raw;
  return 'off';
}

function parseUserIds(): Set<string> {
  const raw = process.env.ANTI_SLUR_USER_IDS ?? '';
  return new Set(
    raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

const MODE: SlurMode = resolveMode();
const FILTERED_USER_IDS = parseUserIds();

const DEFAULT_BLOCK_MESSAGE = "That isn't allowed.";

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  $: 's',
  '7': 't',
  '+': 't',
  '8': 'b',
  '9': 'g',
  '6': 'g',
};

const COLLAPSED_PATTERNS = [
  /n+[i?]+g+(?:[e?]+r+|[a?]+)/,
  /f+[a?]+g+[o?]+t+/,
  /k+[i?]+k+[e?]+/,
  /t+r+[a?]+n+y+/,
];

const BLOCKED_WORDS = new Set([
  'nigger',
  'niggers',
  'nigga',
  'niggas',
  'fag',
  'fags',
  'faggot',
  'faggots',
  'kike',
  'kikes',
  'spic',
  'spics',
  'chink',
  'chinks',
  'coon',
  'coons',
  'tranny',
  'trannies',
  'wetback',
  'wetbacks',
  'beaner',
  'beaners',
]);

const FALSE_POSITIVES = /nigeria|fagott/g;

function deleet(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .map((char) => LEET[char] ?? char)
    .join('');
}

export function containsSlur(text: string): boolean {
  const deleeted = deleet(text).replace(FALSE_POSITIVES, '');

  const words = deleeted.split(/[^a-z]+/);
  if (words.some((word) => BLOCKED_WORDS.has(word))) return true;

  const collapsed = deleeted.replace(/[*#%]/g, '?').replace(/[^a-z?]/g, '');
  return COLLAPSED_PATTERNS.some((pattern) => pattern.test(collapsed));
}

export function isSlurBlockedFor(userId: string, text: string): boolean {
  if (MODE === 'off') return false;
  if (MODE === 'everyone') return containsSlur(text);
  return FILTERED_USER_IDS.has(userId) && containsSlur(text);
}

export function antiSlurMessage(): string {
  const custom = process.env.ANTI_SLUR_MESSAGE?.trim();
  return custom || DEFAULT_BLOCK_MESSAGE;
}

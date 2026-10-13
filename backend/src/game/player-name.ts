import { PLAYER_NAME_MAX_LENGTH } from '../contracts/game.contract.js';

/** Words that must not appear in player names shown on stand devices. */
const BLOCKED_WORDS = [
  'arschloch',
  'wichser',
  'hurensohn',
  'fotze',
  'schlampe',
  'missgeburt',
  'spast',
  'behindert',
  'schwuchtel',
  'nazi',
  'hitler',
  'fuck',
  'bitch',
  'nigger',
  'nigga',
  'neger',
  'penis',
  'porno',
  'sex',
  'pussy',
  'cunt',
  'fick',
  'scheiss',
  'idiot',
];

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
};

export type NameCheck =
  { ok: true; name: string } | { ok: false; reason: 'invalid' | 'blocked' };

/** Normalises a player name and rejects empty or offensive names. */
export function checkPlayerName(raw: unknown): NameCheck {
  if (typeof raw !== 'string') {
    return { ok: false, reason: 'invalid' };
  }

  const name = Array.from(
    raw
      .normalize('NFC')
      .replace(/[\p{Cc}\p{Cf}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .slice(0, PLAYER_NAME_MAX_LENGTH)
    .join('')
    .trim();

  if (name.length === 0) {
    return { ok: false, reason: 'invalid' };
  }

  const comparable = name
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/./g, (char) => LEET[char] ?? char)
    .replace(/[^a-zäöü]/g, '');

  if (BLOCKED_WORDS.some((word) => comparable.includes(word))) {
    return { ok: false, reason: 'blocked' };
  }

  return { ok: true, name };
}

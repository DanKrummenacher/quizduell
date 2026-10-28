// Empties the database for a handover or a fresh start: questions, their
// statistics, the played duels, the history and the ignored hints. The game
// settings go back to their defaults, the admin password stays.
//
//   DATABASE_URL='<External Database URL>' npm run db:reset -- --yes
//   DATABASE_URL='…' npm run db:reset -- --yes --keep-questions
//
// Without --yes the script only says what it would do.
import pg from 'pg';

const url = process.env['DATABASE_URL'];
const yes = process.argv.includes('--yes');
const keepQuestions = process.argv.includes('--keep-questions');

if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const tables = keepQuestions
  ? ['played_games', 'audit_log', 'dismissed_hints', 'deleted_questions']
  : [
      'played_games',
      'audit_log',
      'dismissed_hints',
      'deleted_questions',
      'question_daily',
      'questions',
    ];

const host = new URL(url).hostname;
console.log(`Database: ${host}`);
console.log(`Tables to empty: ${tables.join(', ')}`);
console.log(
  keepQuestions
    ? 'Questions stay; their statistics are set to zero.'
    : 'Questions are removed too.',
);
console.log('Settings go back to their defaults. The admin password stays.');

if (!yes) {
  console.log('\nDry run. Add --yes to do it.');
  process.exit(0);
}

const client = new pg.Client({
  connectionString: url,
  ssl: host.includes('.') ? { rejectUnauthorized: false } : undefined,
});
await client.connect();
try {
  await client.query('begin');
  await client.query(
    `truncate ${tables.map((table) => `"${table}"`).join(', ')} restart identity`,
  );
  if (keepQuestions) {
    await client.query(
      `update questions set times_asked = 0, times_correct = 0, timeouts = 0,
         answer_ms_total = 0, picks = '{0,0,0,0}'::integer[]`,
    );
    await client.query('truncate question_daily');
  }
  await client.query('delete from settings');
  await client.query('commit');
  console.log('\nDone. The backend applies the default settings at its next start.');
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  await client.end();
}

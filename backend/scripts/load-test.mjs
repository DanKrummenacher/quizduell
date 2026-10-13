// Simulates many simultaneous duels: node scripts/load-test.mjs <url> <duels>
import { io } from 'socket.io-client';

const url = process.argv[2] ?? 'http://localhost:3000';
const duels = Number(process.argv[3] ?? 100);
const stats = { finished: 0, aborted: 0, errors: 0, ackMs: [] };

function player(name) {
  const socket = io(url, { transports: ['websocket'], forceNew: true });
  let answered = -1;
  socket.on('game:state', (state) => {
    if (
      state.phase === 'question' &&
      state.question &&
      answered !== state.question.index
    ) {
      answered = state.question.index;
      // Answer after a human-like delay.
      setTimeout(
        async () => {
          const connected = (socket) =>
            socket.connected
              ? Promise.resolve()
              : new Promise((r) => socket.once('connect', r));

          const started = Date.now();
          const ack = await socket.emitWithAck('game:answer', {
            questionIndex: state.question.index,
            answerIndex: Math.floor(Math.random() * 4),
          });
          stats.ackMs.push(Date.now() - started);
          if (!ack.ok) stats.errors++;
        },
        300 + Math.random() * 2500,
      );
    }
    if (state.phase === 'finished' && !socket.done) {
      socket.done = true;
      stats.finished++;
      socket.close();
    }
    if (state.phase === 'aborted' && !socket.done) {
      socket.done = true;
      stats.aborted++;
      socket.close();
    }
  });
  return socket;
}

const connected = (socket) =>
  socket.connected
    ? Promise.resolve()
    : new Promise((r) => socket.once('connect', r));

const started = Date.now();
for (let i = 0; i < duels; i++) {
  const a = player(`A${i}`);
  const b = player(`B${i}`);
  await connected(a);
  await connected(b);
  const queued = await a.emitWithAck('matchmaking:start', {
    playerName: `Spieler ${i}a`,
  });
  const matched = await b.emitWithAck('matchmaking:start', {
    playerName: `Spieler ${i}b`,
  });
  if (!queued.ok || !matched.ok) stats.errors++;
}
console.log(`${duels} Duelle gestartet in ${Date.now() - started} ms`);

const timer = setInterval(() => {
  const done = stats.finished + stats.aborted;
  if (done >= duels * 2) {
    clearInterval(timer);
    const sorted = stats.ackMs.sort((x, y) => x - y);
    const p = (q) => sorted[Math.floor(sorted.length * q)] ?? 0;
    console.log(
      JSON.stringify(
        {
          players: duels * 2,
          finished: stats.finished,
          aborted: stats.aborted,
          errors: stats.errors,
          answers: sorted.length,
          ackMedianMs: p(0.5),
          ack95Ms: p(0.95),
          ack99Ms: p(0.99),
          totalSeconds: Math.round((Date.now() - started) / 1000),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }
}, 500);

export const SocketEvents = {
  CREATE_GAME: 'createGame',
  JOIN_GAME: 'joinGame',
  SUBMIT_ANSWER: 'submitAnswer',
  GAME_CREATED: 'gameCreated',
  GAME_START: 'gameStart',
  NEW_QUESTION: 'newQuestion',
  OPPONENT_ANSWERED: 'opponentAnswered',
  OPPONENT_LEFT: 'opponentLeft',
  ROUND_RESULT: 'roundResult',
  GAME_OVER: 'gameOver',
  ERROR: 'error',
} as const;

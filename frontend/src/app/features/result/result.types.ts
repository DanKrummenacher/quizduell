export interface PlayerResultView {
  name: string;
  score: number;
  cardState: 'win' | 'loss' | 'default';
  isMe: boolean;
}

/** Remaining time of a rematch request, shown like the quiz timer. */
export interface RematchCountdownView {
  secondsLeft: number;
  /** Share of the rematch window that is left, 0–100. */
  percent: number;
  /** The opponent is asking: shown in the opponent colour. */
  isOffer: boolean;
}

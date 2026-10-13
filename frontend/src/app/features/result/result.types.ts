export interface PlayerResultView {
  name: string;
  score: number;
  cardState: 'win' | 'loss' | 'default';
  isMe: boolean;
}

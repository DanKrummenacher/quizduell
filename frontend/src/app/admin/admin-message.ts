/** Feedback shown above an admin page after an action. */
export interface AdminMessage {
  variant: 'success' | 'error';
  text: string;
}

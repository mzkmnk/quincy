export function isInitializationComplete(message: string): boolean {
  const trimmed = message.trim().toLowerCase();

  // "You are chatting with" メッセージが最後の初期化メッセージ
  return /you are chatting with/i.test(trimmed) || /to exit.*cli.*press/i.test(trimmed);
}

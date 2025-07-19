export function isInitializationMessage(message: string): boolean {
  const trimmed = message.trim().toLowerCase();

  const initPatterns = [
    /mcp servers? initialized/i,
    /ctrl-c to start chatting/i,
    /✓.*loaded in.*s$/i,
    /welcome to amazon q/i,
    /you can resume.*conversation/i,
    /q chat --resume/i,
    /\/help.*commands/i,
    /ctrl.*new.*lines/i,
    /ctrl.*fuzzy.*search/i,
    /you are chatting with/i,
    /to exit.*cli.*press/i,
  ];

  return initPatterns.some(pattern => pattern.test(trimmed));
}

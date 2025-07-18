export function isThinkingMessage(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  return trimmed === 'thinking' || trimmed === 'thinking...' || 
         trimmed === 'thinking....' || /^thinking\.{0,4}$/i.test(trimmed);
}
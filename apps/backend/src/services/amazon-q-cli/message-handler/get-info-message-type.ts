export function getInfoMessageType(message: string): 'initialization' | 'status' | 'progress' | 'general' {
  const trimmed = message.trim().toLowerCase();
  
  if (trimmed.includes('welcome') || trimmed.includes('initialized') || trimmed.includes('starting')) {
    return 'initialization';
  }
  
  if (trimmed.includes('loaded') || trimmed.includes('ready') || trimmed.includes('connected')) {
    return 'status';
  }
  
  if (/\d+\s*of\s*\d+/.test(trimmed) || /\d+\.\d+\s*s/.test(trimmed) || trimmed.includes('progress')) {
    return 'progress';
  }
  
  if (trimmed === 'thinking' || trimmed === 'thinking...') {
    return 'progress';
  }
  
  return 'general';
}
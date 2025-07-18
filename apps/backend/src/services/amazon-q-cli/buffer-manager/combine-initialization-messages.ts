export function combineInitializationMessages(messages: string[]): string {
  const lines: string[] = [];
  const loadedServices: string[] = [];
  let mcpStatus = '';
  let welcomeMessage = '';
  let helpInfo: string[] = [];
  
  for (const message of messages) {
    const trimmed = message.trim();
    
    if (/✓.*loaded in.*s$/i.test(trimmed)) {
      // ロードされたサービスを抽出
      const match = trimmed.match(/✓\s*(.+?)\s+loaded/i);
      if (match) {
        loadedServices.push(match[1]);
      }
    } else if (/mcp servers? initialized/i.test(trimmed)) {
      // 最後のMCPステータスを保持
      if (trimmed.includes('✓ 2 of 2') || trimmed.includes('initialized.')) {
        mcpStatus = 'MCP servers initialized successfully';
      }
    } else if (/welcome to amazon q/i.test(trimmed)) {
      welcomeMessage = trimmed;
    } else if (/\/help|ctrl|you are chatting with|resume.*conversation/i.test(trimmed)) {
      helpInfo.push(trimmed);
    }
  }
  
  // 統合メッセージを構築
  if (welcomeMessage) {
    lines.push(welcomeMessage);
  }
  
  if (mcpStatus) {
    lines.push(mcpStatus);
  }
  
  if (loadedServices.length > 0) {
    lines.push(`Loaded services: ${loadedServices.join(', ')}`);
  }
  
  if (helpInfo.length > 0) {
    lines.push(''); // 空行
    lines.push('Available commands:');
    helpInfo.forEach(info => {
      if (!info.includes('You are chatting with')) {
        lines.push(`• ${info}`);
      }
    });
    
    // "You are chatting with" メッセージは最後に
    const modelInfo = helpInfo.find(info => info.includes('You are chatting with'));
    if (modelInfo) {
      lines.push('');
      lines.push(modelInfo);
    }
  }
  
  return lines.join('\n');
}
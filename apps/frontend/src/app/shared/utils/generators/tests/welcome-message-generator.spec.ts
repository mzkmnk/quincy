import { generateWelcomeMessage } from '../welcome-message-generator';

describe('generateWelcomeMessage', () => {
  it('ウェルカムメッセージを生成する', () => {
    const messages = generateWelcomeMessage();

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      id: 'welcome',
      content:
        "Hello! I'm Amazon Q, your AI coding assistant. How can I help you with your project today?",
      sender: 'assistant',
    });
    expect(messages[0].timestamp).toBeInstanceOf(Date);
  });

  it('毎回同じ内容のメッセージを生成する', () => {
    const messages1 = generateWelcomeMessage();
    const messages2 = generateWelcomeMessage();

    expect(messages1[0].id).toBe(messages2[0].id);
    expect(messages1[0].content).toBe(messages2[0].content);
    expect(messages1[0].sender).toBe(messages2[0].sender);
  });

  it('新しいタイムスタンプを生成する', () => {
    const messages1 = generateWelcomeMessage();
    const messages2 = generateWelcomeMessage();

    expect(messages2[0].timestamp.getTime()).toBeGreaterThanOrEqual(
      messages1[0].timestamp.getTime()
    );
  });
});

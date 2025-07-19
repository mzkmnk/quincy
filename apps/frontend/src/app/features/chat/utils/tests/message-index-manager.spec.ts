import { updateMessageIndexMap } from '../message-index-manager';

describe('updateMessageIndexMap', () => {
  let messageIndexMap: Map<string, number>;

  beforeEach(() => {
    messageIndexMap = new Map<string, number>();
  });

  describe('基本機能', () => {
    it('空のメッセージ配列でマップをクリアする', () => {
      // 既存のエントリを追加
      messageIndexMap.set('existing-1', 0);
      messageIndexMap.set('existing-2', 1);
      expect(messageIndexMap.size).toBe(2);

      updateMessageIndexMap(messageIndexMap, []);

      expect(messageIndexMap.size).toBe(0);
    });

    it('単一のメッセージでマップを更新する', () => {
      const messages = [{ id: 'msg-1' }];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(1);
      expect(messageIndexMap.get('msg-1')).toBe(0);
    });

    it('複数のメッセージでマップを更新する', () => {
      const messages = [
        { id: 'msg-1' },
        { id: 'msg-2' },
        { id: 'msg-3' }
      ];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(3);
      expect(messageIndexMap.get('msg-1')).toBe(0);
      expect(messageIndexMap.get('msg-2')).toBe(1);
      expect(messageIndexMap.get('msg-3')).toBe(2);
    });

    it('既存のマップエントリを正しく置き換える', () => {
      // 既存のエントリを設定
      messageIndexMap.set('old-msg-1', 0);
      messageIndexMap.set('old-msg-2', 1);

      const messages = [
        { id: 'new-msg-1' },
        { id: 'new-msg-2' }
      ];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(2);
      expect(messageIndexMap.has('old-msg-1')).toBe(false);
      expect(messageIndexMap.has('old-msg-2')).toBe(false);
      expect(messageIndexMap.get('new-msg-1')).toBe(0);
      expect(messageIndexMap.get('new-msg-2')).toBe(1);
    });
  });

  describe('様々なメッセージIDでの動作', () => {
    it('短いIDでも正常に動作する', () => {
      const messages = [{ id: '1' }, { id: 'a' }, { id: 'x' }];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get('1')).toBe(0);
      expect(messageIndexMap.get('a')).toBe(1);
      expect(messageIndexMap.get('x')).toBe(2);
    });

    it('長いIDでも正常に動作する', () => {
      const longId = 'very-long-message-id-' + 'x'.repeat(100);
      const messages = [{ id: longId }];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get(longId)).toBe(0);
    });

    it('特殊文字を含むIDでも正常に動作する', () => {
      const messages = [
        { id: 'msg-123-$%^&*()_+-=[]{}|;:,.<>?' },
        { id: 'msg@example.com' },
        { id: 'msg#hash' },
        { id: 'msg/with/slashes' }
      ];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get('msg-123-$%^&*()_+-=[]{}|;:,.<>?')).toBe(0);
      expect(messageIndexMap.get('msg@example.com')).toBe(1);
      expect(messageIndexMap.get('msg#hash')).toBe(2);
      expect(messageIndexMap.get('msg/with/slashes')).toBe(3);
    });

    it('Unicode文字を含むIDでも正常に動作する', () => {
      const messages = [
        { id: 'msg-日本語-123' },
        { id: 'msg-中文-456' },
        { id: 'msg-русский-789' },
        { id: 'msg-🚀-emoji' }
      ];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get('msg-日本語-123')).toBe(0);
      expect(messageIndexMap.get('msg-中文-456')).toBe(1);
      expect(messageIndexMap.get('msg-русский-789')).toBe(2);
      expect(messageIndexMap.get('msg-🚀-emoji')).toBe(3);
    });

    it('空文字列のIDでも正常に動作する', () => {
      const messages = [{ id: '' }];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get('')).toBe(0);
    });
  });

  describe('重複IDの処理', () => {
    it('重複するIDがある場合、最後のインデックスが保存される', () => {
      const messages = [
        { id: 'duplicate' },
        { id: 'unique-1' },
        { id: 'duplicate' },
        { id: 'unique-2' }
      ];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(3); // duplicate, unique-1, unique-2
      expect(messageIndexMap.get('duplicate')).toBe(2); // 最後のインデックス
      expect(messageIndexMap.get('unique-1')).toBe(1);
      expect(messageIndexMap.get('unique-2')).toBe(3);
    });

    it('全て同じIDの場合、最後のインデックスが保存される', () => {
      const messages = [
        { id: 'same' },
        { id: 'same' },
        { id: 'same' }
      ];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(1);
      expect(messageIndexMap.get('same')).toBe(2);
    });
  });

  describe('追加プロパティを持つメッセージオブジェクト', () => {
    it('idプロパティ以外の追加プロパティがあっても正常に動作する', () => {
      const messages = [
        { id: 'msg-1', content: 'Hello', timestamp: Date.now() },
        { id: 'msg-2', content: 'World', author: 'user', metadata: { type: 'text' } }
      ] as any[];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(2);
      expect(messageIndexMap.get('msg-1')).toBe(0);
      expect(messageIndexMap.get('msg-2')).toBe(1);
    });

    it('ネストしたオブジェクトを含むメッセージでも正常に動作する', () => {
      const messages = [
        {
          id: 'complex-msg',
          data: {
            nested: {
              deeply: {
                value: 'test'
              }
            }
          },
          array: [1, 2, 3]
        }
      ] as any[];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get('complex-msg')).toBe(0);
    });
  });

  describe('大量データでのパフォーマンス', () => {
    it('大量のメッセージでも効率的に処理される', () => {
      const messages = Array.from({ length: 10000 }, (_, i) => ({ id: `msg-${i}` }));

      const start = performance.now();
      updateMessageIndexMap(messageIndexMap, messages);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(messageIndexMap.size).toBe(10000);
      expect(messageIndexMap.get('msg-0')).toBe(0);
      expect(messageIndexMap.get('msg-9999')).toBe(9999);
    });

    it('複数回の更新でも効率的に動作する', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        const messages = Array.from({ length: 100 }, (_, j) => ({ id: `batch-${i}-msg-${j}` }));
        updateMessageIndexMap(messageIndexMap, messages);
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(messageIndexMap.size).toBe(100); // 最後のバッチのみ残る
    });
  });

  describe('エッジケース', () => {
    it('同じMapオブジェクトを複数回更新できる', () => {
      const messages1 = [{ id: 'msg-1' }, { id: 'msg-2' }];
      const messages2 = [{ id: 'msg-3' }, { id: 'msg-4' }, { id: 'msg-5' }];

      updateMessageIndexMap(messageIndexMap, messages1);
      expect(messageIndexMap.size).toBe(2);

      updateMessageIndexMap(messageIndexMap, messages2);
      expect(messageIndexMap.size).toBe(3);
      expect(messageIndexMap.has('msg-1')).toBe(false);
      expect(messageIndexMap.has('msg-2')).toBe(false);
      expect(messageIndexMap.get('msg-3')).toBe(0);
      expect(messageIndexMap.get('msg-4')).toBe(1);
      expect(messageIndexMap.get('msg-5')).toBe(2);
    });

    it('非常に大きなインデックス値でも正常に動作する', () => {
      const messages = Array.from({ length: Number.MAX_SAFE_INTEGER > 100000 ? 100000 : 1000 }, (_, i) => ({ id: `msg-${i}` }));

      updateMessageIndexMap(messageIndexMap, messages);

      const lastIndex = messages.length - 1;
      expect(messageIndexMap.get(`msg-${lastIndex}`)).toBe(lastIndex);
    });

    it('Mapの参照が変更されない', () => {
      const originalMap = messageIndexMap;
      const messages = [{ id: 'test' }];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap).toBe(originalMap);
    });

    it('メッセージ配列が変更されても影響を受けない', () => {
      const messages = [{ id: 'msg-1' }, { id: 'msg-2' }];

      updateMessageIndexMap(messageIndexMap, messages);

      // 元の配列を変更
      messages.push({ id: 'msg-3' });
      messages[0].id = 'modified-id';

      // マップは影響を受けない
      expect(messageIndexMap.size).toBe(2);
      expect(messageIndexMap.get('msg-1')).toBe(0);
      expect(messageIndexMap.get('msg-2')).toBe(1);
      expect(messageIndexMap.has('msg-3')).toBe(false);
      expect(messageIndexMap.has('modified-id')).toBe(false);
    });
  });

  describe('戻り値の確認', () => {
    it('関数の戻り値がvoidである', () => {
      const messages = [{ id: 'test' }];
      const result = updateMessageIndexMap(messageIndexMap, messages);

      expect(result).toBeUndefined();
    });
  });

  describe('実際の使用シナリオ', () => {
    it('チャットメッセージリストの更新をシミュレート', () => {
      // 初期メッセージ
      const initialMessages = [
        { id: 'msg-1' },
        { id: 'msg-2' },
        { id: 'msg-3' }
      ];

      updateMessageIndexMap(messageIndexMap, initialMessages);
      expect(messageIndexMap.get('msg-2')).toBe(1);

      // 新しいメッセージが追加された状態
      const updatedMessages = [
        { id: 'msg-1' },
        { id: 'msg-2' },
        { id: 'msg-3' },
        { id: 'msg-4' },
        { id: 'msg-5' }
      ];

      updateMessageIndexMap(messageIndexMap, updatedMessages);
      expect(messageIndexMap.size).toBe(5);
      expect(messageIndexMap.get('msg-2')).toBe(1); // インデックスは変わらない
      expect(messageIndexMap.get('msg-4')).toBe(3);
      expect(messageIndexMap.get('msg-5')).toBe(4);
    });

    it('メッセージの削除をシミュレート', () => {
      const originalMessages = [
        { id: 'msg-1' },
        { id: 'msg-2' },
        { id: 'msg-3' },
        { id: 'msg-4' }
      ];

      updateMessageIndexMap(messageIndexMap, originalMessages);
      expect(messageIndexMap.get('msg-3')).toBe(2);

      // msg-2が削除された状態
      const afterDeletion = [
        { id: 'msg-1' },
        { id: 'msg-3' },
        { id: 'msg-4' }
      ];

      updateMessageIndexMap(messageIndexMap, afterDeletion);
      expect(messageIndexMap.size).toBe(3);
      expect(messageIndexMap.has('msg-2')).toBe(false);
      expect(messageIndexMap.get('msg-3')).toBe(1); // インデックスが変更される
      expect(messageIndexMap.get('msg-4')).toBe(2);
    });
  });
});
import { updateMessageIndexMap } from '../message-index-manager';

describe('message-index-manager', () => {
  describe('updateMessageIndexMap', () => {
    it('空のメッセージ配列で正常に動作する', () => {
      const messageIndexMap = new Map<string, number>();
      const messages: { id: string }[] = [];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.size).toBe(0);
    });

    it('メッセージ配列のインデックスマップを正しく更新する', () => {
      const messageIndexMap = new Map<string, number>();
      const messages = [{ id: 'msg-1' }, { id: 'msg-2' }, { id: 'msg-3' }];

      updateMessageIndexMap(messageIndexMap, messages);

      expect(messageIndexMap.get('msg-1')).toBe(0);
      expect(messageIndexMap.get('msg-2')).toBe(1);
      expect(messageIndexMap.get('msg-3')).toBe(2);
    });
  });
});

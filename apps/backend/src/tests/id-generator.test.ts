/**
 * ID生成ユーティリティのテスト
 */

import {
  generateId,
  generateRandomString,
  generateMessageId,
  generateSessionId,
} from '../utils/id-generator';

describe('ID生成ユーティリティ', () => {
  describe('generateRandomString', () => {
    it('デフォルトの長さ（9文字）のランダム文字列を生成する', () => {
      const result = generateRandomString();
      expect(result).toMatch(/^[a-z0-9]{9}$/);
    });

    it('指定された長さのランダム文字列を生成する', () => {
      const length = 5;
      const result = generateRandomString(length);
      expect(result).toMatch(/^[a-z0-9]{5}$/);
    });

    it('連続した呼び出しで異なる文字列を生成する', () => {
      const result1 = generateRandomString();
      const result2 = generateRandomString();
      expect(result1).not.toBe(result2);
    });
  });

  describe('generateId', () => {
    it('プレフィックス付きのIDを生成する', () => {
      const prefix = 'test';
      const result = generateId(prefix);
      expect(result).toMatch(/^test_\d+_[a-z0-9]{9}$/);
    });

    it('カスタムランダム長さでIDを生成する', () => {
      const prefix = 'custom';
      const randomLength = 5;
      const result = generateId(prefix, randomLength);
      expect(result).toMatch(/^custom_\d+_[a-z0-9]{5}$/);
    });

    it('連続した呼び出しで異なるIDを生成する', () => {
      const prefix = 'test';
      const result1 = generateId(prefix);
      const result2 = generateId(prefix);
      expect(result1).not.toBe(result2);
    });

    it('タイムスタンプが含まれている', () => {
      const prefix = 'test';
      const beforeTime = Date.now();
      const result = generateId(prefix);
      const afterTime = Date.now();

      const parts = result.split('_');
      const timestamp = parseInt(parts[1]);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('generateMessageId', () => {
    it('msgプレフィックスでIDを生成する', () => {
      const result = generateMessageId();
      expect(result).toMatch(/^msg_\d+_[a-z0-9]{9}$/);
    });

    it('連続した呼び出しで異なるIDを生成する', () => {
      const result1 = generateMessageId();
      const result2 = generateMessageId();
      expect(result1).not.toBe(result2);
    });
  });

  describe('generateSessionId', () => {
    it('q_sessionプレフィックスでIDを生成する', () => {
      const result = generateSessionId();
      expect(result).toMatch(/^q_session_\d+_[a-z0-9]{9}$/);
    });

    it('連続した呼び出しで異なるIDを生成する', () => {
      const result1 = generateSessionId();
      const result2 = generateSessionId();
      expect(result1).not.toBe(result2);
    });
  });

  describe('ID形式の一貫性', () => {
    it('すべてのID生成関数が一貫した形式を使用する', () => {
      const messageId = generateMessageId();
      const sessionId = generateSessionId();

      // 基本的な構造: prefix_timestamp_randomString
      expect(messageId.split('_')).toHaveLength(3);
      expect(sessionId.split('_')).toHaveLength(4); // q_session_timestamp_randomString

      // タイムスタンプが数値であることを確認
      const messageTimestamp = parseInt(messageId.split('_')[1]);
      const sessionTimestamp = parseInt(sessionId.split('_')[2]);

      expect(messageTimestamp).toBeGreaterThan(0);
      expect(sessionTimestamp).toBeGreaterThan(0);
    });
  });
});

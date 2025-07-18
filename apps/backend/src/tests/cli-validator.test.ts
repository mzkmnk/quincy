/**
 * CLI検証ユーティリティのテスト
 */

import { isValidCLIPath, getCLICandidates, checkCLIAvailability } from '../utils/cli-validator';

describe('CLI検証ユーティリティ', () => {
  describe('isValidCLIPath', () => {
    it('有効なCLIパス（q）を承認する', () => {
      expect(isValidCLIPath('q')).toBe(true);
    });

    it('有効なCLIパス（/usr/local/bin/q）を承認する', () => {
      expect(isValidCLIPath('/usr/local/bin/q')).toBe(true);
    });

    it('有効なCLIパス（/opt/homebrew/bin/q）を承認する', () => {
      expect(isValidCLIPath('/opt/homebrew/bin/q')).toBe(true);
    });

    it('空文字列を拒否する', () => {
      expect(isValidCLIPath('')).toBe(false);
    });

    it('null/undefinedを拒否する', () => {
      expect(isValidCLIPath(null as any)).toBe(false);
      expect(isValidCLIPath(undefined as any)).toBe(false);
    });

    it('危険な文字を含むパスを拒否する', () => {
      expect(isValidCLIPath('q; rm -rf /')).toBe(false);
      expect(isValidCLIPath('q && malicious')).toBe(false);
      expect(isValidCLIPath('q | evil')).toBe(false);
      expect(isValidCLIPath('q `danger`')).toBe(false);
      expect(isValidCLIPath('q $injection')).toBe(false);
    });

    it('許可されていないパスを拒否する', () => {
      expect(isValidCLIPath('/bin/sh')).toBe(false);
      expect(isValidCLIPath('/usr/bin/malicious')).toBe(false);
      expect(isValidCLIPath('random-command')).toBe(false);
    });

    it('ユーザーローカルパスを承認する', () => {
      const userPath = '/home/testuser/.local/bin/q';
      expect(isValidCLIPath(userPath)).toBe(true);
    });
  });

  describe('getCLICandidates', () => {
    it('CLI候補パスのリストを返す', () => {
      const candidates = getCLICandidates();
      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates).toContain('q');
      expect(candidates).toContain('/usr/local/bin/q');
      expect(candidates).toContain('/opt/homebrew/bin/q');
    });

    it('undefined要素を含まない', () => {
      const candidates = getCLICandidates();
      expect(candidates.every(path => path !== undefined)).toBe(true);
    });
  });

  describe('checkCLIAvailability', () => {
    it('利用可能性チェック結果を返す', async () => {
      const result = await checkCLIAvailability();
      
      expect(result).toHaveProperty('available');
      expect(typeof result.available).toBe('boolean');
      
      if (result.available) {
        expect(result).toHaveProperty('path');
        expect(typeof result.path).toBe('string');
      } else {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('CLIが見つからない場合、適切なエラーメッセージを返す', async () => {
      // 実際のシステムに依存するため、CLIが見つからない場合のテスト
      const result = await checkCLIAvailability();
      
      if (!result.available) {
        expect(result.error).toContain('Amazon Q CLI not found');
        expect(result.error).toContain('Tried paths:');
      }
    });
  });
});
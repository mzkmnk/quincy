/**
 * 危険なパスの定数定義
 * システムディレクトリなど、アクセスを制限すべきパスのリスト
 */

/**
 * アクセスを制限すべき危険なパスのリスト
 * セキュリティ上の理由でプロジェクトパスとして使用を禁止するディレクトリ
 */
export const DANGEROUS_PATHS: readonly string[] = [
  '/',
  '/etc',
  '/bin',
  '/usr/bin',
  '/sbin',
  '/usr/sbin',
  '/var',
  '/tmp',
  '/System',
  '/Applications'
] as const;

/**
 * 危険なパスのリストを取得する
 * @returns 危険なパスの配列
 */
export function getDangerousPaths(): readonly string[] {
  return DANGEROUS_PATHS;
}
import { currentQConversation } from '../amazon-q-history.state';

/**
 * 現在のAmazon Q会話を取得する
 * @returns 現在のAmazon Q会話
 */
export function getCurrentQConversation() {
  return currentQConversation;
}
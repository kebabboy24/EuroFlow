import {
  operatorTelegramConfig,
  sendOperatorTelegramMessage,
  type OperatorNotificationResult,
} from "@/lib/telegram/operator-notifications";

export type TelegramNotifyResult = OperatorNotificationResult;

export function telegramNotifyConfig() {
  return operatorTelegramConfig();
}

export async function sendTelegramNotification(text: string): Promise<TelegramNotifyResult> {
  return sendOperatorTelegramMessage(text);
}

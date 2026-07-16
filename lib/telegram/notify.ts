type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
  error_code?: number;
};

export type TelegramNotifyResult = {
  ok: boolean;
  chatIdConfigured: boolean;
  tokenConfigured: boolean;
  description?: string;
  errorCode?: number;
};

export function telegramNotifyConfig() {
  return {
    token: process.env.TELEGRAM_NOTIFY_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
  };
}

export async function sendTelegramNotification(text: string): Promise<TelegramNotifyResult> {
  const { token, chatId } = telegramNotifyConfig();

  if (!token || !chatId) {
    return {
      ok: false,
      tokenConfigured: Boolean(token),
      chatIdConfigured: Boolean(chatId),
      description: !token ? "Telegram notify bot token is not configured." : "Telegram chat id is not configured.",
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const result = (await response.json().catch(() => ({}))) as TelegramApiResponse;

    if (!response.ok || result.ok === false) {
      return {
        ok: false,
        tokenConfigured: true,
        chatIdConfigured: true,
        description: result.description || `Telegram API returned HTTP ${response.status}`,
        errorCode: result.error_code,
      };
    }

    return { ok: true, tokenConfigured: true, chatIdConfigured: true };
  } catch (error) {
    return {
      ok: false,
      tokenConfigured: true,
      chatIdConfigured: true,
      description: error instanceof Error ? error.message : "Telegram request failed.",
    };
  }
}

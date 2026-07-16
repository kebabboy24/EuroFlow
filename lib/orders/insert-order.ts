const OPTIONAL_ORDER_COLUMNS = new Set([
  "source",
  "telegram_chat_id",
  "telegram_user_id",
  "receive_currency",
  "send_region",
  "send_method",
  "send_bank",
  "receive_region",
  "receive_method",
  "receive_bank",
  "payout_details",
  "payment_reference",
  "rate_value",
]);

type InsertOrderResult = {
  data: { id?: string; [key: string]: unknown } | null;
  error: { message?: string; code?: string } | null;
  omittedColumns: string[];
};

function missingSchemaColumn(error: { message?: string; code?: string } | null) {
  if (!error?.message) return null;
  if (error.code && error.code !== "PGRST204") return null;

  const match = error.message.match(/'([^']+)' column of 'orders'/);
  return match?.[1] || null;
}

export async function insertOrderWithSchemaFallback(
  supabase: any,
  order: Record<string, unknown>,
  select = "*"
): Promise<InsertOrderResult> {
  const payload = { ...order };
  const omittedColumns: string[] = [];

  for (let attempt = 0; attempt < OPTIONAL_ORDER_COLUMNS.size + 1; attempt += 1) {
    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select(select)
      .single();

    if (!error) return { data, error: null, omittedColumns };

    const column = missingSchemaColumn(error);
    if (column && OPTIONAL_ORDER_COLUMNS.has(column) && column in payload) {
      delete payload[column];
      omittedColumns.push(column);
      continue;
    }

    return { data: null, error, omittedColumns };
  }

  return {
    data: null,
    error: { message: "Не удалось сохранить заявку из-за схемы базы данных." },
    omittedColumns,
  };
}

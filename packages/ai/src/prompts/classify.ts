/**
 * Module 2 — Document Classification Prompt
 */
export const CLASSIFY_DOCUMENT_PROMPT = `Проанализируй документ и верни ТОЛЬКО JSON без любых пояснений.

Определи:
1. type: "INVOICE" | "ACT" | "CONTRACT" | "RECEIPT" | "WAYBILL" | "UPD" | "OTHER"
2. contractorName: название контрагента (строка или null)
3. contractorInn: ИНН контрагента (строка или null)  
4. amount: сумма документа (число или null)
5. currency: валюта "RUB" | "USD" | "EUR" | "KZT" | "UZS" (строка)
6. documentDate: дата документа в ISO формате (строка или null)
7. documentNumber: номер документа (строка или null)
8. tags: массив из 3-5 тегов для поиска (например: ["строительство", "ООО Ромашка", "услуги"])

Верни строго JSON:
{
  "type": "ACT",
  "contractorName": "ООО Ромашка",
  "contractorInn": "7707083893",
  "amount": 150000.00,
  "currency": "RUB",
  "documentDate": "2024-03-15T00:00:00.000Z",
  "documentNumber": "А-2024-042",
  "tags": ["услуги", "ООО Ромашка", "март 2024"]
}`;

/**
 * Module 2 — Tag Generation Prompt
 */
export const GENERATE_TAGS_PROMPT = `На основе данных документа придумай 3-5 поисковых тегов.
Учти: отрасль, тип услуги, название контрагента, период.
Верни только JSON массив строк: ["тег1", "тег2", "тег3"]`;

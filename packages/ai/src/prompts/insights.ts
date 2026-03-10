/**
 * Module 4 — Executive Dashboard AI Insights Prompt
 */
export function buildInsightsPrompt(weeklyData: object): string {
    return `На основе финансовых данных компании за неделю напиши 3-5 ключевых вывода для руководителя.

Данные:
${JSON.stringify(weeklyData, null, 2)}

Требования к ответу:
- Язык: простой, без бухгалтерского жаргона
- Формат: короткие тезисы с эмодзи в начале каждого
- Фокус: что важно для бизнеса, где риски, где возможности
- Не перечисляй цифры — давай их интерпретацию

Верни JSON массив строк:
["📈 Выручка выросла на 12% по сравнению с прошлой неделей — рост обусловлен...", "⚠️ Три клиента задержали оплату на сумму 450 000 руб. — рекомендуем..."]`;
}

/**
 * Module 7 — AR Reminder Letter Prompt
 */
export function buildReminderPrompt(params: {
    tone: 'friendly' | 'firm' | 'demanding' | 'legal';
    companyName: string;
    contractorName: string;
    amount: number;
    daysOverdue: number;
    invoiceNumber?: string;
}): string {
    const toneMap = {
        friendly: 'вежливый и дружелюбный',
        firm: 'официальный и строгий',
        demanding: 'требовательный с указанием последствий',
        legal: 'юридически формальный со ссылкой на претензионный порядок',
    };

    return `Напиши письмо с напоминанием об оплате долга.

Параметры:
- Наша компания: ${params.companyName}
- Должник: ${params.contractorName}
- Сумма долга: ${params.amount.toLocaleString('ru-RU')} руб.
- Просрочка: ${params.daysOverdue} дней
- Счёт: ${params.invoiceNumber || 'не указан'}
- Тон письма: ${toneMap[params.tone]}

Напиши профессиональное деловое письмо. Включи:
1. Обращение
2. Основная информация о задолженности
3. Срок погашения (3 рабочих дня)
4. Последствия неоплаты (соответствует тону)
5. Контакт для связи

Ответ верни как обычный текст письма, без JSON.`;
}

/**
 * Module 10 — Expense Receipt Extraction Prompt
 */
export const EXPENSE_RECEIPT_PROMPT = `Извлеки данные из фотографии чека/квитанции.

Верни строго JSON:
{
  "vendorName": "Название продавца",
  "amount": 1250.00,
  "currency": "RUB",
  "vatAmount": 208.33,
  "receiptDate": "2024-03-15T14:30:00.000Z",
  "category": "food" | "transport" | "accommodation" | "other",
  "items": [{"name": "Название товара/услуги", "price": 1250.00, "quantity": 1}]
}

Если какое-то поле не определяется — верни null для этого поля.`;

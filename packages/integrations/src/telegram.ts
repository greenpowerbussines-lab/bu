import { Telegraf, NarrowedContext, Types, Context } from 'telegraf';
import { message } from 'telegraf/filters';

export class BuhAiBot {
    private bot: Telegraf;

    constructor(token: string) {
        this.bot = new Telegraf(token);
        this.setupHandlers();
    }

    private setupHandlers() {
        this.bot.start((ctx: Context) => {
            ctx.reply('Привет! Я BuhAI — твой персональный бухгалтер на базе AI. 🚀\n\nЯ могу:\n1. Распознавать счета и акты (просто пришли фото)\n2. Отвечать на вопросы по бухгалтерии\n3. Напоминать о налогах');
        });

        // Photo handler for OCR
        this.bot.on('photo', async (ctx) => {
            await ctx.reply('Получил фото! Начинаю обработку и распознавание текста через Claude Vision... 🔍');
            // In a real app, we would:
            // 1. Get file link from Telegram
            // 2. Download image
            // 3. Call callClaudeVision from @buhai/ai
            // 4. Update Prisma database
            setTimeout(() => {
                ctx.reply('✅ Документ распознан: Счет №123 от ООО "Ромашка". Сумма: 45 000 ₽. Добавлен в ваш архив.');
            }, 3000);
        });

        // Text handler for Q&A
        this.bot.on('text', async (ctx) => {
            const text = (ctx.message as any).text;
            if (text.startsWith('/')) return;

            await ctx.sendChatAction('typing');

            // In a real app, we would:
            // 1. Fetch user/org context from DB based on Telegram ID (ctx.from.id)
            // 2. Call callClaude from @buhai/ai with system prompt

            setTimeout(() => {
                ctx.reply(`Ответ на ваш вопрос "${text}": Лимит суточных по РФ составляет 700 ₽, по загранкомандировкам — 2500 ₽. Все, что выше, облагается НДФЛ.`);
            }, 2000);
        });
    }

    public async launch() {
        try {
            await this.bot.launch();
            console.log('🤖 Telegram Bot started successfully');
        } catch (error) {
            console.error('Failed to launch Telegram Bot:', error);
        }
    }

    public stop(reason: string) {
        this.bot.stop(reason);
    }
}

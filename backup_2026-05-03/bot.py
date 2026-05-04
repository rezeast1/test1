import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import ReplyKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiohttp import web
import json

# --- НАСТРОЙКИ ---
TOKEN = "8374209578:AAG2nCNoi9rct_cZQFNVhMDWkyqPxJZ6xTo"
APP_URL = "https://rezeast1.github.io/test1/"
SPECIALIST_ID = 743066247  # Твой ID вставлен сюда
WEBHOOK_PORT = 8080  # Порт для приема запросов от сайта

# Состояние ожидания текста вопроса
class HelpState(StatesGroup):
    waiting_for_question = State()

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    builder = ReplyKeyboardBuilder()
    builder.row(types.KeyboardButton(text="Открыть Mini App 🚀", web_app=WebAppInfo(url=APP_URL)))
    builder.row(types.KeyboardButton(text="🆘 Обратиться к специалисту"))

    await message.answer(
        "Привет! Нажми на кнопку ниже, чтобы открыть приложение или задать вопрос специалисту.",
        reply_markup=builder.as_markup(resize_keyboard=True)
    )

# Шаг 1: Пользователь нажал кнопку
@dp.message(F.text == "🆘 Обратиться к специалисту")
async def ask_for_details(message: types.Message, state: FSMContext):
    await message.answer("Пожалуйста, напишите ваш вопрос или описание проблемы. Я передам его специалисту.")
    # Включаем режим ожидания сообщения
    await state.set_state(HelpState.waiting_for_question)

# Шаг 2: Бот ловит сам текст вопроса
@dp.message(HelpState.waiting_for_question)
async def forward_to_specialist(message: types.Message, state: FSMContext):
    user_info = f"@{message.from_user.username}" if message.from_user.username else "скрыт"
    user_link = f"tg://user?id={message.from_user.id}"
    
    # Формируем карточку заявки для тебя
    notification = (
        f"📩 **Новое обращение!**\n\n"
        f"👤 **От:** {message.from_user.full_name} ({user_info})\n"
        f"📝 **Текст вопроса:**\n_{message.text}_\n\n"
        f"🔗 [Открыть чат с пользователем]({user_link})"
    )

    try:
        # Шлем тебе
        await bot.send_message(chat_id=SPECIALIST_ID, text=notification, parse_mode="Markdown")
        # Подтверждаем пользователю
        await message.answer("Спасибо! Ваш вопрос передан. C Вами свяжутся в ближайшее время.")
    except Exception as e:
        await message.answer("Ошибка при отправке. Убедитесь, что специалист запустил бота.")
        print(f"Ошибка: {e}")

    # Выходим из режима ожидания
    await state.clear()

# --- ВЕБ-СЕРВЕР ДЛЯ ПРИЕМА ПРЕДЛОЖЕНИЙ С САЙТА ---
async def handle_suggestion(request):
    """Обработчик для приема предложений тем с сайта"""
    try:
        # Разрешаем CORS
        if request.method == 'OPTIONS':
            return web.Response(
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            )

        data = await request.json()

        title = data.get('title', 'Без названия')
        keywords = data.get('keywords', '')
        content = data.get('content', 'Без описания')
        email = data.get('email', '')
        telegram_user = data.get('telegramUser')

        # Формируем сообщение для специалиста
        message = f"🆕 <b>Новое предложение темы для Вики</b>\n\n"

        # Информация о пользователе Telegram
        if telegram_user:
            user_name = f"{telegram_user.get('first_name', '')} {telegram_user.get('last_name', '')}".strip()
            username = telegram_user.get('username', 'не указан')
            user_id = telegram_user.get('id', 'неизвестен')
            message += f"👤 <b>От пользователя:</b> {user_name} (@{username})\n"
            message += f"🆔 <b>Telegram ID:</b> <code>{user_id}</code>\n\n"

        message += f"📌 <b>Название:</b> {title}\n\n"

        if keywords:
            message += f"🏷 <b>Ключевые слова:</b> {keywords}\n\n"

        message += f"📝 <b>Описание:</b>\n{content}\n\n"

        if email:
            message += f"📧 <b>Email:</b> {email}\n\n"

        message += f"🕐 <b>Дата:</b> {data.get('date', 'не указана')}"

        # Отправляем специалисту
        await bot.send_message(
            chat_id=SPECIALIST_ID,
            text=message,
            parse_mode="HTML"
        )

        return web.json_response(
            {'success': True, 'message': 'Предложение отправлено'},
            headers={'Access-Control-Allow-Origin': '*'}
        )

    except Exception as e:
        print(f"Ошибка обработки предложения: {e}")
        return web.json_response(
            {'success': False, 'error': str(e)},
            status=500,
            headers={'Access-Control-Allow-Origin': '*'}
        )

async def health_check(request):
    """Health check для Render"""
    return web.Response(text="OK", status=200)

async def start_web_server():
    """Запуск веб-сервера для приема запросов"""
    app = web.Application()
    app.router.add_get('/', health_check)
    app.router.add_get('/health', health_check)
    app.router.add_post('/api/suggest', handle_suggestion)
    app.router.add_options('/api/suggest', handle_suggestion)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', WEBHOOK_PORT)
    await site.start()
    print(f"Веб-сервер запущен на порту {WEBHOOK_PORT}")

async def main():
    print("Бот запущен и готов к работе...")
    # Запускаем веб-сервер
    await start_web_server()
    # Запускаем бота
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
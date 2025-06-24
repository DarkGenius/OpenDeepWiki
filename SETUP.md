# Настройка проекта

## Первоначальная настройка

1. Скопируйте пример файла конфигурации:
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   ```

2. Отредактируйте `docker-compose.yml` и задайте обязательные параметры:
   ```yaml
   - CHAT_API_KEY=YOUR_API_KEY_HERE # Замените на ваш API ключ
   - ENDPOINT=YOUR_OPENAI_ENDPOINT_HERE # Замените на адрес вашего OpenAI API
   ```

   **Обязательные параметры:**
   - `CHAT_API_KEY` - ваш API ключ для доступа к LLM
   - `ENDPOINT` - адрес OpenAI-совместимого API (например: `https://api.openai.com/v1` или `http://localhost:11434/v1` для Ollama)

3. При необходимости измените другие параметры конфигурации:
   - `LANGUAGE` - язык генерации (English, Chinese, 中文, Russian, Русский)
   - `CHAT_MODEL` и `ANALYSIS_MODEL` - модели для использования
   - `TASK_MAX_SIZE_PER_USER` - максимальное количество задач на пользователя

## Запуск проекта

```bash
docker-compose up -d
```

## Важные замечания

- Файл `docker-compose.yml` содержит секретные данные и не должен коммититься в репозиторий
- Папки `repositories/` и `data/` содержат локальные данные и также исключены из git
- Используйте `docker-compose.example.yml` как шаблон для создания своего конфигурационного файла 
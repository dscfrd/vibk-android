# vibk lite

Android-компаньон для [vibk](https://github.com/dscfrd/vibk) — мобильный SSH-терминал с облачной синхронизацией.

## Возможности

**Терминал**
- SSH-подключение к серверам (password / key auth)
- xterm.js в WebView с полной поддержкой ANSI
- Auto-Yes — автоматическое подтверждение запросов Claude Code (с обратным отсчётом 5 сек)
- Распознавание numbered-меню → быстрый выбор опций
- Голосовой ввод (ru-RU)
- Ctrl+C

**План**
- Просмотр `.vibk/plan.md` проекта через SSH
- Секции с прогресс-барами
- Pull-to-refresh

**Тикеты**
- Просмотр и редактирование `.vibk/tickets.json`
- Группировка по статусу (In Progress / To Do / Done)
- Inline-редактирование: title, description, priority, status
- Сохранение обратно на сервер

**Настройки**
- Google аккаунт + vault sync
- Тема (dark / light)
- Звук уведомлений
- Режим "не выключать экран"

## Стек

- React Native 0.76
- TypeScript
- xterm.js (WebView)
- @dylankenneally/react-native-ssh-sftp
- Google Sign-In + Drive appDataFolder
- AES-256-GCM (react-native-quick-crypto)
- MMKV (локальное хранилище)
- NativeWind (Tailwind)
- Tokyo Night тема

## Архитектура

```
src/
  screens/          — Terminal, Plan, Tickets, Settings, Login
  components/       — TerminalWebView, InputBar, OptionsPopup
  contexts/         — AuthContext, SyncContext
  hooks/            — useAutoYes, useSendMessage, useIdleDetection, useNotificationMatcher
  services/         — ssh-service, cloud-sync, vault, storage, google-drive
  shared/           — типы (синхронизированы с desktop vibk)
  utils/            — strip-ansi, detect-options
  navigation/       — bottom tabs (Terminal, Plan, Tickets, Settings)
```

## Синхронизация

Lite-версия — read-only sync. Данные (проекты, серверы, ключи) хранятся в зашифрованном vault на Google Drive. Приложение скачивает и расшифровывает vault при входе. Единственная запись — обновление тикетов напрямую на сервер через SSH.

## Сборка

```bash
npm install
npx react-native run-android
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

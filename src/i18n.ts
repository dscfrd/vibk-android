import { useCallback } from 'react'
import { storage } from './services/storage'

type Translations = Record<string, string>

const en: Translations = {
  // Tabs
  'tab.terminal': 'Terminal',
  'tab.plan': 'Plan',
  'tab.tickets': 'Tickets',
  'tab.settings': 'Settings',

  // Login
  'login.signIn': 'Sign in with Google',
  'login.vaultPassword': 'Vault Password',
  'login.unlock': 'Unlock',
  'login.wrongPassword': 'Wrong vault password',

  // Sync
  'sync.syncing': 'Syncing...',
  'sync.lastSync': 'Last sync',
  'sync.never': 'Never',
  'sync.syncNow': 'Sync Now',
  'sync.error': 'Sync error',
  'sync.noProjects': 'No projects synced',

  // Terminal
  'terminal.connect': 'Connect',
  'terminal.disconnect': 'Disconnect',
  'terminal.connecting': 'Connecting...',
  'terminal.connected': 'Connected',
  'terminal.disconnected': 'Disconnected',
  'terminal.selectServer': 'Select server',
  'terminal.noServers': 'No SSH servers',
  'terminal.autoYes': 'Auto-Yes',
  'terminal.send': 'Send',
  'terminal.placeholder': 'Type a message...',

  // Plan
  'plan.noPlan': 'No plan',
  'plan.progress': 'Progress',

  // Tickets
  'tickets.todo': 'To Do',
  'tickets.inProgress': 'In Progress',
  'tickets.done': 'Done',
  'tickets.noTickets': 'No tickets',
  'tickets.priorityHigh': 'High',
  'tickets.priorityMedium': 'Medium',
  'tickets.priorityLow': 'Low',

  // Settings
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.dark': 'Dark',
  'settings.light': 'Light',
  'settings.notificationSound': 'Notification Sound',
  'settings.keepAwake': 'Keep Screen Awake',
  'settings.account': 'Account',
  'settings.signOut': 'Sign Out',
  'settings.sync': 'Cloud Sync',
  'settings.about': 'About',
  'settings.version': 'Version',

  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.close': 'Close'
}

const ru: Translations = {
  'tab.terminal': 'Терминал',
  'tab.plan': 'План',
  'tab.tickets': 'Тикеты',
  'tab.settings': 'Настройки',

  'login.signIn': 'Войти через Google',
  'login.vaultPassword': 'Пароль хранилища',
  'login.unlock': 'Разблокировать',
  'login.wrongPassword': 'Неверный пароль хранилища',

  'sync.syncing': 'Синхронизация...',
  'sync.lastSync': 'Последняя синхр.',
  'sync.never': 'Никогда',
  'sync.syncNow': 'Синхронизировать',
  'sync.error': 'Ошибка синхронизации',
  'sync.noProjects': 'Нет проектов',

  'terminal.connect': 'Подключиться',
  'terminal.disconnect': 'Отключиться',
  'terminal.connecting': 'Подключение...',
  'terminal.connected': 'Подключено',
  'terminal.disconnected': 'Отключено',
  'terminal.selectServer': 'Выбрать сервер',
  'terminal.noServers': 'Нет SSH серверов',
  'terminal.autoYes': 'Авто-да',
  'terminal.send': 'Отправить',
  'terminal.placeholder': 'Введите сообщение...',

  'plan.noPlan': 'Нет плана',
  'plan.progress': 'Прогресс',

  'tickets.todo': 'К выполнению',
  'tickets.inProgress': 'В работе',
  'tickets.done': 'Готово',
  'tickets.noTickets': 'Нет тикетов',
  'tickets.priorityHigh': 'Высокий',
  'tickets.priorityMedium': 'Средний',
  'tickets.priorityLow': 'Низкий',

  'settings.title': 'Настройки',
  'settings.theme': 'Тема',
  'settings.dark': 'Тёмная',
  'settings.light': 'Светлая',
  'settings.notificationSound': 'Звук уведомлений',
  'settings.keepAwake': 'Не выключать экран',
  'settings.account': 'Аккаунт',
  'settings.signOut': 'Выйти',
  'settings.sync': 'Облачная синхр.',
  'settings.about': 'О приложении',
  'settings.version': 'Версия',

  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.edit': 'Редактировать',
  'common.close': 'Закрыть'
}

const translations: Record<string, Translations> = { en, ru }

function getLanguage(): string {
  // Could use device locale, for now default to 'en'
  return 'en'
}

export function t(key: string): string {
  const lang = getLanguage()
  return translations[lang]?.[key] || translations.en[key] || key
}

export function useT(): (key: string) => string {
  return useCallback((key: string) => t(key), [])
}

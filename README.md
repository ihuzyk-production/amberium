# 🔶 Amberium (AMB) Token

![Solana](https://img.shields.io/badge/Solana-20232A?style=for-the-badge&logo=solana&logoColor=3C68FF)
![Anchor](https://img.shields.io/badge/Anchor-3DBF61?style=for-the-badge&logo=anchor&logoColor=white)
![Token](https://img.shields.io/badge/SPL_Token-EEA01C?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

Amberium (AMB) - інноваційний токен на блокчейні Solana, який революціонізує ринок бурштину завдяки токенізації реальних фізичних активів. Кожен токен AMB представляє точно 1 карат сертифікованого бурштину.

## 💡 Проблема та рішення

**Проблема**: Традиційний ринок бурштину потерпає від проблем з прозорістю, відстеженням походження та ліквідністю.

**Наше рішення**: Amberium створює цифрове представлення бурштину на блокчейні Solana, що забезпечує:
- ✅ Прозору систему підтвердження походження
- ✅ Глобальну ліквідність та миттєві транзакції
- ✅ Дробну власність на цінні активи
- ✅ Захист від підробок

## 🪙 Характеристики токену

- **Відповідність**: 1 AMB = 1 карат бурштину
- **Початкова ціна**: 1$ за 1 AMB
- **Стандарт**: SPL токен на Solana
- **Емісія**: Контрольована, підтверджена фізичним видобутком бурштину
- **Функціональність**: Можливість передачі, зберігання та використання в DeFi

## 🛠️ Технології

- **Blockchain**: Solana (вибрано за швидкість та низькі комісії)
- **Smart Contract**: Розроблено з використанням Rust та Anchor Framework
- **Client**: JavaScript з використанням Solana Web3.js та SPL-Token

## 📋 Передумови

Для роботи з проектом потрібно:
- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v14+)
- [Yarn](https://yarnpkg.com/)

## 🚀 Швидкий старт

### Встановлення

```bash
# Клонуйте репозиторій
git clone https://github.com/ihuzyk-production/amberium.git
cd amberium

# Встановіть залежності
yarn install

# Створіть гаманець Solana (якщо у вас його ще немає)
solana-keygen new -o ~/.config/solana/id.json

# Налаштуйте devnet для розробки
solana config set --url devnet

# Отримайте тестові SOL
solana airdrop 2
```

### Компіляція та розгортання

```bash
# Компіляція смарт-контракту
anchor build

# Розгортання на devnet
anchor deploy
```

### Операції з токеном

```bash
# Ініціалізація нового токену з постачанням 1 мільйон
node app/direct-client.js init 1000000

# Емісія 5000 нових токенів на основі підтвердженого видобутку
node app/direct-client.js mint 5000
```

## 🧪 Тестування

```bash
# Запуск автоматичних тестів
anchor test
```

## 📐 Архітектура

### Смарт-контракт (Rust)

Основні компоненти смарт-контракту:

- **Initialize**: Створює новий токен з початковим постачанням
- **MintTokens**: Емітує нові токени при підтвердженні видобутку бурштину
- **AdminConfig**: PDA для зберігання адміністративних прав
- **MintAuthority**: PDA для контролю емісії

### Клієнтська частина (JavaScript)

- **amberium-client.js**: Клієнт з підтримкою Anchor IDL
- **direct-client.js**: Альтернативний клієнт з прямими викликами

## 🔍 Демо

Діючий екземпляр токену Amberium на devnet:
- Program ID: `86ouczdz4eVPC3TCvUMTB1VCXE3Ti3pNn41a9ztRrUTd`
- Mint Address: Генерується при ініціалізації


## 📄 Ліцензія

Цей проект ліцензовано під [MIT License](LICENSE).

---

*© Amberium 2025* 
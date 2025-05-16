// Конфігурація проекту Amberium
module.exports = {
  // ID програми на devnet
  PROGRAM_ID: '86ouczdz4eVPC3TCvUMTB1VCXE3Ti3pNn41a9ztRrUTd',
  
  // Параметри токену
  TOKEN_DECIMALS: 6,
  
  // Мережа
  NETWORK: 'https://api.devnet.solana.com',
  
  // Шлях до файлу з приватним ключем (локальне використання, не буде в репозиторії)
  KEYPAIR_PATH: require('os').homedir() + '/.config/solana/id.json'
}; 
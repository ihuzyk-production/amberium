const {   Connection,   PublicKey,   Keypair,   SystemProgram,   Transaction,  TransactionInstruction,  sendAndConfirmTransaction,  SYSVAR_RENT_PUBKEY} = require('@solana/web3.js');const {   TOKEN_PROGRAM_ID,   getAssociatedTokenAddress,  createAssociatedTokenAccountInstruction,  createInitializeMintInstruction,  MINT_SIZE,  getMinimumBalanceForRentExemptMint,  createMintToInstruction} = require('@solana/spl-token');const BN = require('bn.js');const fs = require('fs');const path = require('path');const crypto = require('crypto');const config = require('./config');// Підключення до кластераconst connection = new Connection(config.NETWORK, 'confirmed');

// Функція для створення дискримінатора інструкції Anchor
function createInstructionDiscriminator(name) {
  return Buffer.from(
    crypto.createHash('sha256')
      .update(`global:${name}`)
      .digest()
  ).slice(0, 8);
}

// Дискримінатори для наших інструкцій
const INITIALIZE_IX_DISCRIMINATOR = createInstructionDiscriminator('initialize');
const MINT_TOKENS_IX_DISCRIMINATOR = createInstructionDiscriminator('mint_tokens');

console.log('Дискримінатор initialize:', INITIALIZE_IX_DISCRIMINATOR.toString('hex'));
console.log('Дискримінатор mint_tokens:', MINT_TOKENS_IX_DISCRIMINATOR.toString('hex'));

// Завантаження ключа гаманцяlet payer;try {  console.log('Шукаю ключ у:', config.KEYPAIR_PATH);  const walletKeyData = JSON.parse(fs.readFileSync(config.KEYPAIR_PATH, { encoding: 'utf-8' }));  payer = Keypair.fromSecretKey(Buffer.from(walletKeyData));  console.log('Гаманець завантажено:', payer.publicKey.toString());} catch (error) {  console.error('Помилка при завантаженні ключа:', error);  process.exit(1);}

// ID програмиconst programId = new PublicKey(config.PROGRAM_ID);

// Константа для конвертації токенівconst DECIMALS = config.TOKEN_DECIMALS;const CONVERSION_FACTOR = 10 ** DECIMALS;

// Простіша реалізація з прямим мінтингом
async function initializeToken(initialSupply) {
  try {
    // Конвертуємо в токени з урахуванням децималів
    const rawSupply = new BN(initialSupply).mul(new BN(CONVERSION_FACTOR));
    
    console.log('Ініціалізація токена Amberium з початковим обсягом:', initialSupply, '(', rawSupply.toString(), 'базових одиниць)');
    
    // Генерація нового keypair для mint
    const mint = Keypair.generate();
    console.log('Монету буде створено з адресою:', mint.publicKey.toString());
    
    // Пайєр буде mint authority та freeze authority
    const mintAuthority = payer.publicKey;
    console.log('Mint Authority буде:', mintAuthority.toString());
    
    // Створення асоційованого токен рахунку
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      payer.publicKey
    );
    console.log('Токен акаунт:', tokenAccount.toString());
    
    const transaction = new Transaction();
    
    // 1. Створення mint акаунту
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // 2. Ініціалізація mint акаунту з пайєром як authority
    transaction.add(
      createInitializeMintInstruction(
        mint.publicKey,
        DECIMALS, // 6 знаків після коми
        mintAuthority,
        mintAuthority, // freeze authority = mint authority
        TOKEN_PROGRAM_ID
      )
    );
    
    // 3. Створення асоційованого токен акаунту
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        tokenAccount,
        payer.publicKey,
        mint.publicKey
      )
    );
    
    // 4. Мінтинг початкової кількості токенів
    if (initialSupply > 0) {
      transaction.add(
        createMintToInstruction(
          mint.publicKey,
          tokenAccount,
          mintAuthority,
          rawSupply
        )
      );
    }
    
    console.log('Відправка транзакції для ініціалізації та мінтингу токенів...');
    
    const txId = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, mint],
      { commitment: 'confirmed' }
    );
    
    console.log('Транзакція успішна:', txId);
    
    // Запис даних в файл
    fs.writeFileSync(
      path.join(__dirname, 'mint-address.json'),
      JSON.stringify({
        mint: mint.publicKey.toString()
      })
    );
    
    // Отримання балансу токенів
    const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
    console.log('Баланс токенів після ініціалізації:', tokenInfo.value.uiAmount);
    
    console.log('Токен Amberium ініціалізовано!');
    console.log('Адреса токена (mint):', mint.publicKey.toString());
    
    return { mint: mint.publicKey, tokenAccount };
  } catch (error) {
    console.error('Помилка при ініціалізації токена:', error);
    throw error;
  }
}

// Функція для емісії нових токенів
async function mintNewTokens(amount) {
  try {
    // Конвертуємо в токени з урахуванням децималів
    const rawAmount = new BN(amount).mul(new BN(CONVERSION_FACTOR));
    
    console.log(`Емісія ${amount} токенів Amberium (${rawAmount.toString()} базових одиниць), підтверджених видобутим бурштином...`);
    
    // Завантаження адреси mint з файлу
    let mintAddress;
    
    try {
      const mintAddressPath = path.join(__dirname, 'mint-address.json');
      if (!fs.existsSync(mintAddressPath)) {
        throw new Error('Файл з адресою mint не знайдено. Спочатку виконайте команду init.');
      }
      const mintData = JSON.parse(fs.readFileSync(mintAddressPath, 'utf-8'));
      mintAddress = new PublicKey(mintData.mint);
      console.log('Завантажено адресу mint:', mintAddress.toString());
    } catch (error) {
      console.error('Помилка при завантаженні адреси mint:', error.message);
      process.exit(1);
    }
    
    // Mint authority - це власник приватного ключа (пайєр)
    const mintAuthority = payer.publicKey;
    
    // Створення асоційованого токен рахунку
    const tokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      payer.publicKey
    );
    
    // Створюємо транзакцію для мінтингу
    const transaction = new Transaction();
    
    // Додаємо інструкцію мінтингу
    transaction.add(
      createMintToInstruction(
        mintAddress,
        tokenAccount,
        mintAuthority,
        rawAmount
      )
    );
    
    // Відправляємо транзакцію
    console.log('Відправка транзакції мінтингу...');
    const txId = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );
    
    console.log('Мінтинг успішний:', txId);
    
    // Отримання балансу токенів
    const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
    console.log('Поточний баланс токенів:', tokenInfo.value.uiAmount);
    
    return txId;
  } catch (error) {
    console.error('Помилка при емісії нових токенів:', error);
    throw error;
  }
}

// Головна функція
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'init') {
    const initialSupply = parseInt(args[1] || '1000000'); // За замовчуванням 1 мільйон токенів
    await initializeToken(initialSupply);
  } else if (command === 'mint') {
    const amount = parseInt(args[1] || '1000'); // За замовчуванням 1000 токенів
    await mintNewTokens(amount);
  } else {
    console.log('Використання:');
    console.log('node direct-client.js init [початковий_обсяг] - Ініціалізувати новий токен');
    console.log('node direct-client.js mint [кількість] - Випустити нові токени на основі добутого бурштину');
  }
}

main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  }
); 
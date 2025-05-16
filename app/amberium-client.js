const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, web3, BN } = require('@coral-xyz/anchor');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Підключення до кластера та налаштування провайдера
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Завантаження ключа гаманця з файлу (має бути згенерований раніше)
// Приклад: solana-keygen new -o ~/.config/solana/id.json
let payer;
try {
  const homeDir = require('os').homedir();
  const walletKeyPath = path.join(homeDir, '.config', 'solana', 'id.json');
  const walletKeyData = JSON.parse(fs.readFileSync(walletKeyPath, { encoding: 'utf-8' }));
  payer = Keypair.fromSecretKey(Buffer.from(walletKeyData));
} catch (error) {
  console.error('Помилка при завантаженні ключа:', error);
  process.exit(1);
}

// Налаштування провайдера з нашим гаманцем
const provider = new AnchorProvider(
  connection,
  { publicKey: payer.publicKey, signTransaction: tx => tx.partialSign(payer), signAllTransactions: txs => txs.map(tx => tx.partialSign(payer)) },
  { commitment: 'confirmed' }
);

// Завантаження IDL (після запуску anchor build)
let idl, program;
try {
  // Шлях до IDL файлу
  const idlPath = path.resolve(__dirname, '../target/idl/amberium.json');
  console.log('Шукаю IDL файл за шляхом:', idlPath);
  
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL файл не знайдено за шляхом ${idlPath}. Спершу виконайте команду "anchor build"`);
  }
  
  // Завантаження IDL
  const idlContent = fs.readFileSync(idlPath, 'utf-8');
  idl = JSON.parse(idlContent);
  
  if (!idl || !idl.instructions || !idl.accounts) {
    throw new Error('IDL файл має некоректний формат. Перебудуйте проект командою "anchor build"');
  }
  
  console.log(`IDL файл успішно завантажено з ${idl.accounts.length} акаунтами та ${idl.instructions.length} інструкціями`);
  
  // ID програми з IDL або хардкод якщо не знайдено
  const programId = new PublicKey(idl.metadata?.address || '86ouczdz4eVPC3TCvUMTB1VCXE3Ti3pNn41a9ztRrUTd');
  console.log('ID програми:', programId.toString());
  
  // Створення інстансу програми
  program = new Program(idl, programId, provider);
} catch (error) {
  console.error('Помилка при ініціалізації програми:', error);
  process.exit(1);
}

// Функція для ініціалізації токена
async function initializeToken(initialSupply) {
  try {
    // Генерація нового keypair для mint
    const mint = Keypair.generate();
    
    console.log('Монету буде створено з адресою:', mint.publicKey.toString());
    
    // Знаходження PDA для адміна
    const [admin, _] = await PublicKey.findProgramAddress(
      [Buffer.from('admin'), mint.publicKey.toBuffer()],
      program.programId
    );
    
    // Знаходження PDA для mint authority
    const [mintAuthority, __] = await PublicKey.findProgramAddress(
      [Buffer.from('mint_authority'), mint.publicKey.toBuffer()],
      program.programId
    );
    
    // Створення асоційованого токен рахунку
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      payer.publicKey
    );
    
    console.log('Ініціалізація токена Amberium з початковим обсягом:', initialSupply.toString());
    
    // Виконання транзакції ініціалізації
    const tx = await program.methods
      .initialize(initialSupply)
      .accounts({
        authority: payer.publicKey,
        admin: admin,
        mintAuthority: mintAuthority,
        mint: mint.publicKey,
        tokenAccount: tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([payer, mint])
      .rpc();
    
    console.log('Транзакція успішно виконана:', tx);
    console.log('Токен Amberium ініціалізовано!');
    console.log('Адреса токена (mint):', mint.publicKey.toString());
    console.log('Адреса адміністратора:', admin.toString());
    
    // Запис адреси mint в файл для подальшого використання
    fs.writeFileSync(
      path.join(__dirname, 'mint-address.json'),
      JSON.stringify({ mint: mint.publicKey.toString() })
    );
    
    return { mint: mint.publicKey, admin, tokenAccount };
  } catch (error) {
    console.error('Помилка при ініціалізації токена:', error);
    throw error;
  }
}

// Функція для емісії нових токенів, підтверджених новим бурштином
async function mintNewTokens(amount) {
  try {
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
    
    // Знаходження PDA для адміна
    const [admin, _] = await PublicKey.findProgramAddress(
      [Buffer.from('admin'), mintAddress.toBuffer()],
      program.programId
    );
    
    // Знаходження PDA для mint authority
    const [mintAuthority, __] = await PublicKey.findProgramAddress(
      [Buffer.from('mint_authority'), mintAddress.toBuffer()],
      program.programId
    );
    
    // Створення асоційованого токен рахунку
    const tokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      payer.publicKey
    );
    
    console.log(`Емісія ${amount.toString()} нових токенів Amberium, підтверджених видобутим бурштином...`);
    
    // Виконання транзакції емісії
    const tx = await program.methods
      .mintTokens(amount)
      .accounts({
        authority: payer.publicKey,
        admin: admin,
        mintAuthority: mintAuthority,
        mint: mintAddress,
        tokenAccount: tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
    
    console.log('Транзакція успішно виконана:', tx);
    console.log(`Випущено ${amount.toString()} нових токенів Amberium!`);
    
    // Отримання оновленого балансу
    const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
    console.log('Новий баланс токенів:', tokenInfo.value.uiAmount);
    
    return tx;
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
    const initialSupply = new BN(args[1] || 1000000); // За замовчуванням 1 мільйон токенів
    await initializeToken(initialSupply);
  } else if (command === 'mint') {
    const amount = new BN(args[1] || 1000); // За замовчуванням 1000 токенів
    await mintNewTokens(amount);
  } else {
    console.log('Використання:');
    console.log('node amberium-client.js init [початковий_обсяг] - Ініціалізувати новий токен');
    console.log('node amberium-client.js mint [кількість] - Випустити нові токени на основі добутого бурштину');
  }
}

main().then(
  () => process.exit(0),
  err => {
    console.error(err);
    process.exit(1);
  }
); 
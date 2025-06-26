import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('bluebot.db');

// Initialize database tables
export const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Users table (offline cache)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT,
          phone_number TEXT,
          full_name TEXT NOT NULL,
          is_verified INTEGER DEFAULT 0,
          kyc_status TEXT DEFAULT 'pending',
          wallet_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Expenses table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          receipt_url TEXT,
          receipt_data TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Categories table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          icon TEXT NOT NULL,
          budget_limit REAL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Savings goals table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS savings_goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          target_amount REAL NOT NULL,
          current_amount REAL DEFAULT 0,
          target_date TEXT,
          is_locked INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Transactions table (wallet transactions)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'ZAR',
          recipient TEXT,
          recipient_id TEXT,
          description TEXT,
          status TEXT DEFAULT 'pending',
          transaction_hash TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Chat messages table (AI conversations)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          context TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Financial education progress table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS education_progress (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          course_id TEXT NOT NULL,
          lesson_id TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          score INTEGER DEFAULT 0,
          completed_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Gamification table (badges, points, achievements)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS gamification (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          points INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          badges TEXT, -- JSON array of badge IDs
          achievements TEXT, -- JSON array of achievement objects
          streak_days INTEGER DEFAULT 0,
          last_activity TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Crypto wallet data table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS crypto_wallets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          wallet_address TEXT NOT NULL,
          wallet_type TEXT NOT NULL, -- 'ethereum', 'polygon', etc.
          encrypted_private_key TEXT NOT NULL,
          balance REAL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // App settings table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS app_settings (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          setting_key TEXT NOT NULL,
          setting_value TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // Insert default categories
      tx.executeSql(
        `INSERT OR IGNORE INTO categories (id, user_id, name, color, icon, created_at) VALUES
          ('default_food', '', 'Food & Groceries', '#10B981', 'shopping-cart', datetime('now')),
          ('default_transport', '', 'Transport', '#3B82F6', 'car', datetime('now')),
          ('default_utilities', '', 'Utilities', '#F59E0B', 'zap', datetime('now')),
          ('default_entertainment', '', 'Entertainment', '#8B5CF6', 'film', datetime('now')),
          ('default_healthcare', '', 'Healthcare', '#EF4444', 'heart', datetime('now')),
          ('default_education', '', 'Education', '#06B6D4', 'book', datetime('now')),
          ('default_shopping', '', 'Shopping', '#EC4899', 'shopping-bag', datetime('now')),
          ('default_savings', '', 'Savings', '#059669', 'piggy-bank', datetime('now')),
          ('default_other', '', 'Other', '#6B7280', 'more-horizontal', datetime('now'));`
      );

    }, (error) => {
      console.error('Database initialization error:', error);
      reject(error);
    }, () => {
      console.log('Database initialized successfully');
      resolve(true);
    });
  });
};

// User operations
export const insertUser = (user: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO users (id, email, phone_number, full_name, is_verified, kyc_status, wallet_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, user.phoneNumber, user.fullName, user.isVerified ? 1 : 0, user.kycStatus, user.walletId, user.createdAt],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getUser = (userId: string) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        (_, result) => {
          if (result.rows.length > 0) {
            const user = result.rows.item(0);
            resolve({
              ...user,
              isVerified: user.is_verified === 1,
            });
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Expense operations
export const insertExpense = (expense: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO expenses (id, user_id, amount, description, category, receipt_url, receipt_data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [expense.id, expense.userId, expense.amount, expense.description, expense.category, expense.receiptUrl, expense.receiptData, expense.createdAt],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getExpenses = (userId: string, limit: number = 50) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (_, result) => {
          const expenses = [];
          for (let i = 0; i < result.rows.length; i++) {
            expenses.push(result.rows.item(i));
          }
          resolve(expenses);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Savings goal operations
export const insertSavingsGoal = (goal: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO savings_goals (id, user_id, title, description, target_amount, current_amount, target_date, is_locked, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [goal.id, goal.userId, goal.title, goal.description, goal.targetAmount, goal.currentAmount, goal.targetDate, goal.isLocked ? 1 : 0, goal.createdAt],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getSavingsGoals = (userId: string) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (_, result) => {
          const goals = [];
          for (let i = 0; i < result.rows.length; i++) {
            const goal = result.rows.item(i);
            goals.push({
              ...goal,
              isLocked: goal.is_locked === 1,
            });
          }
          resolve(goals);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Transaction operations
export const insertTransaction = (transaction: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO transactions (id, user_id, type, amount, currency, recipient, recipient_id, description, status, transaction_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transaction.id, transaction.userId, transaction.type, transaction.amount, transaction.currency, transaction.recipient, transaction.recipientId, transaction.description, transaction.status, transaction.transactionHash, transaction.createdAt],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getTransactions = (userId: string, limit: number = 50) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (_, result) => {
          const transactions = [];
          for (let i = 0; i < result.rows.length; i++) {
            transactions.push(result.rows.item(i));
          }
          resolve(transactions);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Chat message operations
export const insertChatMessage = (message: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO chat_messages (id, user_id, message, response, context, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [message.id, message.userId, message.message, message.response, message.context, message.createdAt],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getChatHistory = (userId: string, limit: number = 100) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?',
        [userId, limit],
        (_, result) => {
          const messages = [];
          for (let i = 0; i < result.rows.length; i++) {
            messages.push(result.rows.item(i));
          }
          resolve(messages);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// Settings operations
export const setSetting = (userId: string, key: string, value: string) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO app_settings (id, user_id, setting_key, setting_value, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [`${userId}_${key}`, userId, key, value],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getSetting = (userId: string, key: string) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT setting_value FROM app_settings WHERE user_id = ? AND setting_key = ?',
        [userId, key],
        (_, result) => {
          if (result.rows.length > 0) {
            resolve(result.rows.item(0).setting_value);
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

export default db;

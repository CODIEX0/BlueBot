/**
 * Enhanced Financial Education Component
 * Features expanded modules, difficulty levels, rewards, and SA-specific content
 */

import React from 'react';
const { useState, useEffect, useCallback, useRef } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Animated,
} from 'react-native';

interface EducationModule {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'budgeting' | 'investing' | 'saving' | 'debt' | 'sa-specific' | 'crypto' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  xpReward: number;
  prerequisiteIds: string[];
  content: string;
  completed: boolean;
  completedAt?: Date;
  emoji: string;
  unlocked: boolean;
}

interface Quiz {
  id: string;
  moduleId: string;
  questions: QuizQuestion[];
  passingScore: number;
  xpReward: number;
  attempts: number;
  bestScore?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'modules' | 'quizzes' | 'streaks' | 'special';
}

interface UserProgress {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  modulesCompleted: number;
  quizzesCompleted: number;
  achievements: string[];
}

const CATEGORIES = {
  basics: { name: 'Financial Basics', color: '#10B981', emoji: '📖', order: 1 },
  budgeting: { name: 'Budgeting', color: '#0EA5E9', emoji: '📊', order: 2 },
  saving: { name: 'Saving Money', color: '#8B5CF6', emoji: '💰', order: 3 },
  investing: { name: 'Investing', color: '#F59E0B', emoji: '📈', order: 4 },
  debt: { name: 'Debt Management', color: '#EF4444', emoji: '💳', order: 5 },
  'sa-specific': { name: 'SA Finance', color: '#059669', emoji: '🇿🇦', order: 6 },
  crypto: { name: 'Cryptocurrency', color: '#7C3AED', emoji: '₿', order: 7 },
  advanced: { name: 'Advanced Topics', color: '#DC2626', emoji: '🎓', order: 8 },
};

const DIFFICULTY_COLORS = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
  expert: '#7C3AED'
};

export default function EnhancedFinancialEducation() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedModule, setSelectedModule] = React.useState<EducationModule | null>(null);
  const [showModuleModal, setShowModuleModal] = React.useState(false);
  const [currentQuiz, setCurrentQuiz] = React.useState<Quiz | null>(null);
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<number[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [userProgress, setUserProgress] = React.useState<UserProgress>({
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    modulesCompleted: 0,
    quizzesCompleted: 0,
    achievements: []
  });

  const [modules, setModules] = React.useState<EducationModule[]>([
    // BASICS MODULES
    {
      id: 'basics-1',
      title: 'Understanding Money',
      description: 'Learn the fundamental concepts of money, income, and expenses',
      category: 'basics',
      difficulty: 'beginner',
      duration: 5,
      xpReward: 100,
      prerequisiteIds: [],
      emoji: '💡',
      completed: false,
      unlocked: true,
      content: `
# Understanding Money

## What is Money?
Money is a medium of exchange that represents value. In South Africa, our currency is the Rand (ZAR).

## Types of Money
- **Cash**: Physical notes and coins
- **Digital**: Bank accounts, cards, mobile payments
- **Investments**: Assets that can grow in value

## Income vs Expenses
- **Income**: Money you receive (salary, business, investments)
- **Expenses**: Money you spend (rent, food, transport)

## The Golden Rule
**Income - Expenses = Savings**

If this number is negative, you're spending more than you earn - time to budget!

## South African Context
- The South African Reserve Bank (SARB) controls our money supply
- Inflation affects purchasing power
- Interest rates impact borrowing and saving costs
      `
    },
    {
      id: 'basics-2',
      title: 'Banking in South Africa',
      description: 'Navigate the South African banking system like a pro',
      category: 'basics',
      difficulty: 'beginner',
      duration: 8,
      xpReward: 150,
      prerequisiteIds: ['basics-1'],
      emoji: '🏦',
      completed: false,
      unlocked: false,
      content: `
# Banking in South Africa

## Major Banks
1. **Standard Bank** - Largest by assets
2. **FNB (First National Bank)** - Known for innovation
3. **ABSA** - Strong retail presence
4. **Nedbank** - Green banking focus
5. **Capitec** - Simple, low-cost banking

## Account Types
- **Savings Account**: Earn interest, limited transactions
- **Cheque Account**: Daily transactions, debit orders
- **Money Market**: Higher interest, minimum balance
- **Fixed Deposit**: Lock money for guaranteed returns

## Banking Costs
Always compare:
- Monthly fees
- Transaction costs
- ATM fees
- International transaction fees

## Digital Banking
- Internet banking
- Mobile apps
- USSD codes (*120*[bank code]#)
- WhatsApp banking (some banks)

## Your Rights
Under the National Credit Act, you have rights to:
- Fair treatment
- Information in your language
- Protection from reckless lending
      `
    },
    {
      id: 'basics-3',
      title: 'Financial Planning Basics',
      description: 'Create your personal financial plan',
      category: 'basics',
      difficulty: 'intermediate',
      duration: 10,
      xpReward: 200,
      prerequisiteIds: ['basics-1', 'basics-2'],
      emoji: '📋',
      completed: false,
      unlocked: false,
      content: `
# Financial Planning Basics

## The 5 Steps to Financial Freedom

### 1. Set Clear Goals
- Emergency fund (3-6 months expenses)
- Short-term goals (1-2 years)
- Medium-term goals (3-5 years)  
- Long-term goals (10+ years)

### 2. Know Your Numbers
- Monthly income after tax
- Fixed expenses (rent, insurance)
- Variable expenses (groceries, fuel)
- Discretionary expenses (entertainment)

### 3. Create Your Budget
Use the 50/30/20 rule:
- 50% Needs (essentials)
- 30% Wants (lifestyle)
- 20% Savings & debt repayment

### 4. Build Your Emergency Fund
Start with R1,000, then build to:
- R5,000 (basic security)
- 3 months expenses (standard)
- 6 months expenses (ideal)

### 5. Invest for Growth
- Tax-Free Savings Account
- Retirement Annuity
- JSE investments
- Property (when ready)

## South African Priorities
1. Emergency fund (load-shedding, job market)
2. Medical aid/insurance
3. Retirement savings
4. Property down payment
5. Children's education
      `
    },

    // BUDGETING MODULES
    {
      id: 'budget-1',
      title: 'The 50/30/20 Budget Rule',
      description: 'Master the most popular budgeting method',
      category: 'budgeting',
      difficulty: 'beginner',
      duration: 7,
      xpReward: 120,
      prerequisiteIds: ['basics-1'],
      emoji: '📊',
      completed: false,
      unlocked: false,
      content: `
# The 50/30/20 Budget Rule

## How It Works
Divide your after-tax income into three categories:

### 50% - NEEDS (Essentials)
- Rent or bond payments
- Groceries and household items
- Transport costs (fuel, taxi, public transport)
- Insurance (medical aid, car, home)
- Minimum debt payments
- Utilities (electricity, water, internet)

### 30% - WANTS (Lifestyle)
- Dining out and takeaways
- Entertainment (movies, streaming, games)
- Hobbies and sports
- Shopping (clothes, gadgets)
- Personal care and beauty
- Holidays and trips

### 20% - SAVINGS & DEBT
- Emergency fund
- Retirement contributions
- Investment accounts
- Extra debt payments
- TFSA contributions

## South African Example
Monthly take-home: R15,000
- R7,500 for needs
- R4,500 for wants
- R3,000 for savings/debt

## Adapting for SA Conditions
- Include load-shedding costs (UPS, generator fuel)
- Factor in petrol price volatility
- Consider seasonal expenses (school fees)
- Plan for economic uncertainty

## Getting Started
1. Track expenses for one month
2. Calculate your current percentages
3. Adjust spending to hit targets
4. Automate savings on payday
5. Review monthly and adjust
      `
    },
    {
      id: 'budget-2',
      title: 'Zero-Based Budgeting',
      description: 'Give every rand a purpose with zero-based budgeting',
      category: 'budgeting',
      difficulty: 'intermediate',
      duration: 12,
      xpReward: 180,
      prerequisiteIds: ['budget-1'],
      emoji: '🎯',
      completed: false,
      unlocked: false,
      content: `
# Zero-Based Budgeting

## The Concept
Every rand you earn gets assigned a specific purpose until you have zero left to assign.

**Income - All Expenses - All Savings = R0**

## Why It Works
- Forces intentional spending
- Eliminates "mystery" money disappearance
- Maximizes every rand
- Builds strong money habits

## Setting Up Zero-Based Budget

### Step 1: List All Income
- Primary salary
- Side hustles
- Investment income
- Any other sources

### Step 2: List All Expenses
**Fixed Expenses:**
- Rent/bond: R6,000
- Medical aid: R1,500  
- Car payment: R3,000
- Insurance: R800
- Cellphone: R500

**Variable Expenses:**
- Groceries: R2,500
- Fuel: R1,200
- Utilities: R1,000

**Savings Goals:**
- Emergency fund: R1,000
- Retirement: R1,500
- Vacation fund: R500

### Step 3: Assign Every Rand
If income = R18,000 and expenses = R17,500, you have R500 left.
Assign it: Extra debt payment, additional savings, or increase emergency fund.

## SA-Specific Categories
- Load-shedding expenses
- Taxi/transport money
- School fees (quarterly)
- Traditional/cultural obligations
- Domestic worker wages
- Security costs

## Tools to Help
- Banking apps with budgeting features
- Spreadsheet templates
- Envelope method (cash)
- ABSA's budget calculator
- 22Seven app (free)
      `
    },

    // SAVING MODULES
    {
      id: 'save-1',
      title: 'Building Your Emergency Fund',
      description: 'Create a financial safety net for unexpected expenses',
      category: 'saving',
      difficulty: 'beginner',
      duration: 8,
      xpReward: 150,
      prerequisiteIds: ['basics-1'],
      emoji: '🚨',
      completed: false,
      unlocked: false,
      content: `
# Building Your Emergency Fund

## Why You Need One
Life happens:
- Job loss or reduced income
- Medical emergencies
- Car repairs
- Home maintenance (roof leaks, geyser burst)
- Family emergencies
- Economic downturns

## How Much to Save
**Starter Goal**: R2,000 - R5,000
- Covers small emergencies
- Prevents credit card debt
- Builds saving habit

**Standard Goal**: 3-6 months of expenses
- Job loss protection
- Major emergency coverage
- Peace of mind

**Advanced Goal**: 6-12 months of expenses
- Business owners
- Unstable income
- Economic uncertainty

## Where to Keep It
✅ **Good Options:**
- Separate savings account
- Money market account
- 32-day notice account
- Access Bonds (if you have one)

❌ **Bad Options:**
- Under the mattress
- Current account (too tempting)
- Investments (too risky)
- Fixed deposits (not accessible)

## Building Strategy
1. **Start Small**: R50/week = R2,600/year
2. **Automate**: Debit order on payday
3. **Use Windfalls**: Tax refunds, bonuses
4. **Sell Stuff**: Declutter and save
5. **Side Hustle**: Extra income streams

## SA-Specific Tips
- Keep some cash for load-shedding shopping
- Consider multiple banks (risk spread)
- Factor in potential job market volatility
- Include medical emergency buffer
- Plan for fuel price increases
      `
    },

    // INVESTING MODULES  
    {
      id: 'invest-1',
      title: 'Introduction to Investing',
      description: 'Start your wealth-building journey with smart investing',
      category: 'investing',
      difficulty: 'intermediate',
      duration: 15,
      xpReward: 250,
      prerequisiteIds: ['basics-3', 'save-1'],
      emoji: '📈',
      completed: false,
      unlocked: false,
      content: `
# Introduction to Investing

## Why Invest?
**Inflation**: R100 today won't buy the same in 10 years
**Compound Growth**: Your money makes money, which makes more money
**Wealth Building**: The only way to build long-term wealth

## Risk vs Return
Higher potential returns usually mean higher risk:
- **Cash Savings**: Low risk, low return (4-6%)
- **Bonds**: Medium risk, medium return (7-10%)
- **Shares**: High risk, high return (10-15%+ long-term)
- **Property**: Medium-high risk, medium-high return

## The Magic of Compound Interest
**Example**: R1,000/month for 30 years at 10% return
- Total contributions: R360,000
- Final value: R2,280,000+
- Your money made: R1,920,000!

## Investment Accounts in SA

### Tax-Free Savings Account (TFSA)
- R36,000 per year limit
- R500,000 lifetime limit
- NO tax on growth or withdrawals
- Perfect for beginners

### Retirement Annuity (RA)
- Tax deductible up to 27.5% of income
- Locked until age 55
- Great tax benefits
- Forced long-term savings

### Discretionary Investments
- No limits or restrictions
- Pay tax on dividends and capital gains
- Full flexibility
- Use after maxing TFSA

## Getting Started
1. **Emergency Fund First**: 3-6 months expenses
2. **Pay Off High-Interest Debt**: Credit cards first
3. **Open TFSA**: Start with R500/month
4. **Educate Yourself**: Read, learn, start small
5. **Stay Consistent**: Time in market beats timing market

## SA Investment Platforms
- **Easy Equities**: Low fees, great app
- **10X Investments**: Low-cost retirement
- **Allan Gray**: Established fund manager
- **Satrix**: Low-cost index funds
- **Your Bank**: Often expensive but convenient
      `
    },

    // SOUTH AFRICAN SPECIFIC
    {
      id: 'sa-1',
      title: 'Understanding SARS and Tax',
      description: 'Navigate South African tax like a pro',
      category: 'sa-specific',
      difficulty: 'intermediate',
      duration: 12,
      xpReward: 200,
      prerequisiteIds: ['basics-2'],
      emoji: '🇿🇦',
      completed: false,
      unlocked: false,
      content: `
# Understanding SARS and Tax

## Income Tax Brackets (2024/25)
- R0 - R237,100: 18%
- R237,101 - R370,500: 26%
- R370,501 - R512,800: 31%
- R512,801 - R673,000: 36%
- R673,001 - R857,900: 39%
- R857,901+: 45%

## Primary Rebate
Everyone gets R17,235 rebate per year
**Practical**: You only pay tax on income above R95,750

## Major Deductions
1. **Retirement Contributions**: Up to 27.5% of income (max R350,000)
2. **Medical Aid Credits**: R347/month main, R347 first dependent
3. **Medical Expenses**: Above 7.5% of income
4. **Donations**: Up to 10% of income to approved charities

## Tax-Efficient Investing

### Tax-Free Savings Account
- R36,000 annual contribution limit
- R500,000 lifetime limit
- NO tax on interest, dividends, or capital gains
- Can withdraw anytime (but can't re-contribute)

### Retirement Annuity
- Tax deductible contributions
- No tax while growing
- Taxed at retirement (but often lower rate)
- Locked until age 55

## Important Dates
- **February**: Tax season opens
- **31 October**: Non-provisional taxpayers
- **31 January**: Provisional taxpayers
- **April/May**: SARS refunds (if any)

## eFiling Tips
1. Register on SARS website
2. Keep all tax certificates (IRP5, IT3b, etc.)
3. File before deadlines
4. Check for refunds 21 days after filing
5. Keep records for 5 years

## Common Mistakes
- Not claiming medical expenses
- Forgetting retirement contributions
- Missing donation certificates
- Late filing penalties
- Not updating contact details
      `
    },

    // CRYPTOCURRENCY MODULE
    {
      id: 'crypto-1',
      title: 'Cryptocurrency for Beginners',
      description: 'Understanding digital money for unbanked and banked users',
      category: 'crypto',
      difficulty: 'intermediate',
      duration: 20,
      xpReward: 300,
      prerequisiteIds: ['basics-3', 'invest-1'],
      emoji: '₿',
      completed: false,
      unlocked: false,
      content: `
# Cryptocurrency for South Africans

## What is Cryptocurrency?
Digital money that exists only electronically, secured by cryptography and recorded on a blockchain.

## Why Crypto Matters in SA
- **Banking Access**: 11 million South Africans are unbanked
- **Remittances**: Cheaper international transfers
- **Inflation Hedge**: Potential protection against rand weakness
- **24/7 Trading**: Markets never close
- **Financial Inclusion**: Anyone with internet can participate

## Popular Cryptocurrencies
1. **Bitcoin (BTC)**: Digital gold, store of value
2. **Ethereum (ETH)**: Smart contracts, DeFi platform
3. **Stablecoins (USDC, USDT)**: Pegged to US dollar
4. **Binance Coin (BNB)**: Exchange token

## SA-Regulated Exchanges
1. **Luno**: SA-based, bank-friendly, easy for beginners
2. **VALR**: Advanced trading, good app
3. **AltCoinTrader**: Local exchange, multiple cryptos
4. **Ice3X**: Established SA platform

## Getting Started Safely
1. **Education First**: Learn before investing
2. **Start Small**: Only invest what you can afford to lose
3. **Use Regulated Exchanges**: Stick to FSP-licensed platforms
4. **Secure Storage**: Learn about wallets
5. **Tax Awareness**: Crypto gains are taxable in SA

## Security Best Practices
- Enable 2-factor authentication
- Use strong, unique passwords
- Never share private keys
- Consider hardware wallets for large amounts
- Beware of scams and "get rich quick" schemes

## Tax Implications
SARS treats crypto as assets:
- **Trading**: Income tax applies
- **Investing**: Capital gains tax
- **Keep Records**: All transactions must be tracked
- **Get Help**: Consider crypto tax software

## Risks to Understand
- **Volatility**: Prices can swing wildly
- **Regulatory Risk**: Laws can change
- **Technology Risk**: Lost keys = lost money
- **Scam Risk**: Many fraudulent schemes
- **Market Risk**: Entire market can crash

## For Unbanked Users
- Mobile money integration
- Peer-to-peer trading
- Lower barrier to entry
- Access to global markets
- But: Need smartphone and data
      `
    }
  ]);

  const [quizzes, setQuizzes] = React.useState<Quiz[]>([
    {
      id: 'quiz-basics-1',
      moduleId: 'basics-1',
      passingScore: 70,
      xpReward: 50,
      attempts: 0,
      questions: [
        {
          id: 'q1',
          question: 'What is the formula for calculating savings?',
          options: [
            'Expenses - Income = Savings',
            'Income - Expenses = Savings',
            'Income + Expenses = Savings',
            'Savings - Expenses = Income'
          ],
          correctAnswer: 1,
          explanation: 'Savings is what remains after subtracting expenses from income.',
          difficulty: 'easy'
        },
        {
          id: 'q2',
          question: 'What does SARB stand for?',
          options: [
            'South African Reserve Bank',
            'South African Revenue Board',
            'South African Retail Bank',
            'South African Registration Bureau'
          ],
          correctAnswer: 0,
          explanation: 'SARB is the South African Reserve Bank, our central bank.',
          difficulty: 'medium'
        },
        {
          id: 'q3',
          question: 'If your income - expenses = negative number, what does this mean?',
          options: [
            'You are saving money',
            'You are spending more than you earn',
            'You need to earn less',
            'Your budget is perfect'
          ],
          correctAnswer: 1,
          explanation: 'A negative number means you are spending more than you earn - time to budget!',
          difficulty: 'easy'
        }
      ]
    },
    {
      id: 'quiz-budget-1',
      moduleId: 'budget-1',
      passingScore: 70,
      xpReward: 75,
      attempts: 0,
      questions: [
        {
          id: 'q1',
          question: 'In the 50/30/20 rule, what percentage goes to wants?',
          options: ['50%', '30%', '20%', '40%'],
          correctAnswer: 1,
          explanation: '30% of after-tax income should go to wants and lifestyle expenses.',
          difficulty: 'easy'
        },
        {
          id: 'q2',
          question: 'Which of these is a NEED in South African context?',
          options: [
            'Netflix subscription',
            'Medical aid',
            'Expensive coffee',
            'Latest smartphone'
          ],
          correctAnswer: 1,
          explanation: 'Medical aid is essential in SA due to healthcare costs.',
          difficulty: 'medium'
        },
        {
          id: 'q3',
          question: 'If you earn R10,000 after tax, how much should go to savings/debt?',
          options: ['R1,000', 'R2,000', 'R3,000', 'R5,000'],
          correctAnswer: 1,
          explanation: '20% of R10,000 = R2,000 for savings and debt repayment.',
          difficulty: 'easy'
        }
      ]
    }
  ]);

  const [achievements, setAchievements] = React.useState<Achievement[]>([
    {
      id: 'first-module',
      title: 'First Steps',
      description: 'Complete your first education module',
      emoji: '👶',
      xpReward: 50,
      unlocked: false,
      category: 'modules'
    },
    {
      id: 'quiz-master',
      title: 'Quiz Master',
      description: 'Pass 5 quizzes with 90%+ score',
      emoji: '🧠',
      xpReward: 200,
      unlocked: false,
      category: 'quizzes'
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Learn something new 7 days in a row',
      emoji: '🔥',
      xpReward: 150,
      unlocked: false,
      category: 'streaks'
    },
    {
      id: 'sa-expert',
      title: 'Mzansi Money Master',
      description: 'Complete all South African finance modules',
      emoji: '🇿🇦',
      xpReward: 500,
      unlocked: false,
      category: 'special'
    }
  ]);

  // Filter modules based on selected category
  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(module => module.category === selectedCategory);

  // Sort modules by category order and difficulty
  const sortedModules = filteredModules.sort((a, b) => {
    const categoryOrderA = CATEGORIES[a.category]?.order || 999;
    const categoryOrderB = CATEGORIES[b.category]?.order || 999;
    
    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }
    
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  // Calculate user level based on XP
  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 500) + 1;
  };

  // Check if module is unlocked
  const isModuleUnlocked = (module: EducationModule): boolean => {
    if (module.prerequisiteIds.length === 0) return true;
    return module.prerequisiteIds.every(id => 
      modules.find(m => m.id === id)?.completed
    );
  };

  // Complete module
  const completeModule = (moduleId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return { ...module, completed: true, completedAt: new Date() };
      }
      // Unlock dependent modules
      if (module.prerequisiteIds.includes(moduleId)) {
        return { ...module, unlocked: isModuleUnlocked(module) };
      }
      return module;
    }));

    // Update user progress
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setUserProgress(prev => ({
        ...prev,
        totalXP: prev.totalXP + module.xpReward,
        level: calculateLevel(prev.totalXP + module.xpReward),
        modulesCompleted: prev.modulesCompleted + 1,
        currentStreak: prev.currentStreak + 1,
        longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1)
      }));

      // Check for achievements
      checkAchievements();
    }
  };

  // Check and unlock achievements
  const checkAchievements = () => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first-module':
          shouldUnlock = userProgress.modulesCompleted >= 1;
          break;
        case 'week-streak':
          shouldUnlock = userProgress.currentStreak >= 7;
          break;
        case 'sa-expert':
          const saModules = modules.filter(m => m.category === 'sa-specific');
          const completedSAModules = saModules.filter(m => m.completed);
          shouldUnlock = completedSAModules.length === saModules.length;
          break;
      }

      if (shouldUnlock) {
        setUserProgress(prev => ({
          ...prev,
          totalXP: prev.totalXP + achievement.xpReward,
          achievements: [...prev.achievements, achievement.id]
        }));

        return { ...achievement, unlocked: true, unlockedAt: new Date() };
      }

      return achievement;
    }));
  };

  // Start quiz
  const startQuiz = (moduleId: string) => {
    const quiz = quizzes.find(q => q.moduleId === moduleId);
    if (quiz) {
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowResults(false);
      setShowQuizModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.progressSection}>
          <Text style={styles.headerTitle}>Financial Education</Text>
          <View style={styles.levelSection}>
            <Text style={styles.levelText}>Level {userProgress.level}</Text>
            <Text style={styles.xpText}>{userProgress.totalXP} XP</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(userProgress.totalXP % 500) / 5}%` }
            ]} 
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === 'all' && styles.categoryButtonTextActive
          ]}>
            All 📚
          </Text>
        </TouchableOpacity>

        {Object.entries(CATEGORIES)
          .sort(([,a], [,b]) => a.order - b.order)
          .map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryButton,
              selectedCategory === key && styles.categoryButtonActive,
              { borderColor: category.color }
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === key && styles.categoryButtonTextActive
            ]}>
              {category.emoji} {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modules List */}
      <ScrollView style={styles.modulesList}>
        {sortedModules.map(module => {
          const isUnlocked = isModuleUnlocked(module);
          const category = CATEGORIES[module.category];
          
          return (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.moduleCard,
                !isUnlocked && styles.moduleCardLocked,
                module.completed && styles.moduleCardCompleted
              ]}
              onPress={() => {
                if (isUnlocked) {
                  setSelectedModule(module);
                  setShowModuleModal(true);
                }
              }}
              disabled={!isUnlocked}
            >
              <View style={styles.moduleHeader}>
                <View style={styles.moduleEmoji}>
                  <Text style={styles.emojiText}>
                    {!isUnlocked ? '🔒' : module.emoji}
                  </Text>
                </View>
                
                <View style={styles.moduleInfo}>
                  <Text style={[
                    styles.moduleTitle,
                    !isUnlocked && styles.moduleTextLocked
                  ]}>
                    {module.title}
                  </Text>
                  <Text style={[
                    styles.moduleDescription,
                    !isUnlocked && styles.moduleTextLocked
                  ]}>
                    {module.description}
                  </Text>
                </View>

                <View style={styles.moduleStats}>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: DIFFICULTY_COLORS[module.difficulty] }
                  ]}>
                    <Text style={styles.difficultyText}>
                      {module.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.durationText}>
                    {module.duration} min
                  </Text>
                  <Text style={styles.xpText}>
                    +{module.xpReward} XP
                  </Text>
                </View>
              </View>

              {module.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✅ Completed</Text>
                </View>
              )}

              {!isUnlocked && module.prerequisiteIds.length > 0 && (
                <View style={styles.prerequisiteInfo}>
                  <Text style={styles.prerequisiteText}>
                    Complete: {module.prerequisiteIds.map(id => 
                      modules.find(m => m.id === id)?.title
                    ).join(', ')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Module Detail Modal */}
      <Modal
        visible={showModuleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModuleModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedModule?.emoji} {selectedModule?.title}
            </Text>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.moduleContent}>
              {selectedModule?.content}
            </Text>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.quizButton}
              onPress={() => {
                if (selectedModule) {
                  startQuiz(selectedModule.id);
                }
              }}
            >
              <Text style={styles.quizButtonText}>
                Take Quiz (+{quizzes.find(q => q.moduleId === selectedModule?.id)?.xpReward || 0} points)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    paddingTop: 40,
  },
  progressSection: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  levelSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  xpText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  moduleDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
    modalActions: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    quizButton: {
      backgroundColor: '#10B981',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    quizButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    categoryFilter: {
      paddingVertical: 8,
      paddingLeft: 16,
      paddingRight: 8,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    categoryButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    categoryButtonActive: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
    },
    categoryButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
    },
    categoryButtonTextActive: {
      color: '#FFFFFF',
    },
    modulesList: {
      flex: 1,
      padding: 16,
    },
    moduleCardLocked: {
      backgroundColor: '#F3F4F6',
    },
    moduleCardCompleted: {
      backgroundColor: '#D1FAE5',
    },
    moduleEmoji: {
      marginRight: 12,
    },
    moduleInfo: {
      flex: 1,
    },
    moduleStats: {
      alignItems: 'flex-end',
    },
    moduleTextLocked: {
      color: '#9CA3AF',
    },
    completedBadge: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#10B981',
      alignItems: 'center',
    },
    completedText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    prerequisiteInfo: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#FEF3C7',
    },
    prerequisiteText: {
      color: '#92400E',
      fontWeight: '500',
    },
    difficultyBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      marginBottom: 4,
    },
    difficultyText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '500',
    },
    durationText: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 2,
    },
    emojiText: {
      fontSize: 24,
    },
    moduleContent: {
      fontSize: 16,
      lineHeight: 24,
      color: '#374151',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
    },
    closeButtonText: {
      fontSize: 18,
      color: '#FFFFFF',
    },
});

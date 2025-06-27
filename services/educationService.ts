/**
 * Financial Education Service
 * Provides financial literacy content and courses for South African users
 */

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string; // e.g., "30 minutes"
  lessons: Lesson[];
  category: 'Budgeting' | 'Saving' | 'Investing' | 'Credit' | 'Insurance' | 'Crypto';
  thumbnail: string;
  xpReward: number;
  completed: boolean;
  progress: number; // 0-100
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'quiz' | 'interactive';
  duration: string;
  xpReward: number;
  completed: boolean;
  quiz?: Quiz;
}

export interface Quiz {
  questions: QuizQuestion[];
  passingScore: number; // percentage
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

export interface UserProgress {
  totalXP: number;
  level: number;
  completedCourses: string[];
  completedLessons: string[];
  achievements: Achievement[];
  streakDays: number;
  lastStudyDate: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  requirements: {
    type: 'courses_completed' | 'lessons_completed' | 'quiz_perfect' | 'streak_days' | 'xp_earned';
    target: number;
  };
}

class FinancialEducationService {
  private courses: Course[] = [
    {
      id: 'budgeting-basics',
      title: 'Budgeting Basics for South Africa',
      description: 'Learn how to create and manage a budget that works in the South African economic context.',
      difficulty: 'Beginner',
      duration: '45 minutes',
      category: 'Budgeting',
      thumbnail: '📊',
      xpReward: 100,
      completed: false,
      progress: 0,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Understanding Your Income',
          content: `In South Africa, understanding your income is the foundation of good budgeting. Whether you earn a salary, wages, or have irregular income, knowing exactly how much money comes in each month is crucial.

**Types of Income in SA:**
- Salary (monthly fixed amount)
- Wages (hourly or daily rates)
- Commission and bonuses
- Government grants (like child support grant)
- Side hustle income
- Investment returns

**Important Considerations:**
- Always budget based on your NET income (after tax)
- Factor in deductions like UIF, medical aid, and pension
- Consider the 13th cheque as a bonus, not regular income
- If income is irregular, use the lowest monthly amount for budgeting

**Action Steps:**
1. Gather 3 months of payslips
2. Calculate your average monthly net income
3. List all sources of income
4. Identify which income is guaranteed vs. variable`,
          type: 'text',
          duration: '10 minutes',
          xpReward: 25,
          completed: false
        },
        {
          id: 'lesson-2',
          title: 'The 50/30/20 Rule (SA Edition)',
          content: `The 50/30/20 rule is a simple budgeting framework adapted for South African conditions:

**50% - NEEDS (Essential Expenses)**
- Rent/bond payments
- Groceries and household items
- Transport costs (taxi, petrol, car payments)
- Utilities (electricity, water, cell phone)
- Medical aid and insurance
- Minimum debt payments

**30% - WANTS (Lifestyle Expenses)**
- Entertainment and dining out
- Hobbies and recreation
- Clothing (beyond basics)
- Subscriptions (DSTV, Netflix, gym)
- Personal care and beauty

**20% - SAVINGS & DEBT REPAYMENT**
- Emergency fund
- Retirement savings
- Tax-free savings account
- Extra debt payments
- Investment contributions

**SA-Specific Adjustments:**
- High transport costs might require 55/25/20 split
- Consider load shedding costs (inverter, generator)
- Factor in extended family support obligations
- Account for irregular expenses like school fees`,
          type: 'text',
          duration: '15 minutes',
          xpReward: 25,
          completed: false
        },
        {
          id: 'quiz-1',
          title: 'Budgeting Knowledge Check',
          content: '',
          type: 'quiz',
          duration: '10 minutes',
          xpReward: 50,
          completed: false,
          quiz: {
            passingScore: 70,
            questions: [
              {
                id: 'q1',
                question: 'What percentage of your income should go to NEEDS according to the 50/30/20 rule?',
                options: ['30%', '50%', '20%', '40%'],
                correctAnswer: 1,
                explanation: 'According to the 50/30/20 rule, 50% of your income should go to essential needs like rent, groceries, and transport.'
              },
              {
                id: 'q2',
                question: 'Which of these is considered a NEED in the South African context?',
                options: ['DSTV subscription', 'Taxi fare to work', 'Eating out', 'Gym membership'],
                correctAnswer: 1,
                explanation: 'Transport to work (including taxi fare) is an essential need in South Africa where public transport is often necessary for employment.'
              },
              {
                id: 'q3',
                question: 'What should you base your budget on?',
                options: ['Gross income', 'Net income (after tax)', 'Expected bonuses', 'Maximum possible income'],
                correctAnswer: 1,
                explanation: 'Always budget based on your net income (after tax and deductions) to ensure realistic planning.'
              }
            ]
          }
        }
      ]
    },
    {
      id: 'saving-strategies',
      title: 'Smart Saving Strategies for SA',
      description: 'Discover effective ways to save money in the South African economy, from emergency funds to long-term investments.',
      difficulty: 'Beginner',
      duration: '50 minutes',
      category: 'Saving',
      thumbnail: '💰',
      xpReward: 120,
      completed: false,
      progress: 0,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Building Your Emergency Fund',
          content: `An emergency fund is your financial safety net. In South Africa's uncertain economic climate, it's more important than ever.

**Why Emergency Funds Matter in SA:**
- Job market volatility
- Load shedding and infrastructure challenges
- Medical emergencies with limited public healthcare
- Economic uncertainty and inflation

**How Much to Save:**
- Minimum: R1,000 starter emergency fund
- Goal: 3-6 months of living expenses
- High-risk jobs: 6-12 months of expenses

**Where to Keep Your Emergency Fund:**
- High-yield savings account
- Money market account
- 32-day notice account (for higher amounts)
- NOT in investments that can lose value

**Building Strategy:**
1. Start with R50-R100 per month
2. Save windfalls (tax refunds, bonuses)
3. Automate transfers on payday
4. Gradually increase contribution amounts
5. Keep it separate from daily banking`,
          type: 'text',
          duration: '12 minutes',
          xpReward: 30,
          completed: false
        },
        {
          id: 'lesson-2',
          title: 'Tax-Free Savings Accounts (TFSA)',
          content: `Tax-Free Savings Accounts are one of South Africa's best savings tools. Understanding how to use them effectively can significantly boost your wealth.

**TFSA Benefits:**
- No tax on interest, dividends, or capital gains
- R36,000 annual contribution limit
- R500,000 lifetime contribution limit
- Flexible withdrawals (but contributions can't be replaced)

**Best Uses for TFSA:**
- Long-term savings goals (5+ years)
- Retirement planning supplement
- Wealth building through investments
- Emergency fund (for higher earners)

**Investment Options:**
- Cash deposits (safe but lower returns)
- Unit trusts/mutual funds
- Exchange Traded Funds (ETFs)
- Shares (for experienced investors)

**Strategies:**
- Maximize your R36,000 annual allowance
- Start early (compound interest effect)
- Choose growth investments for long-term goals
- Consider automatic monthly debit orders
- Don't withdraw unless absolutely necessary

**Common Mistakes:**
- Using it as a short-term savings account
- Not maximizing the annual allowance
- Withdrawing funds unnecessarily
- Choosing overly conservative investments`,
          type: 'text',
          duration: '15 minutes',
          xpReward: 30,
          completed: false
        }
      ]
    },
    {
      id: 'crypto-basics',
      title: 'Cryptocurrency for South Africans',
      description: 'Learn about digital currencies and how they can benefit unbanked and underbanked South Africans.',
      difficulty: 'Intermediate',
      duration: '60 minutes',
      category: 'Crypto',
      thumbnail: '₿',
      xpReward: 150,
      completed: false,
      progress: 0,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Understanding Cryptocurrency',
          content: `Cryptocurrency is digital money that can provide financial services to unbanked South Africans and offer alternative investment opportunities.

**What is Cryptocurrency?**
- Digital currency secured by cryptography
- Operates on decentralized networks (blockchain)
- Not controlled by banks or governments
- Can be sent anywhere in the world 24/7

**Popular Cryptocurrencies:**
- Bitcoin (BTC) - Digital gold, store of value
- Ethereum (ETH) - Smart contracts platform
- Stablecoins (USDC, USDT) - Pegged to US Dollar

**Benefits for South Africans:**
- Financial inclusion for the unbanked
- Lower international transfer fees
- Protection against currency devaluation
- 24/7 access to financial services
- Investment opportunities

**Risks to Consider:**
- High volatility (prices change rapidly)
- Regulatory uncertainty in SA
- Technical complexity
- Security risks if not handled properly
- Potential for scams

**SA Regulatory Environment:**
- SARB allows crypto trading
- Treated as assets for tax purposes
- Annual foreign investment allowance applies
- Capital gains tax on profits`,
          type: 'text',
          duration: '20 minutes',
          xpReward: 40,
          completed: false
        }
      ]
    }
  ];

  private achievements: Achievement[] = [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      xpReward: 50,
      requirements: {
        type: 'lessons_completed',
        target: 1
      }
    },
    {
      id: 'course-master',
      title: 'Course Master',
      description: 'Complete your first course',
      icon: '🏆',
      xpReward: 100,
      requirements: {
        type: 'courses_completed',
        target: 1
      }
    },
    {
      id: 'quiz-champion',
      title: 'Quiz Champion',
      description: 'Get 100% on a quiz',
      icon: '🧠',
      xpReward: 75,
      requirements: {
        type: 'quiz_perfect',
        target: 1
      }
    },
    {
      id: 'dedicated-learner',
      title: 'Dedicated Learner',
      description: 'Study for 7 days straight',
      icon: '🔥',
      xpReward: 200,
      requirements: {
        type: 'streak_days',
        target: 7
      }
    }
  ];

  getCourses(): Course[] {
    return this.courses;
  }

  getCourse(courseId: string): Course | null {
    return this.courses.find(course => course.id === courseId) || null;
  }

  getCoursesByCategory(category: Course['category']): Course[] {
    return this.courses.filter(course => course.category === category);
  }

  getLesson(courseId: string, lessonId: string): Lesson | null {
    const course = this.getCourse(courseId);
    if (!course) return null;
    
    return course.lessons.find(lesson => lesson.id === lessonId) || null;
  }

  async completeLesson(courseId: string, lessonId: string): Promise<{
    xpEarned: number;
    achievementsUnlocked: Achievement[];
    levelUp: boolean;
  }> {
    const course = this.getCourse(courseId);
    const lesson = this.getLesson(courseId, lessonId);
    
    if (!course || !lesson) {
      throw new Error('Course or lesson not found');
    }

    // Mark lesson as completed
    lesson.completed = true;
    
    // Update course progress
    const completedLessons = course.lessons.filter(l => l.completed).length;
    course.progress = Math.round((completedLessons / course.lessons.length) * 100);
    
    // Check if course is completed
    if (course.progress === 100) {
      course.completed = true;
    }

    // Calculate XP and achievements
    const xpEarned = lesson.xpReward;
    const achievementsUnlocked = this.checkAchievements();
    const currentLevel = this.calculateLevel();
    
    // Simulate level up check
    const levelUp = false; // Implement level calculation logic

    return {
      xpEarned,
      achievementsUnlocked,
      levelUp
    };
  }

  async submitQuizAnswers(
    courseId: string, 
    lessonId: string, 
    answers: number[]
  ): Promise<{
    score: number;
    passed: boolean;
    feedback: Array<{
      question: string;
      correct: boolean;
      explanation: string;
    }>;
  }> {
    const lesson = this.getLesson(courseId, lessonId);
    
    if (!lesson || !lesson.quiz) {
      throw new Error('Quiz not found');
    }

    const quiz = lesson.quiz;
    let correctAnswers = 0;
    const feedback = quiz.questions.map((question, index) => {
      const isCorrect = answers[index] === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        correct: isCorrect,
        explanation: question.explanation
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    if (passed) {
      await this.completeLesson(courseId, lessonId);
    }

    return {
      score,
      passed,
      feedback
    };
  }

  getAchievements(): Achievement[] {
    return this.achievements;
  }

  private checkAchievements(): Achievement[] {
    // Logic to check which achievements have been unlocked
    // This would integrate with user progress data
    return [];
  }

  private calculateLevel(): number {
    // Calculate user level based on total XP
    // Example: Level = Math.floor(totalXP / 100) + 1
    return 1;
  }

  getTotalXP(): number {
    // Calculate total XP from completed lessons and achievements
    return this.courses.reduce((total, course) => {
      return total + course.lessons.reduce((courseTotal, lesson) => {
        return courseTotal + (lesson.completed ? lesson.xpReward : 0);
      }, 0);
    }, 0);
  }

  getRecommendedCourses(): Course[] {
    // Return courses recommended for the user based on their progress
    const incompleteCourses = this.courses.filter(course => !course.completed);
    
    // Prioritize beginner courses
    return incompleteCourses
      .sort((a, b) => {
        if (a.difficulty === 'Beginner' && b.difficulty !== 'Beginner') return -1;
        if (b.difficulty === 'Beginner' && a.difficulty !== 'Beginner') return 1;
        return 0;
      })
      .slice(0, 3);
  }

  getDailyTip(): string {
    const tips = [
      "Start your emergency fund with just R50 this month. Small steps lead to big changes!",
      "Use the envelope method: withdraw cash for discretionary spending to avoid overspending.",
      "Take advantage of your R36,000 annual TFSA allowance - it's free money from SARS!",
      "Review your bank statements weekly to catch unauthorized transactions early.",
      "Consider generic brands at grocery stores - they can save you 20-30% on your shopping bill.",
      "Set up automatic transfers to savings on payday - pay yourself first!",
      "Compare insurance quotes annually to ensure you're getting the best rates.",
      "Use free Wi-Fi when possible to reduce your data costs.",
      "Cook meals at home more often - it's healthier and much more cost-effective.",
      "Track your spending for a week to identify where your money really goes."
    ];

    const today = new Date().getDate();
    return tips[today % tips.length];
  }
}

export default new FinancialEducationService();

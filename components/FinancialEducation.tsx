import React from 'react';
const { useState, useCallback, useEffect, useRef, useContext, createContext } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';

interface FinancialLesson {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'budgeting' | 'investing' | 'saving' | 'debt' | 'sa-specific';
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  completed: boolean;
  emoji: string;
}

interface Quiz {
  id: string;
  lessonId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const CATEGORIES = {
  basics: { name: 'Financial Basics', color: '#10B981', emoji: '📖' },
  budgeting: { name: 'Budgeting', color: '#0EA5E9', emoji: '📊' },
  saving: { name: 'Saving Money', color: '#8B5CF6', emoji: '💰' },
  investing: { name: 'Investing', color: '#F59E0B', emoji: '📈' },
  debt: { name: 'Debt Management', color: '#EF4444', emoji: '💳' },
  'sa-specific': { name: 'South African Finance', color: '#6B7280', emoji: '🇿🇦' },
};

export default function FinancialEducation() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<FinancialLesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  const [lessons, setLessons] = useState<FinancialLesson[]>([
    {
      id: '1',
      title: 'Understanding Your Money',
      description: 'Learn the basics of income, expenses, and cash flow',
      category: 'basics',
      duration: 5,
      difficulty: 'beginner',
      emoji: '💡',
      completed: false,
      content: `
# Understanding Your Money

Money management starts with understanding where your money comes from and where it goes.

## Income vs Expenses
- **Income**: Money you receive (salary, side jobs, investments)
- **Expenses**: Money you spend (rent, food, transport, entertainment)

## Cash Flow
Your cash flow is simply: Income - Expenses

If this number is positive, you're saving money. If it's negative, you're spending more than you earn.

## Types of Expenses
1. **Fixed Expenses**: Same amount each month (rent, insurance)
2. **Variable Expenses**: Change each month (groceries, fuel)
3. **Discretionary Expenses**: Optional spending (entertainment, dining out)

## Key Takeaway
Track your money for one month to understand your spending patterns. This is the foundation of good financial health.
      `,
    },
    {
      id: '2',
      title: 'The 50/30/20 Budget Rule',
      description: 'Learn how to allocate your income effectively',
      category: 'budgeting',
      duration: 7,
      difficulty: 'beginner',
      emoji: '📊',
      completed: false,
      content: `
# The 50/30/20 Budget Rule

This simple rule helps you allocate your after-tax income:

## 50% - Needs
Money for essential expenses:
- Rent or bond payments
- Groceries
- Transport
- Insurance
- Minimum debt payments

## 30% - Wants
Money for lifestyle and entertainment:
- Dining out
- Movies and entertainment
- Hobbies
- Shopping (non-essential)
- Subscriptions

## 20% - Savings & Debt
Money for your future:
- Emergency fund
- Retirement savings
- Extra debt payments
- Investments

## South African Example
If you earn R15,000 per month:
- R7,500 for needs
- R4,500 for wants  
- R3,000 for savings and debt

## Tips for Success
1. Start by tracking current spending
2. Adjust percentages based on your situation
3. Automate your savings
4. Review and adjust monthly
      `,
    },
    {
      id: '3',
      title: 'Building an Emergency Fund',
      description: 'Why you need emergency savings and how to build one',
      category: 'saving',
      duration: 6,
      difficulty: 'beginner',
      emoji: '🚨',
      completed: false,
      content: `
# Building an Emergency Fund

An emergency fund is money set aside for unexpected expenses or income loss.

## Why You Need One
- Job loss or reduced income
- Medical emergencies
- Car repairs
- Home maintenance
- Family emergencies

## How Much to Save
**Beginner Goal**: R2,000 - R5,000
**Standard Goal**: 3-6 months of expenses
**Advanced Goal**: 6-12 months of expenses

## Where to Keep It
- Separate savings account
- Money market account
- 32-day notice account
- NOT in investments (too risky)

## How to Build It
1. **Start small**: Even R50/week helps
2. **Automate**: Set up automatic transfers
3. **Use windfalls**: Tax refunds, bonuses
4. **Reduce expenses**: Find money to redirect
5. **Side income**: Freelance or part-time work

## South African Options
- Standard Bank Savings Account
- FNB Easy Save Account
- Capitec Global One Savings
- Nedbank Money Market Account

Remember: Don't touch this money unless it's a true emergency!
      `,
    },
    {
      id: '4',
      title: 'Understanding South African Tax',
      description: 'Learn about SARS, tax brackets, and deductions',
      category: 'sa-specific',
      duration: 10,
      difficulty: 'intermediate',
      emoji: '🇿🇦',
      completed: false,
      content: `
# Understanding South African Tax

Learn how tax works in South Africa and how to optimize your tax situation.

## Income Tax Brackets (2024/25)
- R0 - R237,100: 18%
- R237,101 - R370,500: 26%  
- R370,501 - R512,800: 31%
- R512,801 - R673,000: 36%
- R673,001 - R857,900: 39%
- R857,901+: 45%

## Primary Rebate
All taxpayers get a rebate of R17,235 per year, meaning you only pay tax on income above R95,750.

## Tax-Free Investments
1. **Tax-Free Savings Account (TFSA)**
   - R36,000 per year limit
   - R500,000 lifetime limit
   - No tax on growth or withdrawals

2. **Retirement Annuities (RA)**
   - 27.5% of income or R350,000 per year
   - Tax deductible
   - Locked until retirement

## Medical Aid Credits
- Main member: R347/month
- First dependant: R347/month  
- Additional dependants: R234/month each

## Key Deductions
- Retirement fund contributions
- Medical expenses (above 7.5% of income)
- Donations to approved charities
- Home office expenses (if applicable)

## SARS Filing
- File by end of November (non-provisional)
- File by end of January (provisional)
- Use eFiling for convenience
      `,
    },
    {
      id: '5',
      title: 'Debt Management Strategies',
      description: 'Learn how to tackle debt effectively',
      category: 'debt',
      duration: 8,
      difficulty: 'intermediate',
      emoji: '💳',
      completed: false,
      content: `
# Debt Management Strategies

Learn effective strategies to pay off debt and avoid the debt trap.

## Types of Debt
**Good Debt**: Helps build wealth
- Home loans
- Education loans
- Business loans

**Bad Debt**: Costs money without building wealth
- Credit cards
- Store accounts
- Personal loans
- Payday loans

## Debt Repayment Strategies

### 1. Debt Snowball
- Pay minimums on all debts
- Put extra money toward smallest debt
- Once paid, move to next smallest
- **Pros**: Quick wins, motivation
- **Cons**: May pay more interest

### 2. Debt Avalanche  
- Pay minimums on all debts
- Put extra money toward highest interest debt
- **Pros**: Saves most money
- **Cons**: Slower initial progress

## South African Debt Relief
1. **Debt Counselling**: Legal protection under National Credit Act
2. **Debt Consolidation**: Combine multiple debts
3. **Payment Plans**: Negotiate with creditors

## Warning Signs of Debt Problems
- Only making minimum payments
- Using credit for basic needs
- Borrowing to pay other debts
- Missing payments
- Credit utilization above 30%

## Prevention Tips
1. Build an emergency fund
2. Live below your means
3. Avoid store credit
4. Pay credit cards in full
5. Read all terms and conditions
      `,
    },
  ]);

  const [quizzes] = useState<Quiz[]>([
    {
      id: '1',
      lessonId: '1',
      question: 'What is cash flow?',
      options: [
        'Your total income',
        'Your total expenses', 
        'Income minus expenses',
        'Money in your bank account'
      ],
      correctAnswer: 2,
      explanation: 'Cash flow is your income minus your expenses. A positive cash flow means you\'re saving money, while negative cash flow means you\'re spending more than you earn.',
    },
    {
      id: '2',
      lessonId: '2',
      question: 'In the 50/30/20 rule, what percentage goes to savings and debt repayment?',
      options: ['10%', '20%', '30%', '50%'],
      correctAnswer: 1,
      explanation: 'In the 50/30/20 rule, 20% of your income should go toward savings and debt repayment.',
    },
    {
      id: '3',
      lessonId: '3',
      question: 'What is the recommended emergency fund size for beginners?',
      options: [
        'R500 - R1,000',
        'R2,000 - R5,000',
        'R10,000 - R20,000',
        'One month of expenses'
      ],
      correctAnswer: 1,
      explanation: 'For beginners, an emergency fund of R2,000 - R5,000 is a good starting goal. This provides a basic safety net for small emergencies.',
    },
  ]);

  const filteredLessons = selectedCategory === 'all' 
    ? lessons 
    : lessons.filter(lesson => lesson.category === selectedCategory);

  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  const progressPercentage = (completedLessons / lessons.length) * 100;

  const handleStartLesson = (lesson: FinancialLesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const handleCompleteLesson = () => {
    if (selectedLesson) {
      // Mark lesson as completed
      setLessons(prev => prev.map(lesson => 
        lesson.id === selectedLesson.id 
          ? { ...lesson, completed: true }
          : lesson
      ));

      // Start quiz if available
      const quiz = quizzes.find(q => q.lessonId === selectedLesson.id);
      if (quiz) {
        setCurrentQuiz(quiz);
        setShowLessonModal(false);
        setShowQuizModal(true);
        setSelectedAnswer(null);
        setQuizAnswered(false);
      } else {
        setShowLessonModal(false);
      }
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setQuizAnswered(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Education</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <Text style={styles.progressCardTitle}>Your Learning Progress</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{completedLessons}</Text>
              <Text style={styles.progressStatLabel}>Completed</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{lessons.length - completedLessons}</Text>
              <Text style={styles.progressStatLabel}>Remaining</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{lessons.length}</Text>
              <Text style={styles.progressStatLabel}>Total Lessons</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryFilter}>
          <Text style={styles.filterTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryButtons}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === 'all' && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={styles.categoryButtonEmoji}>📚</Text>
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === 'all' && styles.categoryButtonTextActive
                ]}>All Lessons</Text>
              </TouchableOpacity>

              {Object.entries(CATEGORIES).map(([key, category]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryButton,
                    selectedCategory === key && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(key)}
                >
                  <Text style={styles.categoryButtonEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === key && styles.categoryButtonTextActive
                  ]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lessons List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' 
              ? 'All Lessons' 
              : CATEGORIES[selectedCategory as keyof typeof CATEGORIES]?.name || 'Lessons'
            }
          </Text>

          {filteredLessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={[
                styles.lessonCard,
                lesson.completed && styles.lessonCardCompleted
              ]}
              onPress={() => handleStartLesson(lesson)}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.lessonTitleContainer}>
                  <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                  </View>
                </View>
                {lesson.completed && (
                  <Text style={styles.completedEmoji}>✅</Text>
                )}
              </View>

              <View style={styles.lessonMeta}>
                <View style={styles.lessonTags}>
                  <View style={[
                    styles.difficultyTag,
                    { backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }
                  ]}>
                    <Text style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(lesson.difficulty) }
                    ]}>
                      {lesson.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.durationText}>⏱️ {lesson.duration} min</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Start Small</Text>
              <Text style={styles.tipText}>
                Even learning one concept per week will significantly improve your financial knowledge over time.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🎯</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Apply What You Learn</Text>
              <Text style={styles.tipText}>
                Try to implement at least one thing from each lesson in your personal finances.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Lesson Modal */}
      <Modal
        visible={showLessonModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLessonModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedLesson?.title}</Text>
            <TouchableOpacity onPress={handleCompleteLesson}>
              <Text style={styles.modalCompleteText}>Complete</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.lessonContent}>
              {selectedLesson?.content}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Quiz Modal */}
      <Modal
        visible={showQuizModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuizModal(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quick Quiz</Text>
            <View style={styles.modalCloseText} />
          </View>

          <View style={styles.quizContent}>
            {currentQuiz && (
              <>
                <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
                
                {currentQuiz.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quizOption,
                      selectedAnswer === index && styles.quizOptionSelected,
                      quizAnswered && index === currentQuiz.correctAnswer && styles.quizOptionCorrect,
                      quizAnswered && selectedAnswer === index && index !== currentQuiz.correctAnswer && styles.quizOptionIncorrect,
                    ]}
                    onPress={() => !quizAnswered && handleQuizAnswer(index)}
                    disabled={quizAnswered}
                  >
                    <Text style={styles.quizOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}

                {quizAnswered && (
                  <View style={styles.quizExplanation}>
                    <Text style={styles.quizExplanationTitle}>
                      {selectedAnswer === currentQuiz.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                    </Text>
                    <Text style={styles.quizExplanationText}>
                      {currentQuiz.explanation}
                    </Text>
                    <TouchableOpacity 
                      style={styles.quizContinueButton}
                      onPress={() => setShowQuizModal(false)}
                    >
                      <Text style={styles.quizContinueButtonText}>Continue Learning</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  progressBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  categoryButtonEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonTitleContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  lessonEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  completedEmoji: {
    fontSize: 16,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  modalCompleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  lessonContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  quizQuestion: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 24,
    lineHeight: 28,
  },
  quizOption: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  quizOptionSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#F0F9FF',
  },
  quizOptionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  quizOptionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  quizOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  quizExplanation: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quizExplanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quizExplanationText: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 20,
  },
  quizContinueButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quizContinueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});



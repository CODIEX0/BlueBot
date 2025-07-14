/**
 * Curriculum-Based Financial Education Component
 * Integrates the comprehensive BlueBot Financial Mastery Academy curriculum
 */

import React from 'react';
const { useState, useEffect } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { curriculumService, CurriculumData, Course, Lesson, LearningPath, UserProgress } from '../services/curriculumService';
import { useGamification } from '../contexts/GamificationContext';

interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const DIFFICULTY_COLORS = {
  'Beginner': '#10B981',
  'Intermediate': '#F59E0B',
  'Advanced': '#EF4444',
};

const CATEGORY_COLORS = {
  'Psychology & Mindset': '#8B5CF6',
  'Core Skills': '#10B981',
  'Investing': '#F59E0B',
  'Tax Planning': '#0EA5E9',
  'Retirement': '#EC4899',
  'Business': '#6366F1',
  'Technology': '#7C3AED',
};

export default function CurriculumBasedEducation() {
  const [selectedView, setSelectedView] = useState<'courses' | 'lessons' | 'paths' | 'achievements'>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedCourses: [],
    completedLessons: [],
    totalXP: 0,
    currentLevel: 1,
    achievements: [],
    lastActive: new Date().toISOString()
  });

  const { addPoints, unlockAchievement, updateStats } = useGamification();

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const curriculumData = await curriculumService.loadCurriculum();
      const userProgressData = await curriculumService.loadUserProgress();
      
      setCurriculum(curriculumData);
      setUserProgress(userProgressData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading curriculum:', error);
      setLoading(false);
    }
  };

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const openPath = (path: LearningPath) => {
    setSelectedPath(path);
    setShowPathModal(true);
  };

  const completeLesson = async (lessonId: string, xpReward: number) => {
    if (userProgress.completedLessons.includes(lessonId)) {
      Alert.alert('Already Completed', 'You have already completed this lesson!');
      return;
    }

    const newLevel = calculateLevel(userProgress.totalXP + xpReward);
    const leveledUp = newLevel > userProgress.currentLevel;
    
    const newProgress = {
      ...userProgress,
      completedLessons: [...userProgress.completedLessons, lessonId],
      totalXP: userProgress.totalXP + xpReward,
      currentLevel: newLevel,
      lastActive: new Date().toISOString()
    };
    
    setUserProgress(newProgress);
    await curriculumService.saveUserProgress(newProgress);
    
    // Update gamification system
    await addPoints(xpReward);
    await updateStats({ lessonsCompleted: userProgress.completedLessons.length + 1 });
    
    // Check for achievements
    if (newProgress.completedLessons.length === 1) {
      await unlockAchievement('first-lesson');
    }
    if (newProgress.completedLessons.length === 10) {
      await unlockAchievement('lesson-enthusiast');
    }
    if (newProgress.completedLessons.length === 50) {
      await unlockAchievement('learning-master');
    }
    
    // Check if course is completed
    const courseCompleted = checkCourseCompletion(lessonId, newProgress);
    if (courseCompleted) {
      await unlockAchievement('course-completed');
    }
    
    let message = `You earned ${xpReward} XP! 🎉`;
    if (leveledUp) {
      message += `\n\nLevel Up! 🚀 You're now level ${newLevel}!`;
    }
    
    Alert.alert('Lesson Completed!', message);
    setShowLessonModal(false);
  };

  const calculateLevel = (totalXP: number): number => {
    // Level calculation: 100 XP for level 1, then exponential growth
    if (totalXP < 100) return 1;
    return Math.floor(Math.log2(totalXP / 50)) + 1;
  };

  const getXPForNextLevel = (currentLevel: number): number => {
    return Math.pow(2, currentLevel - 1) * 100;
  };

  const checkCourseCompletion = (lessonId: string, progress: UserProgress): boolean => {
    if (!curriculum) return false;
    
    const course = curriculum.courses.find(c => 
      c.lessons.some(l => l.id === lessonId)
    );
    
    if (!course) return false;
    
    const allLessonsCompleted = course.lessons.every(lesson => 
      progress.completedLessons.includes(lesson.id)
    );
    
    if (allLessonsCompleted && !progress.completedCourses.includes(course.id)) {
      const updatedProgress = {
        ...progress,
        completedCourses: [...progress.completedCourses, course.id]
      };
      setUserProgress(updatedProgress);
      curriculumService.saveUserProgress(updatedProgress);
      return true;
    }
    
    return false;
  };

  const calculateProgress = (courseId: string) => {
    if (!curriculum) return 0;
    const course = curriculum.courses.find(c => c.id === courseId);
    if (!course) return 0;
    
    const completedLessons = course.lessons.filter(lesson => 
      userProgress.completedLessons.includes(lesson.id)
    ).length;
    
    return Math.round((completedLessons / course.lessons.length) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading Curriculum...</Text>
      </View>
    );
  }

  if (!curriculum) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load curriculum</Text>
      </View>
    );
  }

  const renderHeader = () => {
    const currentLevelXP = getXPForNextLevel(userProgress.currentLevel - 1);
    const nextLevelXP = getXPForNextLevel(userProgress.currentLevel);
    const progressToNextLevel = ((userProgress.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    return (
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>{curriculum.meta.title}</Text>
          <Text style={styles.headerSubtitle}>{curriculum.meta.description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userProgress.totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userProgress.currentLevel}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{userProgress.completedLessons.length}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
          </View>
          
          <View style={styles.levelProgressContainer}>
            <Text style={styles.levelProgressText}>
              Level {userProgress.currentLevel} → {userProgress.currentLevel + 1}
            </Text>
            <View style={styles.levelProgressBar}>
              <View style={[styles.levelProgressFill, { width: `${Math.min(progressToNextLevel, 100)}%` }]} />
            </View>
            <Text style={styles.levelProgressXP}>
              {userProgress.totalXP - currentLevelXP} / {nextLevelXP - currentLevelXP} XP
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderNavigationTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedView === 'courses' && styles.activeTab]}
        onPress={() => setSelectedView('courses')}
      >
        <Ionicons name="book" size={20} color={selectedView === 'courses' ? '#667eea' : '#64748B'} />
        <Text style={[styles.tabText, selectedView === 'courses' && styles.activeTabText]}>
          Courses
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedView === 'lessons' && styles.activeTab]}
        onPress={() => setSelectedView('lessons')}
      >
        <Ionicons name="play-circle" size={20} color={selectedView === 'lessons' ? '#667eea' : '#64748B'} />
        <Text style={[styles.tabText, selectedView === 'lessons' && styles.activeTabText]}>
          All Lessons
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedView === 'paths' && styles.activeTab]}
        onPress={() => setSelectedView('paths')}
      >
        <Ionicons name="map" size={20} color={selectedView === 'paths' ? '#667eea' : '#64748B'} />
        <Text style={[styles.tabText, selectedView === 'paths' && styles.activeTabText]}>
          Paths
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, selectedView === 'achievements' && styles.activeTab]}
        onPress={() => setSelectedView('achievements')}
      >
        <Ionicons name="trophy" size={20} color={selectedView === 'achievements' ? '#667eea' : '#64748B'} />
        <Text style={[styles.tabText, selectedView === 'achievements' && styles.activeTabText]}>
          Awards
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCourse = (course: Course) => {
    const progress = calculateProgress(course.id);
    const isCompleted = userProgress.completedCourses.includes(course.id);
    
    return (
      <TouchableOpacity
        key={course.id}
        style={styles.courseCard}
        onPress={() => openCourse(course)}
      >
        <View style={styles.courseHeader}>
          <Text style={styles.courseThumbnail}>{course.thumbnail}</Text>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
            <Text style={styles.courseCategory}>{course.category}</Text>
          </View>
          <View style={styles.courseMetrics}>
            <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLORS[course.difficulty] }]}>
              <Text style={styles.difficultyText}>{course.difficulty}</Text>
            </View>
            <Text style={styles.duration}>{course.duration}</Text>
          </View>
        </View>
        
        <Text style={styles.courseDescription} numberOfLines={2}>
          {course.description}
        </Text>
        
        <View style={styles.courseFooter}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Progress: {progress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
          <View style={styles.xpContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.xpText}>{course.xpReward} XP</Text>
          </View>
        </View>
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderLearningPath = (path: LearningPath) => (
    <TouchableOpacity
      key={path.id}
      style={styles.pathCard}
      onPress={() => openPath(path)}
    >
      <View style={styles.pathHeader}>
        <Text style={styles.pathTitle}>{path.title}</Text>
        <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLORS[path.difficulty] }]}>
          <Text style={styles.difficultyText}>{path.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.pathDescription}>{path.description}</Text>
      <View style={styles.pathFooter}>
        <Text style={styles.pathTime}>⏱️ {path.estimatedTime}</Text>
        <Text style={styles.pathCourses}>📚 {path.courses.length} courses</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLessonCard = (lesson: Lesson, course: Course) => {
    const isCompleted = userProgress.completedLessons.includes(lesson.id);
    
    return (
      <TouchableOpacity
        key={lesson.id}
        style={[styles.lessonCard, isCompleted && styles.completedLessonCard]}
        onPress={() => openLesson(lesson)}
      >
        <View style={styles.lessonCardHeader}>
          <View style={styles.lessonCardInfo}>
            <Text style={styles.lessonCardTitle} numberOfLines={2}>{lesson.title}</Text>
            <Text style={styles.lessonCardCourse}>{course.title}</Text>
            <Text style={styles.lessonCardCategory}>{course.category}</Text>
          </View>
          <View style={styles.lessonCardMeta}>
            <Text style={styles.lessonCardDuration}>⏱️ {lesson.duration}</Text>
            <View style={styles.lessonCardXP}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.lessonXPText}>{lesson.xpReward} XP</Text>
            </View>
          </View>
        </View>
        
        {isCompleted && (
          <View style={styles.lessonCompletedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.lessonCompletedText}>Completed</Text>
          </View>
        )}
        
        {!isCompleted && (
          <View style={styles.lessonProgressIndicator}>
            <Ionicons name="play-circle" size={20} color="#667eea" />
            <Text style={styles.lessonStartText}>Start Lesson</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getAllLessons = () => {
    if (!curriculum) return [];
    
    const allLessons: Array<{ lesson: Lesson; course: Course }> = [];
    curriculum.courses.forEach(course => {
      course.lessons.forEach(lesson => {
        allLessons.push({ lesson, course });
      });
    });
    
    return allLessons;
  };

  const renderAchievement = (achievement: any) => {
    const isUnlocked = userProgress.achievements.includes(achievement.id);
    
    return (
      <View key={achievement.id} style={[styles.achievementCard, !isUnlocked && styles.lockedAchievement]}>
        <Text style={styles.achievementIcon}>{achievement.badgeIcon}</Text>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDescription, !isUnlocked && styles.lockedText]}>
            {achievement.description}
          </Text>
          <Text style={styles.achievementXP}>🌟 {achievement.xpRequired} XP required</Text>
        </View>
        {isUnlocked && (
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        )}
      </View>
    );
  };

  const renderCourseModal = () => (
    <Modal visible={showCourseModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{selectedCourse?.title}</Text>
          <TouchableOpacity onPress={() => setShowCourseModal(false)}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.courseDescription}>{selectedCourse?.description}</Text>
          
          <View style={styles.courseDetails}>
            <Text style={styles.sectionTitle}>Learning Outcomes</Text>
            {selectedCourse?.learningOutcomes.map((outcome, index) => (
              <Text key={index} style={styles.outcome}>• {outcome}</Text>
            ))}
          </View>
          
          <View style={styles.lessonsSection}>
            <Text style={styles.sectionTitle}>Lessons ({selectedCourse?.lessons.length})</Text>
            {selectedCourse?.lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonItem}
                onPress={() => openLesson(lesson)}
              >
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonDuration}>⏱️ {lesson.duration}</Text>
                </View>
                <View style={styles.lessonMeta}>
                  <Text style={styles.lessonXP}>🌟 {lesson.xpReward} XP</Text>
                  {userProgress.completedLessons.includes(lesson.id) && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderLessonModal = () => (
    <Modal visible={showLessonModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{selectedLesson?.title}</Text>
          <TouchableOpacity onPress={() => setShowLessonModal(false)}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {selectedLesson?.content && (
            <View>
              <Text style={styles.lessonContentTitle}>Lesson Content</Text>
              <Text style={styles.lessonContent}>
                {typeof selectedLesson.content === 'object' 
                  ? selectedLesson.content.introduction || 'This lesson covers important financial concepts.'
                  : selectedLesson.content}
              </Text>
              
              {selectedLesson.content.keyPoints && (
                <View style={styles.keyPointsSection}>
                  <Text style={styles.sectionTitle}>Key Points</Text>
                  {selectedLesson.content.keyPoints.map((point: string, index: number) => (
                    <Text key={index} style={styles.keyPoint}>• {point}</Text>
                  ))}
                </View>
              )}
              
              {selectedLesson.content.saSpecificFactors && (
                <View style={styles.saFactorsSection}>
                  <Text style={styles.sectionTitle}>South African Specific Factors</Text>
                  {selectedLesson.content.saSpecificFactors.map((factor: string, index: number) => (
                    <Text key={index} style={styles.keyPoint}>• {factor}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => completeLesson(selectedLesson?.id || '', selectedLesson?.xpReward || 0)}
          >
            <Text style={styles.completeButtonText}>Complete Lesson (+{selectedLesson?.xpReward} XP)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderNavigationTabs()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedView === 'courses' && (
          <View style={styles.coursesContainer}>
            {curriculum.courses.map(renderCourse)}
          </View>
        )}
        
        {selectedView === 'lessons' && (
          <View style={styles.lessonsContainer}>
            <Text style={styles.sectionHeaderText}>
              All Lessons ({getAllLessons().length})
            </Text>
            <Text style={styles.sectionSubtext}>
              Browse and start any lesson directly
            </Text>
            {getAllLessons().map(({ lesson, course }) => 
              renderLessonCard(lesson, course)
            )}
          </View>
        )}
        
        {selectedView === 'paths' && (
          <View style={styles.pathsContainer}>
            {curriculum.learningPaths.map(renderLearningPath)}
          </View>
        )}
        
        {selectedView === 'achievements' && (
          <View style={styles.achievementsContainer}>
            {curriculum.achievements.map(renderAchievement)}
          </View>
        )}
      </ScrollView>
      
      {renderCourseModal()}
      {renderLessonModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F1F5F9',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  coursesContainer: {
    paddingHorizontal: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseThumbnail: {
    fontSize: 32,
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  courseCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  courseMetrics: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  duration: {
    fontSize: 12,
    color: '#64748B',
  },
  courseDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  pathsContainer: {
    paddingHorizontal: 20,
  },
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pathTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 12,
  },
  pathDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  pathFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pathTime: {
    fontSize: 12,
    color: '#64748B',
  },
  pathCourses: {
    fontSize: 12,
    color: '#64748B',
  },
  achievementsContainer: {
    paddingHorizontal: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  achievementXP: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  lockedText: {
    color: '#94A3B8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  courseDetails: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  outcome: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  lessonsSection: {
    marginBottom: 24,
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  lessonMeta: {
    alignItems: 'flex-end',
  },
  lessonXP: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 4,
  },
  lessonContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  lessonContentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  keyPointsSection: {
    marginBottom: 20,
  },
  saFactorsSection: {
    marginBottom: 20,
  },
  keyPoint: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
    paddingLeft: 8,
  },
  completeButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  levelProgressContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  levelProgressText: {
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 4,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  levelProgressXP: {
    fontSize: 10,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  lessonsContainer: {
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  completedLessonCard: {
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  lessonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  lessonCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  lessonCardCourse: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 2,
  },
  lessonCardCategory: {
    fontSize: 12,
    color: '#64748B',
  },
  lessonCardMeta: {
    alignItems: 'flex-end',
  },
  lessonCardDuration: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  lessonCardXP: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonXPText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  lessonCompletedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonCompletedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  lessonProgressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonStartText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 8,
  },
});

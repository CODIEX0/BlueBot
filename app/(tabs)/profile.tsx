import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import {
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  Award,
  Target,
  Book,
  ChevronRight,
  LogOut,
  Star,
  Trophy,
  Flame,
} from 'lucide-react-native';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface FinancialGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
}

export default function Profile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const userInfo = {
    name: 'Thabo Mthembu',
    email: 'thabo.mthembu@email.com',
    phone: '+27 71 234 5678',
    memberSince: '2024',
    kycStatus: 'verified',
  };

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Receipt Scan',
      description: 'Scanned your first receipt',
      icon: <Trophy size={20} color="#FFD700" />,
      unlocked: true,
    },
    {
      id: '2',
      title: 'Savings Streak',
      description: 'Saved money for 7 days straight',
      icon: <Flame size={20} color="#FF4500" />,
      unlocked: true,
    },
    {
      id: '3',
      title: 'Budget Master',
      description: 'Stayed within budget for a full month',
      icon: <Star size={20} color="#8B5CF6" />,
      unlocked: false,
      progress: 18,
      total: 30,
    },
    {
      id: '4',
      title: 'AI Helper',
      description: 'Asked BlueBot 50 questions',
      icon: <Award size={20} color="#10B981" />,
      unlocked: false,
      progress: 32,
      total: 50,
    },
  ];

  const financialGoals: FinancialGoal[] = [
    {
      id: '1',
      title: 'Emergency Fund',
      target: 10000,
      current: 7250,
      deadline: '2025-06-30',
    },
    {
      id: '2',
      title: 'Vacation Savings',
      target: 5000,
      current: 1200,
      deadline: '2025-12-15',
    },
  ];

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Settings size={20} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <User size={32} color="#1E3A8A" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
            <View style={styles.verificationBadge}>
              <Shield size={14} color="#10B981" />
              <Text style={styles.verificationText}>Verified Account</Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
              >
                <View style={styles.achievementIcon}>
                  {achievement.icon}
                </View>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text
                  style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.achievementDescriptionLocked,
                  ]}
                >
                  {achievement.description}
                </Text>
                {!achievement.unlocked && achievement.progress && achievement.total && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(achievement.progress / achievement.total) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress}/{achievement.total}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Financial Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Goals</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Add Goal</Text>
            </TouchableOpacity>
          </View>
          {financialGoals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalAmount}>
                  {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                </Text>
              </View>
              <View style={styles.goalProgressContainer}>
                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${getProgressPercentage(goal.current, goal.target)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.goalProgressText}>
                  {Math.round(getProgressPercentage(goal.current, goal.target))}%
                </Text>
              </View>
              <Text style={styles.goalDeadline}>Target: {goal.deadline}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#1E3A8A" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0EA5E9' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color="#1E3A8A" />
              <Text style={styles.settingText}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0EA5E9' }}
              thumbColor={biometricEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Target size={20} color="#1E3A8A" />
              <Text style={styles.settingText}>Auto-Save</Text>
            </View>
            <Switch
              value={autoSaveEnabled}
              onValueChange={setAutoSaveEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0EA5E9' }}
              thumbColor={autoSaveEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <CreditCard size={20} color="#1E3A8A" />
              <Text style={styles.menuText}>Payment Methods</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Book size={20} color="#1E3A8A" />
              <Text style={styles.menuText}>Financial Education</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <HelpCircle size={20} color="#1E3A8A" />
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Shield size={20} color="#1E3A8A" />
              <Text style={styles.menuText}>Privacy & Security</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>BlueBot v1.0.0</Text>
          <Text style={styles.appInfoText}>
            Member since {userInfo.memberSince} • Standard Bank
          </Text>
        </View>
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1E3A8A',
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: '#64748B',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  achievementDescriptionLocked: {
    color: '#94A3B8',
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  goalAmount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginRight: 12,
  },
  goalProgressFill: {
    height: 6,
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#64748B',
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginLeft: 12,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
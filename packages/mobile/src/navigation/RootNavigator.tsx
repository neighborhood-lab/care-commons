/**
 * Root Navigator
 * 
 * Main navigation structure for the app with:
 * - Authentication flow (login)
 * - Main tab navigation (visits, schedule, profile)
 * - Modal screens (clock-in, task details)
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen.js';
import { TodayVisitsScreen } from '../screens/visits/TodayVisitsScreen.js';
import { ScheduleScreen } from '../screens/schedule/ScheduleScreen.js';
import { ProfileScreen } from '../screens/profile/ProfileScreen.js';
import { VisitDetailScreen as VisitDetailScreenBase } from '../features/visits/screens/VisitDetailScreen.js';
import { ClockInScreen } from '../screens/visits/ClockInScreen.js';
import { TasksScreen } from '../screens/visits/TasksScreen.js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Wrapper to adapt VisitDetailScreen to React Navigation
function VisitDetailScreen({ route }: NativeStackScreenProps<RootStackParamList, 'VisitDetail'>) {
  return <VisitDetailScreenBase visitId={route.params.visitId} />;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  VisitDetail: { visitId: string };
  ClockIn: { visitId: string };
  Tasks: { visitId: string };
};

export type MainTabParamList = {
  TodayVisits: undefined;
  Schedule: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main tabs navigator
 */
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <MainTab.Screen
        name="TodayVisits"
        component={TodayVisitsScreen}
        options={{
          title: "Today's Visits",
          tabBarLabel: 'Visits',
        }}
      />
      <MainTab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
}

/**
 * Root navigator with authentication flow
 */
export function RootNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <NavigationContainer>
      <RootStack.Navigator>
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Auth"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainNavigator}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="VisitDetail"
              component={VisitDetailScreen}
              options={{ title: 'Visit Details' }}
            />
            <RootStack.Screen
              name="ClockIn"
              component={ClockInScreen}
              options={{
                title: 'Clock In',
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name="Tasks"
              component={TasksScreen}
              options={{
                title: 'Tasks',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

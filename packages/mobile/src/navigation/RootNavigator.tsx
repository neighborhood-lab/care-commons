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
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen.js';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen.js';
import { TodayVisitsScreen } from '../screens/visits/TodayVisitsScreen.js';
import { ScheduleScreen } from '../screens/schedule/ScheduleScreen.js';
import { ProfileScreen } from '../screens/profile/ProfileScreen.js';
import { VisitDetailScreen } from '../screens/visits/VisitDetailScreen.js';
import { VisitCheckInScreen } from '../screens/visits/VisitCheckInScreen.js';
import { VisitCheckOutScreen } from '../screens/visits/VisitCheckOutScreen.js';
import { VisitDocumentationScreen } from '../screens/visits/VisitDocumentationScreen.js';
import { VisitHistoryScreen } from '../screens/visits/VisitHistoryScreen.js';
import { ClockInScreen } from '../screens/visits/ClockInScreen.js';
import { CameraScreen } from '../screens/visits/CameraScreen.js';
import { TasksScreen } from '../screens/visits/TasksScreen.js';
import { SignatureScreen } from '../screens/visits/SignatureScreen.js';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  Main: undefined;
  VisitDetail: { visitId: string };
  VisitCheckIn: { visitId: string };
  VisitCheckOut: { visitId: string };
  VisitDocumentation: { visitId: string };
  VisitHistory: undefined;
  ClockIn: { visitId: string };
  Camera: { onCapture: (uri: string) => void };
  Tasks: { visitId: string };
  Signature: { visitId: string; clientName: string };
};

export type MainTabParamList = {
  TodayVisits: undefined;
  Schedule: undefined;
  VisitHistory: undefined;
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
        name="VisitHistory"
        component={VisitHistoryScreen}
        options={{
          title: 'History',
          tabBarLabel: 'History',
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
          <>
            <RootStack.Screen
              name="Auth"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Permissions"
              component={PermissionsScreen}
              options={{ headerShown: false }}
            />
          </>
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
              name="VisitCheckIn"
              component={VisitCheckInScreen}
              options={{
                title: 'Check In',
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name="VisitCheckOut"
              component={VisitCheckOutScreen}
              options={{
                title: 'Check Out',
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name="VisitDocumentation"
              component={VisitDocumentationScreen}
              options={{ title: 'Documentation' }}
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
              name="Camera"
              component={CameraScreen}
              options={{
                title: 'Take Photo',
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <RootStack.Screen
              name="Tasks"
              component={TasksScreen}
              options={{
                title: 'Tasks',
              }}
            />
            <RootStack.Screen
              name="Signature"
              component={SignatureScreen}
              options={{
                title: 'Client Signature',
                presentation: 'modal',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

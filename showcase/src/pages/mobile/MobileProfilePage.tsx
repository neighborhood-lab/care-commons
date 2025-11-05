import React from 'react';
import { MobileLayout } from '../../components/MobileLayout';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const MobileProfilePage: React.FC = () => {
  const caregiver = {
    name: 'Sarah Johnson',
    phone: '(512) 555-0100',
    email: 'sarah.johnson@example.com',
    location: 'Austin, TX',
    employeeId: 'CG-2025-001',
    joinDate: 'January 2024',
    certifications: [
      'Certified Nursing Assistant (CNA)',
      'CPR & First Aid',
      'Medication Administration',
      'Dementia Care Specialist',
    ],
  };

  const stats = [
    { label: 'Hours This Month', value: '124', icon: Clock, color: 'text-blue-600' },
    { label: 'Clients Served', value: '8', icon: User, color: 'text-purple-600' },
    { label: 'Tasks Completed', value: '342', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Years of Service', value: '1.8', icon: Award, color: 'text-orange-600' },
  ];

  const menuItems = [
    { label: 'My Schedule', icon: Calendar, href: '/mobile/visits' },
    { label: 'Certifications', icon: Award, href: '#' },
    { label: 'Documents', icon: FileText, href: '#' },
    { label: 'Settings', icon: Settings, href: '#' },
  ];

  return (
    <MobileLayout title="Profile">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{caregiver.name}</h2>
              <p className="text-purple-100 text-sm">
                Employee ID: {caregiver.employeeId}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{caregiver.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{caregiver.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{caregiver.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Joined {caregiver.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <Icon className={`h-6 w-6 ${stat.color} mb-2`} />
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Certifications</h3>
          </div>
          <div className="space-y-2">
            {caregiver.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>
            );
          })}
        </div>

        {/* Logout Button */}
        <button className="w-full bg-white text-red-600 border-2 border-red-600 py-3 px-4 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>

        {/* App Info */}
        <div className="text-center text-xs text-gray-500 pb-4">
          <p>Care Commons Mobile v1.0.0</p>
          <p className="mt-1">Showcase Demo Mode</p>
        </div>
      </div>
    </MobileLayout>
  );
};

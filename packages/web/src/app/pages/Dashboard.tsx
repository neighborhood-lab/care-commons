import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/core/hooks';
import { Card, CardHeader, CardContent } from '@/core/components';
import { Users, Calendar, ClipboardList, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Active Clients',
      value: '124',
      icon: <Users className="h-6 w-6" />,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      change: '+12%',
      trend: 'up' as const,
      changeColor: 'text-green-600',
    },
    {
      label: "Today's Visits",
      value: '18',
      icon: <Calendar className="h-6 w-6" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      change: '+5%',
      trend: 'up' as const,
      changeColor: 'text-green-600',
    },
    {
      label: 'Pending Tasks',
      value: '7',
      icon: <ClipboardList className="h-6 w-6" />,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      change: '-3%',
      trend: 'down' as const,
      changeColor: 'text-green-600',
    },
    {
      label: 'Alerts',
      value: '3',
      icon: <AlertCircle className="h-6 w-6" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      change: '+2',
      trend: 'up' as const,
      changeColor: 'text-red-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-gray-600">
          Here&apos;s what&apos;s happening with your care operations today.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card padding="md" hover className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <TrendingUp className={`h-4 w-4 ${stat.changeColor}`} />
                      ) : (
                        <TrendingDown className={`h-4 w-4 ${stat.changeColor}`} />
                      )}
                      <span className={`text-sm font-medium ${stat.changeColor}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500">from last week</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                    <div className={stat.iconColor}>{stat.icon}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader title="Recent Activity" />
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    status: 'success',
                    color: 'bg-green-500',
                    title: 'Visit completed for John Doe',
                    time: '2 hours ago',
                  },
                  {
                    status: 'info',
                    color: 'bg-blue-500',
                    title: 'New client intake scheduled',
                    time: '4 hours ago',
                  },
                  {
                    status: 'warning',
                    color: 'bg-yellow-500',
                    title: 'Care plan update required',
                    time: 'Yesterday',
                  },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`h-2 w-2 mt-2 rounded-full ${activity.color} animate-pulse`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader title="Upcoming Visits" />
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    client: 'Sarah Johnson',
                    service: 'Personal Care - 2 hours',
                    time: '10:00 AM',
                    caregiver: 'Jane Smith',
                  },
                  {
                    client: 'Michael Brown',
                    service: 'Companion Care - 3 hours',
                    time: '2:00 PM',
                    caregiver: 'Bob Williams',
                  },
                  {
                    client: 'Emily Davis',
                    service: 'Skilled Nursing - 1 hour',
                    time: '4:30 PM',
                    caregiver: 'Mary Johnson',
                  },
                ].map((visit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {visit.client}
                      </p>
                      <p className="text-xs text-gray-600">{visit.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary-600">
                        {visit.time}
                      </p>
                      <p className="text-xs text-gray-600">{visit.caregiver}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

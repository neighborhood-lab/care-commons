/**
 * Role Switcher Component
 *
 * Allows users to switch between different personas to experience
 * the system from various perspectives.
 */

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, User, Users, Heart, Briefcase, Shield } from 'lucide-react';
import { useRole, type UserRole, rolePersonas } from '../contexts/RoleContext';

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  patient: User,
  family: Heart,
  caregiver: Users,
  coordinator: Briefcase,
  admin: Shield,
};

const roleColors: Record<UserRole, string> = {
  patient: 'bg-blue-500',
  family: 'bg-pink-500',
  caregiver: 'bg-green-500',
  coordinator: 'bg-purple-500',
  admin: 'bg-gray-800',
};

export const RoleSwitcher: React.FC = () => {
  const { currentRole, currentPersona, setRole } = useRole();
  const CurrentIcon = roleIcons[currentRole];

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
        <div className={`${roleColors[currentRole]} rounded p-1`}>
          <CurrentIcon className="h-4 w-4 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs text-gray-500">Viewing as</div>
          <div className="text-sm font-semibold text-gray-900">{currentPersona.name}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-2">
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Switch Perspective
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Experience the system from different viewpoints
              </p>
            </div>

            {(Object.keys(rolePersonas) as UserRole[]).map((role) => {
              const persona = rolePersonas[role];
              const Icon = roleIcons[role];
              const isActive = role === currentRole;

              return (
                <Menu.Item key={role}>
                  {({ active, close }) => (
                    <button
                      onClick={() => {
                        setRole(role);
                        close(); // Close the menu after selection
                      }}
                      disabled={isActive}
                      className={`
                        w-full text-left rounded-md px-3 py-2.5 transition-colors
                        ${active && !isActive ? 'bg-gray-50' : ''}
                        ${isActive ? 'bg-blue-50 ring-1 ring-blue-200 cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${roleColors[role]} rounded p-1.5 mt-0.5`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {persona.name}
                            </p>
                            {isActive && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {persona.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

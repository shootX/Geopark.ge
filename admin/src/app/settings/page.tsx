'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Shield, Bell, Palette,
  Globe, Key, CreditCard, LogOut,
  Save, Smartphone, Mail, Eye, EyeOff
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import { getPublicApiBaseUrl } from '@/lib/api-public';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api', label: 'API Keys', icon: Key },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { success } = useToast();
  const [activeSection, setActiveSection] = React.useState('profile');
  const [showPassword, setShowPassword] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSaveProfile = () => {
    success('Profile updated', 'Your changes have been saved');
  };

  const tabs = settingsSections.map((s) => ({
    id: s.id,
    label: s.label,
    icon: <s.icon className="h-4 w-4" />,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and application settings</p>
      </div>

      {/* Section Tabs */}
      <Tabs tabs={tabs} activeTab={activeSection} onTabChange={setActiveSection} />

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user?.full_name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {/* Appearance Section */}
      {activeSection === 'appearance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Theme Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: '☀️' },
                    { value: 'dark', label: 'Dark', icon: '🌙' },
                    { value: 'system', label: 'System', icon: '💻' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value as 'light' | 'dark' | 'system')}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all',
                        theme === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sidebar</label>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Compact Sidebar</p>
                    <p className="text-xs text-gray-500">Collapse sidebar for more screen space</p>
                  </div>
                  <Switch checked={false} onCheckedChange={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Email Notifications', desc: 'Receive email notifications for bookings and offers', enabled: true },
                { title: 'Push Notifications', desc: 'Receive push notifications in browser', enabled: true },
                { title: 'SMS Notifications', desc: 'Receive text messages for urgent alerts', enabled: false },
                { title: 'Marketing Emails', desc: 'Receive product updates and marketing emails', enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Switch checked={item.enabled} onCheckedChange={() => {}} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Current Session</p>
                    <p className="text-xs text-gray-500">MacOS · Chrome · Active now</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <Button variant="outline" className="text-red-500" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Log Out All Devices
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* API Section */}
      {activeSection === 'api' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">API key management coming soon</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You will be able to generate and manage API keys for external integrations.
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">API Base URL</p>
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {getPublicApiBaseUrl()}
                </code>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

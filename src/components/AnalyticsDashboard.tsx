import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Home,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  TestTube,
  Download,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';

interface AnalyticsDashboardProps {
  onNavigate: (page: string) => void;
}

// Sample data
const focusData = [
  { date: 'Mon', minutes: 120, distractions: 5, accuracy: 85 },
  { date: 'Tue', minutes: 95, distractions: 8, accuracy: 78 },
  { date: 'Wed', minutes: 140, distractions: 3, accuracy: 92 },
  { date: 'Thu', minutes: 110, distractions: 6, accuracy: 88 },
  { date: 'Fri', minutes: 130, distractions: 4, accuracy: 90 },
  { date: 'Sat', minutes: 160, distractions: 2, accuracy: 95 },
  { date: 'Sun', minutes: 145, distractions: 3, accuracy: 91 },
];

const retentionData = [
  { week: 'Week 1', users: 1000, returning: 850 },
  { week: 'Week 2', users: 850, returning: 720 },
  { week: 'Week 3', users: 720, returning: 650 },
  { week: 'Week 4', users: 650, returning: 600 },
];

export function AnalyticsDashboard({ onNavigate }: AnalyticsDashboardProps) {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isABTestingEnabled, setIsABTestingEnabled] = useState(false);
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);

  const handleExportData = () => {
    toast.success('📊 Exporting analytics data...');
    setTimeout(() => {
      toast.success('✅ Data exported successfully!');
    }, 1500);
  };

  const handleToggleExperiment = (experimentId: string) => {
    if (activeExperiment === experimentId) {
      setActiveExperiment(null);
      toast('Experiment deactivated');
    } else {
      setActiveExperiment(experimentId);
      toast.success(`✨ Experiment ${experimentId} activated!`);
    }
  };

  return (
    <div className="min-h-screen gradient-wave">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('dashboard')}
                className="hover:bg-accent"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="gradient-text flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Analytics & Testing
                </h1>
                <p className="text-sm text-secondary">
                  Insights, metrics, and A/B experiments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-secondary" />
                <span className="text-sm text-secondary">Debug Mode</span>
                <Switch checked={isDebugMode} onCheckedChange={setIsDebugMode} />
              </div>
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="retention">User Retention</TabsTrigger>
            <TabsTrigger value="experiments">A/B Testing</TabsTrigger>
          </TabsList>

          {/* Key Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-5 h-5 text-blue-400" />
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-sm text-secondary mb-1">Total Focus Time</p>
                    <p className="text-3xl gradient-text">900</p>
                    <p className="text-xs text-secondary">minutes this week</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-sm text-secondary mb-1">Avg Quiz Score</p>
                    <p className="text-3xl gradient-text">88%</p>
                    <p className="text-xs text-secondary">+5% from last week</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-teal-400" />
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-sm text-secondary mb-1">Active Sessions</p>
                    <p className="text-3xl gradient-text">27</p>
                    <p className="text-xs text-secondary">this week</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-sm text-secondary mb-1">Distractions</p>
                    <p className="text-3xl gradient-text">31</p>
                    <p className="text-xs text-yellow-400">-12% from last week</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Focus Minutes Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    Focus Minutes Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={focusData}>
                        <defs>
                          <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#B0B8C4" />
                        <YAxis stroke="#B0B8C4" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(28, 31, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="minutes"
                          stroke="url(#focusGradient)"
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Distractions & Accuracy Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={focusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#B0B8C4" />
                        <YAxis stroke="#B0B8C4" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(28, 31, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="distractions" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="accuracy" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Retention Tab */}
          <TabsContent value="retention" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    User Retention Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={retentionData}>
                        <defs>
                          <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="week" stroke="#B0B8C4" />
                        <YAxis stroke="#B0B8C4" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(28, 31, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Total Users"
                        />
                        <Line
                          type="monotone"
                          dataKey="returning"
                          stroke="url(#retentionGradient)"
                          strokeWidth={3}
                          name="Returning Users"
                          dot={{ fill: '#14b8a6', r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl gradient-text mb-1">92%</p>
                      <p className="text-xs text-secondary">Week 1 Retention</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl gradient-text mb-1">85%</p>
                      <p className="text-xs text-secondary">Week 2 Retention</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl gradient-text mb-1">60%</p>
                      <p className="text-xs text-secondary">4-Week Retention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* A/B Testing Tab */}
          <TabsContent value="experiments" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl mb-1">Active Experiments</h2>
                <p className="text-sm text-secondary">
                  Test new features with controlled user groups
                </p>
              </div>
              <Switch
                checked={isABTestingEnabled}
                onCheckedChange={setIsABTestingEnabled}
              />
            </div>

            {isABTestingEnabled ? (
              <div className="space-y-4">
                {/* Experiment A */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card
                    className={`glass-card cursor-pointer transition-all ${
                      activeExperiment === 'A'
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-border hover:border-blue-500/30'
                    }`}
                    onClick={() => handleToggleExperiment('A')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TestTube className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg">Experiment A: Extended Break Mode</h3>
                            {activeExperiment === 'A' && (
                              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary mb-3">
                            Test longer break intervals (10 min vs 5 min) to see if it improves
                            focus retention
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-secondary mb-1">Control Group</p>
                              <p>5-minute breaks</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary mb-1">Test Group</p>
                              <p>10-minute breaks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Experiment B */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card
                    className={`glass-card cursor-pointer transition-all ${
                      activeExperiment === 'B'
                        ? 'border-purple-500/50 bg-purple-500/5'
                        : 'border-border hover:border-purple-500/30'
                    }`}
                    onClick={() => handleToggleExperiment('B')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TestTube className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg">Experiment B: AI Persona Preference</h3>
                            {activeExperiment === 'B' && (
                              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary mb-3">
                            Compare engagement rates between "Ultra Instinct Sensei" vs
                            "Friendly Tutor" personas
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-secondary mb-1">Control Group</p>
                              <p>Ultra Instinct Sensei</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary mb-1">Test Group</p>
                              <p>Friendly Tutor</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Experiment C */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card
                    className={`glass-card cursor-pointer transition-all ${
                      activeExperiment === 'C'
                        ? 'border-teal-500/50 bg-teal-500/5'
                        : 'border-border hover:border-teal-500/30'
                    }`}
                    onClick={() => handleToggleExperiment('C')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TestTube className="w-5 h-5 text-teal-400" />
                            <h3 className="text-lg">Experiment C: Gamification Intensity</h3>
                            {activeExperiment === 'C' && (
                              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary mb-3">
                            Test if more frequent badge unlocks (every 5 cards vs 10 cards)
                            increases retention
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-secondary mb-1">Control Group</p>
                              <p>Unlock every 10 cards</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary mb-1">Test Group</p>
                              <p>Unlock every 5 cards</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {activeExperiment && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-blue-400" />
                      <strong>Experiment {activeExperiment} is active!</strong> Results will be
                      measured over the next 2 weeks.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Card className="glass-card border-border">
                <CardContent className="p-12 text-center">
                  <TestTube className="w-12 h-12 text-secondary mx-auto mb-4" />
                  <p className="text-secondary">
                    Enable A/B testing to start running experiments
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

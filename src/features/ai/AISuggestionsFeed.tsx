import { motion } from 'motion/react';
import { Sparkles, FileText, Layers, Coffee, Brain, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export function AISuggestionsFeed() {
  const suggestions = [
    {
      id: 1,
      type: 'summary',
      icon: FileText,
      title: 'Auto-summary ready',
      description: 'Your last 50-minute session on Quantum Physics has been summarized.',
      action: 'View Summary',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      id: 2,
      type: 'flashcards',
      icon: Layers,
      title: 'Flashcards generated',
      description: '24 new flashcards created from your uploaded notes on Machine Learning.',
      action: 'Review Cards',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      id: 3,
      type: 'break',
      icon: Coffee,
      title: 'Break activity recommended',
      description: 'Try a 5-minute meditation or light stretching to recharge.',
      action: 'Start Break',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
    },
    {
      id: 4,
      type: 'insight',
      icon: Brain,
      title: 'Focus pattern detected',
      description: 'You are most productive between 9-11 AM. Schedule deep work accordingly.',
      action: 'View Insights',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
  ];

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1 overflow-y-auto">
          {suggestions.slice(0, 3).map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border ${suggestion.bg} ${suggestion.border} transition-all hover:shadow-lg`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${suggestion.bg}`}>
                    <Icon className={`w-5 h-5 ${suggestion.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-secondary mb-3">{suggestion.description}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${suggestion.color} hover:bg-white/10`}
                    >
                      {suggestion.action} →
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Motivational Footer */}
        <motion.div
          className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-border"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(59, 130, 246, 0)',
              '0 0 20px 5px rgba(59, 130, 246, 0.1)',
              '0 0 0 0 rgba(59, 130, 246, 0)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <p className="text-xs sm:text-sm text-center flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span><strong>Keep going!</strong> Building amazing habits.</span>
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}

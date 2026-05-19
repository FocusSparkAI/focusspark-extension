import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  Bot,
  BookOpen,
  TrendingUp,
  Zap,
  Coffee,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const features = [
  {
    id: 'deep-work',
    icon: Target,
    title: 'Deep Work',
    description:
      'Eliminate distractions and enter flow state with AI-powered focus sessions.',
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    id: 'ai-tutor',
    icon: Bot,
    title: 'AI Tutor',
    description:
      'Get instant answers and personalized explanations for any topic.',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'learning',
    icon: BookOpen,
    title: 'Learning (PDF/Notes)',
    description:
      'Upload your materials and get AI-generated summaries and flashcards.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 'goal-tracking',
    icon: TrendingUp,
    title: 'Goal Tracking',
    description:
      'Set goals, track progress, and stay motivated with smart insights.',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'motivation',
    icon: Zap,
    title: 'Motivation',
    description:
      'Science-backed rewards and streaks to keep you energized.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'unwind',
    icon: Coffee,
    title: 'Unwind',
    description:
      'Guided breaks and mindfulness exercises to recharge your mind.',
    gradient: 'from-teal-500 to-emerald-500',
  },
];

export function Features() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find(f => f.id === activeFeature)!;

  return (
    <section className="relative py-20 px-6 lg:px-20 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl mb-4">
            Tools made for <span className="gradient-text">Deep Work</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Modes designed for every kind of learner.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 mb-14">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = feature.id === activeFeature;

            return (
              <motion.button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  relative group p-6 rounded-2xl border transition-all overflow-hidden
                  ${isActive
                    ? `
                      bg-muted
                      dark:bg-muted
                      border-blue-500
                      shadow-md
                    `
                    : `
                      bg-muted/60
                      dark:bg-muted/40
                      border-border
                      hover:border-blue-500/50
                    `
                  }
                `}
              >
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                />

                {/* Icon */}
                <motion.div
                  className="relative flex items-center justify-center mb-3"
                  animate={isActive ? { rotate: [0, -8, 8, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl opacity-0 group-hover:opacity-40`}
                  />
                  <Icon
                    className={`relative w-10 h-10 transition-colors ${
                      isActive
                        ? 'text-blue-500'
                        : 'text-muted-foreground group-hover:text-blue-400'
                    }`}
                    strokeWidth={1.5}
                  />
                </motion.div>

                {/* Title */}
                <div className="relative text-sm font-semibold">
                  {feature.title}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-feature-indicator"
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Active Feature Details */}
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-border bg-muted dark:bg-muted p-10 text-center max-w-3xl mx-auto overflow-hidden"
        >
          {/* Background glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${active.gradient} opacity-5`}
          />

          {/* Icon */}
          <motion.div
            className="relative flex items-center justify-center mb-6"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${active.gradient} blur-3xl opacity-30`}
            />
            <active.icon
              className="relative w-20 h-20 text-blue-500"
              strokeWidth={1.5}
            />
          </motion.div>

          {/* Title */}
          <h3 className="text-3xl mb-4">{active.title}</h3>

          {/* Description */}
          <p className="text-xl text-muted-foreground mb-8">
            {active.description}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 hover:scale-105 transition-all px-8 py-6"
          >
            Try FocusSpark for Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

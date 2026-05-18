import { motion } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  Target,
  Brain,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Button } from './ui/button';

interface HeroSectionDarkProps {
  onNavigate?: (page: string) => void;
}

export function HeroSectionDark({ onNavigate }: HeroSectionDarkProps) {
  return (
    <section className="relative min-h-screen bg-background text-foreground flex items-center justify-center overflow-hidden">
      
      {/* Gradient Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-600/10 to-transparent dark:from-blue-500/20 dark:via-purple-600/20" />

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 py-20 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl lg:text-6xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Welcome to <span className="gradient-text">FocusSpark</span> –{' '}
            <span className="gradient-text">Infinite Productivity</span>
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground mb-8 max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Your AI-powered study partner for focus, flow, and smarter learning.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              size="lg"
              onClick={() => onNavigate?.('signup')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all px-8 py-6"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate?.('science')}
              className="border-2 hover:bg-accent hover:scale-105 transition-all px-8 py-6"
            >
              Learn the Science
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={() => onNavigate?.('dashboard')}
              className="border-2 border-border hover:bg-accent hover:border-primary hover:scale-105 transition-all px-8 py-6"
            >
              <Target className="w-5 h-5 mr-2" />
              Skip Tour
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full blur-3xl" />

          {/* Card */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
            <img
              src="https://images.unsplash.com/photo-1758612898181-d7c92f0e21d5?auto=format&fit=crop&w=1200&q=80"
              alt="Student studying"
              className="w-full h-auto object-cover opacity-80 dark:opacity-70"
            />

            {/* Floating Icons */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[
                { icon: Target, color: 'text-blue-400' },
                { icon: Brain, color: 'text-purple-400' },
                { icon: Zap, color: 'text-yellow-400' },
                { icon: BookOpen, color: 'text-teal-400' },
                { icon: Sparkles, color: 'text-pink-400' },
              ].map(({ icon: Icon, color }, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 30}%`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Icon className={`w-10 h-10 ${color}`} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Hint */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-muted-foreground" />
      </motion.div>
    </section>
  );
}

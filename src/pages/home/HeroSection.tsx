import { motion } from 'motion/react';
import { Sparkles, ChevronDown, LayoutDashboard, Target, Brain, Zap, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface HeroSectionProps {
  onNavigate?: (page: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background gradient-wave">
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-500/30 dark:bg-blue-500/30 rounded-full particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left"
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
              variant="ghost"
              onClick={() => onNavigate?.('dashboard')}
              className="border-2 border-border hover:bg-accent hover:scale-105 transition-all px-8 py-6"
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative"
        >
          <div className="relative">
            {/* Glowing Ring */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full blur-3xl glow-blue-purple" />
            
            {/* Illustration Container */}
            <div className="relative rounded-2xl overflow-hidden border border-border float-animation">
              <img
                src="https://images.unsplash.com/photo-1758612898181-d7c92f0e21d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBkZXNrJTIwZm9jdXNlZHxlbnwxfHx8fDE3NjA3ODMzNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Student studying"
                className="w-full h-auto object-cover"
              />
              {/* Floating Icons Overlay */}
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
          </div>
        </motion.div>
      </div>

      {/* Scroll Hint */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-muted-foreground" />
      </motion.div>
    </section>
  );
}

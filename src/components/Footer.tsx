import { motion } from 'motion/react';
import { Sparkles, Linkedin, Twitter, Youtube } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const quickLinks = [
    { name: 'Home', path: 'home' },
    { name: 'Our Science', path: 'https://www.youtube.com/' },
    { name: 'About Us', path: 'https://www.youtube.com/' },
    { name: 'Contact', path: 'https://www.youtube.com/' },
  ];

  const socialLinks = [
    { icon: Linkedin, href: 'https://www.youtube.com/', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://www.youtube.com/', label: 'Twitter' },
    { icon: Youtube, href: 'https://www.youtube.com/', label: 'YouTube' },
  ];

  return (
    <footer className="relative bg-card border-t border-border">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Left - Logo & Tagline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">FocusSpark</span>
            </div>
            <p className="text-muted-foreground">Stay Focused. Learn Smarter.</p>
          </div>

          {/* Center - Quick Links */}
          <div>
            <h4 className="mb-4 text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right - Social Icons */}
          <div>
            <h4 className="mb-4 text-foreground">Connect With Us</h4>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-blue-500 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-6 text-center text-muted-foreground text-sm">
          © 2025 FocusSpark. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

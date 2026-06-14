import { motion } from 'motion/react';
import { ArrowUpRight, Linkedin, Sparkles, Twitter, Youtube } from 'lucide-react';
import { FRONTEND_ROUTES, buildFrontendUrl } from '../../config/frontend';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  void onNavigate;

  const websiteLinks = [
    { name: 'Home', href: buildFrontendUrl(FRONTEND_ROUTES.home) },
    { name: 'Our Science', href: buildFrontendUrl(FRONTEND_ROUTES.science) },
    { name: 'About Us', href: buildFrontendUrl(FRONTEND_ROUTES.about) },
    { name: 'Contact', href: buildFrontendUrl(FRONTEND_ROUTES.contact) },
  ];
  const resourceLinks = [
    { name: 'Student Dashboard', href: buildFrontendUrl(FRONTEND_ROUTES.dashboard) },
    { name: 'Privacy', href: buildFrontendUrl(FRONTEND_ROUTES.privacy) },
    { name: 'Terms', href: buildFrontendUrl(FRONTEND_ROUTES.terms) },
  ];
  const socialLinks = [
    { icon: Linkedin, href: buildFrontendUrl(FRONTEND_ROUTES.contact), label: 'LinkedIn' },
    { icon: Twitter, href: buildFrontendUrl(FRONTEND_ROUTES.contact), label: 'Twitter' },
    { icon: Youtube, href: buildFrontendUrl(FRONTEND_ROUTES.contact), label: 'YouTube' },
  ];

  return (
    <footer className="relative border-t border-border bg-card">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />

      <div className="mx-auto max-w-6xl px-5 pb-4 pt-8 sm:px-6 lg:px-12 xl:px-16">
        <div className="grid gap-y-10 gap-x-16 md:grid-cols-4 xl:gap-x-24">
          <div className="max-w-[300px]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">FocusSpark</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Extension workspace for focused studying, AI help, practice, and review.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Main Website</h4>
            <div className="flex flex-col gap-3">
              {websiteLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => window.open(link.href, '_blank', 'noopener,noreferrer')}
                  className="inline-flex w-fit items-center gap-1 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.name}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
            <div className="flex flex-col gap-3">
              {resourceLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => window.open(link.href, '_blank', 'noopener,noreferrer')}
                  className="inline-flex w-fit items-center gap-1 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.name}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Social</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-blue-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex min-h-6 items-center justify-center border-t border-border pt-3 text-center text-sm text-muted-foreground">
          &copy; 2026 FocusSpark. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

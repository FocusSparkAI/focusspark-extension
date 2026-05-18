import * as React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface FormattedAIMessageProps {
  content: string;
  timestamp: Date;
}

export function FormattedAIMessage({ content, timestamp }: FormattedAIMessageProps) {
  // Parse the content and format it
  const formatContent = (text: string) => {
    // Split by double newlines for paragraphs
    const sections = text.split('\n\n').filter(Boolean);
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(Boolean);
      const elements: React.ReactElement[] = [];

      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) return;

        // Check if it's a heading (starts with # or is all uppercase with length > 3)
        const isHashHeading = trimmedLine.startsWith('#');
        const isUppercaseHeading = 
          trimmedLine.length > 3 && 
          trimmedLine === trimmedLine.toUpperCase() && 
          !trimmedLine.match(/^[^a-zA-Z]*$/); // Not just symbols
        
        if (isHashHeading) {
          // Remove # symbols
          const headingText = trimmedLine.replace(/^#+\s*/, '');
          elements.push(
            <motion.h4
              key={`heading-${index}-${lineIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + lineIndex * 0.05 }}
              className="gradient-text mb-3 mt-4 first:mt-0"
            >
              {headingText}
            </motion.h4>
          );
        } else if (isUppercaseHeading) {
          elements.push(
            <motion.h4
              key={`heading-${index}-${lineIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + lineIndex * 0.05 }}
              className="gradient-text mb-3 mt-4 first:mt-0"
            >
              {trimmedLine}
            </motion.h4>
          );
        }
        // Check if it's a list item
        else if (trimmedLine.match(/^[-•*]\s/)) {
          const listText = trimmedLine.replace(/^[-•*]\s*/, '');
          // Clean markdown from list text
          const cleanedText = cleanMarkdown(listText);
          elements.push(
            <motion.li
              key={`list-${index}-${lineIndex}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + lineIndex * 0.05 }}
              className="ml-4 mb-2 text-gray-800 dark:text-white/90"
              style={{ lineHeight: '1.7' }}
            >
              <span className="text-blue-400 mr-2">•</span>
              {cleanedText}
            </motion.li>
          );
        }
        // Regular paragraph
        else {
          // Clean markdown characters
          const cleanedText = cleanMarkdown(trimmedLine);
          elements.push(
            <motion.p
              key={`para-${index}-${lineIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + lineIndex * 0.05 }}
              className="mb-4 last:mb-0 text-gray-800 dark:text-white/90"
              style={{ lineHeight: '1.7' }}
            >
              {cleanedText}
            </motion.p>
          );
        }
      });

      // Check if we have list items by looking at keys
      const listItems = elements.filter(el => el.key?.toString().startsWith('list-'));
      const nonListItems = elements.filter(el => !el.key?.toString().startsWith('list-'));
      
      if (listItems.length > 0) {
        return (
          <div key={`section-${index}`}>
            {nonListItems}
            <ul className="space-y-1 mb-4">{listItems}</ul>
          </div>
        );
      }

      return (
        <div key={`section-${index}`} className="mb-5 last:mb-0">
          {elements}
        </div>
      );
    });
  };

  // Clean markdown syntax from text
  const cleanMarkdown = (text: string): string => {
    return text
      // Remove bold markers
      .replace(/\*\*(.+?)\*\*/g, '$1')
      // Remove italic markers
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Remove inline code markers
      .replace(/`(.+?)`/g, '$1')
      // Clean up any remaining asterisks or underscores at word boundaries
      .replace(/\B[*_]+\B/g, '');
  };

  return (
    <div className="max-w-2xl rounded-3xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg text-gray-800 dark:text-white">
      <div className="flex items-start gap-3">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="formatted-ai-content">
            {formatContent(content)}
          </div>
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-500 dark:text-gray-400 mt-3 block"
          >
            {timestamp.toLocaleTimeString()}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
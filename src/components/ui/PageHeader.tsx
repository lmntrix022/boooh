import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconGradient?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  description,
  iconGradient = "from-blue-400 via-purple-400 to-indigo-500"
}) => (
  <motion.div
    className="mb-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.1 }}
  >
    <h1 className="flex items-center gap-3 text-gray-900 text-3xl md:text-4xl font-semibold tracking-tight mb-2">
      <span className="inline-flex items-center justify-center rounded-lg bg-gray-900 p-2 shadow-sm">
        <Icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
      </span>
      {title}
    </h1>
    <motion.p
      className="text-lg text-gray-600"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      {description}
    </motion.p>
  </motion.div>
);

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  hoverColor: string;
  target?: string;
  rel?: string;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  href,
  icon: Icon,
  label,
  color,
  hoverColor,
  target,
  rel,
  className = ""
}) => {
  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:${hoverColor} hover:backdrop-blur-lg transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      <Icon className="h-6 w-6 text-white" />
    </motion.a>
  );
};

export default ActionButton;

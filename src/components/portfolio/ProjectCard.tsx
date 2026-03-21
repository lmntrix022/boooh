import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Star } from 'lucide-react';
import { PortfolioProject } from '@/services/portfolioService';

interface ProjectCardProps {
  project: PortfolioProject;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = React.forwardRef<HTMLDivElement, ProjectCardProps>(({ project, onClick }, ref) => {
  return (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.25, type: "tween" }}
    >
      <Card
        className="group cursor-pointer overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden bg-gray-100">
          {project.featured_image ? (
            <img
              src={project.featured_image}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl opacity-20">📁</div>
            </div>
          )}

          {/* Badge catégorie */}
          {project.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white text-gray-700 border border-gray-200 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {project.category}
              </Badge>
            </div>
          )}

          {/* Compteur de vues */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 text-gray-700 px-2 py-1 rounded-lg text-xs border border-gray-200 shadow-sm">
            <Eye className="w-3 h-3" />
            {project.view_count}
          </div>

          {/* Note témoignage */}
          {project.testimonial_rating && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 text-gray-700 px-2 py-1 rounded-lg text-xs border border-gray-200 shadow-sm">
              <Star className="w-3 h-3 fill-current" />
              {project.testimonial_rating}/5
            </div>
          )}
        </div>

        {/* Contenu */}
        <CardContent className="p-5">
          {/* Titre */}
          <h3 className="font-light text-lg mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            {project.title}
          </h3>

          {/* Description courte */}
          {project.short_description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {project.short_description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-lg border border-gray-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg border border-gray-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

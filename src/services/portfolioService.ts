/**
 * Portfolio/Services Module Service (Facade)
 * Ce service est maintenant une façade qui délègue aux sous-services spécialisés.
 */

import { PortfolioProjectService } from './portfolio/portfolioProjectService';
import { PortfolioQuoteService } from './portfolio/portfolioQuoteService';
import { PortfolioSettingsService } from './portfolio/portfolioSettingsService';
import { PortfolioAnalyticsService } from './portfolio/portfolioAnalyticsService';
import { PortfolioManagerService } from './portfolio/portfolioManagerService';

export * from './portfolio/types';
import {
  PortfolioProject,
  PortfolioServiceType,
  ServiceQuote,
  PortfolioSettings,
  PortfolioAnalytics,
  ServiceCard,
  PortfolioServiceWithCards,
  PortfolioStats,
  CreateProjectData,
  UpdateProjectData,
  CreateQuoteData,
  UpdateQuoteData,
  CreateServiceData,
  UpdateServiceData,
  QuoteStatus,
  QuotePriority,
  AnalyticsEventType
} from './portfolio/types';

/**
 * @deprecated Utilisez les services spécialisés dans src/services/portfolio/ pour les nouveaux développements
 */
export class PortfolioService {
  // PROJECTS
  static createProject = PortfolioProjectService.createProject;
  static getUserProjects = PortfolioProjectService.getUserProjects;
  static getProject = PortfolioProjectService.getProject;
  static getCardProjects = PortfolioProjectService.getCardProjects;
  static getProjectBySlug = PortfolioProjectService.getProjectBySlug;
  static updateProject = PortfolioProjectService.updateProject;
  static deleteProject = PortfolioProjectService.deleteProject;
  static incrementProjectViews = PortfolioProjectService.incrementProjectViews;
  static getTopProjects = PortfolioProjectService.getTopProjects;

  // QUOTES
  static createQuote = PortfolioQuoteService.createQuote;
  static createPublicQuote = PortfolioQuoteService.createPublicQuote;
  static getUserQuotes = PortfolioQuoteService.getUserQuotes;
  static updateQuote = PortfolioQuoteService.updateQuote;
  static deleteQuote = PortfolioQuoteService.deleteQuote;
  static getQuoteByPublicToken = PortfolioQuoteService.getQuoteByPublicToken;
  static respondQuotePublic = PortfolioQuoteService.respondQuotePublic;

  // SETTINGS
  static getSettings = PortfolioSettingsService.getSettings;
  static getCardSettings = PortfolioSettingsService.getCardSettings;
  static createSettings = PortfolioSettingsService.createSettings;
  static updateSettings = PortfolioSettingsService.updateSettings;
  static upsertSettings = PortfolioSettingsService.upsertSettings;

  // ANALYTICS
  static trackEvent = PortfolioAnalyticsService.trackEvent;
  static getStats = PortfolioAnalyticsService.getStats;
  static getAnalytics = PortfolioAnalyticsService.getAnalytics;

  // SERVICES CORE
  static getUserServices = PortfolioManagerService.getUserServices;
  static createService = PortfolioManagerService.createService;
  static updateService = PortfolioManagerService.updateService;
  static deleteService = PortfolioManagerService.deleteService;
  static reorderServices = PortfolioManagerService.reorderServices;
  static linkServiceToCard = PortfolioManagerService.linkServiceToCard;
  static unlinkServiceFromCard = PortfolioManagerService.unlinkServiceFromCard;
  static updateServiceCards = PortfolioManagerService.updateServiceCards;
  static getServiceCards = PortfolioManagerService.getServiceCards;
  static getUserServicesWithCards = PortfolioManagerService.getUserServicesWithCards;
  static getPublishedCardServices = PortfolioManagerService.getPublishedCardServices;
  static getCardServices = PortfolioManagerService.getPublishedCardServices; // Alias for backward compatibility

  // LEGACY METHODS (Pour compatibilité ascendante)

  static async getUserProjectsLegacy(userId: string, publishedOnly = false): Promise<PortfolioProject[]> {
    const result = await this.getUserProjects(userId, { publishedOnly, limit: 1000 });
    return result.projects;
  }

  static async getUserQuotesLegacy(userId: string, filters?: { status?: QuoteStatus; priority?: QuotePriority }): Promise<ServiceQuote[]> {
    const result = await this.getUserQuotes(userId, { ...filters, limit: 1000 });
    return result.quotes;
  }

  static async getUserServicesLegacy(userId: string): Promise<PortfolioServiceType[]> {
    const result = await this.getUserServices(userId, { limit: 1000 });
    return result.services;
  }

  static async getUserServicesWithCardsLegacy(userId: string): Promise<PortfolioServiceWithCards[]> {
    const result = await this.getUserServicesWithCards(userId, { limit: 1000 });
    return result.services;
  }

  static async getAnalyticsLegacy(userId: string, filters?: { eventType?: AnalyticsEventType; projectId?: string; limit?: number }): Promise<PortfolioAnalytics[]> {
    const result = await this.getAnalytics(userId, { ...filters, limit: filters?.limit || 100 });
    return result.analytics;
  }
}

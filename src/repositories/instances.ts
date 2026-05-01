import { ConvexPortfolioRepository } from "./implementations/ConvexPortfolioRepository";
import { ConvexBlogRepository } from "./implementations/ConvexBlogRepository";
import { ConvexHomeRepository } from "./implementations/ConvexHomeRepository";
import { ConvexAboutRepository } from "./implementations/ConvexAboutRepository";
import { ConvexResumeRepository } from "./implementations/ConvexResumeRepository";
import { ConvexSidebarRepository } from "./implementations/ConvexSidebarRepository";

import { StaticPortfolioRepository } from "./implementations/StaticPortfolioRepository";
import { StaticBlogRepository } from "./implementations/StaticBlogRepository";
import { StaticHomeRepository } from "./implementations/StaticHomeRepository";
import { StaticAboutRepository } from "./implementations/StaticAboutRepository";
import { StaticResumeRepository } from "./implementations/StaticResumeRepository";
import { StaticSidebarRepository } from "./implementations/StaticSidebarRepository";

const isProduction = import.meta.env.PROD;

export const portfolioRepository = isProduction
  ? new StaticPortfolioRepository()
  : new ConvexPortfolioRepository();

export const blogRepository = isProduction
  ? new StaticBlogRepository()
  : new ConvexBlogRepository();

export const homeRepository = isProduction
  ? new StaticHomeRepository()
  : new ConvexHomeRepository();

export const aboutRepository = isProduction
  ? new StaticAboutRepository()
  : new ConvexAboutRepository();

export const resumeRepository = isProduction
  ? new StaticResumeRepository()
  : new ConvexResumeRepository();

export const sidebarRepository = isProduction
  ? new StaticSidebarRepository()
  : new ConvexSidebarRepository();

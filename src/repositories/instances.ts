import { SupabasePortfolioRepository } from "./implementations/SupabasePortfolioRepository";
import { SupabaseBlogRepository } from "./implementations/SupabaseBlogRepository";
import { SupabaseHomeRepository } from "./implementations/SupabaseHomeRepository";
import { SupabaseAboutRepository } from "./implementations/SupabaseAboutRepository";
import { SupabaseResumeRepository } from "./implementations/SupabaseResumeRepository";
import { SupabaseSidebarRepository } from "./implementations/SupabaseSidebarRepository";

import { StaticPortfolioRepository } from "./implementations/StaticPortfolioRepository";
import { StaticBlogRepository } from "./implementations/StaticBlogRepository";
import { StaticHomeRepository } from "./implementations/StaticHomeRepository";
import { StaticAboutRepository } from "./implementations/StaticAboutRepository";
import { StaticResumeRepository } from "./implementations/StaticResumeRepository";
import { StaticSidebarRepository } from "./implementations/StaticSidebarRepository";

const isProduction = import.meta.env.PROD;

export const portfolioRepository = isProduction
  ? new StaticPortfolioRepository()
  : new SupabasePortfolioRepository();

export const blogRepository = isProduction
  ? new StaticBlogRepository()
  : new SupabaseBlogRepository();

export const homeRepository = isProduction
  ? new StaticHomeRepository()
  : new SupabaseHomeRepository();

export const aboutRepository = isProduction
  ? new StaticAboutRepository()
  : new SupabaseAboutRepository();

export const resumeRepository = isProduction
  ? new StaticResumeRepository()
  : new SupabaseResumeRepository();

export const sidebarRepository = isProduction
  ? new StaticSidebarRepository()
  : new SupabaseSidebarRepository();

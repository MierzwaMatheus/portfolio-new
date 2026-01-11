import { SupabasePortfolioRepository } from "./implementations/SupabasePortfolioRepository";
import { SupabaseBlogRepository } from "./implementations/SupabaseBlogRepository";
import { SupabaseHomeRepository } from "./implementations/SupabaseHomeRepository";
import { SupabaseAboutRepository } from "./implementations/SupabaseAboutRepository";
import { SupabaseResumeRepository } from "./implementations/SupabaseResumeRepository";

// Instâncias dos repositórios - podem ser injetadas via contexto ou props no futuro
export const portfolioRepository = new SupabasePortfolioRepository();
export const blogRepository = new SupabaseBlogRepository();
export const homeRepository = new SupabaseHomeRepository();
export const aboutRepository = new SupabaseAboutRepository();
export const resumeRepository = new SupabaseResumeRepository();


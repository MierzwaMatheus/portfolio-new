import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ExternalLink, Github, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { usePortfolio } from "@/hooks/usePortfolio";
import { portfolioRepository } from "@/repositories/instances";
import { Project } from "@/repositories/interfaces/PortfolioRepository";

/* ─────────────── OXYZ3-style 3D Tilt Card ─────────────── */
function TiltCard({ project, index, t }: {
  project: Project;
  index: number;
  t: (key: string) => string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // max ±12 deg
    rotateY.set(((x - centerX) / centerX) * 12);
    rotateX.set(((centerY - y) / centerY) * 12);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  // Stable coordinate labels per card
  const coord = useMemo(() => ({
    tl: `[${String(index).padStart(2, "0")}]`,
    tr: `x${Math.floor(Math.random() * 90 + 10)}`,
    bl: `y${Math.floor(Math.random() * 90 + 10)}`,
    br: `z${Math.floor(Math.random() * 90 + 10)}`,
  }), [index]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="w-full"
      style={{ perspective: 2000 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        onClick={() => setDialogOpen(true)}
        className="relative w-full aspect-[16/10] cursor-pointer group overflow-visible"
      >
        {/* ── Layer 0: Background image ── */}
        <div
          className="absolute inset-0 rounded-[6px] overflow-hidden border border-border-default"
          style={{ transform: "translateZ(0px)" }}
        >
          {project.images && project.images.length > 0 ? (
            <img
              src={project.images[0]}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full bg-surface-elevated flex items-center justify-center text-text-muted font-mono text-sm">
              {t("portfolio.noImage")}
            </div>
          )}

          {/* Hover grid overlay (like OXYZ3 grid on hover) */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Vignette / gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/30 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
        </div>

        {/* ── Corner labels (layer Z=50px) — visible on hover ── */}
        <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }} className="absolute inset-0 pointer-events-none">
          <span className="absolute top-3 left-3 text-[10px] font-mono text-text-muted/60 group-hover:text-accent-green transition-colors duration-300 opacity-0 group-hover:opacity-100">
            {coord.tl}
          </span>
          <span className="absolute top-3 right-3 text-[10px] font-mono text-text-muted/60 group-hover:text-accent-purple transition-colors duration-300 opacity-0 group-hover:opacity-100">
            {coord.tr}
          </span>
          <span className="absolute bottom-3 left-3 text-[10px] font-mono text-text-muted/60 group-hover:text-accent-purple transition-colors duration-300 opacity-0 group-hover:opacity-100">
            {coord.bl}
          </span>
          <span className="absolute bottom-3 right-3 text-[10px] font-mono text-text-muted/60 group-hover:text-accent-green transition-colors duration-300 opacity-0 group-hover:opacity-100">
            {coord.br}
          </span>

          {/* Corner rect borders (like OXYZ3 rect spans) */}
          <span className="absolute top-0 left-0 w-6 h-6 border-t border-l border-accent-purple/0 group-hover:border-accent-purple/60 transition-colors duration-500 rounded-tl-[6px]" />
          <span className="absolute top-0 right-0 w-6 h-6 border-t border-r border-accent-green/0 group-hover:border-accent-green/60 transition-colors duration-500 rounded-tr-[6px]" />
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-accent-green/0 group-hover:border-accent-green/60 transition-colors duration-500 rounded-bl-[6px]" />
          <span className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-accent-purple/0 group-hover:border-accent-purple/60 transition-colors duration-500 rounded-br-[6px]" />
        </div>

        {/* ── Title overlay at Z=40px — "floats" above the image ── */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none"
          style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            {project.tags?.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-[11px] uppercase tracking-widest px-3 py-1 bg-surface-page/70 backdrop-blur-md text-text-primary border border-border-default/40 rounded-[3px] font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-bold font-display text-text-primary leading-tight tracking-tight drop-shadow-lg">
            {project.title}
          </h3>
          <p className="text-text-secondary text-sm font-mono mt-1.5 line-clamp-2 drop-shadow-md max-w-[90%]">
            {project.description}
          </p>
        </div>

        {/* ── CTA label at Z=70px — pops out most ── */}
        <div
          className="absolute top-4 right-4 pointer-events-none"
          style={{ transform: "translateZ(70px)", transformStyle: "preserve-3d" }}
        >
          <span className="bg-surface-page/70 backdrop-blur-md border border-border-default/60 text-text-primary/80 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest rounded-[3px] opacity-0 group-hover:opacity-100 transition-all duration-300 inline-block translate-y-1 group-hover:translate-y-0">
            {t("portfolio.details")}
          </span>
        </div>

        {/* ── Dialog (controlled, opens on card click) ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl bg-surface-card border-border-default text-text-primary p-0 overflow-hidden max-h-[90vh] flex flex-col rounded-[6px]">
            <VisuallyHidden>
              <DialogTitle>{project.title}</DialogTitle>
            </VisuallyHidden>

            <div className="overflow-y-auto flex-1">
              {/* Carousel Section */}
              <div className="bg-surface-page p-6 flex items-center justify-center relative min-h-[250px] border-b border-border-default">
                {project.images && project.images.length > 0 ? (
                  <Carousel className="w-full max-w-md mx-auto">
                    <CarouselContent>
                      {project.images.map((img: string, idx: number) => (
                        <CarouselItem key={idx}>
                          <div className="aspect-video rounded-[4px] overflow-hidden border border-border-default relative group/carousel">
                            <img src={img} alt={`${project.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 bg-surface-elevated border-border-default text-text-secondary hover:text-text-primary hover:bg-accent-purple hover:border-accent-purple rounded-[4px]" />
                    <CarouselNext className="right-2 bg-surface-elevated border-border-default text-text-secondary hover:text-text-primary hover:bg-accent-purple hover:border-accent-purple rounded-[4px]" />
                  </Carousel>
                ) : (
                  <div className="text-text-muted font-mono text-sm">{t("portfolio.noImages")}</div>
                )}
              </div>

              {/* Details Section */}
              <div className="p-6 lg:p-8 space-y-6 bg-surface-card">
                <div>
                  <div className="text-2xl font-bold font-display text-text-primary mb-2">{project.title}</div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="bg-accent-purple-subtle text-accent-purple border-accent-purple hover:bg-accent-purple hover:text-white rounded-[3px] font-mono text-[10px] uppercase tracking-widest px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <DialogDescription className="text-text-secondary text-sm font-mono leading-relaxed whitespace-pre-line">
                  {project.long_description || project.description}
                </DialogDescription>

                <div className="space-y-4 pt-6 border-t border-border-default">
                  <h4 className="text-xs font-bold text-text-muted uppercase font-mono tracking-widest">{t("portfolio.projectLinks")}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {project.demo_link && (
                      <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button className="w-full bg-accent-green hover:bg-accent-green/90 text-[#0A0A0A] font-mono text-xs uppercase tracking-wider rounded-[4px]">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          {t("portfolio.liveDemo")}
                        </Button>
                      </a>
                    )}
                    {project.github_link && (
                      <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="outline" className="w-full border-border-default text-text-secondary hover:bg-surface-elevated hover:border-accent-purple hover:text-text-primary font-mono text-xs uppercase tracking-wider rounded-[4px]">
                          <Github className="mr-2 h-3 w-3" />
                          {t("portfolio.code")}
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Stripe overlay (scanlines — very subtle) ── */}
        <div
          className="absolute inset-0 rounded-[6px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            transform: "translateZ(2px)",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── Main Portfolio page ─────────────── */
export default function Portfolio() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [activeFilter, setActiveFilter] = useState(t("portfolio.all"));
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ url: string; index: number; images: string[] } | null>(null);

  // Keyboard nav for expanded images
  useEffect(() => {
    if (!expandedImage || expandedImage.images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = expandedImage.index > 0 ? expandedImage.index - 1 : expandedImage.images.length - 1;
        setExpandedImage({ ...expandedImage, url: expandedImage.images[prevIndex], index: prevIndex });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = expandedImage.index < expandedImage.images.length - 1 ? expandedImage.index + 1 : 0;
        setExpandedImage({ ...expandedImage, url: expandedImage.images[nextIndex], index: nextIndex });
      } else if (e.key === "Escape") {
        setExpandedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImage]);

  const availableTags = useMemo(() => {
    const allTags = projects.flatMap((p) => p.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [projects]);

  const filters = useMemo(() => [t("portfolio.all"), ...availableTags], [availableTags, t]);

  const filteredProjects = activeFilter === t("portfolio.all") ? projects : projects.filter((p) => p.tags?.includes(activeFilter));

  useEffect(() => {
    if (activeFilter !== t("portfolio.all") && !availableTags.includes(activeFilter)) {
      setActiveFilter(t("portfolio.all"));
    }
  }, [activeFilter, availableTags, t]);

  if (isLoading || i18nLoading) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold font-display text-text-primary uppercase tracking-tight">{t("portfolio.title")}</h1>
        <p className="text-text-secondary mt-2 font-mono text-sm">{t("portfolio.subtitle")}</p>
      </header>

      {/* Filters */}
      {filters.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`inline-flex items-center justify-center px-4 py-1.5 rounded-[3px] text-[10px] font-mono uppercase tracking-widest transition-all duration-300 border ${activeFilter === filter
                ? "bg-accent-purple-subtle text-accent-purple border-accent-purple hover:bg-accent-purple hover:text-white"
                : "bg-surface-elevated text-text-secondary hover:border-accent-green hover:text-text-primary border-border-default"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Projects Grid — OXYZ3-style Tilt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <TiltCard
              key={project.id}
              project={project}
              index={index}
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Expanded image dialog */}
      <Dialog open={!!expandedImage} onOpenChange={(open) => !open && setExpandedImage(null)}>
        <DialogContent
          className="!max-w-[98vw] !w-[98vw] !h-[98vh] !max-h-[98vh] bg-surface-page border-border-default p-0 overflow-hidden flex flex-col !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%] rounded-[6px]"
          showCloseButton={false}
        >
          {expandedImage && (
            <>
              <DialogHeader className="p-4 border-b border-border-default flex-shrink-0 bg-surface-sidebar">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-text-primary font-mono text-sm uppercase tracking-wider">
                    {t("portfolio.image")} {expandedImage.index + 1} {t("portfolio.of")} {expandedImage.images.length}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedImage(null)}
                    className="text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-[4px] h-8 w-8"
                    aria-label={t("common.close")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="relative flex-1 flex items-center justify-center bg-surface-page/80 overflow-hidden min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={expandedImage.url}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center p-4"
                  >
                    <img
                      src={expandedImage.url}
                      alt={`Imagem expandida ${expandedImage.index + 1}`}
                      className="w-auto h-auto max-w-full max-h-full object-contain rounded-[4px] border border-border-default"
                      style={{ maxHeight: "calc(98vh - 100px)" }}
                    />
                  </motion.div>
                </AnimatePresence>
                {expandedImage.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-surface-elevated/80 border-border-default text-text-secondary hover:text-text-primary hover:bg-accent-purple hover:border-accent-purple z-10 rounded-[4px]"
                      onClick={() => {
                        const prevIndex = expandedImage.index > 0 ? expandedImage.index - 1 : expandedImage.images.length - 1;
                        setExpandedImage({ ...expandedImage, url: expandedImage.images[prevIndex], index: prevIndex });
                      }}
                      aria-label={t("portfolio.previousImage")}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface-elevated/80 border-border-default text-text-secondary hover:text-text-primary hover:bg-accent-purple hover:border-accent-purple z-10 rounded-[4px]"
                      onClick={() => {
                        const nextIndex = expandedImage.index < expandedImage.images.length - 1 ? expandedImage.index + 1 : 0;
                        setExpandedImage({ ...expandedImage, url: expandedImage.images[nextIndex], index: nextIndex });
                      }}
                      aria-label={t("portfolio.nextImage")}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}


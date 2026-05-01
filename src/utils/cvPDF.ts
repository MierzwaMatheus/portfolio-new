import type { SidebarContactInfo } from "@/repositories/interfaces/SidebarRepository";
import type { ResumeItem } from "@/repositories/interfaces/ResumeRepository";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

type Locale = "pt-BR" | "en-US";
type TranslatedResumeItem = ResumeItem & { translatedContent?: any };

const LABELS = {
  "pt-BR": {
    experience: "Experiência Profissional",
    projects: "Projetos",
    education: "Educação",
    skills: "Habilidades Técnicas",
    languages: "Idiomas",
    courses: "Cursos e Certificações",
    softSkills: "Soft Skills",
    volunteer: "Trabalho Voluntário",
    technologies: "Tecnologias",
    present: "Atual",
  },
  "en-US": {
    experience: "Professional Experience",
    projects: "Projects",
    education: "Education",
    skills: "Technical Skills",
    languages: "Languages",
    courses: "Courses & Certifications",
    softSkills: "Soft Skills",
    volunteer: "Volunteer Work",
    technologies: "Technologies",
    present: "Present",
  },
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToAtsHtml(raw: string): string {
  // Extract <li> contents as clean bullets
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const liMatches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(raw)) !== null) liMatches.push(m);
  if (liMatches.length > 0) {
    const items = liMatches.map(m => `<li>${m[1].replace(/<[^>]+>/g, "").trim()}</li>`).join("");
    return `<ul>${items}</ul>`;
  }
  // Fallback: strip all tags and return as paragraph
  const plain = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? `<p>${esc(plain)}</p>` : "";
}

function descriptionToHtml(text: string): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return htmlToAtsHtml(text);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items = lines.filter(l => l.startsWith("- ") || l.startsWith("• "));
  if (items.length > 0) {
    const bullets = items.map(l => `<li>${esc(l.replace(/^[-•]\s*/, ""))}</li>`).join("");
    return `<ul>${bullets}</ul>`;
  }
  return `<p>${esc(lines.join(" "))}</p>`;
}

function sectionHtml(title: string, body: string): string {
  if (!body.trim()) return "";
  return `
    <div class="section">
      <h2>${esc(title)}</h2>
      <hr/>
      ${body}
    </div>`;
}

function experienceHtml(items: TranslatedResumeItem[]): string {
  return items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    const company = c.company ? esc(c.company) : "";
    const role = c.role ? esc(c.role) : "";
    const period = c.period ? esc(c.period) : "";
    const description = c.description ? descriptionToHtml(c.description) : "";
    return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${company}${company && role ? " — " : ""}${role}</span>
          <span class="entry-period">${period}</span>
        </div>
        ${description}
      </div>`;
  }).join("");
}

function educationHtml(items: TranslatedResumeItem[]): string {
  return items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    const institution = c.institution ? esc(c.institution) : "";
    const degree = c.degree ? esc(c.degree) : "";
    const period = c.period ? esc(c.period) : "";
    const description = c.description ? descriptionToHtml(c.description) : "";
    return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${institution}${institution && degree ? " — " : ""}${degree}</span>
          <span class="entry-period">${period}</span>
        </div>
        ${description}
      </div>`;
  }).join("");
}

function skillsHtml(items: TranslatedResumeItem[]): string {
  const names = items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    return c.name ? esc(c.name) : "";
  }).filter(Boolean);
  if (!names.length) return "";
  return `<p class="inline-list">${names.join(", ")}</p>`;
}

function languagesHtml(items: TranslatedResumeItem[]): string {
  return items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    const name = c.name ? esc(c.name) : "";
    const level = c.level ? esc(c.level) : "";
    return `<p><strong>${name}</strong>${level ? ": " + level : ""}</p>`;
  }).join("");
}

function simpleListHtml(items: TranslatedResumeItem[]): string {
  const texts = items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    if (typeof c === "string") return esc(c);
    if (c.text) return esc(c.text);
    return "";
  }).filter(Boolean);
  if (!texts.length) return "";
  return `<ul>${texts.map(t => `<li>${t}</li>`).join("")}</ul>`;
}

function softSkillsHtml(items: TranslatedResumeItem[]): string {
  const texts = items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    if (typeof c === "string") return esc(c);
    if (c.text) return esc(c.text);
    return "";
  }).filter(Boolean);
  if (!texts.length) return "";
  return `<p class="inline-list">${texts.join(", ")}</p>`;
}

function projectsHtml(projects: Project[], label: string): string {
  return projects.map(p => {
    const tags = p.tags?.length ? `<p class="entry-tech"><strong>${label}:</strong> ${p.tags.map(esc).join(", ")}</p>` : "";
    return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${esc(p.title)}</span>
        </div>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        ${tags}
      </div>`;
  }).join("");
}

function buildContactLine(ci: SidebarContactInfo): string {
  const parts: string[] = [];
  if (ci.email) parts.push(esc(ci.email));
  if (ci.phone) parts.push(esc(ci.phone));
  if (ci.linkedin_url) parts.push(esc(ci.linkedin_url.replace(/^https?:\/\/(www\.)?/, "")));
  if (ci.github_url) parts.push(esc(ci.github_url.replace(/^https?:\/\/(www\.)?/, "")));
  return parts.join(" &nbsp;|&nbsp; ");
}

export function generateCV(
  contactInfo: SidebarContactInfo,
  resumeItems: (ResumeItem & { translatedContent?: any })[],
  projects: Project[],
  locale: Locale,
  topProjectsCount = 3
): void {
  const L = LABELS[locale];
  const lang = locale === "pt-BR" ? "pt-BR" : "en-US";

  const byType = (type: string) =>
    resumeItems.filter(i => i.type === type).sort((a, b) => a.order_index - b.order_index);

  const topProjects = projects.slice(0, topProjectsCount);

  const contactLine = buildContactLine(contactInfo);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(contactInfo.name)} — CV</title>
  <style>
    @page { size: A4; margin: 14mm 18mm; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      background: #fff;
      line-height: 1.45;
    }

    .header-name {
      font-size: 22pt;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .header-role {
      font-size: 12pt;
      font-style: italic;
      color: #444;
      margin-bottom: 6px;
    }

    .header-contact {
      font-size: 9pt;
      color: #555;
      margin-bottom: 14px;
    }

    .section {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .section h2 {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .section hr {
      border: none;
      border-top: 1px solid #111;
      margin-bottom: 8px;
    }

    .entry {
      margin-bottom: 10px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .entry-title {
      font-weight: bold;
      font-size: 10.5pt;
    }

    .entry-period {
      font-size: 9.5pt;
      color: #555;
      white-space: nowrap;
      margin-left: 8px;
    }

    .entry-desc {
      font-size: 9.5pt;
      color: #444;
      margin-top: 2px;
    }

    .entry-tech {
      font-size: 9.5pt;
      color: #444;
      margin-top: 2px;
    }

    p {
      margin-top: 3px;
      font-size: 10pt;
    }

    ul {
      padding-left: 18px;
      margin-top: 3px;
    }

    li {
      font-size: 10pt;
      margin-bottom: 1px;
    }

    .inline-list {
      font-size: 10pt;
    }

    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <div class="header-name">${esc(contactInfo.name)}</div>
  <div class="header-role">${esc(contactInfo.role)}</div>
  <div class="header-contact">${contactLine}</div>

  ${sectionHtml(L.experience, experienceHtml(byType("experience")))}
  ${topProjects.length ? sectionHtml(L.projects, projectsHtml(topProjects, L.technologies)) : ""}
  ${sectionHtml(L.education, educationHtml(byType("education")))}
  ${sectionHtml(L.skills, skillsHtml(byType("skill")))}
  ${sectionHtml(L.languages, languagesHtml(byType("language")))}
  ${sectionHtml(L.courses, simpleListHtml(byType("course")))}
  ${sectionHtml(L.softSkills, softSkillsHtml(byType("soft_skill")))}
  ${sectionHtml(L.volunteer, simpleListHtml(byType("volunteer")))}

</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup bloqueado. Permita popups para gerar o CV.");
  }
  win.onload = () => {
    setTimeout(() => {
      win.print();
      URL.revokeObjectURL(url);
    }, 400);
  };
}

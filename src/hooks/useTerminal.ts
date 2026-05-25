import { useState, useCallback } from "react";
import { BlogPost } from "@/repositories/interfaces/BlogRepository";

export type LineType = "input" | "output" | "error" | "nav" | "welcome";

export interface TerminalLine {
  type: LineType;
  text: string;
}

const COMMANDS = [
  "help",
  "home",
  "projects",
  "about",
  "resume",
  "curriculo",
  "blog",
  "posts",
  "open",
  "contact",
  "ls",
  "whoami",
  "theme",
  "clear",
  "exit",
  "quit",
];

const WELCOME_LINES: TerminalLine[] = [
  { type: "welcome", text: "Welcome to matheus-mierzwa terminal v1.0" },
  { type: "welcome", text: "Type 'help' to see available commands." },
  { type: "welcome", text: "─────────────────────────────────────────" },
];

interface UseTerminalOptions {
  posts: BlogPost[];
  onNavigate: (path: string) => void;
  onClose: () => void;
  onThemeToggle?: () => void;
}

export function useTerminal({
  posts,
  onNavigate,
  onClose,
  onThemeToggle,
}: UseTerminalOptions) {
  const [lines, setLines] = useState<TerminalLine[]>(WELCOME_LINES);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addLine = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line]);
  }, []);

  const navigate = useCallback(
    (path: string, label: string) => {
      addLine({ type: "nav", text: `→ navigating to ${label}...` });
      setTimeout(() => {
        onNavigate(path);
        onClose();
      }, 300);
    },
    [addLine, onNavigate, onClose]
  );

  const processCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      addLine({ type: "input", text: `visitor@matheus-mierzwa:~$ ${trimmed}` });

      const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

      switch (cmd) {
        case "help":
          [
            "Available commands:",
            "  home          → Go to home page",
            "  projects      → Go to portfolio",
            "  about         → Go to about page",
            "  resume        → Go to resume / curriculum",
            "  blog          → Go to blog",
            "  posts         → List all published posts",
            "  open <slug>   → Navigate to a blog post",
            "  contact       → Show contact info",
            "  ls            → List available pages",
            "  whoami        → Who is this guy?",
            "  theme         → Toggle dark/light mode",
            "  clear         → Clear terminal",
            "  exit          → Close terminal",
          ].forEach(t => addLine({ type: "output", text: t }));
          break;

        case "home":
          navigate("/", "/");
          break;

        case "projects":
          navigate("/portfolio", "/portfolio");
          break;

        case "about":
          navigate("/sobre", "/sobre");
          break;

        case "resume":
        case "curriculo":
          navigate("/curriculo", "/curriculo");
          break;

        case "blog":
          navigate("/blog", "/blog");
          break;

        case "posts":
          if (posts.length === 0) {
            addLine({ type: "output", text: "No published posts found." });
          } else {
            addLine({ type: "output", text: "Published posts:" });
            posts.forEach(p =>
              addLine({ type: "output", text: `  ${p.slug.padEnd(32)} ${p.title}` })
            );
          }
          break;

        case "open": {
          const slug = args[0];
          if (!slug) {
            addLine({ type: "error", text: "usage: open <slug>" });
            break;
          }
          const found = posts.find(p => p.slug === slug);
          if (!found) {
            addLine({ type: "error", text: `post not found: ${slug}` });
          } else {
            navigate(`/blog/${slug}`, `/blog/${slug}`);
          }
          break;
        }

        case "contact":
          [
            "Contact:",
            "  email    mierzwa.oliveira@gmail.com",
            "  github   github.com/MierzwaMatheus",
            "  linkedin linkedin.com/in/matheus-mierzwa",
          ].forEach(t => addLine({ type: "output", text: t }));
          break;

        case "ls":
          [
            "Pages:",
            "  /             home",
            "  /portfolio    projects",
            "  /sobre        about",
            "  /curriculo    resume",
            "  /blog         blog",
          ].forEach(t => addLine({ type: "output", text: t }));
          break;

        case "whoami":
          addLine({
            type: "output",
            text: "matheus mierzwa — software developer",
          });
          break;

        case "theme":
          if (onThemeToggle) {
            onThemeToggle();
            addLine({ type: "output", text: "Theme toggled." });
          } else {
            addLine({ type: "error", text: "Theme switching is not enabled." });
          }
          break;

        case "clear":
          setLines(WELCOME_LINES);
          return;

        case "exit":
        case "quit":
          onClose();
          return;

        default:
          addLine({ type: "error", text: `command not found: ${cmd}` });
      }
    },
    [addLine, navigate, posts, onClose, onThemeToggle]
  );

  const submit = useCallback(() => {
    const trimmed = input.trim();
    processCommand(input);
    if (trimmed) {
      setCmdHistory(prev => [trimmed, ...prev]);
    }
    setInput("");
    setHistoryIndex(-1);
  }, [input, processCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistoryIndex(prev => {
          const next = Math.min(prev + 1, cmdHistory.length - 1);
          if (next >= 0) setInput(cmdHistory[next]);
          return next;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistoryIndex(prev => {
          const next = Math.max(prev - 1, -1);
          setInput(next === -1 ? "" : cmdHistory[next]);
          return next;
        });
      } else if (e.key === "Tab") {
        e.preventDefault();
        const partial = input.trim().toLowerCase();
        const match = COMMANDS.find(c => c.startsWith(partial) && c !== partial);
        if (match) setInput(match);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [submit, cmdHistory, input, onClose]
  );

  return { lines, input, setInput, handleKeyDown };
}

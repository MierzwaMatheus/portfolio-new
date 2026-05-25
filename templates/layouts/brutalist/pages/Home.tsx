import { useHome } from "@/hooks/useHome";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository } from "@/repositories/instances";

function AsciiRule({ char = "─", label }: { char?: string; label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "14px 0",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.7,
        color: "var(--text)",
      }}
    >
      {label ? (
        <>
          <span style={{ color: "var(--accent)" }}>{char.repeat(3)}</span>
          <span
            style={{
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            [ {label} ]
          </span>
          <span style={{ flex: 1, color: "var(--accent)", overflow: "hidden" }}>
            {char.repeat(200)}
          </span>
        </>
      ) : (
        <span style={{ flex: 1, overflow: "hidden" }}>{char.repeat(200)}</span>
      )}
    </div>
  );
}

function BrutPrompt({
  cmd,
  output,
  host = "user@rubrica",
}: {
  cmd: string;
  output?: React.ReactNode;
  host?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}
    >
      <div>
        <span style={{ color: "var(--accent)" }}>{host}</span>
        <span style={{ opacity: 0.7 }}>:~$ </span>
        <span style={{ color: "var(--primary)", fontWeight: 700 }}>{cmd}</span>
      </div>
      {output && <div style={{ marginTop: 6 }}>{output}</div>}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { contactRole, aboutText, services, testimonials } =
    useHome(homeRepository);

  const primaryStack = services.map((s) => s.title);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        padding: "24px 28px",
      }}
    >
      {/* ASCII banner */}
      <pre
        style={{
          margin: 0,
          color: "var(--primary)",
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.05,
          fontFamily: "var(--font-mono)",
          overflow: "hidden",
        }}
      >{` ███╗   ███╗ █████╗ ████████╗██╗  ██╗███████╗██╗   ██╗███████╗
 ████╗ ████║██╔══██╗╚══██╔══╝██║  ██║██╔════╝██║   ██║██╔════╝
 ██╔████╔██║███████║   ██║   ███████║█████╗  ██║   ██║███████║
 ██║╚██╔╝██║██╔══██║   ██║   ██╔══██║██╔══╝  ██║   ██║╚════██║
 ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║███████║╚██████╔╝███████║
 ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝`}</pre>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
        {`// ${contactRole}`}
      </div>

      <AsciiRule label="whoami" />

      <BrutPrompt
        cmd="cat /etc/motd"
        output={
          <div
            style={{ paddingLeft: 14, borderLeft: "2px solid var(--accent)" }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                margin: "6px 0",
              }}
            >
              {t("home.greeting")}
            </div>
            <div style={{ opacity: 0.85, marginBottom: 8 }}>{contactRole}</div>
            <div style={{ opacity: 0.7, fontSize: 12, lineHeight: 1.6 }}>
              {aboutText}
            </div>
          </div>
        }
      />

      <div style={{ marginTop: 18 }}>
        <BrutPrompt
          cmd="ls --primary-stack"
          output={
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginTop: 6,
              }}
            >
              {primaryStack.map((s) => (
                <span
                  key={s}
                  style={{
                    padding: "3px 10px",
                    border: "1px solid var(--text)",
                    color: "var(--text)",
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>›</span> {s}
                </span>
              ))}
            </div>
          }
        />
      </div>

      <AsciiRule label="capabilities" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          border: "1px solid var(--text)",
        }}
      >
        {services.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: 18,
              borderRight: i % 2 === 0 ? "1px solid var(--text)" : "none",
              borderBottom:
                i < services.length - 2 ? "1px solid var(--text)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {c.title.toLowerCase()}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.55,
                opacity: 0.82,
              }}
            >
              {c.description}
            </p>
          </div>
        ))}
      </div>

      <AsciiRule label="testimonials" />

      <BrutPrompt
        cmd="cat clients/*.txt | head"
        output={
          <div style={{ marginTop: 8 }}>
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                style={{
                  marginBottom: 14,
                  padding: "12px 14px",
                  border: "1px solid var(--text)",
                  background: i === 0 ? "var(--text)" : "transparent",
                  color: i === 0 ? "var(--bg)" : "var(--text)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    opacity: 0.7,
                    marginBottom: 6,
                  }}
                >
                  <span>
                    {">"} from: {t.name} &lt;{t.role}&gt;
                  </span>
                  <span>rating: ★★★★★</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        }
      />

      <div style={{ marginTop: 16 }}>
        <BrutPrompt cmd="echo $CONTACT" />
        <div style={{ marginTop: 8, opacity: 0.5, fontSize: 12 }}>
          <span style={{ color: "var(--accent)" }}>user@rubrica</span>
          <span>:~$ </span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: "var(--text)",
              verticalAlign: "middle",
              animation: "brut-blink 1s steps(1) infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

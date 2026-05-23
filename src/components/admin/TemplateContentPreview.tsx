import { formatClauseContent, parseTemplateContent } from "@/utils/contractPDF";

interface Props {
  content: string;
}

export function TemplateContentPreview({ content }: Props) {
  if (!content.trim()) return null;

  const { header, clauses } = parseTemplateContent(content);

  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-200">
      {header.trim() && (
        <div
          dangerouslySetInnerHTML={{ __html: formatClauseContent(header) }}
        />
      )}
      {clauses.map((clause, i) => (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: formatClauseContent(clause) }}
        />
      ))}
    </div>
  );
}

import { useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TemplateContentPreview } from "./TemplateContentPreview";
import { TemplateSyntaxGuide } from "./TemplateSyntaxGuide";

interface Variable {
  key: string;
  label: string;
}

interface Props {
  content: string;
  onChange: (value: string) => void;
  variables: Variable[];
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  variable: string,
  currentValue: string,
): { newValue: string; newCursorPos: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = `{{${variable}}}`;
  const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
  return { newValue, newCursorPos: start + text.length };
}

export function TemplateEditor({ content, onChange, variables }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { newValue, newCursorPos } = insertAtCursor(textarea, variable, content);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  const editorContent = (
    <div className="space-y-2">
      <TemplateSyntaxGuide />
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-white/5 rounded-md border border-white/10">
          <span className="text-xs text-gray-500 w-full mb-1">
            Clique para inserir variável na posição do cursor:
          </span>
          {variables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors font-mono"
            >
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o conteúdo do template. Use as variáveis acima para inserir dados da proposta."
        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono text-sm min-h-[280px] resize-y"
        rows={14}
      />
    </div>
  );

  const previewContent = (
    <div
      data-testid="preview-pane"
      className="min-h-[280px] rounded-md border border-white/10 bg-white/5 p-4 overflow-y-auto"
    >
      {content.trim() ? (
        <TemplateContentPreview content={content} />
      ) : (
        <p className="text-gray-500 text-sm italic">
          O preview aparecerá aqui conforme você digita.
        </p>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile: abas */}
      <div className="md:hidden">
        <Tabs defaultValue="editor">
          <TabsList className="mb-3 bg-white/5 border border-white/10">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor">
            {editorContent}
          </TabsContent>
          <TabsContent value="preview">
            {previewContent}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        <div data-testid="editor-pane" className="space-y-2">
          {editorContent}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Preview</p>
          {previewContent}
        </div>
      </div>
    </div>
  );
}

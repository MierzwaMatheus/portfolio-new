import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Code,
  Code2,
  Eye
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showCodeView, setShowCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState(content);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      if (!showCodeView) {
        setCodeContent(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[150px] p-4 focus:outline-none text-gray-300 tiptap',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml) {
        editor.commands.setContent(content);
        setCodeContent(content);
      }
    }
  }, [content, editor]);

  const toggleCodeView = () => {
    if (showCodeView) {
      // Sair do modo código - atualizar o editor com o conteúdo do textarea
      if (editor) {
        editor.commands.setContent(codeContent);
        onChange(codeContent);
      }
    } else {
      // Entrar no modo código - atualizar o textarea com o HTML atual
      if (editor) {
        setCodeContent(editor.getHTML());
      }
    }
    setShowCodeView(!showCodeView);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-white/10 rounded-md overflow-hidden bg-white/5">
      <style>{`
        .tiptap ul {
          list-style-type: disc;
          list-style-position: outside;
          margin-left: 1.5rem;
          padding-left: 0;
        }
        .tiptap ul li {
          padding-left: 0.5rem;
          margin-left: 0;
          display: list-item;
        }
        .tiptap ol {
          list-style-type: decimal;
          list-style-position: outside;
          margin-left: 1.5rem;
          padding-left: 0;
        }
        .tiptap ol li {
          padding-left: 0.5rem;
          margin-left: 0;
          display: list-item;
        }
      `}</style>
      <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-white/5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
        >
          <Code className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCodeView}
          className={showCodeView ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400'}
          title={showCodeView ? 'Ver visualização' : 'Ver código HTML'}
        >
          {showCodeView ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="text-gray-400"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="text-gray-400"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      {showCodeView ? (
        <textarea
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          className="w-full min-h-[150px] p-4 bg-black/20 text-gray-300 font-mono text-sm border-0 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 resize-y"
          style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
          placeholder="Edite o HTML aqui..."
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

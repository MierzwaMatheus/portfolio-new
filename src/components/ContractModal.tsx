import { useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { generateContractContent, ProposalData, AcceptanceData } from "@/utils/contractGenerator";

interface ClientData {
  client_name: string;
  client_document: string;
  client_email: string;
  client_role?: string | null;
  client_declaration?: string | null;
}

interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: ProposalData;
  clientData: ClientData;
  sessionToken: string | null;
  onSign: () => Promise<void>;
  isSigning?: boolean;
}

export function ContractModal({
  open,
  onOpenChange,
  proposal,
  clientData,
  sessionToken,
  onSign,
  isSigning = false
}: ContractModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const normalizeMarkdown = (input: string): string => {
    const normalizedNewlines = input.replace(/\r\n/g, "\n");
    const rawLines = normalizedNewlines.split("\n");

    while (rawLines.length > 0 && rawLines[0].trim() === "") rawLines.shift();
    while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === "") rawLines.pop();

    const nonEmptyIndents = rawLines
      .filter((l) => l.trim() !== "")
      .map((l) => (l.match(/^[ \t]*/)?.[0].length ?? 0));
    const minIndent = nonEmptyIndents.length > 0 ? Math.min(...nonEmptyIndents) : 0;

    const dedented = rawLines.map((l) => l.slice(Math.min(minIndent, l.length)));

    const normalizedBullets = dedented
      .flatMap((line) => {
        const trimmed = line.trim();

        // Caso comum: cada item começa com "• " em uma linha.
        const convertedLine = line.replace(/^(\s*)•\s+/g, "$1- ");
        if (convertedLine !== line) return [convertedLine];

        // Caso problemático: itens com "•" colados na mesma linha (ex: "Nessa hipótese: • A • B")
        if (!trimmed.includes("•")) return [line];

        const parts = line.split(/\s*•\s+/g);
        if (parts.length <= 1) return [line];

        const first = parts[0]?.trimEnd() ?? "";
        const items = parts.slice(1).map((p) => p.trim()).filter(Boolean);

        // Se não conseguimos extrair itens, mantém como veio
        if (items.length === 0) return [line];

        const out: string[] = [];
        if (first.trim() !== "") out.push(first);
        out.push("", ...items.map((i) => `- ${i}`));
        return out;
      })
      // Normaliza whitespace à direita pra não atrapalhar parser
      .map((l) => l.replace(/[ \t]+$/g, ""));

    const isListLine = (l: string) => /^(\s*)([-*]|\d+\.)\s+/.test(l);

    const withListSpacing: string[] = [];
    for (let i = 0; i < normalizedBullets.length; i++) {
      const line = normalizedBullets[i];
      const prev = withListSpacing.length > 0 ? withListSpacing[withListSpacing.length - 1] : "";

      if (isListLine(line) && prev.trim() !== "" && !isListLine(prev)) {
        withListSpacing.push("");
      }

      withListSpacing.push(line);
    }

    return withListSpacing.join("\n");
  };

  const markdownComponents = {
    p: ({ children, ...props }: ComponentPropsWithoutRef<"p"> & { children?: ReactNode }) => (
      <p className="my-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul"> & { children?: ReactNode }) => (
      <ul className="my-5 list-disc pl-6 space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol"> & { children?: ReactNode }) => (
      <ol className="my-5 list-decimal pl-6 space-y-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: ComponentPropsWithoutRef<"li"> & { children?: ReactNode }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),
  };

  // Verificar se clientData e proposal existem antes de usar
  if (!clientData || !proposal || !clientData.client_name) {
    return null;
  }

  // Criar dados temporários para visualização do contrato
  // O aceite real acontecerá quando assinar digitalmente
  const tempAcceptanceData: AcceptanceData = {
    client_name: clientData.client_name,
    client_document: clientData.client_document,
    client_email: clientData.client_email,
    client_role: clientData.client_role || undefined,
    client_declaration: clientData.client_declaration || undefined,
    accepted_at: new Date().toISOString() // Data temporária para visualização
  };

  const contractContent = generateContractContent(proposal, tempAcceptanceData);

  const handleSign = async () => {
    await onSign();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-neon-purple" />
            Contrato Eletrônico
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo do contrato com scroll */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ maxHeight: 'calc(90vh - 300px)' }}
        >
          <div className="mb-6">
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-yellow-400">
                      Leia o contrato com atenção antes de assinar
                    </p>
                    <p className="text-yellow-300/80">
                      O botão para finalizar e assinar digitalmente este contrato encontra-se no final do documento. 
                      Recomendamos a leitura completa e atenção especial a todas as cláusulas. 
                      Em caso de dúvidas, entre em contato antes de prosseguir com a assinatura.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div ref={contentRef} className="prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 prose-hr:border-white/10 max-w-none prose-p:leading-relaxed prose-p:mb-6 prose-h2:mt-10 prose-h2:mb-5 prose-h3:mt-8 prose-h3:mb-4 prose-ul:my-6 prose-ol:my-6 prose-ul:pl-6 prose-ol:pl-6 prose-li:mb-3 prose-blockquote:border-l-4 prose-blockquote:border-neon-purple prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400">
            <ReactMarkdown components={markdownComponents}>{normalizeMarkdown(contractContent.header)}</ReactMarkdown>
            {contractContent.clauses.map((clause, index) => (
              <ReactMarkdown key={index} components={markdownComponents}>
                {normalizeMarkdown(clause)}
              </ReactMarkdown>
            ))}
          </div>

          {/* Área de assinatura digital */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <Card className="bg-card/50 backdrop-blur-sm border-neon-purple/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-neon-purple" />
                  <h3 className="text-xl font-bold">Assinatura Digital</h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    Ao clicar em "Assinar Digitalmente", você confirma que:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Leu e compreendeu todos os termos deste contrato</li>
                    <li>Concorda com todas as cláusulas apresentadas</li>
                    <li>Está autorizado a celebrar este contrato em nome da parte contratante</li>
                    <li>Aceita que esta assinatura tem validade jurídica equivalente à assinatura física</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSign}
                    disabled={isSigning}
                    className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white h-12 text-lg"
                    size="lg"
                  >
                    {isSigning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processando assinatura...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Assinar Digitalmente
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


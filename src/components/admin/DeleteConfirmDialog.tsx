import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  onPermanentDelete?: () => Promise<void> | void;
  itemName?: string;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  onPermanentDelete,
  itemName,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState<"soft" | "hard" | null>(null);

  async function handleSoft() {
    setLoading("soft");
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(null);
    }
  }

  async function handleHard() {
    if (!onPermanentDelete) return;
    setLoading("hard");
    try {
      await onPermanentDelete();
      onClose();
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir item</DialogTitle>
          <DialogDescription>
            {itemName ? (
              <>Tem certeza que deseja excluir <strong>"{itemName}"</strong>?</>
            ) : (
              "Tem certeza que deseja excluir este item?"
            )}
            {onPermanentDelete ? (
              <span className="block mt-2 text-xs text-muted-foreground">
                "Excluir" desativa o item (pode ser restaurado). "Excluir permanentemente" remove do banco de dados sem possibilidade de recuperação.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSoft} disabled={busy}>
            {loading === "soft" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Excluir
          </Button>
          {onPermanentDelete && (
            <Button
              variant="destructive"
              onClick={handleHard}
              disabled={busy}
              className="bg-red-700 hover:bg-red-800 border-red-900"
            >
              {loading === "hard" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Excluir permanentemente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

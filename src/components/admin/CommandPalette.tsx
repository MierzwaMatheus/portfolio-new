import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type CommandPaletteItem = {
  label: string;
  description: string;
  path: string;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
  onNavigate: (path: string) => void;
};

export function CommandPalette({ open, onOpenChange, items, onNavigate }: CommandPaletteProps) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Navegar para"
      description="Digite para filtrar páginas do admin"
      showCloseButton={false}
    >
      <CommandInput placeholder="Buscar página..." />
      <CommandList>
        <CommandEmpty>Nenhuma página encontrada.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {items.map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.description}`}
              onSelect={() => {
                onNavigate(item.path);
                onOpenChange(false);
              }}
            >
              <span>{item.label}</span>
              <span className="text-muted-foreground ml-2 text-xs">{item.description}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

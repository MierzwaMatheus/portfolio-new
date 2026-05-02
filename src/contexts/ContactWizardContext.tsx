import { createContext, useContext, useState, ReactNode } from "react";

export type FlowType = "project" | "job" | "networking" | "feedback";

export type WizardTrigger = {
  flowType?: FlowType;
  sourceContext?: string;
};

interface ContactWizardContextValue {
  isOpen: boolean;
  trigger: WizardTrigger;
  openWizard: (trigger?: WizardTrigger) => void;
  closeWizard: () => void;
}

const ContactWizardContext = createContext<ContactWizardContextValue | null>(null);

export function ContactWizardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState<WizardTrigger>({});

  const openWizard = (t?: WizardTrigger) => {
    setTrigger(t ?? {});
    setIsOpen(true);
  };

  const closeWizard = () => {
    setIsOpen(false);
  };

  return (
    <ContactWizardContext.Provider value={{ isOpen, trigger, openWizard, closeWizard }}>
      {children}
    </ContactWizardContext.Provider>
  );
}

export function useContactWizard() {
  const ctx = useContext(ContactWizardContext);
  if (!ctx) throw new Error("useContactWizard must be inside ContactWizardProvider");
  return ctx;
}

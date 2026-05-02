import { createContext, useContext, useReducer, ReactNode } from 'react';

export type MediaType = 'text' | 'video' | null;

export interface PersonalInfo {
  name: string;
  role: string;
  company: string;
  email: string;
}

interface State {
  step: number;
  mediaType: MediaType;
  text: string;
  videoStorageId: string | null;
  videoFileSize: number | null;
  videoFileName: string | null;
  personalInfo: PersonalInfo;
  avatarFile: Blob | null;
  avatarPreviewUrl: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_MEDIA_TYPE'; payload: MediaType }
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'SET_VIDEO'; payload: { storageId: string; fileSize: number; fileName: string } }
  | { type: 'SET_PERSONAL_INFO'; payload: PersonalInfo }
  | { type: 'SET_AVATAR'; payload: { file: Blob; previewUrl: string } }
  | { type: 'CLEAR_AVATAR' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESET' };

const initialPersonalInfo: PersonalInfo = {
  name: '',
  role: '',
  company: '',
  email: '',
};

const initialState: State = {
  step: 0,
  mediaType: null,
  text: '',
  videoStorageId: null,
  videoFileSize: null,
  videoFileName: null,
  personalInfo: initialPersonalInfo,
  avatarFile: null,
  avatarPreviewUrl: '',
  isSubmitting: false,
  isSuccess: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MEDIA_TYPE':
      return { ...state, mediaType: action.payload };
    case 'SET_TEXT':
      return { ...state, text: action.payload };
    case 'SET_VIDEO':
      return {
        ...state,
        videoStorageId: action.payload.storageId,
        videoFileSize: action.payload.fileSize,
        videoFileName: action.payload.fileName,
      };
    case 'SET_PERSONAL_INFO':
      return { ...state, personalInfo: action.payload };
    case 'SET_AVATAR':
      if (state.avatarPreviewUrl) URL.revokeObjectURL(state.avatarPreviewUrl);
      return { ...state, avatarFile: action.payload.file, avatarPreviewUrl: action.payload.previewUrl };
    case 'CLEAR_AVATAR':
      if (state.avatarPreviewUrl) URL.revokeObjectURL(state.avatarPreviewUrl);
      return { ...state, avatarFile: null, avatarPreviewUrl: '' };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1, error: null };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1), error: null };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, isSuccess: true };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const TestimonialWizardContext = createContext<ContextValue | null>(null);

export function TestimonialWizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <TestimonialWizardContext.Provider value={{ state, dispatch }}>
      {children}
    </TestimonialWizardContext.Provider>
  );
}

export function useTestimonialWizard() {
  const ctx = useContext(TestimonialWizardContext);
  if (!ctx) throw new Error('useTestimonialWizard must be used inside TestimonialWizardProvider');
  return ctx;
}

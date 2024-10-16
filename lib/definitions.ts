export type CanvasProps = {
  backgroundColor: string;
  canvasRef: React.RefObject<CanvasRef>;
  questionsSheetImageSource?: CanvasImageSource | null;
};

export type CanvasRef = {
  handleExport: () => string;
  getDimensions: () => { width: number; height: number };
};

// export type CanvasWrapperProps = {
//   backgroundColor: string;
//   ref: any;
// }

export type LineData = {
  tool: string;
  points: number[];
  color: string;
  size: number;
};

export type LoginData = {
  email: string;
  password: string;
};

export type LanguageDetails = {
  id: string;
  name: string;
  azureSpeechVoiceName: string;
};

export const languages: LanguageDetails[] = [
  {
    id: "en-US",
    name: "English",
    azureSpeechVoiceName: "en-US-JennyNeural",
  },
  {
    id: "id-ID",
    name: "Indonesian",
    azureSpeechVoiceName: "id-ID-ArdiNeural",
  },
];

export type LanguageCode = (typeof languages)[number]["id"];

export type Workflow = {
  id: number;
  name: string;
  image_url: string;
  notify: boolean;
  options: QuestionInput;
  next_workflow_id?: number;
  use_ai: boolean;
};

export type Profile = {
  workflow_id?: number;
  notify?: boolean;
};

export type RealtimePostgresUpdatePayload<T> = {
  old?: T;
  new?: T;
};

export type Option = {
  id: string
  text: string
}

export type EssayInput = {
  id: string
  label: string
  type: "short" | "long"
}

export type QuestionInput = {
  type: "multiple-choice" | "essay"
  options?: Option[]
  correctAnswer?: string
  essayInputs?: EssayInput[]
}
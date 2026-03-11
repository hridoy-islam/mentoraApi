export interface TQuestionBank {

  question: string;
  type: "mcq" | "short";
  options?: string[];
  optionType?: string[];
  correctAnswers?: string[];
  shortAnswer?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

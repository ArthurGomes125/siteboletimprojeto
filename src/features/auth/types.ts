export type Account = {
  role: "secretaria" | "professor" | "aluno" | "admin" | "student";
  studentId?: string;
  name: string;
};

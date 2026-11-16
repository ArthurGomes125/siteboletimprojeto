export type Student = { id: string; name: string; email: string; className: string };
export type Teacher = { id: string; name: string };
export type Subject = { id: string; name: string; teacher: string };
export type Trimester = 1 | 2 | 3;
export type Grade = { studentId: string; subjectId: string; trimester: Trimester; score: number | null };
export type Store = { subjects: Subject[]; grades: Grade[] };

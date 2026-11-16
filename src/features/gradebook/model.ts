import type { Grade, Store, Student, Subject, Teacher, Trimester } from "./types";

export const STORAGE = "escola-online-v1";
export const STUDENTS_STORAGE = "escola-online-students-v1";
export const TEACHERS_STORAGE = "escola-online-teachers-v1";

export const defaultStudents: Student[] = [
  { id: "26DS-1047", name: "Ana Clara Martins", email: "ana.martins@gmail.com", className: "2º DS · B" },
  { id: "26DS-2183", name: "Bruno Henrique Costa", email: "bruno.costa@gmail.com", className: "2º DS · B" },
  { id: "26DS-3096", name: "Camila Oliveira Santos", email: "camila.santos@gmail.com", className: "2º DS · B" },
  { id: "26DS-4271", name: "Daniel Ferreira Lima", email: "daniel.lima@gmail.com", className: "2º DS · B" },
  { id: "26DS-5384", name: "Eduarda Alves Rocha", email: "eduarda.rocha@gmail.com", className: "2º DS · B" },
  { id: "26DS-6429", name: "Felipe Gabriel Souza", email: "felipe.souza@gmail.com", className: "2º DS · B" },
  { id: "26DS-7562", name: "Giovanna Ribeiro Melo", email: "giovanna.melo@gmail.com", className: "2º DS · B" },
  { id: "26DS-8635", name: "Heitor Mendes Carvalho", email: "heitor.carvalho@gmail.com", className: "2º DS · B" },
  { id: "26DS-9748", name: "Isadora Gomes Pereira", email: "isadora.pereira@gmail.com", className: "2º DS · B" },
  { id: "26DS-0851", name: "Lucas Rodrigues Barros", email: "lucas.barros@gmail.com", className: "2º DS · B" },
];

export const starterSubjects: Subject[] = [
  { id: "s1", name: "Programação Web", teacher: "Carlos Alberto" },
  { id: "s2", name: "Banco de Dados", teacher: "Radja" },
  { id: "s3", name: "Engenharia de Software", teacher: "Romildo" },
];

export const defaultTeachers: Teacher[] = [
  { id: "teacher-1", name: "Carlos Alberto" },
  { id: "teacher-2", name: "Radja" },
  { id: "teacher-3", name: "Romildo" },
];

export const emptyStore: Store = {
  subjects: starterSubjects,
  grades: defaultStudents.flatMap((student) =>
    starterSubjects.flatMap((subject) =>
      ([1, 2, 3] as Trimester[]).map((trimester) => ({
        studentId: student.id,
        subjectId: subject.id,
        trimester,
        score: null,
      })),
    ),
  ),
};

export function status(score: number | null) {
  if (score === null) return { label: "Pendente", tone: "pending" };
  if (score < 6) return { label: "Reprovado", tone: "fail" };
  return { label: "Aprovado", tone: "pass" };
}

export function finalAverage(studentId: string, store: Store): number | null {
  const scores = store.subjects.flatMap((subject) =>
    ([1, 2, 3] as Trimester[]).map(
      (trimester) =>
        store.grades.find(
          (grade) =>
            grade.studentId === studentId &&
            grade.subjectId === subject.id &&
            grade.trimester === trimester,
        )?.score ?? null,
    ),
  );
  if (scores.length === 0 || scores.some((score) => score === null)) return null;
  return scores.reduce<number>((sum, score) => sum + (score ?? 0), 0) / scores.length;
}

export function subjectAverage(studentId: string, subjectId: string, store: Store): number | null {
  const scores = ([1, 2, 3] as Trimester[]).map(
    (trimester) =>
      store.grades.find(
        (grade) =>
          grade.studentId === studentId &&
          grade.subjectId === subjectId &&
          grade.trimester === trimester,
      )?.score ?? null,
  );
  if (scores.some((score) => score === null)) return null;
  return scores.reduce<number>((sum, score) => sum + (score ?? 0), 0) / scores.length;
}

export function safeStore(raw: string | null): Store {
  if (!raw) return emptyStore;
  try {
    const value = JSON.parse(raw) as Store;
    if (!Array.isArray(value.subjects) || !Array.isArray(value.grades)) return emptyStore;
    return {
      subjects: value.subjects.filter(
        (subject) =>
          subject &&
          typeof subject.id === "string" &&
          typeof subject.name === "string" &&
          typeof subject.teacher === "string",
      ),
      grades: value.grades
        .filter(
          (grade) =>
            grade &&
            typeof grade.studentId === "string" &&
            typeof grade.subjectId === "string" &&
            (grade.score === null ||
              (typeof grade.score === "number" && grade.score >= 0 && grade.score <= 10)),
        )
        .map((grade: Grade) => {
          const oldId = /^2026(\d{3})$/.exec(grade.studentId);
          const migratedStudentId = oldId
            ? defaultStudents[Number(oldId[1]) - 1]?.id ?? grade.studentId
            : grade.studentId;
          return {
            ...grade,
            studentId: migratedStudentId,
            trimester: grade.trimester === 2 ? 2 : grade.trimester === 3 ? 3 : 1,
          };
        }),
    };
  } catch {
    return emptyStore;
  }
}

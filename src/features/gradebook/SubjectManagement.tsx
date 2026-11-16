"use client";

import { useState, type FormEvent } from "react";
import type { Store, Student, Subject, Teacher, Trimester } from "./types";

type Props = {
  store: Store;
  students: Student[];
  teachers: Teacher[];
  onStoreChange: (store: Store) => void;
  onTeachersChange: (teachers: Teacher[]) => void;
  onClose: () => void;
};

export default function SubjectManagement({
  store,
  students,
  teachers,
  onStoreChange,
  onTeachersChange,
  onClose,
}: Props) {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectTeacher, setSubjectTeacher] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [notice, setNotice] = useState("");

  function saveSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = subjectName.trim();
    const teacher = subjectTeacher.trim();
    if (!name || !teacher) return;

    if (editingSubject) {
      onStoreChange({
        ...store,
        subjects: store.subjects.map((subject) =>
          subject.id === editingSubject.id ? { ...subject, name, teacher } : subject,
        ),
      });
    } else {
      const subject = { id: `s${Date.now()}`, name, teacher };
      onStoreChange({
        subjects: [...store.subjects, subject],
        grades: [
          ...store.grades,
          ...students.flatMap((student) =>
            ([1, 2, 3] as Trimester[]).map((trimester) => ({
              studentId: student.id,
              subjectId: subject.id,
              trimester,
              score: null,
            })),
          ),
        ],
      });
    }

    setSubjectName("");
    setSubjectTeacher("");
    setEditingSubject(null);
    setNotice("Disciplina salva com sucesso.");
  }

  function addTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTeacherName.trim();
    if (!name) return;
    if (teachers.some((teacher) => teacher.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setNotice("Já existe um professor com esse nome.");
      return;
    }

    onTeachersChange([...teachers, { id: `teacher-${Date.now()}`, name }]);
    setNewTeacherName("");
    setNotice(`Professor ${name} cadastrado.`);
  }

  function deleteSubject(id: string) {
    if (!window.confirm("Excluir esta disciplina e as médias associadas?")) return;
    onStoreChange({
      subjects: store.subjects.filter((subject) => subject.id !== id),
      grades: store.grades.filter((grade) => grade.subjectId !== id),
    });
  }

  return <section className="subjects-layout">
    <section className="panel subject-form-panel">
      <div className="panel-heading">
        <div><h2>{editingSubject ? "Editar disciplina" : "Nova disciplina"}</h2><p>Organize os componentes curriculares.</p></div>
        <button className="subject-management-close" type="button" onClick={onClose}>Fechar ×</button>
      </div>
      <form onSubmit={saveSubject} className="subject-form">
        <label>Nome da disciplina
          <input id="subject-name" placeholder="Ex.: Programação Web" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} required />
        </label>
        <label>Professor(a) responsável
          <select value={subjectTeacher} onChange={(event) => setSubjectTeacher(event.target.value)} required>
            <option value="" disabled>Selecione um professor</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.name}>{teacher.name}</option>)}
          </select>
        </label>
        <button className="primary-btn" type="submit">{editingSubject ? "Salvar alterações" : "＋ Adicionar disciplina"}</button>
        {editingSubject && <button className="cancel-link" type="button" onClick={() => { setEditingSubject(null); setSubjectName(""); setSubjectTeacher(""); }}>Cancelar edição</button>}
        {notice && <p className="success-message" role="status">{notice}</p>}
      </form>
    </section>

    <section className="panel subject-list-panel">
      <div className="panel-heading"><div><h2>Disciplinas cadastradas</h2><p>{store.subjects.length} componentes curriculares</p></div></div>
      <div className="subject-cards">
        {store.subjects.map((subject, index) => <article className="subject-card" key={subject.id}>
          <div className={`subject-icon si-${index % 4}`}>{["⌘", "▦", "◈", "⌁"][index % 4]}</div>
          <div className="subject-info">
            <b>{subject.name}</b><small>{subject.teacher}</small><small className="grade-count">{students.length} alunos · médias registradas</small>
          </div>
          <div className="subject-actions">
            <button className="icon-button" title="Editar disciplina" onClick={() => { setEditingSubject(subject); setSubjectName(subject.name); setSubjectTeacher(subject.teacher); }}>✎</button>
            <button className="icon-button delete-button" title="Excluir disciplina" onClick={() => deleteSubject(subject.id)}>⌫</button>
          </div>
        </article>)}
        {store.subjects.length === 0 && <div className="empty-state">Nenhuma disciplina. Adicione a primeira ao lado.</div>}
      </div>
    </section>

    <section className="panel teacher-panel">
      <div className="panel-heading"><div><h2>Professores cadastrados</h2><p>Cadastre professores para vinculá-los às disciplinas.</p></div><span className="count-pill">{teachers.length} professores</span></div>
      <div className="teacher-list">{teachers.map((teacher) => <span className="teacher-chip" key={teacher.id}>{teacher.name}</span>)}</div>
      <form className="teacher-create-form" onSubmit={addTeacher}>
        <label htmlFor="new-teacher-name">Nome do professor</label>
        <input id="new-teacher-name" value={newTeacherName} onChange={(event) => setNewTeacherName(event.target.value)} placeholder="Ex.: Maria Silva" required />
        <button className="primary-btn" type="submit">＋ Adicionar professor</button>
      </form>
    </section>
  </section>;
}

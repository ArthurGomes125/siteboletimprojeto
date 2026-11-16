"use client";

import { useState } from "react";
import { finalAverage, status, subjectAverage } from "./model";
import type { Store, Student, Trimester } from "./types";

type Props = {
  student: Student;
  store: Store;
  trimester: Trimester;
  onTrimesterChange: (trimester: Trimester) => void;
};

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(1).replace(".", ",");
}

export default function StudentGradebook({ student, store, trimester, onTrimesterChange }: Props) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const average = finalAverage(student.id, store);
  const overall = status(average);

  return <>
    <section className="student-hero">
      <div className="hero-main">
        <span className="eyebrow light-eyebrow">SEU DESEMPENHO</span>
        <h2>Seu esforço está<br />construindo o futuro.</h2>
        <p>Confira suas médias e acompanhe sua evolução<br />em cada disciplina.</p>
      </div>
      <div className="hero-grade">
        <span>MÉDIA GERAL</span>
        <b>{formatScore(average)}</b>
        <small>{store.subjects.filter((subject) => subjectAverage(student.id, subject.id, store) !== null).length} de {store.subjects.length} disciplinas com média</small>
        <span className={`status-badge ${overall.tone}`}><i /> {overall.label}</span>
      </div>
      <div className="hero-decoration">✳</div>
    </section>

    <section className="panel grades-panel">
      <div className="panel-heading">
        <div>
          <h2>Boletim escolar</h2>
          <div className="grade-header-controls">
            <p>{trimester}º Trimestre <span>·</span> {student.className} <span>·</span> 2026</p>
            <select
              className="select-control"
              aria-label="Selecionar trimestre"
              value={trimester}
              onChange={(event) => onTrimesterChange(Number(event.target.value) as Trimester)}
            >
              <option value="1">1º trimestre</option>
              <option value="2">2º trimestre</option>
              <option value="3">3º trimestre</option>
            </select>
          </div>
        </div>
        <span className="term-pill"><span /> EM ANDAMENTO</span>
      </div>

      <div className="grade-list">
        {store.subjects.map((subject, index) => {
          const currentGrade = store.grades.find(
            (grade) =>
              grade.studentId === student.id &&
              grade.subjectId === subject.id &&
              grade.trimester === trimester,
          )?.score ?? null;
          const averageForSubject = subjectAverage(student.id, subject.id, store);
          const result = status(averageForSubject);
          const expanded = expandedSubject === subject.id;

          return <article className={`grade-row student-grade-row${expanded ? " expanded" : ""}`} key={subject.id}>
            <button
              className="student-grade-toggle"
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpandedSubject(expanded ? null : subject.id)}
            >
              <span className={`subject-icon si-${index % 4}`}>{["⌘", "▦", "◈", "⌁"][index % 4]}</span>
              <span className="subject-info"><b>{subject.name}</b><small>{subject.teacher}</small></span>
              <span className="grade-number">
                <b>{formatScore(currentGrade)}</b>
                <small>{trimester}º tri.</small>
              </span>
              <span className={`status-badge ${result.tone}`}><i /> {result.label}</span>
              <span className="grade-arrow" aria-hidden="true">{expanded ? "⌄" : "›"}</span>
            </button>
            {expanded && <div className="student-grade-details">
              <div className="student-term-grades">
                {([1, 2, 3] as Trimester[]).map((period) => {
                  const score = store.grades.find(
                    (grade) =>
                      grade.studentId === student.id &&
                      grade.subjectId === subject.id &&
                      grade.trimester === period,
                  )?.score ?? null;
                  return <div key={period}><small>{period}º trimestre</small><b>{formatScore(score)}</b></div>;
                })}
              </div>
              <div className="student-subject-average">
                <span>Média da disciplina</span>
                <b>{formatScore(averageForSubject)}</b>
                <span className={`status-badge ${result.tone}`}><i /> {result.label}</span>
              </div>
            </div>}
          </article>;
        })}
        {store.subjects.length === 0 && <div className="empty-state">Nenhuma disciplina cadastrada ainda.</div>}
      </div>
      <div className="grades-note"><span>ⓘ</span> A média mínima para aprovação é <b>6,0</b>. Médias abaixo de 6,0 resultam em reprovação.</div>
    </section>
    <div className="student-footer-note"><span>✳</span> Cada passo conta. Continue assim!</div>
  </>;
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Account } from "../features/auth/types";
import StudentGradebook from "../features/gradebook/StudentGradebook";
import SubjectManagement from "../features/gradebook/SubjectManagement";
import {
  defaultTeachers,
  defaultStudents,
  emptyStore,
  finalAverage,
  safeStore,
  status,
  STORAGE,
  STUDENTS_STORAGE,
  subjectAverage,
  TEACHERS_STORAGE,
} from "../features/gradebook/model";
import type { Store, Student, Teacher, Trimester } from "../features/gradebook/types";

export default function Home() {
  const [students, setStudents] = useState<Student[]>(defaultStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(defaultTeachers);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [studentNotice, setStudentNotice] = useState("");
  const [studentNoticeError, setStudentNoticeError] = useState(false);
  const [store, setStore] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"secretaria" | "professor" | "aluno">("aluno");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"overview" | "students" | "subjects" | "roster">("overview");
  const [trimester, setTrimester] = useState<Trimester>(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, string>>({});
  const [gradeError, setGradeError] = useState("");

  useEffect(() => {
    setStore(safeStore(localStorage.getItem(STORAGE)));
    try {
      const savedStudents = JSON.parse(localStorage.getItem(STUDENTS_STORAGE) || "null");
      if (Array.isArray(savedStudents) && savedStudents.every((s) => s && typeof s.id === "string" && typeof s.name === "string" && typeof s.email === "string" && typeof s.className === "string")) setStudents(savedStudents.map((student) => ({ ...student, className: student.className === "2º DS · A" ? "2º DS · B" : student.className })));
    } catch { localStorage.removeItem(STUDENTS_STORAGE); }
    try {
      const savedTeachers = JSON.parse(localStorage.getItem(TEACHERS_STORAGE) || "null");
      if (Array.isArray(savedTeachers) && savedTeachers.every((teacher) => teacher && typeof teacher.id === "string" && typeof teacher.name === "string")) setTeachers(savedTeachers);
    } catch { localStorage.removeItem(TEACHERS_STORAGE); }
    setDarkMode(localStorage.getItem("escola-online-theme") === "dark");
    const saved = localStorage.getItem("escola-online-session");
    if (saved) {
      try {
        const savedAccount = JSON.parse(saved) as Account;
        const migrated: Account = savedAccount.role === "admin" ? { ...savedAccount, role: "secretaria" } : savedAccount.role === "student" ? { ...savedAccount, role: "aluno" } : savedAccount;
        if (migrated.role === "aluno" && migrated.studentId?.startsWith("2026")) { const oldIndex = Number(migrated.studentId.slice(-3)) - 1; if (Number.isInteger(oldIndex) && oldIndex >= 0 && oldIndex < students.length) migrated.studentId = students[oldIndex].id; }
        setAccount(migrated);
      } catch { localStorage.removeItem("escola-online-session"); }
    }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { localStorage.setItem(STORAGE, JSON.stringify(store)); localStorage.setItem(STUDENTS_STORAGE, JSON.stringify(students)); localStorage.setItem(TEACHERS_STORAGE, JSON.stringify(teachers)); } }, [ready, store, students, teachers]);
  useEffect(() => { if (!ready) return; document.documentElement.dataset.theme = darkMode ? "dark" : "light"; localStorage.setItem("escola-online-theme", darkMode ? "dark" : "light"); }, [darkMode, ready]);

  const isAdmin = account?.role === "secretaria" || account?.role === "admin";
  const canManageGrades = isAdmin || account?.role === "professor";
  const canEditGrades = account?.role === "professor";
  const currentStudent = students.find((s) => s.id === account?.studentId) ?? students[0] ?? defaultStudents[0];
  const shownStudents = useMemo(() => students.filter((s) => `${s.name} ${s.id} ${s.email}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const averageFor = (studentId: string) => finalAverage(studentId, store);
  const activeSubject = store.subjects.find((subject) => subject.id === selectedSubject) ?? null;

  function persist(next: Store) { setStore(next); }
  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const normalized = email.trim().toLowerCase();
    let next: Account | null = null;
    if (selectedRole === "secretaria" && normalized === "secretaria@secretaria.escola.com" && password === "secretaria123") next = { role: "secretaria", name: "Secretaria" };
    if (selectedRole === "professor" && normalized === "professor@professor.escola.com" && password === "professor123") next = { role: "professor", name: "Professor" };
    const student = students.find((s) => s.email === normalized);
    if (!next && selectedRole === "aluno" && normalized === "aluno@aluno.escola.com" && password === "aluno123") next = { role: "aluno", studentId: students[0]?.id, name: "Aluno" };
    if (!next && selectedRole === "aluno" && student && password === "aluno123") next = { role: "aluno", studentId: student.id, name: student.name };
    if (!next) { setLoginError("E-mail ou senha incorretos. Confira seus dados e tente novamente."); return; }
    setAccount(next);
    setTab("overview");
    setSelectedSubject(null);
    setMenuOpen(false);
    localStorage.setItem("escola-online-session", JSON.stringify(next));
    setLoginError("");
  }
  function logout() {
    setAccount(null);
    setTab("overview");
    setSelectedSubject(null);
    setMenuOpen(false);
    localStorage.removeItem("escola-online-session");
    setEmail("");
    setPassword("");
  }
  function gradeKey(studentId: string, subjectId: string, period: Trimester = trimester) { return `${studentId}:${subjectId}:${period}`; }
  function updateGrade(studentId: string, subjectId: string, value: string, period: Trimester = trimester) {
    if (!canEditGrades) return;
    const key = gradeKey(studentId, subjectId, period);
    setGradeDrafts((current) => ({ ...current, [key]: value }));
    setGradeError("");
  }
  function saveGrade(studentId: string, subjectId: string, period: Trimester = trimester) {
    if (!canEditGrades) return;
    const key = gradeKey(studentId, subjectId, period);
    const raw = gradeDrafts[key];
    if (raw === undefined) return;
    const normalized = raw.trim().replace(",", ".");
    const score = normalized === "" ? null : Number(normalized);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 10 || !/^\d{1,2}(\.\d)?$/.test(normalized))) {
      setGradeError("Digite uma nota entre 0 e 10. Você pode usar vírgula ou ponto nos decimais.");
      return;
    }
    setStore((current) => {
      const exists = current.grades.some(
        (grade) =>
          grade.studentId === studentId &&
          grade.subjectId === subjectId &&
          grade.trimester === period,
      );
      return {
        ...current,
        grades: exists
          ? current.grades.map((grade) =>
              grade.studentId === studentId &&
              grade.subjectId === subjectId &&
              grade.trimester === period
                ? { ...grade, score }
                : grade,
            )
          : [...current.grades, { studentId, subjectId, trimester: period, score }],
      };
    });
    setGradeDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
    setGradeError("");
  }
  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;
    const name = newStudentName.trim();
    const normalizedEmail = newStudentEmail.trim().toLowerCase();
    if (!name || !normalizedEmail) return;
    if (students.some((student) => student.email.toLowerCase() === normalizedEmail)) {
      setStudentNotice("Já existe um aluno cadastrado com esse e-mail.");
      setStudentNoticeError(true);
      return;
    }
    const usedIds = new Set(students.map((student) => student.id));
    let enrollmentNumber = 1;
    while (enrollmentNumber <= 9999 && usedIds.has(`26DS-${String(enrollmentNumber).padStart(4, "0")}`)) enrollmentNumber += 1;
    if (enrollmentNumber > 9999) {
      setStudentNotice("Não há matrículas disponíveis para cadastrar outro aluno.");
      setStudentNoticeError(true);
      return;
    }
    const nextStudent: Student = { id: `26DS-${String(enrollmentNumber).padStart(4, "0")}`, name, email: normalizedEmail, className: "2º DS · B" };
    setStudents((current) => [...current, nextStudent]);
    setStore((current) => ({ ...current, grades: [...current.grades, ...current.subjects.flatMap((subject) => ([1, 2, 3] as Trimester[]).map((trimester) => ({ studentId: nextStudent.id, subjectId: subject.id, trimester, score: null })))] }));
    setNewStudentName("");
    setNewStudentEmail("");
    setStudentNotice(`Aluno ${name} cadastrado. Matrícula: ${nextStudent.id}`);
    setStudentNoticeError(false);
  }

  if (!ready) return <main className="loading"><span className="brand-mark">E</span><p>Preparando seu espaço escolar…</p></main>;
  if (!account) return <main className="login-layout">
    <section className="login-art"><div className="art-top"><span className="brand-mark brand-light">E</span><span>ESCOLA ONLINE</span></div><div className="art-copy"><span className="eyebrow light-eyebrow">SEU PRÓXIMO CAPÍTULO</span><h1>Aprender abre<br/>novos caminhos.</h1><p>Acompanhe sua jornada, celebre cada conquista e descubra até onde você pode chegar.</p></div><div className="art-foot"><span>✳</span> Educação que transforma</div><div className="art-orb orb-one"/><div className="art-orb orb-two"/><div className="art-grid"/></section>
    <section className="login-panel"><div className="login-mobile-brand"><span className="brand-mark">E</span> ESCOLA ONLINE</div><form className="login-form" onSubmit={login}><span className="eyebrow">PORTAL DA COMUNIDADE ESCOLAR</span><h2>Bom ter você<br/>por aqui.</h2><p className="muted">Escolha seu perfil e entre com seus dados.</p><div className="role-switch" aria-label="Escolha o perfil">{(["secretaria", "professor", "aluno"] as const).map((role) => <button key={role} type="button" className={selectedRole === role ? "selected" : ""} onClick={() => { setSelectedRole(role); setLoginError(""); }}>{role === "secretaria" ? "Secretaria" : role === "professor" ? "Professor" : "Aluno"}</button>)}</div><label htmlFor="email">E-mail</label><div className="input-wrap"><span className="input-icon">✉</span><input id="email" type="email" autoComplete="username" placeholder={selectedRole === "aluno" ? "nome@gmail.com" : `${selectedRole}@${selectedRole}.escola.com`} value={email} onChange={(e) => setEmail(e.target.value)} required/></div><label htmlFor="password">Senha</label><div className="input-wrap"><span className="input-icon">⌑</span><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required/><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button></div>{loginError && <p className="login-error" role="alert">{loginError}</p>}<button className="primary-btn login-button" type="submit">Acessar o portal <span>→</span></button><div className="login-help"><span>◈</span><p>Precisa de ajuda para acessar?<br/><b>Procure a secretaria da escola.</b></p></div><div className="demo-hint">Secretaria: secretaria@secretaria.escola.com / secretaria123<br/>Professor: professor@professor.escola.com / professor123<br/>Aluno: aluno@aluno.escola.com / aluno123</div></form><footer className="login-copyright">© 2026 Escola Online <span>Feito para aprender.</span></footer></section>
  </main>;

  return <div className="app-shell">{menuOpen && <button className="drawer-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}/>} {menuOpen && <aside className="sidebar"><a className="brand" href="#inicio"><span className="brand-mark">E</span><span>escola<span className="brand-online">online</span><small>PORTAL ESCOLAR</small></span></a><div className="side-label">MENU PRINCIPAL</div><nav className="side-nav">
    <button className={`nav-item ${tab === "overview" ? "active" : ""}`} onClick={() => { setTab("overview"); setMenuOpen(false); }}><span className="nav-icon">▦</span> Visão geral</button>
    {canManageGrades && <><button className={`nav-item ${tab === "students" ? "active" : ""}`} onClick={() => { setTab("students"); setSelectedSubject(null); setMenuOpen(false); }}><span className="nav-icon">♧</span> Lançar notas</button>{isAdmin && <><button className={`nav-item ${tab === "roster" ? "active" : ""}`} onClick={() => { setTab("roster"); setMenuOpen(false); }}><span className="nav-icon">＋</span> Matrículas</button><button className={`nav-item ${tab === "subjects" ? "active" : ""}`} onClick={() => { setTab("subjects"); setMenuOpen(false); }}><span className="nav-icon">▤</span> Disciplinas</button></>}</> }
  </nav><div className="sidebar-bottom"><div className="support-card"><div className="support-icon">✳</div><b>Estamos aqui<br/>para ajudar.</b><p>Fale com a secretaria sempre que precisar.</p><a href="tel:+55819999999" aria-label="Ligar para a secretaria: 81 9999-999">Ligar: 81 9999-999 <span>↗</span></a></div><div className="side-user"><div className="avatar">{account.name.slice(0, 1)}</div><div className="side-user-info"><b>{account.name}</b><small>{isAdmin ? "Secretaria" : account.role === "professor" ? "Professor" : currentStudent.className}</small></div><button className="icon-button logout" title="Sair" onClick={logout}>↪</button></div></div></aside>}
    <div className="main-column"><header className="topbar"><div className="topbar-left"><button className="hamburger" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><span/><span/><span/></button><div className="breadcrumb">Portal <span>/</span> <b>{tab === "overview" ? "Visão geral" : tab === "students" ? "Alunos" : tab === "roster" ? "Matrículas" : "Disciplinas"}</b></div></div><div className="top-actions"><span className="school-year">ANO LETIVO <b>2026</b></span><button className="theme-toggle" title={darkMode ? "Ativar modo claro" : "Ativar modo escuro"} aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"} onClick={() => setDarkMode((value) => !value)}>{darkMode ? "☀" : "☾"}</button><button className="top-avatar" aria-label="Perfil">{account.name.slice(0, 1)}</button></div></header><main className="content">
      <div className="welcome-row"><div><div className="eyebrow">QUARTA-FEIRA, 04 DE NOVEMBRO DE 2026</div><h1>{canManageGrades ? "Visão geral" : account.role === "professor" ? "Olá, professor!" : `Olá, ${currentStudent.name.split(" ")[0]}!`} <span className="wave">✳</span></h1><p className="muted">{isAdmin ? "Acompanhe o panorama acadêmico da sua escola." : account.role === "professor" ? "Consulte a turma e atualize as médias das disciplinas." : "Aqui está um resumo do seu desempenho neste período."}</p></div>{isAdmin && <button className="primary-btn" onClick={() => { setSelectedSubject(null); setMenuOpen(false); setTab("subjects"); }}>＋ Nova disciplina</button>}</div>
      {tab === "overview" && <>
        {canManageGrades ? <>
          <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span className="stat-icon purple">♧</span><span className="stat-caption">CADASTRADOS</span></div><div className="stat-value">{students.length}<span> alunos</span></div><div className="stat-bottom"><span className="stat-dot green-dot"/>Turma 2º DS · B</div></article><article className="stat-card"><div className="stat-top"><span className="stat-icon blue">▤</span><span className="stat-caption">CURRÍCULO ATIVO</span></div><div className="stat-value">{store.subjects.length}<span> disciplinas</span></div><div className="stat-bottom"><span className="stat-dot blue-dot"/>Componentes curriculares</div></article><article className="stat-card"><div className="stat-top"><span className="stat-icon orange">◷</span><span className="stat-caption">LANÇAMENTO DE NOTAS</span></div><div className="stat-value">{store.grades.filter((g) => g.trimester === trimester && g.score !== null).length}<span> / {store.grades.filter((g) => g.trimester === trimester).length}</span></div><div className="stat-bottom">Médias preenchidas</div></article></section>
          <section className="panel student-panel"><div className="panel-heading"><div><h2>Alunos da turma</h2><p>Resumo acadêmico · 2º DS · B</p></div><button className="text-link" onClick={() => setTab("students")}>Ver todos <span>→</span></button></div><div className="table-scroll"><table><thead><tr><th>ALUNO</th><th>MATRÍCULA</th><th>MÉDIA GERAL</th><th>SITUAÇÃO</th><th/></tr></thead><tbody>{students.slice(0, 5).map((student, i) => {const avg = averageFor(student.id); const st = status(avg); return <tr key={student.id}><td><div className="student-cell"><span className={`mini-avatar color-${i % 5}`}>{student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><div><b>{student.name}</b><small>{student.email}</small></div></div></td><td className="mono">{student.id}</td><td><b>{avg === null ? "—" : avg.toFixed(1).replace(".", ",")}</b></td><td><span className={`status-badge ${st.tone}`}><i/> {st.label}</span></td><td><button className="row-link" onClick={() => { setSelectedSubject(null); setTab("students"); }}>Ver boletim →</button></td></tr>})}</tbody></table></div></section>
          
        </> : <>
          <StudentGradebook student={currentStudent} store={store} trimester={trimester} onTrimesterChange={setTrimester} />
        </>}
      </>}
      {tab === "students" && canManageGrades && (activeSubject ? <section className="panel full-panel"><div className="panel-heading subject-grade-heading"><div><button className="text-link back-subjects" onClick={() => { setSelectedSubject(null); setGradeError(""); }}>← Todas as matérias</button><h2>{activeSubject.name}</h2><p>{activeSubject.teacher} · notas dos três trimestres e média final</p></div><span className="count-pill">{students.length} estudantes</span></div><div className="toolbar"><div className="search-box"><span>⌕</span><input placeholder="Buscar por nome ou matrícula..." value={query} onChange={(e) => setQuery(e.target.value)}/></div></div>{gradeError && <p className="grade-error" role="alert">{gradeError}</p>}<div className="table-scroll"><table><thead><tr><th>ALUNO</th><th>MATRÍCULA</th><th>1º TRIMESTRE</th><th>2º TRIMESTRE</th><th>3º TRIMESTRE</th><th>MÉDIA FINAL</th><th>SITUAÇÃO</th></tr></thead><tbody>{shownStudents.map((student, i) => {const avg = subjectAverage(student.id, activeSubject.id, store); const result = status(avg); return <tr key={student.id}><td><div className="student-cell"><span className={`mini-avatar color-${i % 5}`}>{student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><div><b>{student.name}</b><small>{student.email}</small></div></div></td><td className="mono">{student.id}</td>{([1, 2, 3] as Trimester[]).map((period) => {const grade = store.grades.find((g) => g.studentId === student.id && g.subjectId === activeSubject.id && g.trimester === period);const key = gradeKey(student.id, activeSubject.id, period);return <td key={period}><input className="grade-input" aria-label={`${period}º trimestre, ${activeSubject.name}, ${student.name}`} type="text" inputMode="decimal" maxLength={5} placeholder="0 a 10" value={gradeDrafts[key] ?? (grade?.score == null ? "" : grade.score.toString().replace(".", ","))} disabled={!canEditGrades} onChange={(e) => updateGrade(student.id, activeSubject.id, e.target.value, period)} onBlur={() => saveGrade(student.id, activeSubject.id, period)} onKeyDown={(e) => {if (e.key === "Enter") {e.preventDefault();e.currentTarget.blur();}}}/></td>})}<td><b>{avg === null ? "—" : avg.toFixed(1).replace(".", ",")}</b></td><td><span className={`status-badge ${result.tone}`}><i/> {result.label}</span></td></tr>})}</tbody></table></div><div className="panel-footnote">Notas entre 0 e 10. A média final considera os três trimestres desta matéria; cada nota é salva ao sair do campo.</div></section> : <section className="panel full-panel"><div className="panel-heading"><div><h2>Matérias</h2><p>Selecione uma matéria para abrir o lançamento das notas.</p></div><span className="count-pill">{store.subjects.length} disciplinas</span></div><div className="subject-choice-grid">{store.subjects.map((subject, i) => <button className="subject-choice" key={subject.id} onClick={() => {setSelectedSubject(subject.id);setGradeError("");}}><span className={`subject-icon si-${i % 4}`}>{["⌘", "▦", "◈", "⌁"][i % 4]}</span><span><b>{subject.name}</b><small>{subject.teacher}</small><small>{students.length} alunos · lançar notas</small></span><strong>›</strong></button>)}{store.subjects.length === 0 && <div className="empty-state">Nenhuma matéria cadastrada.</div>}</div></section>)}
      {tab === "roster" && isAdmin && <section className="panel full-panel"><div className="panel-heading"><div><h2>Matrículas e cadastro de alunos</h2><p>Adicione alunos à turma. A matrícula é criada automaticamente.</p></div><span className="count-pill">{students.length} alunos</span></div><form className="student-create-form" onSubmit={addStudent}><label>Nome completo<input value={newStudentName} onChange={(e) => { setNewStudentName(e.target.value); setStudentNotice(""); }} placeholder="Nome do aluno" required/></label><label>E-mail<input type="email" value={newStudentEmail} onChange={(e) => { setNewStudentEmail(e.target.value); setStudentNotice(""); }} placeholder="aluno@escola.com" required/></label><button className="primary-btn" type="submit">＋ Matricular aluno</button></form>{studentNotice && <p className={`success-message student-notice${studentNoticeError ? " student-notice-error" : ""}`} role={studentNoticeError ? "alert" : "status"}>{studentNotice}</p>}<div className="table-scroll"><table><thead><tr><th>ALUNO</th><th>MATRÍCULA</th><th>E-MAIL</th><th>TURMA</th></tr></thead><tbody>{students.map((student, i) => <tr key={student.id}><td><div className="student-cell"><span className={`mini-avatar color-${i % 5}`}>{student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span><b>{student.name}</b></div></td><td className="mono">{student.id}</td><td>{student.email}</td><td>{student.className}</td></tr>)}</tbody></table></div></section>}
      {tab === "subjects" && isAdmin && <SubjectManagement store={store} students={students} teachers={teachers} onStoreChange={persist} onTeachersChange={setTeachers} onClose={() => setTab("overview")} />}
      <footer className="app-footer"><span>© 2026 Escola Online</span><button className="footer-team-link" onClick={() => setShowTeam(true)}>Equipe do projeto</button><span>Uma escola para todos os futuros. <b>✳</b></span></footer>
    </main></div>
    {showTeam && <div className="modal-backdrop" role="presentation" onClick={() => setShowTeam(false)}><section className="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-title" onClick={(e) => e.stopPropagation()}><button className="modal-close" aria-label="Fechar" onClick={() => setShowTeam(false)}>×</button><span className="eyebrow">ESCOLA ONLINE · 2º DS</span><h2 id="team-title">Equipe do projeto</h2><p>Desenvolvido com dedicação pelos integrantes:</p><ul><li><span>JK</span>Jose Kaio</li><li><span>IF</span>Isabelly Fernandes</li><li><span>JG</span>João Gabriel</li><li><span>AG</span>Arthur Gomes</li></ul><div className="team-modal-footer">Projeto de Desenvolvimento de Sistemas · 2026</div></section></div>}
  </div>;
}

# Escola Online - Portal Escolar

Projeto escolar do 2º DS · B para consulta de médias e gestão de disciplinas.

## Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Acessos de demonstração

- Secretaria: `secretaria@secretaria.escola.com` / `secretaria123`
- Professor: `professor@professor.escola.com` / `professor123`
- Aluno: `aluno@aluno.escola.com` / `aluno123`

Os endereços dos alunos são fictícios para o login local e não correspondem a contas Gmail reais. Os outros seguem o padrão `nome.sobrenome@gmail.com`; consulte a lista de alunos na área da secretaria para os endereços completos.

## Recursos

- Boletim separado por 1º, 2º e 3º trimestre.
- Notas de 0 a 10, com entrada decimal por vírgula ou ponto. A média mínima para aprovação é 6,0.
- Secretaria gerencia disciplinas e médias; professor lança notas no boletim; aluno consulta o próprio boletim.
- Professores iniciais: Carlos Alberto, Radja e Romildo; a secretaria também pode cadastrar novos professores e vinculá-los às disciplinas.
- Dez alunos com e-mails de demonstração e matrículas variadas.
- Dados, preferências de tema e sessão persistem no `localStorage`.
- Modo escuro e janela da equipe acessível pelo rodapé.
- Layout adaptável para celular, tablet e computador.
- Contato da secretaria: 81 9999-999.

A autenticação é demonstrativa e local. Sem um servidor, não deve ser usada para proteger dados reais.

## Equipe

Jose Kaio · Isabelly Fernandes · João Gabriel · Arthur Gomes

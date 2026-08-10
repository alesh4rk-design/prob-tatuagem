# Pro'Ink — Guia para agentes

Sistema de gestão para estúdios de tatuagem, adaptado do Pro'Bronze. Site estático (HTML/CSS/JS puro, sem build), publicado no GitHub Pages, com backend em Firebase (Auth + Firestore, projeto `prob-tatuagem`).

## Fluxo de trabalho: Issues e PRs

Toda tarefa (correção, melhoria ou nova função) segue este padrão:

1. **Antes de codar**, crie uma Issue no GitHub descrevendo a tarefa. Classifique com um destes rótulos/prefixos no título:
   - `[Correção]` — bug
   - `[Melhoria]` — ajuste em algo que já existe
   - `[Nova função]` — recurso novo
2. Trabalhe num branch dedicado a essa tarefa.
3. Abra um Pull Request com a mudança. **Sempre mencione a Issue na descrição do PR** (ex: `Closes #12` ou `Refs #12`), para que o GitHub linke os dois automaticamente.
4. Não faça commits diretos na branch principal (`claude/setup-base`) fora desse fluxo, exceto ajustes triviais de config já combinados com o usuário.

Esse padrão vale para qualquer agente (de qualquer modelo) trabalhando neste repositório — não é específico de uma sessão.

## Estrutura do repositório

- Raiz: sistema Pro'Ink (tatuagem) — `index.html`, `tatuador.html`, `cliente.html`, `admin.html`, `vender.html`, `cadastro-cliente.html`, `cadastro-equipe.html`.
- `js/`: lógica do sistema (Firebase config, agenda, financeiro, clientes, etc.)
- `firestore.rules` / `firestore.indexes.json`: regras e índices do Firestore — publicar manualmente no Console do Firebase após alterar (sem deploy automático configurado ainda).
- `base-pro-barbearia/` e `base-pro-bronze/`: bases de referência de outros produtos da mesma plataforma (barbearia e estética) — não fazem parte do sistema de tatuagem, não editar por engano.

## Firebase

- Projeto: `prob-tatuagem` (separado do `pro-b-bronze`, usado pelo Pro'Bronze). Nunca apontar `js/firebase-config.js` ou `js/equipe.js` para outro projeto Firebase sem confirmação explícita do usuário.
- Publicado via GitHub Pages: `https://alesh4rk-design.github.io/prob-tatuagem/`.

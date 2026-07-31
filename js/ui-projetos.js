// Pro'Ink — UI da aba Projetos (renderização + wiring de eventos)
//
// Mantém a lógica de negócio fora daqui (vem de projetos.js) e fora de
// tatuador.html — este módulo só liga a coleção "projetos" ao DOM da aba.
import {
  TIPOS_PROJETO, ROTULO_ETAPA, ETAPAS_CUSTOM,
  criarProjeto, avancarEtapa, registrarPagamentoProjeto, excluirProjeto,
  escutarProjetosDoNegocio, saldoRestante
} from "./projetos.js?v=20260731a";
import { registrarPagamento } from "./financeiro.js?v=20260728d";

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderProjetos(projetos, { getClientesCache, getEquipeCache }) {
  const lista = document.getElementById("lista-projetos");
  if (!lista) return;
  if (!projetos.length) {
    lista.innerHTML = '<div class="empty-state">Nenhum projeto cadastrado ainda.</div>';
    return;
  }
  lista.innerHTML = projetos.map((p) => {
    const restante = saldoRestante(p);
    const tipoTag = p.tipo === "flash" ? "⚡ Flash" : "🎨 Custom";
    const etapaTexto = p.tipo === "flash" ? "Sessão agendada" : (ROTULO_ETAPA[p.etapa] || p.etapa);
    const podeAvancar = p.tipo === "custom" && p.etapa !== "finalizado";
    return `
      <div class="card" style="margin-bottom:.6rem" data-projeto-id="${p.id}">
        <div style="display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap">
          <div>
            <strong>${escapeHtml(p.clienteNome)}</strong>
            <div class="detalhe">${escapeHtml(p.artistaNome || "sem artista definido")} · ${tipoTag}</div>
            <div class="detalhe">${escapeHtml(p.descricao || "")}</div>
          </div>
          <div style="text-align:right">
            <div>${formatarMoeda(p.valorTotal)}</div>
            <div class="detalhe">restam ${formatarMoeda(restante)}</div>
          </div>
        </div>
        <div class="detalhe" style="margin-top:.4rem">Etapa: <strong>${escapeHtml(etapaTexto)}</strong></div>
        <div style="display:flex;gap:.5rem;margin-top:.6rem;flex-wrap:wrap">
          ${podeAvancar ? `<button class="btn-secundario btn-sm" data-acao="avancar" style="width:auto">Avançar etapa</button>` : ""}
          ${restante > 0 ? `<button class="btn-secundario btn-sm" data-acao="pagar" style="width:auto">Registrar pagamento</button>` : ""}
          <button class="btn-secundario btn-sm" data-acao="excluir" style="width:auto;color:var(--red)">Excluir</button>
        </div>
      </div>`;
  }).join("");

  lista.querySelectorAll("[data-acao]").forEach((btn) => {
    const card = btn.closest("[data-projeto-id]");
    const projetoId = card.dataset.projetoId;
    const projeto = projetos.find((p) => p.id === projetoId);
    btn.addEventListener("click", async () => {
      if (btn.dataset.acao === "avancar") {
        await avancarEtapa(projetoId);
      } else if (btn.dataset.acao === "pagar") {
        const valor = parseFloat(prompt(`Valor recebido agora (restam ${formatarMoeda(saldoRestante(projeto))}):`, ""));
        if (!valor || valor <= 0) return;
        await registrarPagamentoProjeto(projetoId, valor);
        await registrarPagamento(projeto.negocioId, {
          agendamentoId: projetoId,
          clienteId: projeto.clienteId,
          clienteNome: projeto.clienteNome,
          valorBruto: valor,
          formaPagamento: "outro",
          statusPagamento: "pago"
        });
      } else if (btn.dataset.acao === "excluir") {
        if (!confirm(`Excluir o projeto de ${projeto.clienteNome}? Essa ação não pode ser desfeita.`)) return;
        await excluirProjeto(projetoId);
      }
    });
  });
}

export function initAbaProjetos({ negocioId, getClientesCache, getEquipeCache, listenersAtivos, toast }) {
  const $ = (id) => document.getElementById(id);

  function preencherSelects() {
    const clientes = getClientesCache();
    const equipe = getEquipeCache();
    $("proj-cliente").innerHTML = '<option value="">Selecione...</option>' +
      clientes.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
    $("proj-artista").innerHTML = '<option value="">Sem artista definido</option>' +
      equipe.map((m) => `<option value="${m.id}">${escapeHtml(m.nome)}</option>`).join("");
  }

  // initAbaProjetos roda de novo a cada login (sem recarregar a página) —
  // sem essa guarda, um logout seguido de login duplicava os listeners de
  // clique (a assinatura do Firestore logo abaixo é refeita normalmente).
  const btnAbrir = $("btn-abrir-cadastro-projeto");
  if (!btnAbrir.dataset.bound) {
    btnAbrir.dataset.bound = "1";

    btnAbrir.addEventListener("click", () => {
      preencherSelects();
      $("modal-cadastro-projeto").style.display = "flex";
    });
    $("btn-cancelar-cadastro-projeto").addEventListener("click", () => {
      $("modal-cadastro-projeto").style.display = "none";
    });

    $("btn-criar-projeto").addEventListener("click", async () => {
      const clienteId = $("proj-cliente").value;
      const cliente = getClientesCache().find((c) => c.id === clienteId);
      const artistaId = $("proj-artista").value || null;
      const artista = getEquipeCache().find((m) => m.id === artistaId);
      const tipo = $("proj-tipo").value;
      const descricao = $("proj-descricao").value.trim();
      const valorTotal = parseFloat($("proj-valor-total").value) || 0;
      const sinalValor = parseFloat($("proj-sinal").value) || 0;

      if (!cliente) { toast("Selecione a cliente.", "erro"); return; }
      if (!TIPOS_PROJETO.includes(tipo)) { toast("Selecione o tipo do projeto.", "erro"); return; }
      if (!valorTotal) { toast("Informe o valor total do projeto.", "erro"); return; }

      const btn = $("btn-criar-projeto");
      btn.disabled = true;
      try {
        await criarProjeto(negocioId, {
          clienteId: cliente.id, clienteNome: cliente.nome,
          artistaId: artista?.id || null, artistaNome: artista?.nome || null,
          tipo, descricao, valorTotal, sinalValor
        });
        $("modal-cadastro-projeto").style.display = "none";
        toast("Projeto criado.", "sucesso");
      } finally {
        btn.disabled = false;
      }
    });
  }

  const unsubscribe = escutarProjetosDoNegocio(negocioId, (projetos) => {
    renderProjetos(projetos, { getClientesCache, getEquipeCache });
  });
  listenersAtivos.push(unsubscribe);
  return unsubscribe;
}

// Pro'Ink — UI da aba Portfólio (galeria de fotos por artista)
import {
  adicionarFotoPortfolio, excluirFotoPortfolio, escutarPortfolioDoNegocio
} from "./portfolio.js?v=20260731a";

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function renderPortfolio(fotos, filtroArtistaId) {
  const grade = document.getElementById("portfolio-grade");
  if (!grade) return;
  const visiveis = filtroArtistaId ? fotos.filter((f) => f.artistaId === filtroArtistaId) : fotos;
  if (!visiveis.length) {
    grade.innerHTML = '<div class="empty-state">Nenhuma foto cadastrada ainda.</div>';
    return;
  }
  grade.innerHTML = visiveis.map((f) => `
    <div class="card" style="padding:.5rem" data-foto-id="${f.id}">
      <img src="${escapeHtml(f.url)}" alt="${escapeHtml(f.legenda)}" style="width:100%;border-radius:8px;display:block;aspect-ratio:1;object-fit:cover">
      <div class="detalhe" style="margin-top:.4rem">${escapeHtml(f.artistaNome || "sem artista")}${f.estilo ? " · " + escapeHtml(f.estilo) : ""}</div>
      ${f.legenda ? `<div class="detalhe">${escapeHtml(f.legenda)}</div>` : ""}
      <button class="btn-secundario btn-sm" data-acao="excluir-foto" style="width:100%;margin-top:.4rem;color:var(--red)">Excluir</button>
    </div>
  `).join("");

  grade.querySelectorAll('[data-acao="excluir-foto"]').forEach((btn) => {
    const fotoId = btn.closest("[data-foto-id]").dataset.fotoId;
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir esta foto do portfólio?")) return;
      await excluirFotoPortfolio(fotoId);
    });
  });
}

export function initAbaPortfolio({ negocioId, getEquipeCache, listenersAtivos, toast }) {
  const $ = (id) => document.getElementById(id);
  let fotosCache = [];

  function preencherFiltroArtista() {
    const equipe = getEquipeCache();
    const selecionado = $("portfolio-filtro-artista").value;
    $("portfolio-filtro-artista").innerHTML = '<option value="">Todos os artistas</option>' +
      equipe.map((m) => `<option value="${m.id}">${escapeHtml(m.nome)}</option>`).join("");
    $("portfolio-filtro-artista").value = selecionado;

    $("port-artista").innerHTML = '<option value="">Selecione o artista...</option>' +
      equipe.map((m) => `<option value="${m.id}">${escapeHtml(m.nome)}</option>`).join("");
  }

  if (!$("btn-abrir-add-foto").dataset.bound) {
    $("btn-abrir-add-foto").dataset.bound = "1";

    $("btn-abrir-add-foto").addEventListener("click", () => {
      preencherFiltroArtista();
      $("modal-add-foto-portfolio").style.display = "flex";
    });
    $("btn-cancelar-add-foto").addEventListener("click", () => {
      $("modal-add-foto-portfolio").style.display = "none";
    });

    $("btn-salvar-foto-portfolio").addEventListener("click", async () => {
      const artistaId = $("port-artista").value;
      const artista = getEquipeCache().find((m) => m.id === artistaId);
      const url = $("port-url").value.trim();
      const legenda = $("port-legenda").value.trim();
      const estilo = $("port-estilo").value.trim();

      if (!artista) { toast("Selecione o artista.", "erro"); return; }
      if (!url) { toast("Informe a URL da foto.", "erro"); return; }

      const btn = $("btn-salvar-foto-portfolio");
      btn.disabled = true;
      try {
        await adicionarFotoPortfolio(negocioId, { artistaId: artista.id, artistaNome: artista.nome, url, legenda, estilo });
        $("port-url").value = ""; $("port-legenda").value = ""; $("port-estilo").value = "";
        $("modal-add-foto-portfolio").style.display = "none";
        toast("Foto adicionada ao portfólio.", "sucesso");
      } finally {
        btn.disabled = false;
      }
    });

    $("portfolio-filtro-artista").addEventListener("change", () => {
      renderPortfolio(fotosCache, $("portfolio-filtro-artista").value);
    });
  }

  const unsubscribe = escutarPortfolioDoNegocio(negocioId, (fotos) => {
    fotosCache = fotos;
    renderPortfolio(fotosCache, $("portfolio-filtro-artista")?.value || "");
  });
  listenersAtivos.push(unsubscribe);
  return unsubscribe;
}

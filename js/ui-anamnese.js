// Pro'Ink — UI do modal de Anamnese, TCLE e Responsável Legal (menor de idade)
//
// Lógica de negócio fica em anamnese.js; este módulo só liga isso ao DOM.
import {
  ehMenorDeIdade, salvarAnamnese, obterAnamnese,
  salvarResponsavelLegal, obterResponsavelLegal,
  registrarAceiteTcle, obterUltimoAceiteTcle
} from "./anamnese.js?v=20260731a";

const TEXTO_TCLE_PADRAO = "Declaro estar ciente dos riscos do procedimento de tatuagem (reações alérgicas, infecção se os cuidados pós-sessão não forem seguidos, variação de cor com o tempo) e autorizo sua realização.";

// Estado em nível de módulo (não por chamada de initModalAnamnese) — assim
// o botão de salvar, ligado uma única vez, sempre enxerga a cliente aberta
// por último, mesmo que initModalAnamnese rode de novo a cada login.
let clienteAtual = null;

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export function initModalAnamnese({ toast }) {
  const $ = (id) => document.getElementById(id);

  async function abrir(cliente) {
    clienteAtual = cliente;
    $("anam-cliente-nome").textContent = cliente.nome;

    const anamnese = await obterAnamnese(cliente.id);
    $("anam-alergias").value = anamnese?.alergias || "";
    $("anam-medicamentos").value = anamnese?.medicamentos || "";
    $("anam-observacoes").value = anamnese?.observacoes || "";
    $("anam-gestante").checked = !!anamnese?.gestante;
    document.querySelectorAll("#anam-condicoes input[type=checkbox]").forEach((chk) => {
      chk.checked = (anamnese?.condicoesSaude || []).includes(chk.value);
    });

    const menor = ehMenorDeIdade(cliente.dataNascimento);
    $("anam-bloco-responsavel").style.display = menor ? "block" : "none";
    if (menor) {
      const responsavel = await obterResponsavelLegal(cliente.id);
      $("anam-responsavel-nome").value = responsavel?.nomeResponsavel || "";
      $("anam-responsavel-cpf").value = responsavel?.cpfResponsavel || "";
      $("anam-responsavel-doc-url").value = responsavel?.urlDocumento || "";
    }

    const ultimoAceite = await obterUltimoAceiteTcle(cliente.id);
    $("anam-tcle-texto").textContent = TEXTO_TCLE_PADRAO;
    $("anam-tcle-status").textContent = ultimoAceite
      ? `Último aceite: ${escapeHtml(ultimoAceite.nomeDigitado)}`
      : "Ainda sem aceite registrado.";
    $("anam-tcle-nome").value = "";

    $("modal-anamnese").style.display = "flex";
  }

  // initModalAnamnese roda de novo a cada login (sem recarregar a página) —
  // sem essa guarda, um logout seguido de login duplicava os listeners.
  if (!$("btn-fechar-anamnese").dataset.bound) {
    $("btn-fechar-anamnese").dataset.bound = "1";

    $("btn-fechar-anamnese").addEventListener("click", () => {
      $("modal-anamnese").style.display = "none";
    });

    $("btn-salvar-anamnese").addEventListener("click", async () => {
      if (!clienteAtual) return;
      const condicoesSaude = Array.from(document.querySelectorAll("#anam-condicoes input[type=checkbox]:checked")).map((c) => c.value);
      const btn = $("btn-salvar-anamnese");
      btn.disabled = true;
      try {
        await salvarAnamnese(clienteAtual.id, {
          condicoesSaude,
          alergias: $("anam-alergias").value.trim(),
          medicamentos: $("anam-medicamentos").value.trim(),
          gestante: $("anam-gestante").checked,
          observacoes: $("anam-observacoes").value.trim()
        });

        if (ehMenorDeIdade(clienteAtual.dataNascimento)) {
          const nomeResponsavel = $("anam-responsavel-nome").value.trim();
          if (!nomeResponsavel) { toast("Cliente menor de idade precisa do nome do responsável legal.", "erro"); return; }
          await salvarResponsavelLegal(clienteAtual.id, {
            nomeResponsavel,
            cpfResponsavel: $("anam-responsavel-cpf").value.trim(),
            urlDocumento: $("anam-responsavel-doc-url").value.trim()
          });
        }

        toast("Anamnese salva.", "sucesso");
      } finally {
        btn.disabled = false;
      }
    });

    $("btn-aceitar-tcle").addEventListener("click", async () => {
      if (!clienteAtual) return;
      const nomeDigitado = $("anam-tcle-nome").value.trim();
      if (!nomeDigitado) { toast("Digite o nome de quem está aceitando o termo.", "erro"); return; }
      await registrarAceiteTcle(clienteAtual.id, { nomeDigitado, textoVersao: TEXTO_TCLE_PADRAO });
      toast("TCLE aceito e registrado.", "sucesso");
      $("anam-tcle-status").textContent = `Último aceite: ${nomeDigitado}`;
      $("anam-tcle-nome").value = "";
    });
  }

  return { abrir };
}

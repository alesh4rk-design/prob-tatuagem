// Pro'Ink — Projetos de tatuagem: etapas, tipo (flash/custom) e valores
import { db } from "./firebase-config.js?v=20260728d";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { notificarErroFirestore } from "./firestore-erro.js?v=20260728d";

// tipo: "flash" (desenho pronto, preço fechado) | "custom" (desenho sob medida, por etapas)
export const TIPOS_PROJETO = ["flash", "custom"];

// etapa: só existe pra projetos "custom" — flash nasce direto em "sessao_agendada"
export const ETAPAS_CUSTOM = [
  "orcamento",
  "sinal_pago",
  "desenho_aprovado",
  "sessao_agendada",
  "finalizado"
];

export const ROTULO_ETAPA = {
  orcamento: "Orçamento",
  sinal_pago: "Sinal pago",
  desenho_aprovado: "Desenho aprovado",
  sessao_agendada: "Sessão agendada",
  finalizado: "Finalizado"
};

export function etapaInicial(tipo) {
  return tipo === "flash" ? "sessao_agendada" : "orcamento";
}

export function proximaEtapa(etapaAtual) {
  const i = ETAPAS_CUSTOM.indexOf(etapaAtual);
  if (i === -1 || i === ETAPAS_CUSTOM.length - 1) return null;
  return ETAPAS_CUSTOM[i + 1];
}

export async function criarProjeto(negocioId, {
  clienteId, clienteNome, artistaId, artistaNome,
  tipo, descricao, valorTotal, sinalValor = 0
}) {
  if (!TIPOS_PROJETO.includes(tipo)) throw new Error("Tipo de projeto inválido.");
  return addDoc(collection(db, "projetos"), {
    negocioId,
    clienteId, clienteNome,
    artistaId, artistaNome,
    tipo,
    descricao,
    valorTotal,
    sinalValor,
    saldoPago: 0,
    etapa: etapaInicial(tipo),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
}

export async function avancarEtapa(projetoId, etapaForcada = null) {
  const ref = doc(db, "projetos", projetoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Projeto não encontrado.");
  const projeto = snap.data();
  if (projeto.tipo === "flash") throw new Error("Projeto flash não tem etapas — vai direto pra sessão.");

  const novaEtapa = etapaForcada || proximaEtapa(projeto.etapa);
  if (!novaEtapa) throw new Error("Projeto já está na última etapa.");

  await updateDoc(ref, { etapa: novaEtapa, atualizadoEm: serverTimestamp() });
  return novaEtapa;
}

// Soma um pagamento (sinal ou parcela) ao saldo já pago do projeto.
// A gravação do lançamento em si fica a cargo de financeiro.js — esta
// função só atualiza o total pago no projeto pra calcular saldoRestante().
export async function registrarPagamentoProjeto(projetoId, valorPago) {
  const ref = doc(db, "projetos", projetoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Projeto não encontrado.");
  const projeto = snap.data();
  const novoSaldoPago = (projeto.saldoPago || 0) + valorPago;

  await updateDoc(ref, { saldoPago: novoSaldoPago, atualizadoEm: serverTimestamp() });
  return { saldoPago: novoSaldoPago, saldoRestante: saldoRestante({ ...projeto, saldoPago: novoSaldoPago }) };
}

export function saldoRestante(projeto) {
  return Math.max((projeto.valorTotal || 0) - (projeto.saldoPago || 0), 0);
}

export function excluirProjeto(projetoId) {
  return deleteDoc(doc(db, "projetos", projetoId));
}

export function escutarProjetosDoNegocio(negocioId, callback) {
  const q = query(collection(db, "projetos"), where("negocioId", "==", negocioId));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    callback(lista.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
  }, notificarErroFirestore);
}

export function escutarProjetosDoCliente(clienteId, callback) {
  const q = query(collection(db, "projetos"), where("clienteId", "==", clienteId));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    callback(lista.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
  }, notificarErroFirestore);
}

export function escutarProjetosDoArtista(artistaId, callback) {
  const q = query(collection(db, "projetos"), where("artistaId", "==", artistaId));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    callback(lista.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
  }, notificarErroFirestore);
}

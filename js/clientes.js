// Pro'Ink — Clientes (cadastro pela recepção). Anamnese, TCLE e responsável
// legal (cliente menor de idade) ficam em anamnese.js, gravados no mesmo
// documento de clientes/{id}.
import { db } from "./firebase-config.js?v=20260728d";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { notificarErroFirestore } from "./firestore-erro.js?v=20260728d";

export async function criarCliente(negocioId, { nome, whatsapp = "", observacoes = "", dataNascimento = null }) {
  return addDoc(collection(db, "clientes"), {
    negocioId,
    nome,
    whatsapp,
    observacoes,
    dataNascimento: dataNascimento || null,
    ultimaSessaoEm: null,
    criadoEm: serverTimestamp()
  });
}

// Verdadeiro se a data de nascimento (formato "AAAA-MM-DD") cai hoje
export function ehAniversarioHoje(dataNascimento) {
  if (!dataNascimento) return false;
  const [, mes, dia] = dataNascimento.split("-").map(Number);
  const hoje = new Date();
  return mes === hoje.getMonth() + 1 && dia === hoje.getDate();
}

export function editarCliente(clienteId, dados) {
  return updateDoc(doc(db, "clientes", clienteId), dados);
}

export function excluirCliente(clienteId) {
  return deleteDoc(doc(db, "clientes", clienteId));
}

export function escutarClientes(negocioId, callback) {
  const q = query(collection(db, "clientes"), where("negocioId", "==", negocioId));
  return onSnapshot(q, (snap) => {
    const clientes = [];
    snap.forEach((d) => clientes.push({ id: d.id, ...d.data() }));
    callback(clientes.sort((a, b) => a.nome.localeCompare(b.nome)));
  }, notificarErroFirestore);
}

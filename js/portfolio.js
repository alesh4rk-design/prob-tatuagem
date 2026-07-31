// Pro'Ink — Portfólio por artista (galeria de fotos do próprio trabalho)
//
// O upload do arquivo em si (Storage) fica a cargo da tela que chama estas
// funções — aqui só se lida com a URL já hospedada, igual ao padrão adotado
// em anamnese.js pro documento do responsável legal.
import { db } from "./firebase-config.js?v=20260728d";
import {
  collection, doc, addDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { notificarErroFirestore } from "./firestore-erro.js?v=20260728d";

export async function adicionarFotoPortfolio(negocioId, { artistaId, artistaNome, url, legenda = "", estilo = "" }) {
  if (!url) throw new Error("URL da foto é obrigatória.");
  return addDoc(collection(db, "portfolio"), {
    negocioId,
    artistaId,
    artistaNome,
    url,
    legenda,
    estilo,
    criadoEm: serverTimestamp()
  });
}

export function excluirFotoPortfolio(fotoId) {
  return deleteDoc(doc(db, "portfolio", fotoId));
}

export function escutarPortfolioDoArtista(artistaId, callback) {
  const q = query(collection(db, "portfolio"), where("artistaId", "==", artistaId));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    callback(lista.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
  }, notificarErroFirestore);
}

export function escutarPortfolioDoNegocio(negocioId, callback) {
  const q = query(collection(db, "portfolio"), where("negocioId", "==", negocioId));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    callback(lista.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
  }, notificarErroFirestore);
}

// Pro'Ink — Anamnese e Termo de Consentimento Livre e Esclarecido (TCLE)
import { db } from "./firebase-config.js?v=20260728d";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Idade mínima pra tatuar sem responsável (varia por lei estadual/municipal — ajustável).
export const IDADE_MINIMA_SEM_RESPONSAVEL = 18;

// Texto padrão do TCLE — usado tanto no preenchimento pelo tatuador(a)
// (ui-anamnese.js) quanto no autoatendimento da cliente (cliente.html).
export const TEXTO_TCLE_PADRAO = "Declaro estar ciente dos riscos do procedimento de tatuagem (reações alérgicas, infecção se os cuidados pós-sessão não forem seguidos, variação de cor com o tempo) e autorizo sua realização.";

// Intervalo mínimo recomendado entre sessões da mesma tatuagem, pra dar tempo
// de cicatrização antes da próxima etapa/retoque.
export const INTERVALO_MINIMO_HORAS_PADRAO = 24 * 15; // ~15 dias
export const LIMITE_SESSOES_MES_PADRAO = 12;

// Verifica intervalo mínimo desde a última sessão registrada nessa tatuagem.
export function verificarIntervaloMinimo(ultimaSessaoData, intervaloHoras = INTERVALO_MINIMO_HORAS_PADRAO) {
  if (!ultimaSessaoData) return { permitido: true, horasFaltando: 0 };
  const agora = new Date();
  const ultima = new Date(ultimaSessaoData);
  const horasDecorridas = (agora - ultima) / (1000 * 60 * 60);
  const permitido = horasDecorridas >= intervaloHoras;
  return {
    permitido,
    horasFaltando: permitido ? 0 : Math.ceil(intervaloHoras - horasDecorridas)
  };
}

// Verifica limite de sessões no mês corrente (capacidade do tatuador/estúdio).
export function verificarLimiteMensal(sessoesDoMes, limite = LIMITE_SESSOES_MES_PADRAO) {
  const restantes = limite - sessoesDoMes;
  return {
    dentroDoLimite: sessoesDoMes < limite,
    restantes: Math.max(restantes, 0),
    alerta: restantes <= 2 && restantes > 0
  };
}

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

export function ehMenorDeIdade(dataNascimento) {
  const idade = calcularIdade(dataNascimento);
  return idade !== null && idade < IDADE_MINIMA_SEM_RESPONSAVEL;
}

// Salva a anamnese (saúde) da cliente — condições, alergias e medicamentos que
// afetam a decisão de tatuar (cicatrização, sangramento, reação alérgica etc).
export async function salvarAnamnese(clienteId, {
  condicoesSaude = [],
  alergias = "",
  medicamentos = "",
  gestante = false,
  observacoes = ""
}) {
  return setDoc(doc(db, "clientes", clienteId), {
    anamnese: {
      condicoesSaude,
      alergias,
      medicamentos,
      gestante,
      observacoes,
      atualizadoEm: serverTimestamp()
    }
  }, { merge: true });
}

export async function obterAnamnese(clienteId) {
  const snap = await getDoc(doc(db, "clientes", clienteId));
  return snap.exists() ? (snap.data().anamnese || null) : null;
}

// Salva o responsável legal de uma cliente menor de idade (nome + documento).
// urlDocumento é o link do arquivo já enviado ao Storage — o upload em si fica
// a cargo da tela que chama esta função.
export async function salvarResponsavelLegal(clienteId, { nomeResponsavel, cpfResponsavel = "", urlDocumento }) {
  return setDoc(doc(db, "clientes", clienteId), {
    responsavelLegal: {
      nomeResponsavel,
      cpfResponsavel,
      urlDocumento,
      atualizadoEm: serverTimestamp()
    }
  }, { merge: true });
}

export async function obterResponsavelLegal(clienteId) {
  const snap = await getDoc(doc(db, "clientes", clienteId));
  return snap.exists() ? (snap.data().responsavelLegal || null) : null;
}

// Registra a aceitação do TCLE pra um projeto/sessão específico. O aceite é
// simples (nome digitado + data), não uma assinatura desenhada.
export async function registrarAceiteTcle(clienteId, { nomeDigitado, textoVersao }) {
  const aceite = {
    nomeDigitado,
    textoVersao,
    aceitoEm: serverTimestamp()
  };
  await setDoc(doc(db, "clientes", clienteId), {
    tcle: { ultimoAceite: aceite }
  }, { merge: true });
  return aceite;
}

export async function obterUltimoAceiteTcle(clienteId) {
  const snap = await getDoc(doc(db, "clientes", clienteId));
  return snap.exists() ? (snap.data().tcle?.ultimoAceite || null) : null;
}

// Verifica se a cliente pode ser agendada: precisa de anamnese preenchida e,
// se for menor de idade, também precisa de responsável legal cadastrado.
export function podeAgendar(cliente) {
  if (!cliente?.anamnese) {
    return { permitido: false, motivo: "Anamnese não preenchida." };
  }
  if (ehMenorDeIdade(cliente.dataNascimento) && !cliente?.responsavelLegal) {
    return { permitido: false, motivo: "Cliente menor de idade sem responsável legal cadastrado." };
  }
  return { permitido: true, motivo: null };
}

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

const BETS_DOC_ID = 'config';
const POINTS_PER_QUESTION = 10;
const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'cock', 'bastard',
  'piss', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga', 'chink', 'spic', 'kike',
  'retard', 'douchebag', 'jackass', 'dyke', 'wanker', 'bollocks', 'twat', 'prick',
];

// Precompiled, once, at module load. Each word becomes a case-insensitive regex
// that (a) requires the slur to stand on its own via \b word boundaries — so real
// names like "Harshit", "Cassandra", or "Dickson" are NOT flagged — and (b) allows
// filler separators between letters so spaced / punctuated obfuscation ("f u c k",
// "s.h.i.t", "b-i-t-c-h") is still caught. Leetspeak with digits/symbols is already
// rejected earlier by the letters-only rule.
const PROFANITY_PATTERNS = BAD_WORDS.map((word) => {
  const spaced = word.split('').join("[\\s._'*\\-]*");
  return new RegExp(`\\b${spaced}\\b`, 'i');
});

// Returns true when the supplied text contains a disallowed word as a standalone
// token (including lightly obfuscated / spaced-out variants).
export function containsProfanity(text) {
  const value = (text || '').toString();
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(value));
}

export const DEFAULT_BETS_CONFIG = {
  questions: [],
  correctAnswers: {},
  votingLocked: false,
};

function betsDocRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.BETS, BETS_DOC_ID);
}

function betsVotesRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, 'betsVotes');
}

function normalizeQuestion(question, index) {
  return {
    id: question.id || `question-${Date.now()}-${index}`,
    text: question.text?.trim() || '',
    section: question.section?.trim() || 'General',
    options: (question.options || []).map((option) => option.trim()).filter(Boolean),
    order: question.order ?? index,
  };
}

function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function voteDocId(guestName) {
  return encodeURIComponent(normalizeName(guestName));
}

export function validateGuestName(guestName) {
  const trimmedName = guestName.trim();

  if (trimmedName.length < 2) return 'Please enter your full name.';
  if (trimmedName.length > 40) return 'Name is too long.';
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) return 'Please use letters only.';
  if (containsProfanity(trimmedName)) return 'Please enter a clean name.';

  return '';
}

export async function saveBetsConfig(weddingId, config) {
  const questions = (config.questions || [])
    .map(normalizeQuestion)
    .filter((question) => question.text && question.options.length >= 2);

  await setDoc(betsDocRef(weddingId), {
    questions,
    correctAnswers: config.correctAnswers || {},
    votingLocked: Boolean(config.votingLocked),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeToBets(weddingId, callback) {
  return onSnapshot(
    betsDocRef(weddingId),
    (snap) => {
      const data = snap.exists() ? snap.data() : DEFAULT_BETS_CONFIG;
      callback({
        ...DEFAULT_BETS_CONFIG,
        ...data,
        questions: (data.questions || [])
          .map(normalizeQuestion)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      });
    },
    (error) => {
      console.error('Failed to load bets config:', error);
      callback({ ...DEFAULT_BETS_CONFIG });
    }
  );
}

export async function submitVote(weddingId, guestName, answers) {
  const validationError = validateGuestName(guestName);
  if (validationError) {
    throw new Error(validationError);
  }

  const guestDocRef = doc(betsVotesRef(weddingId), voteDocId(guestName));
  const existingVote = await getDoc(guestDocRef);

  await setDoc(guestDocRef, {
    guestName: guestName.trim(),
    normalizedName: normalizeName(guestName),
    answers: {
      ...(existingVote.exists() ? existingVote.data().answers || {} : {}),
      ...(answers || {}),
    },
    updatedAt: serverTimestamp(),
    createdAt: existingVote.exists() ? existingVote.data().createdAt || serverTimestamp() : serverTimestamp(),
  }, { merge: true });
}

export function subscribeToVotes(weddingId, callback) {
  return onSnapshot(
    betsVotesRef(weddingId),
    (snap) => {
      const votes = snap.docs.map((voteDoc) => ({ id: voteDoc.id, ...voteDoc.data() }));
      callback(votes.sort((a, b) => (a.guestName || '').localeCompare(b.guestName || '')));
    },
    (error) => {
      console.error('Failed to load bets votes:', error);
      callback([]);
    }
  );
}

export async function setCorrectAnswers(weddingId, correctAnswers) {
  await setDoc(betsDocRef(weddingId), {
    correctAnswers: correctAnswers || {},
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function lockVoting(weddingId, votingLocked) {
  await setDoc(betsDocRef(weddingId), {
    votingLocked: Boolean(votingLocked),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function calculateLeaderboard(questions, correctAnswers, votes) {
  const answeredQuestions = (questions || []).filter((question) => correctAnswers?.[question.id]);

  return (votes || [])
    .map((vote) => {
      const correctCount = answeredQuestions.filter(
        (question) => vote.answers?.[question.id] === correctAnswers[question.id]
      ).length;

      return {
        id: vote.id,
        guestName: vote.guestName,
        score: correctCount * POINTS_PER_QUESTION,
        correctCount,
        totalAnswered: answeredQuestions.length,
        answers: vote.answers || {},
      };
    })
    .sort((a, b) => b.score - a.score || a.guestName.localeCompare(b.guestName));
}

export function getBetsGuestLink(weddingId, slug) {
  const identifier = slug || weddingId;
  return `${window.location.origin}/bets/${identifier}`;
}

export function getBetsLeaderboardLink(weddingId, slug) {
  const identifier = slug || weddingId;
  return `${window.location.origin}/bets/${identifier}/leaderboard`;
}

export { POINTS_PER_QUESTION };

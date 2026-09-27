import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ---- Design tokens ----
// Subject: objective competitive testing prep. Palette pulls from
// cardstock/manila and grading-pen ink rather than a generic app palette.
// Palette sits in FBLA's blue-and-gold family without copying it.
// FBLA's official hexes are navy #0A2E7F, blue #1D52BC, gold #F4AB19.
// Every colour below is a deliberately different value, far enough away
// to be a distinct colour rather than a near-copy of the real brand.
// All text pairings meet WCAG AA contrast.
const INK = '#15356B';        // navy, 18.8 deltaE from FBLA navy
const INK_SOFT = '#5A6274';
const PAPER = '#EDEAE0';      // desk / booklet cover stock
const CARD = '#FBFAF6';       // the answer sheet itself
const LINE = '#C8C2B2';       // light rule
const RULE = '#98907E';       // heavy rule, bubble outlines
const ACCENT = '#2A5FA8';     // blue, 22.2 deltaE from FBLA blue
const RED = '#C23B34';        // kept for wrong answers and errors only
const RED_DARK = '#9C2E28';
const GREEN = '#2F6E4E';
const GREEN_BG = '#E1EEE5';
const GOLD = '#C28620';       // gold, 21.8 deltaE from FBLA gold
const GOLD_TEXT = '#8A5E12';  // darker gold, for small text on GOLD_BG
const GOLD_BG = '#F6E8CA';

const MONO = "ui-monospace, 'SF Mono', 'Menlo', 'Consolas', monospace";
const SANS = "-apple-system, 'Segoe UI', Roboto, sans-serif";

const styles = {
  // Laid out like a printed objective test: paper stock, a heavy rule under
  // the booklet header, square corners, no drop shadows, monospace for
  // anything that would be pre-printed on a real answer sheet.
  page: { minHeight: '100vh', background: PAPER, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: SANS, padding: '24px 16px' },
  header: { width: '100%', maxWidth: '560px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  headerLogo: { fontFamily: MONO, fontSize: '13px', fontWeight: 700, color: INK, letterSpacing: '1.5px' },
  headerTag: { fontFamily: MONO, fontSize: '11px', color: INK_SOFT, letterSpacing: '0.5px' },
  signOut: { fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: INK_SOFT, background: 'transparent', border: `1px solid ${RULE}`, borderRadius: 0, padding: '5px 9px', cursor: 'pointer', letterSpacing: '0.5px' },

  // The sheet. Heavy navy bar across the top, like the header band printed
  // on a test booklet.
  card: { background: CARD, border: `1px solid ${RULE}`, borderTop: `5px solid ${INK}`, borderRadius: 0, padding: '28px 26px', maxWidth: '560px', width: '100%' },

  eyebrow: { fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: INK_SOFT, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' },
  title: { fontSize: '21px', fontWeight: 700, marginBottom: '6px', color: INK, lineHeight: 1.3 },
  subtitle: { fontSize: '14px', color: INK_SOFT, marginBottom: '22px', lineHeight: 1.5 },
  input: { width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${RULE}`, borderRadius: 0, marginBottom: '14px', boxSizing: 'border-box', fontFamily: SANS, background: '#fff', color: INK },
  select: { width: '100%', padding: '12px 14px', fontSize: '15px', border: `1px solid ${RULE}`, borderRadius: 0, marginBottom: '14px', boxSizing: 'border-box', background: '#fff', color: INK, fontFamily: SANS },
  button: { width: '100%', padding: '13px', fontSize: '13px', fontWeight: 700, color: '#fff', background: INK, border: `1px solid ${INK}`, borderRadius: 0, cursor: 'pointer', marginBottom: '10px', fontFamily: MONO, letterSpacing: '1.5px', textTransform: 'uppercase' },
  buttonSecondary: { width: '100%', padding: '13px', fontSize: '13px', fontWeight: 700, color: INK, background: 'transparent', border: `1px solid ${RULE}`, borderRadius: 0, cursor: 'pointer', marginBottom: '10px', fontFamily: MONO, letterSpacing: '1.5px', textTransform: 'uppercase' },
  buttonGreen: { width: '100%', padding: '13px', fontSize: '13px', fontWeight: 700, color: '#fff', background: GREEN, border: `1px solid ${GREEN}`, borderRadius: 0, cursor: 'pointer', marginBottom: '10px', fontFamily: MONO, letterSpacing: '1.5px', textTransform: 'uppercase' },
  buttonDisabled: { opacity: 0.45, cursor: 'not-allowed' },

  // Menu entries read as ruled rows on a form, not as floating cards.
  menuTile: { width: '100%', textAlign: 'left', padding: '13px 0 13px 14px', marginBottom: 0, borderTop: `1px solid ${LINE}`, borderLeft: `3px solid transparent`, background: 'transparent', cursor: 'pointer' },
  menuTag: { fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: INK_SOFT, letterSpacing: '1px', marginBottom: '4px' },
  menuSection: { marginBottom: '26px' },
  sectionHeading: { fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: INK, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 0, paddingBottom: '6px', borderBottom: `2px solid ${INK}` },
  menuTitle: { fontSize: '15px', fontWeight: 700, color: INK, marginBottom: '2px' },
  menuDesc: { fontSize: '13px', color: INK_SOFT, lineHeight: 1.45 },

  // Booklet strip above a question: number on the left, competency on the
  // right, heavy rule underneath.
  sheetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${INK}`, paddingBottom: '8px', marginBottom: '4px' },
  qNum: { fontFamily: MONO, fontSize: '30px', fontWeight: 700, color: INK, letterSpacing: '1px', lineHeight: 1 },
  qOf: { fontFamily: MONO, fontSize: '11px', color: INK_SOFT, letterSpacing: '1px' },
  progress: { fontFamily: MONO, fontSize: '11px', color: INK_SOFT, marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' },

  // Stem sits in a tall block and the answer rows are spaced out, so a
  // question plus all four options always exceeds one screen height. No
  // single screenshot can capture a whole question.
  qText: { fontSize: '18px', fontWeight: 600, color: INK, marginBottom: '12vh', lineHeight: 1.45, minHeight: '48vh', display: 'flex', alignItems: 'center' },

  // Answer rows are ruled lines with a real bubble, like a scantron.
  bubbleRow: { display: 'flex', alignItems: 'center', gap: '16px', width: '100%', minHeight: '11vh', boxSizing: 'border-box', padding: '11px 12px', marginBottom: '14px', border: `1px solid ${LINE}`, borderLeft: `3px solid transparent`, borderRadius: 0, background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: SANS, fontSize: '15px', color: INK },
  bubbleRowSelected: { borderColor: INK, borderLeftColor: INK, background: '#fff' },
  bubbleRowCorrect: { borderColor: GREEN, borderLeftColor: GREEN, background: GREEN_BG },
  bubbleRowWrong: { borderColor: RED, borderLeftColor: RED, background: '#F7E7E5' },
  bubble: { flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: '13px', color: INK_SOFT, background: '#fff' },
  bubbleSelected: { borderColor: INK, background: INK, color: '#fff' },
  bubbleCorrect: { borderColor: GREEN, background: GREEN, color: '#fff' },
  bubbleWrong: { borderColor: RED, background: RED, color: '#fff' },

  scoreBox: { textAlign: 'center' },
  scoreNum: { fontFamily: MONO, fontSize: '46px', fontWeight: 700, color: INK, margin: '10px 0', letterSpacing: '1px' },
  competencyTag: { display: 'inline-block', fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: INK_SOFT, border: `1px solid ${RULE}`, padding: '3px 8px', borderRadius: 0, marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' },
  error: { color: RED_DARK, fontSize: '14px', marginBottom: '14px', lineHeight: 1.4, borderLeft: `3px solid ${RED}`, paddingLeft: '10px' },
  flashcard: { minHeight: '210px', border: `1px solid ${RULE}`, borderTop: `3px solid ${INK}`, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '28px', cursor: 'pointer', fontSize: '17px', marginBottom: '16px', background: '#fff', color: INK },
  flashcardBack: { background: GREEN_BG, borderColor: GREEN, borderTopColor: GREEN },
  flashcardTerm: { fontSize: '23px', fontWeight: 700, fontFamily: SANS },
  missedItem: { padding: '13px 0 13px 12px', borderTop: `1px solid ${LINE}`, borderLeft: `3px solid ${RULE}`, borderRadius: 0, marginBottom: '10px', textAlign: 'left', background: 'transparent' },
  navRow: { display: 'flex', gap: '10px' },
  levelTag: { display: 'inline-block', fontFamily: MONO, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 8px', borderRadius: 0, marginBottom: '10px' },
  levelFoundational: { color: GREEN, background: GREEN_BG },
  levelIntermediate: { color: GOLD_TEXT, background: GOLD_BG },
  levelObscure: { color: RED_DARK, background: '#F7E7E5' },
  summaryText: { fontSize: '15px', lineHeight: '1.7', color: INK, whiteSpace: 'pre-wrap', marginBottom: '22px' },
  boxTag: { fontFamily: MONO, fontSize: '10px', color: INK_SOFT, marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' },
};


function rowToQuestion(row) {
  const letterToIndex = { a: 0, b: 1, c: 2, d: 3 };
  return {
    id: row.id,
    q: row.question_text,
    options: [row.option_a, row.option_b, row.option_c, row.option_d],
    answer: letterToIndex[(row.correct_answer || '').toLowerCase().trim()] ?? 0,
    competency: row.competency || 'General',
    explanation: row.explanation || '',
    difficulty: row.difficulty || 'medium',
  };
}

// Picks the hardest available questions first, so AI generation is always
// calibrated against real SLC-level material when it exists, instead of
// whatever happens to be first in Supabase's default row order.
// Fisher-Yates. Without this a practice set came back in whatever order
// Supabase happened to return, which meant the same questions in the same
// sequence every session: a student ends up learning positions rather than
// content, and never reaches the back of a large pool.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A practice set is capped so a big pool doesn't turn into an endless
// session. Real objective tests run about 100 questions; this is practice,
// so a shorter set that can be finished in one sitting is more useful.
const SESSION_SIZE = 25;

const DIFFICULTY_RANK = { hard: 0, medium: 1, easy: 2 };
function pickHardestExamples(pool, count) {
  return [...pool]
    .sort((a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1))
    .slice(0, count);
}



// Every call to our own /api routes carries the signed-in student's token.
// The server rejects anything without a valid one, so a stranger who finds
// the API address cannot run up the Anthropic bill.
async function authedFetch(url, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session expired. Sign in again.');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Your session expired. Sign in again.');
  if (res.status === 429) throw new Error('Too many requests in a row. Wait a minute and try again.');
  return res;
}

async function logResponse({ studentName, studentEmail, event, q, selectedIndex }) {
  const letters = ['a', 'b', 'c', 'd'];
  try {
    await supabase.from('responses').insert({
      student_name: studentName,
      student_email: studentEmail,
      event,
      question_text: q.q,
      competency: q.competency,
      selected_answer: letters[selectedIndex],
      correct_answer: letters[q.answer],
      is_correct: selectedIndex === q.answer,
    });
  } catch (err) {
    console.error('Failed to log response:', err);
  }
}

async function logMastery({ student, q, selectedIndex, correct }) {
  const letters = ['a', 'b', 'c', 'd'];
  try {
    if (q.id) {
      const { data: existing } = await supabase
        .from('missed_questions')
        .select('*')
        .eq('student_email', student.email)
        .eq('question_id', q.id)
        .maybeSingle();

      if (!correct) {
        if (existing) {
          await supabase.from('missed_questions').update({
            box: 1,
            times_missed: existing.times_missed + 1,
            times_correct_since_last_miss: 0,
            next_review: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
            last_result: 'incorrect',
            last_selected_answer: letters[selectedIndex],
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id);
        } else {
          await supabase.from('missed_questions').insert({
            student_email: student.email,
            question_id: q.id,
            event: student.event,
            competency: q.competency,
            box: 1,
            times_missed: 1,
            next_review: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
            last_result: 'incorrect',
            last_selected_answer: letters[selectedIndex],
          });
        }
      } else if (existing) {
        const newBox = Math.min(existing.box + 1, 5);
        const minutes = REVIEW_INTERVALS_MIN[newBox];
        await supabase.from('missed_questions').update({
          box: newBox,
          times_correct_since_last_miss: existing.times_correct_since_last_miss + 1,
          next_review: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
          last_result: 'correct',
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      }
    }

    const { data: masteryRow } = await supabase
      .from('competency_mastery')
      .select('*')
      .eq('student_email', student.email)
      .eq('event', student.event)
      .eq('competency', q.competency)
      .maybeSingle();

    const totalAttempts = (masteryRow?.total_attempts || 0) + 1;
    const totalCorrect = (masteryRow?.total_correct || 0) + (correct ? 1 : 0);
    const masteryScore = totalCorrect / totalAttempts;

    await supabase.from('competency_mastery').upsert({
      student_email: student.email,
      event: student.event,
      competency: q.competency,
      total_attempts: totalAttempts,
      total_correct: totalCorrect,
      mastery_score: masteryScore,
      last_practiced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_email,event,competency' });
  } catch (err) {
    console.error('Failed to log mastery/missed question:', err);
  }
}
// Minutes until next review, keyed by the box the card is entering.
// Early boxes are short so progress is visible the same session;
// later boxes stretch out to real day-scale spacing.
const REVIEW_INTERVALS_MIN = { 1: 2, 2: 15, 3: 60, 4: 60 * 24, 5: 60 * 24 * 7 };

// Grouped in the order a student actually moves through them: take the
// material in, drill it, go back over what went wrong, then see where they
// stand. The old per-tile tags (TRACK, QUIZ, CARDS...) were dropped; the
// headings carry that job now and the titles already say the rest.
const MENU_SECTIONS = [
  {
    heading: 'Study',
    items: [
      { key: 'learn', title: 'Learn a Concept', desc: 'Read through one competency area' },
      { key: 'vocab', title: 'Vocabulary Flashcards', desc: 'Flashcards that bring back the terms you keep missing' },
    ],
  },
  {
    heading: 'Practice',
    items: [
      { key: 'quiz-mixed', title: 'Mixed Practice', desc: 'Random questions from across the whole event' },
      { key: 'quiz-competency', title: 'Practice by Competency', desc: 'Drill a single competency area' },
      { key: 'ai-fresh', title: 'Fresh AI Practice Set', desc: 'New questions written to match the real ones' },
    ],
  },
  {
    heading: 'Review',
    items: [
      { key: 'review-mistakes', title: 'Review Your Mistakes', desc: 'Go back over questions you got wrong' },
    ],
  },
  {
    heading: 'Progress',
    items: [
      { key: 'progress', title: 'My Progress', desc: 'Where you are strong, and what to work on' },
    ],
  },
];

export default function App() {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [student, setStudent] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [allQuestions, setAllQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [screen, setScreen] = useState('home');
  const [pendingAction, setPendingAction] = useState(null);

  const [competencyFilter, setCompetencyFilter] = useState('All');
  const [questions, setQuestions] = useState([]);
  const [isAiSet, setIsAiSet] = useState(false);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const [learnCompetency, setLearnCompetency] = useState('');
  const [learnSummary, setLearnSummary] = useState('');
  const [learningLoading, setLearningLoading] = useState(false);
  const [learnError, setLearnError] = useState('');

  const [vocabCompetency, setVocabCompetency] = useState('');
  const [vocabQueue, setVocabQueue] = useState([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabError, setVocabError] = useState('');
  const [vocabCurrent, setVocabCurrent] = useState(0);
  const [vocabFlipped, setVocabFlipped] = useState(false);
  const [vocabNextDue, setVocabNextDue] = useState(null);
  const [vocabSessionCount, setVocabSessionCount] = useState(0);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewCurrent, setReviewCurrent] = useState(0);
  const [reviewSelected, setReviewSelected] = useState(null);
  const [reviewSessionCount, setReviewSessionCount] = useState(0);
  const [reviewExplanation, setReviewExplanation] = useState('');
  const [reviewExplanationLoading, setReviewExplanationLoading] = useState(false);
  const [masteryData, setMasteryData] = useState([]);
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [masteryError, setMasteryError] = useState('');
  const [conferenceDates, setConferenceDates] = useState([]);
  const [catalogEvents, setCatalogEvents] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCatalogEvent, setSelectedCatalogEvent] = useState(null);
  const [catalogDemoQuestions, setCatalogDemoQuestions] = useState([]);

  // Loads the student record belonging to the signed-in account.
  // Row Level Security in the database guarantees this can only ever
  // return that one student's own row.
  const loadOwnStudentRow = async (email) => {
    // Filtering by email explicitly, rather than relying on the database
    // policies alone, means this works whether or not Row Level Security
    // has been switched on yet. Without the filter this breaks while RLS
    // is still off, because the query comes back with every student.
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      return { error: 'Something went wrong loading your account: ' + error.message };
    }
    if (!data) {
      return { error: "Your sign-in worked, but you're not on the student list yet. Reach out to get added." };
    }
    return { student: data };
  };

  // If the student signed in earlier and hasn't signed out, pick that back up
  // instead of making them type their password again.
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        const result = await loadOwnStudentRow(session.user.email);
        if (cancelled) return;
        if (result.student) setStudent(result.student);
        else await supabase.auth.signOut();
      }
      setCheckingSession(false);
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async () => {
    const email = emailInput.trim();
    if (email.length === 0 || passwordInput.length === 0) {
      setLoginError('Enter both your email and your password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });

    if (authError) {
      // Deliberately vague. Saying which half was wrong would let someone
      // confirm whether a given classmate has an account.
      setLoginError("That email and password don't match. Reach out if you need your password reset.");
      setLoginLoading(false);
      return;
    }

    const result = await loadOwnStudentRow(email);
    if (result.error) {
      await supabase.auth.signOut();
      setLoginError(result.error);
      setLoginLoading(false);
      return;
    }

    setPasswordInput('');
    setStudent(result.student);
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStudent(null);
    setEmailInput('');
    setPasswordInput('');
    setScreen('menu');
  };

  useEffect(() => {
    if (!student || !student.active || !student.event) return;
    async function loadQuestions() {
      setLoadingQuestions(true);
      setLoadError('');
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('event', student.event);

      if (error) {
        setLoadError('Could not load questions from the database: ' + error.message);
        setLoadingQuestions(false);
        return;
      }
      if (!data || data.length === 0) {
        setLoadError(`No questions found yet for "${student.event}". Check back once questions are added for this event.`);
        setLoadingQuestions(false);
        return;
      }
      setAllQuestions(data.map(rowToQuestion));
      setLoadingQuestions(false);
    }
    loadQuestions();
  }, [student]);

  useEffect(() => {
    if (!student) return;
    async function loadConferenceDates() {
      const { data, error } = await supabase
        .from('conference_dates')
        .select('*');
      if (!error && data) {
        setConferenceDates(data);
      }
    }
    loadConferenceDates();
  }, [student]);

  useEffect(() => {
    if (!student) return;
    if (student.active && student.event) return;
    if (catalogEvents.length > 0) return;
    loadEventCatalog();
  }, [student]);

  const competencies = Array.from(new Set(allQuestions.map(q => q.competency)));

  const resetSessionState = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setMissed([]);
    setIsAiSet(false);
    setGenError('');
  };

  const practiceCompetency = (competencyName) => {
    setCompetencyFilter(competencyName);
    setQuestions(allQuestions.filter(q => q.competency === competencyName));
    resetSessionState();
    setScreen('quiz');
  };

  const goHome = () => {
    setScreen('home');
    resetSessionState();
  };

const handleMenuClick = (key) => {
    if (key === 'quiz-mixed') {
      setQuestions(shuffle(allQuestions).slice(0, SESSION_SIZE));
      resetSessionState();
      setScreen('quiz');
    } else if (key === 'quiz-competency') {
      setPendingAction(key);
      setScreen('pickCompetency');
    } else if (key === 'learn') {
setScreen('learnPick');
    } else if (key === 'vocab') {
      setScreen('vocabPick');
    } else if (key === 'ai-fresh') {
      startAiFreshSet();
    } else if (key === 'review-mistakes') {
      startReviewSession();
    } else if (key === 'progress') {
      loadMasteryData();
    }
  };

  const confirmCompetencyPick = () => {
    const filtered = competencyFilter === 'All'
      ? allQuestions
      : allQuestions.filter(q => q.competency === competencyFilter);
    setQuestions(shuffle(filtered).slice(0, SESSION_SIZE));
    resetSessionState();
    setScreen('quiz');
  };

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const q = questions[current];
    const correct = i === q.answer;
    if (correct) setScore(s => s + 1);
    else setMissed(m => [...m, q]);
    logResponse({ studentName: student.full_name, studentEmail: student.email, event: student.event, q, selectedIndex: i });
    logMastery({ student, q, selectedIndex: i, correct });
  };

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setScreen('quizFinished');
    }
  };

  const retakeSameSet = () => {
    resetSessionState();
    setScreen('quiz');
  };

  const startAiFreshSet = async () => {
    setScreen('quiz');
    setGenerating(true);
    setGenError('');
    resetSessionState();
    try {
      const res = await authedFetch('/api/generate-questions', { examples: pickHardestExamples(allQuestions, 8), count: 10, event: student.event });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('AI did not return usable questions. Try again.');
      }
      const withCompetency = data.map(d => ({ ...d, competency: d.competency || 'AI Generated' }));
      setQuestions(withCompetency);
      setIsAiSet(true);
    } catch (err) {
      setGenError(err.message || 'Something went wrong generating questions.');
    } finally {
      setGenerating(false);
    }
  };

  const fetchConceptSummary = async () => {
    if (!learnCompetency) return;
    setLearningLoading(true);
    setLearnError('');
    setLearnSummary('');
    try {
      const examples = pickHardestExamples(allQuestions.filter(q => q.competency === learnCompetency), 6);
      const res = await authedFetch('/api/explain-competency', { competency: learnCompetency, examples, event: student.event });
      const data = await res.json();
      if (!data.summary) throw new Error('Could not generate a summary. Try again.');
      setLearnSummary(data.summary);
      setScreen('learnResult');
    } catch (err) {
      setLearnError(err.message || 'Something went wrong.');
    } finally {
      setLearningLoading(false);
    }
  };

  // Loads (or creates, once, cached forever) the term bank for a competency,
  // then builds today's review queue from this student's personal progress.
  const startVocabSession = async () => {
    if (!vocabCompetency) return;
    setVocabLoading(true);
    setVocabError('');
    try {
      let { data: terms, error: termsErr } = await supabase
        .from('vocab_terms')
        .select('*')
        .eq('event', student.event)
        .eq('competency', vocabCompetency);

      if (termsErr) throw new Error('Could not load vocabulary terms: ' + termsErr.message);

      if (!terms || terms.length === 0) {
        const examples = pickHardestExamples(allQuestions.filter(q => q.competency === vocabCompetency), 6);
        const res = await authedFetch('/api/generate-vocab', { competency: vocabCompetency, event: student.event, examples });
        const generated = await res.json();
        if (!Array.isArray(generated) || generated.length === 0) {
          throw new Error('Could not generate vocabulary terms. Try again.');
        }
        const toInsert = generated.map(g => ({
          event: student.event,
          competency: vocabCompetency,
          term: g.term,
          definition: g.definition,
          level: g.level || 'intermediate',
        }));
        const { data: inserted, error: insertErr } = await supabase
          .from('vocab_terms')
          .insert(toInsert)
          .select();
        if (insertErr) throw new Error('Could not save vocabulary terms: ' + insertErr.message);
        terms = inserted;
      }

      const { data: progressRows, error: progressErr } = await supabase
        .from('vocab_progress')
        .select('*')
        .eq('student_email', student.email)
        .in('vocab_term_id', terms.map(t => t.id));

      if (progressErr) throw new Error('Could not load your progress: ' + progressErr.message);

      const progressByTermId = {};
      (progressRows || []).forEach(p => { progressByTermId[p.vocab_term_id] = p; });

      const now = new Date();
      const merged = terms.map(t => {
        const p = progressByTermId[t.id];
        return {
          termId: t.id,
          term: t.term,
          definition: t.definition,
          level: t.level,
          box: p ? p.box : 1,
          nextReview: p ? new Date(p.next_review) : now,
        };
      });

      const due = merged
        .filter(c => c.nextReview <= now)
        .sort((a, b) => a.box - b.box || a.nextReview - b.nextReview)
        .slice(0, 15);

      if (due.length === 0) {
        const soonest = merged.reduce((min, c) => (!min || c.nextReview < min ? c.nextReview : min), null);
        setVocabNextDue(soonest);
        setVocabQueue([]);
        setScreen('vocabEmpty');
        setVocabLoading(false);
        return;
      }

      setVocabQueue(due);
      setVocabSessionCount(due.length);
      setVocabCurrent(0);
      setVocabFlipped(false);
      setScreen('vocabCards');
    } catch (err) {
      setVocabError(err.message || 'Something went wrong.');
    } finally {
      setVocabLoading(false);
    }
  };

  const markVocabCard = async (gotIt) => {
    const card = vocabQueue[vocabCurrent];
    const newBox = gotIt ? Math.min(card.box + 1, 5) : 1;
    const minutes = REVIEW_INTERVALS_MIN[newBox];
    const nextReview = new Date(Date.now() + minutes * 60 * 1000);

    try {
      await supabase.from('vocab_progress').upsert(
        {
          student_email: student.email,
          vocab_term_id: card.termId,
          box: newBox,
          next_review: nextReview.toISOString(),
          last_result: gotIt ? 'got_it' : 'still_learning',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_email,vocab_term_id' }
      );
    } catch (err) {
      console.error('Failed to save vocab progress:', err);
    }

    if (vocabCurrent + 1 < vocabQueue.length) {
      setVocabCurrent(c => c + 1);
      setVocabFlipped(false);
    } else {
      setScreen('vocabDone');
    }
  };

  const startReviewSession = async () => {
    setReviewLoading(true);
    setReviewError('');
    try {
      const nowIso = new Date().toISOString();
      const { data: missedRows, error: missedErr } = await supabase
        .from('missed_questions')
        .select('*')
        .eq('student_email', student.email)
        .eq('event', student.event)
        .lte('next_review', nowIso)
        .order('box', { ascending: true });

      if (missedErr) throw new Error('Could not load your review queue: ' + missedErr.message);

      if (!missedRows || missedRows.length === 0) {
        setReviewQueue([]);
        setScreen('reviewEmpty');
        setReviewLoading(false);
        return;
      }

      const validMissedRows = missedRows.filter(r => r.question_id);
      const questionIds = validMissedRows.map(r => r.question_id);
      const { data: questionRows, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (qErr) throw new Error('Could not load question details: ' + qErr.message);

      const questionById = {};
      (questionRows || []).forEach(row => { questionById[row.id] = rowToQuestion(row); });

      const queue = validMissedRows
        .map(r => {
          const q = questionById[r.question_id];
          if (!q) return null;
          return { ...q, missedRowId: r.id, box: r.box, timesMissed: r.times_missed };
        })
        .filter(Boolean)
        .slice(0, 15);

      if (queue.length === 0) {
        setReviewQueue([]);
        setScreen('reviewEmpty');
        setReviewLoading(false);
        return;
      }

      setReviewQueue(queue);
      setReviewSessionCount(queue.length);
      setReviewCurrent(0);
      setReviewSelected(null);
      setScreen('reviewQuiz');
    } catch (err) {
      setReviewError(err.message || 'Something went wrong.');
    } finally {
      setReviewLoading(false);
    }
  };

  const loadMasteryData = async () => {
    setMasteryLoading(true);
    setMasteryError('');
    try {
      const { data, error } = await supabase
        .from('competency_mastery')
        .select('*')
        .eq('student_email', student.email)
        .eq('event', student.event)
        .order('mastery_score', { ascending: true });

      if (error) throw new Error('Could not load your progress: ' + error.message);

      setMasteryData(data || []);
      setScreen('progress');
    } catch (err) {
      setMasteryError(err.message || 'Something went wrong.');
      setScreen('progress');
    } finally {
      setMasteryLoading(false);
    }
  };

  const loadEventCatalog = async () => {
    setCatalogLoading(true);
    try {
      const { data } = await supabase
        .from('event_catalog')
        .select('*')
        .order('event_name', { ascending: true });
      setCatalogEvents(data || []);
      setScreen('catalog');
    } finally {
      setCatalogLoading(false);
    }
  };

  const openCatalogEvent = async (event) => {
    setSelectedCatalogEvent(event);
    const { data } = await supabase
      .from('demo_questions')
      .select('*')
      .eq('event_name', event.event_name)
      .limit(5);
    setCatalogDemoQuestions(data || []);
    setScreen('catalogDetail');
  };

  const handleReviewAnswer = (i) => {
    if (reviewSelected !== null) return;
    setReviewSelected(i);
    const q = reviewQueue[reviewCurrent];
    const correct = i === q.answer;
    logMastery({ student, q, selectedIndex: i, correct });
    fetchReviewExplanation();
  };

  const handleReviewNext = () => {
    if (reviewCurrent + 1 < reviewQueue.length) {
      setReviewCurrent(c => c + 1);
      setReviewExplanation('');
      setReviewSelected(null);
    } else {
      setScreen('reviewDone');
    }
  };

  const fetchReviewExplanation = async () => {
    const q = reviewQueue[reviewCurrent];
    if (q.explanation) {
      setReviewExplanation(q.explanation);
      return;
    }
    setReviewExplanationLoading(true);
    try {
      const res = await authedFetch('/api/explain-missed-question', {
        question: q.q,
        options: q.options,
        correctAnswer: q.answer,
        event: student.event,
        competency: q.competency,
      });
      const data = await res.json();
      const text = data.explanation || 'Could not generate an explanation right now.';
      setReviewExplanation(text);

      await supabase.from('questions').update({ explanation: text }).eq('id', q.id);
      setReviewQueue(prev => prev.map((item, i) => i === reviewCurrent ? { ...item, explanation: text } : item));
    } catch (err) {
      setReviewExplanation('Could not load an explanation right now.');
    } finally {
      setReviewExplanationLoading(false);
    }
  };

  // ---- Login ----
  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.eyebrow}>MRHS FBLA PREP</div>
          <div style={styles.title}>Loading</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.eyebrow}>MRHS FBLA PREP</div>
          <div style={styles.title}>Sign in</div>
          <div style={styles.subtitle}>Sign in with the email and password set up for you. Your assigned event loads automatically and cannot be changed here.</div>
          <input
            style={styles.input}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <input
            style={styles.input}
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {loginError && <div style={styles.error}>{loginError}</div>}
          <button
            style={{ ...styles.button, ...(loginLoading ? styles.buttonDisabled : {}) }}
            onClick={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? 'Checking' : 'Start'}
          </button>
        </div>
      </div>
    );
  }

  const Header = () => (
    <div style={styles.header}>
      <div style={styles.headerLogo}>MRHS FBLA PREP</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={styles.headerTag}>{student.full_name.toUpperCase()}</div>
        <button style={styles.signOut} onClick={handleLogout}>SIGN OUT</button>
      </div>
    </div>
  );

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = target - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const CountdownStrip = () => (
    <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '560px', marginBottom: '18px' }}>
      {['RLC', 'SLC', 'NLC'].map(type => {
        const conf = conferenceDates.find(c => c.conference_type === type);
        const days = conf && conf.is_confirmed ? daysUntil(conf.start_date) : null;
        return (
          <div key={type} style={{ flex: 1, background: CARD, border: `1px solid ${RULE}`, borderTop: `3px solid ${INK}`, borderRadius: 0, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: INK, letterSpacing: '1.5px', marginBottom: '4px' }}>{type}</div>
            {days !== null ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: '20px', fontWeight: 700, color: days < 0 ? INK_SOFT : ACCENT }}>{days < 0 ? 'Past' : days}</div>
                <div style={{ fontSize: '10px', color: INK_SOFT }}>{days < 0 ? '' : 'days'}</div>
              </>
            ) : (
              <div style={{ fontFamily: MONO, fontSize: '13px', color: INK_SOFT, marginTop: '6px' }}>TBA</div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (loadingQuestions) {
    return <div style={styles.page}><Header /><div style={styles.card}><div style={styles.title}>Loading questions</div></div></div>;
  }

  if (loadError) {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.title}>Couldn't load questions</div>
          <div style={styles.error}>{loadError}</div>
        </div>
      </div>
    );
  }

  if (screen === 'home') {
    return (
      <div style={styles.page}>
        <Header />
        <CountdownStrip />
        <div style={styles.card}>
          <div style={styles.eyebrow}>{student.event}</div>
          <div style={styles.title}>What do you want to study?</div>
          <div style={{ marginTop: '18px' }}>
            {MENU_SECTIONS.map(section => (
              <div key={section.heading} style={styles.menuSection}>
                <div style={styles.sectionHeading}>{section.heading}</div>
                {section.items.map(item => (
                  <div key={item.key} style={styles.menuTile} onClick={() => handleMenuClick(item.key)}>
                    <div style={styles.menuTitle}>{item.title}</div>
                    <div style={styles.menuDesc}>{item.desc}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'pickCompetency') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.title}>Choose a competency</div>
          <select style={styles.select} value={competencyFilter} onChange={e => setCompetencyFilter(e.target.value)}>
            <option value="All">All Competencies</option>
            {competencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={styles.button} onClick={confirmCompetencyPick}>Continue</button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'learnPick') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.title}>Learn a concept</div>
          <div style={styles.subtitle}>Pick a competency area for a written study summary.</div>
          <select style={styles.select} value={learnCompetency} onChange={e => setLearnCompetency(e.target.value)}>
            <option value="">Select a competency</option>
            {competencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {learnError && <div style={styles.error}>{learnError}</div>}
          <button
            style={{ ...styles.button, ...(learningLoading || !learnCompetency ? styles.buttonDisabled : {}) }}
            onClick={fetchConceptSummary}
            disabled={learningLoading || !learnCompetency}
          >
            {learningLoading ? 'Writing summary' : 'Get summary'}
          </button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'learnResult') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.competencyTag}>{learnCompetency}</div>
          <div style={styles.title}>Concept summary</div>
          <div style={styles.summaryText}>{learnSummary}</div>
          <button style={styles.buttonSecondary} onClick={() => setScreen('learnPick')}>Pick another competency</button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'vocabPick') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.title}>Vocabulary flashcards</div>
          <div style={styles.subtitle}>Terms you struggle with come back sooner. Terms you know well space out further apart, so pick a competency and this will feel different every session.</div>
          <select style={styles.select} value={vocabCompetency} onChange={e => setVocabCompetency(e.target.value)}>
            <option value="">Select a competency</option>
            {competencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {vocabError && <div style={styles.error}>{vocabError}</div>}
          <button
            style={{ ...styles.button, ...(vocabLoading || !vocabCompetency ? styles.buttonDisabled : {}) }}
            onClick={startVocabSession}
            disabled={vocabLoading || !vocabCompetency}
          >
            {vocabLoading ? 'Loading' : 'Start review'}
          </button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'vocabEmpty') {
    const when = vocabNextDue ? vocabNextDue.toLocaleString() : null;
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.competencyTag}>{vocabCompetency}</div>
          <div style={styles.title}>Nothing due right now</div>
          <div style={styles.subtitle}>
            {when
              ? `You've reviewed everything in this competency for now. The next card comes due around ${when}.`
              : "You've reviewed everything in this competency for now. Check back later."}
          </div>
          <button style={styles.buttonSecondary} onClick={() => setScreen('vocabPick')}>Pick another competency</button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'vocabDone') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={{ ...styles.card, ...styles.scoreBox }}>
          <div style={styles.competencyTag}>{vocabCompetency}</div>
          <div style={styles.title}>Session complete</div>
          <div style={styles.subtitle}>You reviewed {vocabSessionCount} card{vocabSessionCount === 1 ? '' : 's'}. Terms you marked "still learning" will come back soon.</div>
          <button style={styles.buttonSecondary} onClick={startVocabSession}>Review again</button>
          <button style={styles.buttonSecondary} onClick={() => setScreen('vocabPick')}>Pick another competency</button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'vocabCards') {
    const card = vocabQueue[vocabCurrent];
    if (!card) return null;
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.competencyTag}>{vocabCompetency}</div>
          <div style={styles.progress}>CARD {vocabCurrent + 1} OF {vocabQueue.length}</div>
          {card.level && (
            <div
              style={{
                ...styles.levelTag,
                ...(card.level === 'foundational' ? styles.levelFoundational
                  : card.level === 'obscure' ? styles.levelObscure
                  : styles.levelIntermediate),
              }}
            >
              {card.level}
            </div>
          )}
          <div
            style={{ ...styles.flashcard, ...(vocabFlipped ? styles.flashcardBack : {}) }}
            onClick={() => setVocabFlipped(f => !f)}
          >
            {vocabFlipped ? <span>{card.definition}</span> : <span style={styles.flashcardTerm}>{card.term}</span>}
          </div>
          <div style={{ fontSize: '13px', color: INK_SOFT, textAlign: 'center', marginBottom: '18px' }}>
            Tap the card to {vocabFlipped ? 'see the term again' : 'reveal the definition'}
          </div>
          {vocabFlipped ? (
            <div style={styles.navRow}>
              <button style={styles.buttonSecondary} onClick={() => markVocabCard(false)}>Still learning</button>
              <button style={styles.buttonGreen} onClick={() => markVocabCard(true)}>Got it</button>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: INK_SOFT, textAlign: 'center' }}>&nbsp;</div>
          )}
          <button style={{ ...styles.buttonSecondary, marginTop: '4px' }} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }


if (screen === 'progress') {
    if (masteryLoading) {
      return <div style={styles.page}><Header /><div style={styles.card}><div style={styles.title}>Loading your progress</div></div></div>;
    }
    if (masteryError) {
      return (
        <div style={styles.page}>
          <Header />
          <div style={styles.card}>
            <div style={styles.title}>Couldn't load progress</div>
            <div style={styles.error}>{masteryError}</div>
            <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
          </div>
        </div>
      );
    }
    const overallAttempts = masteryData.reduce((sum, m) => sum + m.total_attempts, 0);
    const overallCorrect = masteryData.reduce((sum, m) => sum + m.total_correct, 0);
    const overallScore = overallAttempts > 0 ? overallCorrect / overallAttempts : 0;

    const tierFor = (score) => {
      if (score >= 0.8) return { label: 'Strong', color: GREEN, bg: GREEN_BG };
      if (score >= 0.5) return { label: 'Developing', color: GOLD_TEXT, bg: GOLD_BG };
      return { label: 'Needs Work', color: RED_DARK, bg: '#F7E7E5' };
    };

    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.eyebrow}>{student.event}</div>
          <div style={styles.title}>Your progress</div>

          {masteryData.length === 0 ? (
            <div style={styles.subtitle}>No practice data yet. Take a quiz to start building your progress here.</div>
          ) : (
            <>
              <div style={{ marginBottom: '20px', padding: '18px', border: `1px solid ${LINE}`, borderRadius: '4px', background: '#fff' }}>
                <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: INK_SOFT, letterSpacing: '0.5px', marginBottom: '6px' }}>OVERALL ACCURACY</div>
                <div style={styles.scoreNum}>{Math.round(overallScore * 100)}%</div>
                <div style={{ fontSize: '13px', color: INK_SOFT }}>{overallCorrect} correct out of {overallAttempts} attempts</div>
              </div>

              <div style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: INK, marginBottom: '10px', letterSpacing: '0.5px' }}>BY COMPETENCY</div>
              {masteryData.map(m => {
                const tier = tierFor(m.mastery_score);
                return (
                  <div key={m.id} style={{ padding: '14px', border: `1px solid ${LINE}`, borderRadius: '4px', marginBottom: '10px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, color: INK, fontSize: '14px' }}>{m.competency}</div>
                      <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: tier.color, background: tier.bg, padding: '3px 9px', borderRadius: '999px', letterSpacing: '0.5px' }}>{tier.label.toUpperCase()}</div>
                    </div>
                    <div style={{ height: '8px', background: PAPER, borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ height: '100%', width: `${Math.round(m.mastery_score * 100)}%`, background: tier.color }} />
                    </div>
                    <div style={{ fontSize: '12px', color: INK_SOFT, marginBottom: '10px' }}>{Math.round(m.mastery_score * 100)}% accuracy &middot; {m.total_attempts} attempt{m.total_attempts === 1 ? '' : 's'}</div>
                    <button
                      style={{
                        width: '100%', padding: '9px', fontSize: '12px', fontWeight: 700,
                        color: m.mastery_score < 0.5 ? '#fff' : INK,
                        background: m.mastery_score < 0.5 ? RED : 'transparent',
                        border: m.mastery_score < 0.5 ? 'none' : `1px solid ${LINE}`,
                        borderRadius: '3px', cursor: 'pointer', fontFamily: MONO,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                      }}
                      onClick={() => practiceCompetency(m.competency)}
                    >
                      Practice this
                    </button>
                  </div>
                );
              })}
            </>
          )}

          <button style={{ ...styles.buttonSecondary, marginTop: '10px' }} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'catalog') {
    if (catalogLoading) {
      return <div style={styles.page}><Header /><div style={styles.card}><div style={styles.title}>Loading events</div></div></div>;
    }
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          {(!student.active || !student.event) && (
            <div style={{ marginBottom: '18px', padding: '14px', border: `1px solid ${GOLD}`, borderRadius: '4px', background: GOLD_BG }}>
              <div style={{ fontWeight: 700, color: INK, marginBottom: '4px' }}>
                {!student.active ? "Your account is no longer active for full practice." : "You haven't been assigned a competitive event yet."}
              </div>
              <div style={{ fontSize: '13px', color: INK_SOFT }}>
                {!student.active
                  ? "You can still browse event information below."
                  : "Once your event is assigned, you'll get full practice access for it. In the meantime, explore what FBLA has to offer below."}
              </div>
            </div>
          )}
          <div style={styles.title}>Explore FBLA Events</div>
          <div style={styles.subtitle}>Browse every competitive event and see a few sample questions.</div>
          {catalogEvents.map(ev => (
            <div key={ev.id} style={styles.menuTile} onClick={() => openCatalogEvent(ev)}>
              <div style={styles.menuTag}>{ev.category?.toUpperCase()}</div>
              <div style={styles.menuTitle}>{ev.event_name}</div>
              <div style={styles.menuDesc}>{ev.overview}</div>
            </div>
          ))}
          {student.active && student.event && (
            <button style={{ ...styles.buttonSecondary, marginTop: '10px' }} onClick={goHome}>Back to menu</button>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'catalogDetail') {
    if (!selectedCatalogEvent) return null;
    const letters = ['A', 'B', 'C', 'D'];
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.eyebrow}>{selectedCatalogEvent.category}</div>
          <div style={styles.title}>{selectedCatalogEvent.event_name}</div>
          <div style={styles.subtitle}>{selectedCatalogEvent.overview}</div>
          {catalogDemoQuestions.length > 0 && (
            <>
              <div style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: INK, marginBottom: '10px', letterSpacing: '0.5px' }}>SAMPLE QUESTIONS</div>
              {catalogDemoQuestions.map((q, i) => (
                <div key={q.id} style={styles.missedItem}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: INK }}>{q.question_text}</div>
                  {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, oi) => (
                    <div key={oi} style={{ fontSize: '13px', color: oi === ['a','b','c','d'].indexOf((q.correct_answer || '').toLowerCase()) ? GREEN : INK_SOFT, marginBottom: '2px' }}>
                      {letters[oi]}) {opt}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
          <button style={styles.buttonSecondary} onClick={() => setScreen('catalog')}>Back to all events</button>
        </div>
      </div>
    );
  }

  if (screen === 'reviewEmpty') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.title}>Nothing due for review right now</div>
          <div style={styles.subtitle}>You're all caught up. Missed questions come back here once they're due for review.</div>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'reviewDone') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={{ ...styles.card, ...styles.scoreBox }}>
          <div style={styles.title}>Review session complete</div>
          <div style={styles.subtitle}>You reviewed {reviewSessionCount} question{reviewSessionCount === 1 ? '' : 's'}. Questions you missed again will come back sooner than the ones you got right.</div>
          <button style={styles.buttonSecondary} onClick={startReviewSession}>Review again</button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'reviewQuiz') {
    if (reviewLoading) {
      return <div style={styles.page}><Header /><div style={styles.card}><div style={styles.title}>Loading your review queue</div></div></div>;
    }
    if (reviewError) {
      return (
        <div style={styles.page}>
          <Header />
          <div style={styles.card}>
            <div style={styles.title}>Couldn't load review queue</div>
            <div style={styles.error}>{reviewError}</div>
            <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
          </div>
        </div>
      );
    }
    const q = reviewQueue[reviewCurrent];
    if (!q) return null;
    const letters = ['A', 'B', 'C', 'D'];
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.competencyTag}>{q.competency}</div>
          <div style={styles.progress}>REVIEW {reviewCurrent + 1} OF {reviewQueue.length}</div>
          <div style={styles.qText}>{q.q}</div>
          <div>
            {q.options.map((opt, i) => {
              let rowStyle = { ...styles.bubbleRow };
              let bubbleStyle = { ...styles.bubble };
              if (reviewSelected !== null) {
                if (i === q.answer) { rowStyle = { ...rowStyle, ...styles.bubbleRowCorrect }; bubbleStyle = { ...bubbleStyle, ...styles.bubbleCorrect }; }
                else if (i === reviewSelected) { rowStyle = { ...rowStyle, ...styles.bubbleRowWrong }; bubbleStyle = { ...bubbleStyle, ...styles.bubbleWrong }; }
              } else if (i === reviewSelected) {
                rowStyle = { ...rowStyle, ...styles.bubbleRowSelected };
                bubbleStyle = { ...bubbleStyle, ...styles.bubbleSelected };
              }
              return (
                <button key={i} style={rowStyle} onClick={() => handleReviewAnswer(i)}>
                  <span style={bubbleStyle}>{letters[i]}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
          {reviewSelected !== null && (
            <div style={{ marginTop: '14px', marginBottom: '14px', padding: '16px', border: `1px solid ${LINE}`, borderRadius: '4px', background: GOLD_BG }}>
              <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: GOLD_TEXT, marginBottom: '8px', letterSpacing: '0.5px' }}>WHY</div>
              {reviewExplanationLoading ? (
                <div style={{ fontSize: '14px', color: INK_SOFT }}>Loading explanation...</div>
              ) : (
                <div style={{ fontSize: '14px', color: INK, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{reviewExplanation}</div>
              )}
            </div>
          )}{reviewSelected !== null && (
            <button style={{ ...styles.button, marginTop: '10px' }} onClick={handleReviewNext}>
              {reviewCurrent + 1 < reviewQueue.length ? 'Next question' : 'Finish review'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'quizFinished') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={{ ...styles.card, ...styles.scoreBox }}>
          {isAiSet && <div style={styles.competencyTag}>AI-GENERATED SET</div>}
          <div style={styles.title}>{student.full_name}, here's your score</div>
          <div style={styles.scoreNum}>{score} / {questions.length}</div>
          {missed.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              <div style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: INK, marginBottom: '10px', letterSpacing: '0.5px' }}>MISSED QUESTIONS</div>
              {missed.map((m, i) => (
                <div key={i} style={styles.missedItem}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: INK }}>{m.q}</div>
                  <div style={{ fontSize: '13px', color: GREEN }}>Correct answer: {m.options[m.answer]}</div>
                </div>
              ))}
            </div>
          )}
          <button style={styles.buttonSecondary} onClick={retakeSameSet}>Retake this set</button>
          <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
        </div>
      </div>
    );
  }

  if (screen === 'quiz') {
    if (generating) {
      return <div style={styles.page}><Header /><div style={styles.card}><div style={styles.title}>Generating fresh questions</div></div></div>;
    }
    if (genError) {
      return (
        <div style={styles.page}>
          <Header />
          <div style={styles.card}>
            <div style={styles.title}>Couldn't generate questions</div>
            <div style={styles.error}>{genError}</div>
            <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
          </div>
        </div>
      );
    }
    const q = questions[current];
    if (!q) {
      return (
        <div style={styles.page}>
          <Header />
          <div style={styles.card}>
            <div style={styles.title}>No questions in this set</div>
            <button style={styles.buttonSecondary} onClick={goHome}>Back to menu</button>
          </div>
        </div>
      );
    }
    const letters = ['A', 'B', 'C', 'D'];
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.card}>
          <div style={styles.sheetHead}>
            <div>
              <div style={styles.qOf}>QUESTION</div>
              <div style={styles.qNum}>{String(current + 1).padStart(2, '0')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.qOf}>OF {String(questions.length).padStart(2, '0')}</div>
              {isAiSet && <div style={{ ...styles.qOf, color: GOLD_TEXT }}>AI-GENERATED SET</div>}
            </div>
          </div>
          <div style={{ ...styles.competencyTag, marginTop: '12px' }}>{q.competency}</div>
          <div style={styles.qText}>{q.q}</div>
          <div>
            {q.options.map((opt, i) => {
              let rowStyle = { ...styles.bubbleRow };
              let bubbleStyle = { ...styles.bubble };
              if (selected !== null) {
                if (i === q.answer) { rowStyle = { ...rowStyle, ...styles.bubbleRowCorrect }; bubbleStyle = { ...bubbleStyle, ...styles.bubbleCorrect }; }
                else if (i === selected) { rowStyle = { ...rowStyle, ...styles.bubbleRowWrong }; bubbleStyle = { ...bubbleStyle, ...styles.bubbleWrong }; }
              } else if (i === selected) {
                rowStyle = { ...rowStyle, ...styles.bubbleRowSelected };
                bubbleStyle = { ...bubbleStyle, ...styles.bubbleSelected };
              }
              return (
                <button key={i} style={rowStyle} onClick={() => handleAnswer(i)}>
                  <span style={bubbleStyle}>{letters[i]}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <button style={{ ...styles.button, marginTop: '10px' }} onClick={handleNext}>
              {current + 1 < questions.length ? 'Next question' : 'See score'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

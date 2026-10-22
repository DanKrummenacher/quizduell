// TEMPORARY: realistic sample content for the design concepts (development only).

export interface MockQuestion {
  id: number;
  text: string;
  options: string[];
  correct: number;
  category: string;
  active: boolean;
  /** Share of correct answers in percent, null if never asked. */
  rate: number | null;
  asked: number;
}

export const QUESTIONS: MockQuestion[] = [
  {
    id: 1,
    text: 'Wie viele Kantone hat die Schweiz?',
    options: ['23', '24', '26', '28'],
    correct: 2,
    category: 'Schweiz',
    active: true,
    rate: 64,
    asked: 42,
  },
  {
    id: 2,
    text: 'Welches ist der höchste Berg der Schweiz?',
    options: ['Matterhorn', 'Dufourspitze', 'Eiger', 'Jungfrau'],
    correct: 1,
    category: 'Schweiz',
    active: true,
    rate: 38,
    asked: 37,
  },
  {
    id: 3,
    text: 'An welchem See liegt die Stadt Luzern?',
    options: ['Zürichsee', 'Genfersee', 'Vierwaldstättersee', 'Bodensee'],
    correct: 2,
    category: 'Schweiz',
    active: true,
    rate: 71,
    asked: 29,
  },
  {
    id: 4,
    text: 'In welcher Stadt steht das Bundeshaus?',
    options: ['Zürich', 'Bern', 'Genf', 'Luzern'],
    correct: 1,
    category: 'Schweiz',
    active: true,
    rate: 88,
    asked: 51,
  },
  {
    id: 13,
    text: 'Welche Farbe hat der Schweizer Pass?',
    options: ['Blau', 'Grün', 'Rot', 'Schwarz'],
    correct: 2,
    category: 'Schweiz',
    active: true,
    rate: 29,
    asked: 17,
  },
  {
    id: 5,
    text: 'Welche Zahl fehlt in der Reihe? 2, 4, 8, 16, ?',
    options: ['24', '30', '32', '64'],
    correct: 2,
    category: 'Logik',
    active: true,
    rate: 76,
    asked: 48,
  },
  {
    id: 6,
    text: 'Ein Hirte hat 17 Schafe. Alle ausser 9 laufen davon. Wie viele bleiben?',
    options: ['8', '9', '17', '0'],
    correct: 1,
    category: 'Logik',
    active: true,
    rate: 12,
    asked: 33,
  },
  {
    id: 7,
    text: 'Was wird nass, während es trocknet?',
    options: ['Wasser', 'Ein Handtuch', 'Ein Schwamm', 'Der Wind'],
    correct: 1,
    category: 'Logik',
    active: false,
    rate: 17,
    asked: 24,
  },
  {
    id: 8,
    text: 'Wofür steht die Abkürzung CPU?',
    options: [
      'Central Processing Unit',
      'Computer Power Unit',
      'Central Program Utility',
      'Core Processing Upload',
    ],
    correct: 0,
    category: 'Technik',
    active: true,
    rate: 81,
    asked: 39,
  },
  {
    id: 9,
    text: 'Wie viele Bits hat ein Byte?',
    options: ['4', '8', '16', '32'],
    correct: 1,
    category: 'Technik',
    active: true,
    rate: 93,
    asked: 44,
  },
  {
    id: 10,
    text: 'Was ist ein «Bug» in der Informatik?',
    options: [
      'Ein Fehler im Programm',
      'Ein neues Feature',
      'Ein schneller Prozessor',
      'Ein Virus',
    ],
    correct: 0,
    category: 'Technik',
    active: true,
    rate: null,
    asked: 0,
  },
  {
    id: 11,
    text: 'Wie heisst die Hauptstadt von Australien?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correct: 2,
    category: 'Allgemeinwissen',
    active: true,
    rate: 41,
    asked: 36,
  },
  {
    id: 12,
    text: 'Welches ist der grösste Planet unseres Sonnensystems?',
    options: ['Saturn', 'Jupiter', 'Neptun', 'Erde'],
    correct: 1,
    category: 'Allgemeinwissen',
    active: true,
    rate: 79,
    asked: 40,
  },
];

export const CATEGORIES = [
  { name: 'Allgemeinwissen', total: 6, active: 6, rate: 58 },
  { name: 'Logik', total: 13, active: 12, rate: 41 },
  { name: 'Schweiz', total: 5, active: 5, rate: 63 },
  { name: 'Technik', total: 8, active: 8, rate: 79 },
];

export const LIVE = {
  devices: 6,
  duels: 2,
  searching: 1,
  today: 84,
  total: 1213,
  rate: 58,
  answers: 3640,
  activeQuestions: 31,
  totalQuestions: 32,
};

export const RULES = {
  questions: 3,
  seconds: 20,
  reveal: 4,
  bonus: true,
  rematch: 45,
  idle: 120,
  duration: '1:15 Min.',
  maxPoints: 600,
};

/** Duels per hour of the day, for small charts. */
export const HOURS = [2, 4, 9, 14, 11, 8, 12, 17, 22, 19, 13, 7];

export const LETTERS = ['A', 'B', 'C', 'D'];

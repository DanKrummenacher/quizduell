import type { QuestionInput } from '../contracts/admin.contract.js';

type SampleQuestion = Omit<QuestionInput, 'active'>;

/**
 * Optional starter set. The live database starts empty; admins can import
 * these with one click to try the game and delete them again afterwards.
 */
export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  // Logik
  {
    text: 'Welche Zahl fehlt in der Reihe? 2, 4, 8, 16, ?',
    options: ['24', '30', '32', '64'],
    correctIndex: 2,
    category: 'Logik',
  },
  {
    text: 'Welche Zahl folgt? 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '15'],
    correctIndex: 2,
    category: 'Logik',
  },
  {
    text: 'Ein Elektrozug fährt nach Süden, der Wind weht nach Norden. In welche Richtung weht der Rauch?',
    options: ['Nach Norden', 'Nach Süden', 'Es gibt keinen Rauch', 'Nach Osten'],
    correctIndex: 2,
    category: 'Logik',
  },
  {
    text: 'Du überholst in einem Rennen die Person auf Platz zwei. Auf welchem Platz bist du jetzt?',
    options: ['Erster', 'Zweiter', 'Dritter', 'Letzter'],
    correctIndex: 1,
    category: 'Logik',
  },
  {
    text: 'Was wird nass, während es trocknet?',
    options: ['Wasser', 'Ein Handtuch', 'Ein Schwamm', 'Der Wind'],
    correctIndex: 1,
    category: 'Logik',
  },
  {
    text: 'Du bekommst drei Tabletten und sollst jede halbe Stunde eine nehmen. Wie lange reichen sie?',
    options: ['1 Stunde', '1.5 Stunden', '2 Stunden', '3 Stunden'],
    correctIndex: 0,
    category: 'Logik',
  },
  {
    text: 'Was gehört dir, wird aber von anderen viel öfter benutzt als von dir?',
    options: ['Dein Velo', 'Dein Geld', 'Dein Name', 'Dein Handy'],
    correctIndex: 2,
    category: 'Logik',
  },
  {
    text: 'Ein Hirte hat 17 Schafe. Alle ausser 9 laufen davon. Wie viele Schafe bleiben?',
    options: ['8', '9', '17', '0'],
    correctIndex: 1,
    category: 'Logik',
  },
  {
    text: 'Wie viele Monate haben 28 Tage?',
    options: ['1', '6', 'Alle 12', 'Keiner'],
    correctIndex: 2,
    category: 'Logik',
  },
  {
    text: 'Heute ist es 0 Grad. Morgen soll es doppelt so kalt werden. Wie kalt wird es?',
    options: ['0 Grad', '-2 Grad', '-273 Grad', 'Das lässt sich so nicht rechnen'],
    correctIndex: 3,
    category: 'Logik',
  },
  {
    text: 'Wie oft kannst du 10 von 100 abziehen?',
    options: ['Einmal', 'Neunmal', 'Zehnmal', 'Unendlich oft'],
    correctIndex: 0,
    category: 'Logik',
  },
  {
    text: 'Ein Schläger und ein Ball kosten zusammen 1.10 Franken. Der Schläger kostet 1 Franken mehr als der Ball. Was kostet der Ball?',
    options: ['5 Rappen', '10 Rappen', '15 Rappen', '1 Franken'],
    correctIndex: 0,
    category: 'Logik',
  },
  {
    text: '5 Maschinen brauchen 5 Minuten für 5 Teile. Wie lange brauchen 100 Maschinen für 100 Teile?',
    options: ['1 Minute', '5 Minuten', '20 Minuten', '100 Minuten'],
    correctIndex: 1,
    category: 'Logik',
  },

  // Allgemeinwissen
  {
    text: 'Wie heisst die Hauptstadt von Australien?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctIndex: 2,
    category: 'Allgemeinwissen',
  },
  {
    text: 'Welches ist der grösste Planet unseres Sonnensystems?',
    options: ['Saturn', 'Jupiter', 'Neptun', 'Erde'],
    correctIndex: 1,
    category: 'Allgemeinwissen',
  },
  {
    text: 'Welches chemische Symbol steht für Gold?',
    options: ['Go', 'Gd', 'Ag', 'Au'],
    correctIndex: 3,
    category: 'Allgemeinwissen',
  },
  {
    text: 'Wie viele Knochen hat ein erwachsener Mensch ungefähr?',
    options: ['106', '206', '306', '406'],
    correctIndex: 1,
    category: 'Allgemeinwissen',
  },
  {
    text: 'Wie viele Minuten hat ein Tag?',
    options: ['1240', '1440', '1640', '2400'],
    correctIndex: 1,
    category: 'Allgemeinwissen',
  },
  {
    text: 'Wer hat die Mona Lisa gemalt?',
    options: [
      'Michelangelo',
      'Pablo Picasso',
      'Leonardo da Vinci',
      'Vincent van Gogh',
    ],
    correctIndex: 2,
    category: 'Allgemeinwissen',
  },

  // Schweiz
  {
    text: 'Wie viele Kantone hat die Schweiz?',
    options: ['23', '24', '26', '28'],
    correctIndex: 2,
    category: 'Schweiz',
  },
  {
    text: 'Welches ist der höchste Berg der Schweiz?',
    options: ['Matterhorn', 'Dufourspitze', 'Eiger', 'Jungfrau'],
    correctIndex: 1,
    category: 'Schweiz',
  },
  {
    text: 'An welchem See liegt die Stadt Luzern?',
    options: ['Zürichsee', 'Genfersee', 'Vierwaldstättersee', 'Bodensee'],
    correctIndex: 2,
    category: 'Schweiz',
  },
  {
    text: 'In welcher Stadt steht das Bundeshaus?',
    options: ['Zürich', 'Bern', 'Genf', 'Luzern'],
    correctIndex: 1,
    category: 'Schweiz',
  },
  {
    text: 'Welche Farbe hat der Schweizer Pass?',
    options: ['Blau', 'Grün', 'Rot', 'Schwarz'],
    correctIndex: 2,
    category: 'Schweiz',
  },

  // Technik & Informatik
  {
    text: 'Wofür steht die Abkürzung CPU?',
    options: [
      'Central Processing Unit',
      'Computer Power Unit',
      'Central Program Utility',
      'Core Processing Upload',
    ],
    correctIndex: 0,
    category: 'Technik',
  },
  {
    text: 'Wie viele Bits hat ein Byte?',
    options: ['4', '8', '16', '32'],
    correctIndex: 1,
    category: 'Technik',
  },
  {
    text: 'Welche Dezimalzahl entspricht der Binärzahl 1010?',
    options: ['5', '10', '12', '1010'],
    correctIndex: 1,
    category: 'Technik',
  },
  {
    text: 'Wofür steht WWW?',
    options: [
      'World Wide Web',
      'Wide Web World',
      'World Web Wire',
      'Web Wide Window',
    ],
    correctIndex: 0,
    category: 'Technik',
  },
  {
    text: 'Mit welcher Sprache wird der Aufbau einer Webseite beschrieben?',
    options: ['SQL', 'HTML', 'Java', 'PHP'],
    correctIndex: 1,
    category: 'Technik',
  },
  {
    text: 'Was ist ein «Bug» in der Informatik?',
    options: [
      'Ein Fehler in einem Programm',
      'Ein neues Feature',
      'Ein schneller Prozessor',
      'Eine Art Virenschutz',
    ],
    correctIndex: 0,
    category: 'Technik',
  },
  {
    text: 'Welches Unternehmen entwickelt das Betriebssystem Android?',
    options: ['Apple', 'Microsoft', 'Google', 'Samsung'],
    correctIndex: 2,
    category: 'Technik',
  },
  {
    text: 'Was versteht man unter «Phishing»?',
    options: [
      'Das Komprimieren von Dateien',
      'Betrugsversuche, um an Passwörter oder Daten zu gelangen',
      'Das Suchen von Fehlern im Code',
      'Ein Verfahren zur Datensicherung',
    ],
    correctIndex: 1,
    category: 'Technik',
  },
];

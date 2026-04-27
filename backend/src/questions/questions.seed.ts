export const SEED_QUESTIONS = [
  {
    text: 'Welche Zahl fehlt in der Reihe? 2, 4, 8, 16, ?',
    options: ['24', '30', '32', '64'],
    correctAnswerIndex: 2,
  },
  {
    text: 'Ein Zug fährt nach Süden, der Wind weht nach Norden. In welche Richtung weht der Rauch?',
    options: ['Norden', 'Süden', 'Es gibt keinen Rauch', 'Osten'],
    correctAnswerIndex: 2, // Elektrische Züge oder allgemein "Ein Zug" -> Trickfrage
  },
  {
    text: 'Wenn du in einem Rennen den Zweiten überholst, auf welchem Platz bist du dann?',
    options: ['Erster', 'Zweiter', 'Dritter', 'Letzter'],
    correctAnswerIndex: 1,
  },
  {
    text: 'Was wird nass, während es trocknet?',
    options: ['Wasser', 'Ein Handtuch', 'Schwamm', 'Wind'],
    correctAnswerIndex: 1,
  },
  {
    text: 'Ein Arzt gibt dir drei Tabletten und sagt, du sollst jede halbe Stunde eine nehmen. Wie lange reichen sie?',
    options: ['1 Stunde', '1.5 Stunden', '2 Stunden', '3 Stunden'],
    correctAnswerIndex: 0, // 0 min (erste), 30 min (zweite), 60 min (dritte) -> 1 Stunde
  },
  {
    text: 'Ein Vater und sein Sohn sind in einen Unfall verwickelt. Der Vater stirbt, der Sohn kommt ins Krankenhaus. Der Chirurg sagt: "Ich kann ihn nicht operieren, er ist mein Sohn." Wie ist das möglich?',
    options: ['Der Chirurg ist der Geist des Vaters', 'Der Chirurg ist die Mutter', 'Der Sohn ist adoptiert', 'Ein Irrtum'],
    correctAnswerIndex: 1,
  },
  {
    text: 'Was gehört dir, aber andere benutzen es öfter als du?',
    options: ['Dein Auto', 'Dein Geld', 'Dein Name', 'Dein Haus'],
    correctAnswerIndex: 2,
  },
  {
    text: 'Ein Schaf, zwei Schafe, drei Schafe... Wenn ein Hirte 17 Schafe hat und alle ausser 9 sterben, wie viele Schafe bleiben übrig?',
    options: ['8', '9', '17', '0'],
    correctAnswerIndex: 1,
  },
  {
    text: 'Monate haben 30 oder 31 Tage. Wie viele Monate haben 28 Tage?',
    options: ['1', 'Alle 12', 'Keiner', '6'],
    correctAnswerIndex: 1, // Alle Monate haben mindestens 28 Tage
  },
  {
    text: 'Wenn es heute Null Grad hat und es morgen doppelt so kalt wird, wie kalt ist es dann?',
    options: ['Null Grad', '-2 Grad', 'Das kann man so nicht rechnen', '-273 Grad'],
    correctAnswerIndex: 2,
  }
];

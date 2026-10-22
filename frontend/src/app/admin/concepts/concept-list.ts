// TEMPORARY: the design concepts with their screens (development only).
import { BentoHomeScreen } from './bento/bento-home.screen';
import { BentoMobileScreen } from './bento/bento-mobile.screen';
import { BentoQuestionsScreen } from './bento/bento-questions.screen';
import type { Concept } from './concepts.page';
import { GalerieCardsScreen } from './galerie/galerie-cards.screen';
import { GalerieDecksScreen } from './galerie/galerie-decks.screen';
import { GalerieMobileScreen } from './galerie/galerie-mobile.screen';
import { MidnightCommandScreen } from './midnight/midnight-command.screen';
import { MidnightListScreen } from './midnight/midnight-list.screen';
import { MidnightMobileScreen } from './midnight/midnight-mobile.screen';
import { ProHomeScreen } from './pro/pro-home.screen';
import { ProQuestionsScreen } from './pro/pro-questions.screen';
import { ProSettingsScreen } from './pro/pro-settings.screen';
import { SplitMobileScreen } from './split/split-mobile.screen';
import { SplitQuestionScreen } from './split/split-question.screen';
import { SplitRulesScreen } from './split/split-rules.screen';
import { StudioEditorScreen } from './studio/studio-editor.screen';
import { StudioFlowScreen } from './studio/studio-flow.screen';
import { StudioMobileScreen } from './studio/studio-mobile.screen';

export const CONCEPT_LIST: Concept[] = [
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Ein Quiz-Builder wie Kahoot oder Mentimeter',
    idea: 'Die Fragen sind Folien. Links die Reihe der Folien, in der Mitte bearbeitest du die Frage direkt so, wie sie im Spiel aussieht, rechts stehen Eigenschaften und Zahlen. Der Spielablauf ist ein Zeitstrahl, an dem man zieht.',
    strengths: [
      'Was du siehst, ist was die Spieler sehen – kein Formular',
      'Vertrautes Muster aus Präsentations- und Quiz-Tools',
      'Schnelles Durchgehen und Ändern vieler Fragen',
      'Spielregeln als Ablauf statt als Zahlenliste',
    ],
    bestFor: 'Das Vorbereiten des Fragenkatalogs am Laptop – das Herz des Admins.',
    needs:
      'Die Verteilung der gewählten Antworten (z.B. «Matterhorn 44 %») braucht eine kleine Erweiterung im Backend.',
    screens: [
      { label: 'Fragen bearbeiten', kind: 'desktop', component: StudioEditorScreen },
      { label: 'Spielablauf', kind: 'desktop', component: StudioFlowScreen },
      { label: 'Handy', kind: 'mobile', component: StudioMobileScreen },
    ],
  },
  {
    id: 'bento',
    name: 'Bento',
    tagline: 'Ein Dashboard aus Kacheln, wie bei Apple',
    idea: 'Alles Wichtige auf einen Blick, in Kacheln verschiedener Grösse: die grosse Zahl des Tages, was gerade live läuft, ob das Quiz bereit ist und welche Frage einen Blick braucht. Ruhiges Grau, weisse Kacheln, grosse Zahlen.',
    strengths: [
      'Sofort verständlich – auch für Personen, die das Admin selten öffnen',
      'Sehr modern und hochwertig, eignet sich zum Zeigen an der Messe',
      'Jede Kachel führt direkt zur passenden Aktion',
      'Funktioniert auf Handy, Tablet und Desktop gleich gut',
    ],
    bestFor:
      'Einen schnellen Überblick vor und während der Messe – für Chef, Standpersonal und Lernende.',
    needs:
      'Die Duelle pro Stunde (Balken «Heute») brauchen eine kleine Erweiterung im Backend.',
    screens: [
      { label: 'Übersicht', kind: 'desktop', component: BentoHomeScreen },
      { label: 'Fragen', kind: 'desktop', component: BentoQuestionsScreen },
      { label: 'Handy', kind: 'mobile', component: BentoMobileScreen },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Klar und präzise wie das Stripe-Dashboard',
    idea: 'Ein klassisches, sehr sauberes Business-Admin: Kennzahlen mit kleinen Verlaufskurven, eine ruhige Tabelle mit allen Fragen und ein Seitenblatt zum Bearbeiten, ohne die Liste zu verlassen. Spielregeln als ordentliche Einstellungsseite mit Erklärung zu jedem Abschnitt.',
    strengths: [
      'Vertraut für alle, die mit professioneller Software arbeiten',
      'Sehr viel Information auf wenig Platz, trotzdem ruhig',
      'Bearbeiten im Seitenblatt – die Liste bleibt sichtbar',
      'Ungespeicherte Änderungen sind klar markiert, mit Auswirkung auf die Duell-Dauer',
    ],
    bestFor:
      'Den Alltag: Fragen pflegen, Zahlen prüfen, Regeln anpassen – zuverlässig und ohne Überraschungen.',
    needs:
      'Die Verlaufskurven und die Duelle pro Stunde brauchen eine kleine Erweiterung im Backend.',
    screens: [
      { label: 'Übersicht', kind: 'desktop', component: ProHomeScreen },
      { label: 'Fragen', kind: 'desktop', component: ProQuestionsScreen },
      { label: 'Spielregeln', kind: 'desktop', component: ProSettingsScreen },
    ],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Ein dunkles Profi-Werkzeug wie Linear',
    idea: 'Dunkel, dicht und auf die Tastatur ausgelegt. Fragen nach Kategorien gruppiert, rechts die Details. Mit ⌘K öffnet sich überall ein Befehlsmenü: «tempo» tippen, Enter – und der Tempo-Bonus ist aus. Jede Aktion hat ein Kürzel.',
    strengths: [
      'Extrem schnell für alle, die das Admin oft benutzen',
      'Befehlsmenü findet Fragen, Einstellungen und Aktionen an einem Ort',
      'Dunkles Design schont die Augen und wirkt hochwertig',
      'Keine Suche in Menüs – alles über Tippen erreichbar',
    ],
    bestFor:
      'Die Person, die das Quiz betreut und den Fragenkatalog regelmässig pflegt.',
    screens: [
      { label: 'Fragen', kind: 'desktop', component: MidnightListScreen },
      { label: 'Befehlsmenü ⌘K', kind: 'desktop', component: MidnightCommandScreen },
      { label: 'Handy', kind: 'mobile', component: MidnightMobileScreen },
    ],
  },
  {
    id: 'galerie',
    name: 'Galerie',
    tagline: 'Die Fragen als Spielkarten in Stapeln',
    idea: 'Jede Frage ist eine Karte im Look des Spiels, jede Kategorie ein Stapel. Oben auf jedem Stapel liegt die Karte, die am meisten Aufmerksamkeit braucht. Karten zieht man auf einen anderen Stapel oder auf «Pausieren»; umgedreht zeigt eine Karte ihre Zahlen. Auf dem Handy geht man auffällige Karten durch wie bei einer Dating-App.',
    strengths: [
      'Einzigartig und verspielt, trotzdem klar strukturiert',
      'Die Fragen sehen schon im Admin so aus wie im Spiel',
      'Verschieben und Pausieren per Ziehen statt über Menüs',
      'Auf dem Handy in Sekunden durch die heiklen Fragen',
    ],
    bestFor:
      'Ein Team, das den Fragenkatalog gemeinsam und mit Freude kuratiert – auch Lernende.',
    needs:
      'Die Verteilung der gewählten Antworten auf der Rückseite braucht eine kleine Erweiterung im Backend.',
    screens: [
      { label: 'Stapel', kind: 'desktop', component: GalerieDecksScreen },
      { label: 'Karten', kind: 'desktop', component: GalerieCardsScreen },
      { label: 'Handy', kind: 'mobile', component: GalerieMobileScreen },
    ],
  },
  {
    id: 'split',
    name: 'Split-View',
    tagline: 'Aufgebaut wie die Einstellungen auf dem iPad',
    idea: 'Links eine ruhige Seitenleiste, rechts gruppierte Listen – genau wie die Einstellungen auf iPhone und iPad. Zahlen ändert man mit Plus und Minus, Schalter sind Schalter, und unter jeder Gruppe steht ein kurzer Satz, was die Einstellung bewirkt. Auf dem Handy wird daraus automatisch die bekannte Liste mit Pfeilen.',
    strengths: [
      'Alle kennen dieses Muster – keine Einarbeitung nötig',
      'Ideal für Touch: am Stand auf dem iPad bedienbar',
      'Erklärungen direkt bei der Einstellung statt in einer Anleitung',
      'Handy, Tablet und Desktop fühlen sich gleich an',
    ],
    bestFor:
      'Das Standpersonal, das am iPad schnell eine Regel anpassen oder eine Frage pausieren will.',
    needs: 'Die Ø Antwortzeit pro Frage braucht eine kleine Erweiterung im Backend.',
    screens: [
      { label: 'Spielregeln', kind: 'desktop', component: SplitRulesScreen },
      { label: 'Frage', kind: 'desktop', component: SplitQuestionScreen },
      { label: 'Handy', kind: 'mobile', component: SplitMobileScreen },
    ],
  },
];

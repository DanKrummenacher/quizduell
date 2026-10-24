/** The areas of the admin, in the order of the bar. */
export interface AdminArea {
  path: string;
  label: string;
  icon: string;
  group: 'Betrieb' | 'Inhalte' | 'Analyse';
  /** One line on what the area is for. */
  description: string;
}

export const ADMIN_AREAS: readonly AdminArea[] = [
  {
    path: '/admin',
    label: 'Übersicht',
    icon: 'home',
    group: 'Betrieb',
    description: 'Die Lage auf einen Blick',
  },
  {
    path: '/admin/live',
    label: 'Live',
    icon: 'heartbeat',
    group: 'Betrieb',
    description: 'Laufende Duelle in Echtzeit',
  },
  {
    path: '/admin/hinweise',
    label: 'Hinweise',
    icon: 'bulb',
    group: 'Betrieb',
    description: 'Was Aufmerksamkeit braucht',
  },
  {
    path: '/admin/fragen',
    label: 'Fragen',
    icon: 'items-list',
    group: 'Inhalte',
    description: 'Katalog pflegen, prüfen und importieren',
  },
  {
    path: '/admin/regeln',
    label: 'Spielregeln',
    icon: 'settings',
    group: 'Inhalte',
    description: 'Ablauf und Zeiten eines Duells',
  },
  {
    path: '/admin/auswertung',
    label: 'Auswertung',
    icon: 'statistic',
    group: 'Analyse',
    description: 'Nutzung und Fragen über die Zeit',
  },
  {
    path: '/admin/verlauf',
    label: 'Verlauf',
    icon: 'time',
    group: 'Analyse',
    description: 'Jede Änderung im Admin',
  },
];

/** The area a URL belongs to. */
export function areaOf(url: string): AdminArea | null {
  const path = url.split('?')[0] ?? '';
  return (
    ADMIN_AREAS.find((area) =>
      area.path === '/admin' ? path === '/admin' : path.startsWith(area.path),
    ) ?? null
  );
}

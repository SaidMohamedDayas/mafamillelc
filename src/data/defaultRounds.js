export const defaultRounds = [
  {
    question: "ALSH: Que vérifie-t-on en premier à l'arrivée des enfants ?",
    answers: [
      { text: 'La feuille de présence', points: 32, revealed: false },
      { text: 'Les autorisations parentales', points: 24, revealed: false },
      { text: 'L’état de santé signalé', points: 18, revealed: false },
      { text: 'Les personnes autorisées au départ', points: 12, revealed: false },
      { text: 'Le matériel personnel de l’enfant', points: 8, revealed: false },
    ],
  },
  {
    question: 'Sécurité: Citez un réflexe essentiel avant une sortie extérieure.',
    answers: [
      { text: 'Compter les enfants', points: 30, revealed: false },
      { text: 'Rappeler les consignes', points: 22, revealed: false },
      { text: 'Prévoir une trousse de secours', points: 16, revealed: false },
      { text: 'Vérifier la météo', points: 13, revealed: false },
      { text: 'Prendre les contacts d’urgence', points: 11, revealed: false },
    ],
  },
  {
    question: 'Hygiène: Quelle règle est indispensable avant le repas ? ',
    answers: [
      { text: 'Lavage des mains', points: 40, revealed: false },
      { text: 'Nettoyer les surfaces', points: 18, revealed: false },
      { text: 'Attacher les cheveux longs', points: 14, revealed: false },
      { text: 'Vérifier la chaîne du froid', points: 12, revealed: false },
      { text: 'Port de gants si nécessaire', points: 9, revealed: false },
    ],
  },
  {
    question: 'Sorties: Quel document ne faut-il jamais oublier ? ',
    answers: [
      { text: 'La liste des enfants', points: 31, revealed: false },
      { text: 'Les fiches sanitaires', points: 23, revealed: false },
      { text: 'Les autorisations de sortie', points: 20, revealed: false },
      { text: 'Le planning de la journée', points: 11, revealed: false },
      { text: 'Les numéros d’urgence', points: 9, revealed: false },
    ],
  },
  {
    question: 'Incendie: Quelle est la première action en cas d’alarme ? ',
    answers: [
      { text: 'Évacuer calmement', points: 35, revealed: false },
      { text: 'Compter les enfants au point de rassemblement', points: 22, revealed: false },
      { text: 'Alerter les secours', points: 16, revealed: false },
      { text: 'Suivre le plan d’évacuation', points: 14, revealed: false },
      { text: 'Ne pas retourner dans le bâtiment', points: 8, revealed: false },
    ],
  },
  {
    question: 'Animation: Quelle qualité fait un bon animateur ? ',
    answers: [
      { text: 'L’écoute', points: 26, revealed: false },
      { text: 'La créativité', points: 22, revealed: false },
      { text: 'La patience', points: 18, revealed: false },
      { text: 'Le sens de l’organisation', points: 14, revealed: false },
      { text: 'L’énergie positive', points: 12, revealed: false },
    ],
  },
  {
    question: 'HACCP: Quel point est critique lors d’un service alimentaire ? ',
    answers: [
      { text: 'Respecter les températures', points: 30, revealed: false },
      { text: 'Éviter les contaminations croisées', points: 24, revealed: false },
      { text: 'Tracer les denrées', points: 16, revealed: false },
      { text: 'Respecter les DLC', points: 12, revealed: false },
      { text: 'Désinfecter les ustensiles', points: 10, revealed: false },
    ],
  },
  {
    question: 'Premiers secours: Que faire face à une petite coupure ? ',
    answers: [
      { text: 'Nettoyer la plaie', points: 30, revealed: false },
      { text: 'Désinfecter', points: 24, revealed: false },
      { text: 'Mettre un pansement propre', points: 20, revealed: false },
      { text: 'Porter des gants', points: 10, revealed: false },
      { text: 'Surveiller l’évolution', points: 9, revealed: false },
    ],
  },
  {
    question: 'Rôle de l’animateur: Quelle mission est prioritaire ? ',
    answers: [
      { text: 'Garantir la sécurité physique et affective', points: 34, revealed: false },
      { text: 'Favoriser le vivre-ensemble', points: 22, revealed: false },
      { text: 'Proposer des activités adaptées', points: 18, revealed: false },
      { text: 'Accompagner l’autonomie', points: 12, revealed: false },
      { text: 'Communiquer avec les familles', points: 8, revealed: false },
    ],
  },
  {
    question: 'Sécurité piscine: Quel encadrement est indispensable ? ',
    answers: [
      { text: 'Taux d’encadrement réglementaire', points: 28, revealed: false },
      { text: 'Brief de sécurité avant entrée', points: 20, revealed: false },
      { text: 'Comptage fréquent des enfants', points: 18, revealed: false },
      { text: 'Présence d’un surveillant qualifié', points: 14, revealed: false },
      { text: 'Zone de baignade délimitée', points: 12, revealed: false },
    ],
  },
  {
    question: 'Hygiène collective: Quel geste limite le plus les microbes ? ',
    answers: [
      { text: 'Lavage des mains régulier', points: 38, revealed: false },
      { text: 'Nettoyage des objets partagés', points: 20, revealed: false },
      { text: 'Aération des locaux', points: 14, revealed: false },
      { text: 'Mouchoirs à usage unique', points: 12, revealed: false },
      { text: 'Gestion du linge souillé', points: 9, revealed: false },
    ],
  },
  {
    question: 'Sortie nature: Quel risque doit être anticipé ? ',
    answers: [
      { text: 'Perte d’un enfant', points: 25, revealed: false },
      { text: 'Déshydratation', points: 20, revealed: false },
      { text: 'Piqûres/insectes', points: 18, revealed: false },
      { text: 'Coup de soleil', points: 14, revealed: false },
      { text: 'Chute sur terrain accidenté', points: 13, revealed: false },
    ],
  },
];

export function createInitialRounds() {
  return defaultRounds.map((round) => ({
    ...round,
    answers: round.answers.map((answer) => ({ ...answer, revealed: false })),
  }));
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Never expose raw statusText or internal errors
    if (message.includes('unauthorized')) return 'Accès non autorisé';
    if (message.includes('forbidden')) return 'Action non autorisée';
    if (message.includes('not found')) return 'Ressource introuvable';
    if (message.includes('timeout') || message.includes('abort')) return 'Délai d\'attente dépassé';
    if (message.includes('network') || message.includes('failed')) return 'Erreur réseau';
    if (message.includes('json')) return 'Réponse invalide du serveur';
    if (message.includes('invalid')) return 'Données invalides';

    // Default: generic message
    return 'Une erreur s\'est produite. Veuillez réessayer.';
  }

  return 'Une erreur s\'est produite. Veuillez réessayer.';
}

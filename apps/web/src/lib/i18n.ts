/**
 * Minimal internationalization: four dictionaries and a lookup function.
 *
 * A framework was not needed here. The selected language is a URL search
 * parameter, every page is a Server Component that already reads it, and there
 * is no plural or date formatting to do. TypeScript enforces that the Dutch,
 * German and French dictionaries define exactly the same keys as English, so a
 * missing translation is a build error rather than a blank label.
 */

export const LANGUAGES = ['en', 'nl', 'de', 'fr'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Falls back to English for anything unexpected in the URL. */
export function toLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
};

const en = {
  'app.title': 'Food Product Search',
  'app.tagline': 'Search packaged foods from the Open Food Facts database.',
  'app.loading': 'Loading…',

  'language.label': 'Language',

  'home.hero.title': 'Discover what’s inside your food.',
  'home.hero.subtitle':
    'Search packaged food products and explore ingredients, categories, and nutrition information.',

  'footer.attribution': 'Product data provided by',

  'notFound.title': 'This page does not exist',
  'notFound.body': 'The link may be outdated. Start a new search instead.',

  'search.label': 'Search term',
  'search.placeholder': 'e.g. chocolate',
  'search.button': 'Search',
  'search.loading': 'Searching products…',
  'search.results': 'Results for “{query}”',
  'search.count': '{count} products',
  'search.empty.title': 'No products found',
  'search.empty.body': 'Try a different term, or switch the language of your search.',
  'search.start.title': 'Start by searching for a product',
  'search.start.body': 'Results come from Open Food Facts and may be incomplete.',
  'search.recent': 'Recent searches',
  'search.recent.empty': 'Your recent searches will appear here.',

  'product.back': 'Back to search',
  'product.loading': 'Loading product…',
  'product.details': 'Product details',
  'product.brand': 'Brand',
  'product.quantity': 'Quantity',
  'product.categories': 'Categories',
  'product.ingredients': 'Ingredients',
  'product.barcode': 'Barcode',
  'product.unknown': 'Not available',
  'product.fallbackLanguage': 'Shown in {language}, no translation available.',
  'product.noImage': 'No image',

  'nutrition.title': 'Nutrition',
  'nutrition.per': 'Per 100 g',
  'nutrition.servingSize': 'Serving size: {size}',
  'nutrition.unavailable': 'Open Food Facts has no nutrition data for this product.',
  'nutrition.locked.title': 'Unlock nutrition details',
  'nutrition.locked.body':
    'Detailed nutrition information is included with an active subscription.',
  'nutrition.locked.included':
    'Energy, fat, saturates, carbohydrates, sugars, fibre, protein and salt per 100 g.',
  'nutrition.locked.price': 'US$5 per month · cancel anytime',
  'nutrition.locked.cta': 'Unlock nutrition',
  'nutrition.energyKcal': 'Energy',
  'nutrition.fat': 'Fat',
  'nutrition.saturatedFat': 'of which saturates',
  'nutrition.carbohydrates': 'Carbohydrates',
  'nutrition.sugars': 'of which sugars',
  'nutrition.fiber': 'Fibre',
  'nutrition.proteins': 'Protein',
  'nutrition.salt': 'Salt',

  'billing.subscribe': 'Subscribe – monthly',
  'billing.subscribing': 'Redirecting to Stripe…',
  'billing.manage': 'Manage subscription',
  'billing.managing': 'Opening Stripe…',
  'billing.active': 'Subscription active',
  'billing.active.title': 'Your subscription is active',
  'billing.active.body':
    'You can manage or cancel it in Stripe. Nutrition details stay unlocked while it is active.',
  'billing.inactive.title': 'Your subscription is not active',
  'billing.inactive.body':
    'Nutrition details are locked. You can subscribe again at any time.',
  'billing.inactive': 'Subscription inactive',
  'billing.renews': 'Renews on {date}',
  'billing.cancelsOn': 'Cancels on {date}',
  'billing.success.title': 'Thank you, your subscription is being activated',
  'billing.success.body':
    'Stripe confirms subscriptions through a webhook, which can take a few seconds.',
  'billing.success.pending': 'Not active yet. Refresh in a moment.',
  'billing.cancel.title': 'Checkout cancelled',
  'billing.cancel.body': 'No payment was taken. You can subscribe at any time.',
  'billing.refresh': 'Refresh status',

  'error.title': 'Something went wrong',
  'error.retry': 'Try again',
  'error.VALIDATION_ERROR': 'Please check your search term and try again.',
  'error.NOT_FOUND': 'This product could not be found.',
  'error.UPSTREAM_ERROR': 'Open Food Facts is unavailable right now. Please try again shortly.',
  'error.BILLING_UNAVAILABLE': 'Billing is unavailable right now. Please try again shortly.',
  'error.SUBSCRIPTION_REQUIRED': 'An active subscription is required.',
  'error.CONFLICT': 'You already have an active subscription.',
  'error.INTERNAL_ERROR': 'An unexpected error occurred.',
  'error.NETWORK_ERROR': 'The application could not reach the API.',
} as const;

export type MessageKey = keyof typeof en;

type Dictionary = Record<MessageKey, string>;

const nl: Dictionary = {
  'app.title': 'Voedselproducten zoeken',
  'app.tagline': 'Zoek verpakte levensmiddelen uit de Open Food Facts-database.',
  'app.loading': 'Laden…',

  'language.label': 'Taal',

  'home.hero.title': 'Ontdek wat er in je eten zit.',
  'home.hero.subtitle':
    'Zoek verpakte levensmiddelen en bekijk ingrediënten, categorieën en voedingswaarden.',

  'footer.attribution': 'Productgegevens van',

  'notFound.title': 'Deze pagina bestaat niet',
  'notFound.body': 'De link is misschien verouderd. Begin een nieuwe zoekopdracht.',

  'search.label': 'Zoekterm',
  'search.placeholder': 'bijv. chocolade',
  'search.button': 'Zoeken',
  'search.loading': 'Producten zoeken…',
  'search.results': 'Resultaten voor “{query}”',
  'search.count': '{count} producten',
  'search.empty.title': 'Geen producten gevonden',
  'search.empty.body': 'Probeer een andere term of wissel de taal van je zoekopdracht.',
  'search.start.title': 'Begin met zoeken naar een product',
  'search.start.body': 'Resultaten komen van Open Food Facts en kunnen onvolledig zijn.',
  'search.recent': 'Recente zoekopdrachten',
  'search.recent.empty': 'Je recente zoekopdrachten verschijnen hier.',

  'product.back': 'Terug naar zoeken',
  'product.loading': 'Product laden…',
  'product.details': 'Productgegevens',
  'product.brand': 'Merk',
  'product.quantity': 'Hoeveelheid',
  'product.categories': 'Categorieën',
  'product.ingredients': 'Ingrediënten',
  'product.barcode': 'Barcode',
  'product.unknown': 'Niet beschikbaar',
  'product.fallbackLanguage': 'Weergegeven in het {language}, geen vertaling beschikbaar.',
  'product.noImage': 'Geen afbeelding',

  'nutrition.title': 'Voedingswaarde',
  'nutrition.per': 'Per 100 g',
  'nutrition.servingSize': 'Portiegrootte: {size}',
  'nutrition.unavailable': 'Open Food Facts heeft geen voedingswaarden voor dit product.',
  'nutrition.locked.title': 'Voedingswaarden ontgrendelen',
  'nutrition.locked.body':
    'Gedetailleerde voedingsinformatie is inbegrepen bij een actief abonnement.',
  'nutrition.locked.included':
    'Energie, vetten, verzadigde vetten, koolhydraten, suikers, vezels, eiwitten en zout per 100 g.',
  'nutrition.locked.price': 'US$5 per maand · maandelijks opzegbaar',
  'nutrition.locked.cta': 'Voedingswaarden ontgrendelen',
  'nutrition.energyKcal': 'Energie',
  'nutrition.fat': 'Vetten',
  'nutrition.saturatedFat': 'waarvan verzadigd',
  'nutrition.carbohydrates': 'Koolhydraten',
  'nutrition.sugars': 'waarvan suikers',
  'nutrition.fiber': 'Vezels',
  'nutrition.proteins': 'Eiwitten',
  'nutrition.salt': 'Zout',

  'billing.subscribe': 'Abonneren – maandelijks',
  'billing.subscribing': 'Doorsturen naar Stripe…',
  'billing.manage': 'Abonnement beheren',
  'billing.managing': 'Stripe openen…',
  'billing.active': 'Abonnement actief',
  'billing.active.title': 'Je abonnement is actief',
  'billing.active.body':
    'Je kunt het in Stripe beheren of opzeggen. Voedingswaarden blijven ontgrendeld zolang het actief is.',
  'billing.inactive.title': 'Je abonnement is niet actief',
  'billing.inactive.body':
    'Voedingswaarden zijn vergrendeld. Je kunt je altijd opnieuw abonneren.',
  'billing.inactive': 'Abonnement inactief',
  'billing.renews': 'Verlengt op {date}',
  'billing.cancelsOn': 'Stopt op {date}',
  'billing.success.title': 'Bedankt, je abonnement wordt geactiveerd',
  'billing.success.body':
    'Stripe bevestigt abonnementen via een webhook, dat kan enkele seconden duren.',
  'billing.success.pending': 'Nog niet actief. Ververs over een moment.',
  'billing.cancel.title': 'Afrekenen geannuleerd',
  'billing.cancel.body': 'Er is niets betaald. Je kunt je altijd alsnog abonneren.',
  'billing.refresh': 'Status verversen',

  'error.title': 'Er is iets misgegaan',
  'error.retry': 'Opnieuw proberen',
  'error.VALIDATION_ERROR': 'Controleer je zoekterm en probeer het opnieuw.',
  'error.NOT_FOUND': 'Dit product kon niet worden gevonden.',
  'error.UPSTREAM_ERROR': 'Open Food Facts is nu niet bereikbaar. Probeer het zo weer.',
  'error.BILLING_UNAVAILABLE': 'Facturatie is nu niet beschikbaar. Probeer het zo weer.',
  'error.SUBSCRIPTION_REQUIRED': 'Een actief abonnement is vereist.',
  'error.CONFLICT': 'Je hebt al een actief abonnement.',
  'error.INTERNAL_ERROR': 'Er is een onverwachte fout opgetreden.',
  'error.NETWORK_ERROR': 'De applicatie kon de API niet bereiken.',
};

const de: Dictionary = {
  'app.title': 'Lebensmittelsuche',
  'app.tagline': 'Durchsuchen Sie verpackte Lebensmittel aus der Open-Food-Facts-Datenbank.',
  'app.loading': 'Wird geladen…',

  'language.label': 'Sprache',

  'home.hero.title': 'Entdecken Sie, was in Ihren Lebensmitteln steckt.',
  'home.hero.subtitle':
    'Durchsuchen Sie verpackte Lebensmittel und sehen Sie Zutaten, Kategorien und Nährwerte.',

  'footer.attribution': 'Produktdaten von',

  'notFound.title': 'Diese Seite existiert nicht',
  'notFound.body': 'Der Link ist möglicherweise veraltet. Starten Sie eine neue Suche.',

  'search.label': 'Suchbegriff',
  'search.placeholder': 'z. B. Schokolade',
  'search.button': 'Suchen',
  'search.loading': 'Produkte werden gesucht…',
  'search.results': 'Ergebnisse für „{query}“',
  'search.count': '{count} Produkte',
  'search.empty.title': 'Keine Produkte gefunden',
  'search.empty.body': 'Versuchen Sie einen anderen Begriff oder wechseln Sie die Sprache.',
  'search.start.title': 'Suchen Sie zunächst nach einem Produkt',
  'search.start.body': 'Die Ergebnisse stammen von Open Food Facts und können unvollständig sein.',
  'search.recent': 'Letzte Suchanfragen',
  'search.recent.empty': 'Ihre letzten Suchanfragen erscheinen hier.',

  'product.back': 'Zurück zur Suche',
  'product.loading': 'Produkt wird geladen…',
  'product.details': 'Produktdetails',
  'product.brand': 'Marke',
  'product.quantity': 'Menge',
  'product.categories': 'Kategorien',
  'product.ingredients': 'Zutaten',
  'product.barcode': 'Barcode',
  'product.unknown': 'Nicht verfügbar',
  'product.fallbackLanguage': 'Angezeigt auf {language}, keine Übersetzung verfügbar.',
  'product.noImage': 'Kein Bild',

  'nutrition.title': 'Nährwerte',
  'nutrition.per': 'Pro 100 g',
  'nutrition.servingSize': 'Portionsgröße: {size}',
  'nutrition.unavailable': 'Open Food Facts hat keine Nährwerte für dieses Produkt.',
  'nutrition.locked.title': 'Nährwertangaben freischalten',
  'nutrition.locked.body':
    'Detaillierte Nährwertangaben sind in einem aktiven Abonnement enthalten.',
  'nutrition.locked.included':
    'Energie, Fett, gesättigte Fettsäuren, Kohlenhydrate, Zucker, Ballaststoffe, Eiweiß und Salz pro 100 g.',
  'nutrition.locked.price': 'US$5 pro Monat · monatlich kündbar',
  'nutrition.locked.cta': 'Nährwerte freischalten',
  'nutrition.energyKcal': 'Energie',
  'nutrition.fat': 'Fett',
  'nutrition.saturatedFat': 'davon gesättigte Fettsäuren',
  'nutrition.carbohydrates': 'Kohlenhydrate',
  'nutrition.sugars': 'davon Zucker',
  'nutrition.fiber': 'Ballaststoffe',
  'nutrition.proteins': 'Eiweiß',
  'nutrition.salt': 'Salz',

  'billing.subscribe': 'Abonnieren – monatlich',
  'billing.subscribing': 'Weiterleitung zu Stripe…',
  'billing.manage': 'Abonnement verwalten',
  'billing.managing': 'Stripe wird geöffnet…',
  'billing.active': 'Abonnement aktiv',
  'billing.active.title': 'Ihr Abonnement ist aktiv',
  'billing.active.body':
    'Sie können es in Stripe verwalten oder kündigen. Nährwerte bleiben freigeschaltet, solange es aktiv ist.',
  'billing.inactive.title': 'Ihr Abonnement ist nicht aktiv',
  'billing.inactive.body':
    'Nährwertangaben sind gesperrt. Sie können jederzeit erneut abonnieren.',
  'billing.inactive': 'Abonnement inaktiv',
  'billing.renews': 'Verlängert sich am {date}',
  'billing.cancelsOn': 'Endet am {date}',
  'billing.success.title': 'Vielen Dank, Ihr Abonnement wird aktiviert',
  'billing.success.body':
    'Stripe bestätigt Abonnements über einen Webhook, das kann einige Sekunden dauern.',
  'billing.success.pending': 'Noch nicht aktiv. Bitte gleich neu laden.',
  'billing.cancel.title': 'Bezahlvorgang abgebrochen',
  'billing.cancel.body': 'Es wurde nichts abgebucht. Sie können jederzeit abonnieren.',
  'billing.refresh': 'Status aktualisieren',

  'error.title': 'Etwas ist schiefgelaufen',
  'error.retry': 'Erneut versuchen',
  'error.VALIDATION_ERROR': 'Bitte prüfen Sie Ihren Suchbegriff und versuchen Sie es erneut.',
  'error.NOT_FOUND': 'Dieses Produkt wurde nicht gefunden.',
  'error.UPSTREAM_ERROR': 'Open Food Facts ist derzeit nicht erreichbar. Bitte später erneut versuchen.',
  'error.BILLING_UNAVAILABLE': 'Die Abrechnung ist derzeit nicht verfügbar. Bitte später erneut versuchen.',
  'error.SUBSCRIPTION_REQUIRED': 'Ein aktives Abonnement ist erforderlich.',
  'error.CONFLICT': 'Sie haben bereits ein aktives Abonnement.',
  'error.INTERNAL_ERROR': 'Ein unerwarteter Fehler ist aufgetreten.',
  'error.NETWORK_ERROR': 'Die Anwendung konnte die API nicht erreichen.',
};

const fr: Dictionary = {
  'app.title': 'Recherche de produits alimentaires',
  'app.tagline': 'Recherchez des aliments emballés dans la base Open Food Facts.',
  'app.loading': 'Chargement…',

  'language.label': 'Langue',

  'home.hero.title': 'Découvrez ce que contiennent vos aliments.',
  'home.hero.subtitle':
    'Recherchez des aliments emballés et explorez les ingrédients, les catégories et les valeurs nutritionnelles.',

  'footer.attribution': 'Données produits fournies par',

  'notFound.title': 'Cette page n’existe pas',
  'notFound.body': 'Le lien est peut-être obsolète. Lancez une nouvelle recherche.',

  'search.label': 'Terme de recherche',
  'search.placeholder': 'ex. chocolat',
  'search.button': 'Rechercher',
  'search.loading': 'Recherche de produits…',
  'search.results': 'Résultats pour « {query} »',
  'search.count': '{count} produits',
  'search.empty.title': 'Aucun produit trouvé',
  'search.empty.body': 'Essayez un autre terme ou changez la langue de votre recherche.',
  'search.start.title': 'Commencez par rechercher un produit',
  'search.start.body': 'Les résultats proviennent d’Open Food Facts et peuvent être incomplets.',
  'search.recent': 'Recherches récentes',
  'search.recent.empty': 'Vos recherches récentes apparaîtront ici.',

  'product.back': 'Retour à la recherche',
  'product.loading': 'Chargement du produit…',
  'product.details': 'Détails du produit',
  'product.brand': 'Marque',
  'product.quantity': 'Quantité',
  'product.categories': 'Catégories',
  'product.ingredients': 'Ingrédients',
  'product.barcode': 'Code-barres',
  'product.unknown': 'Non disponible',
  'product.fallbackLanguage': 'Affiché en {language}, aucune traduction disponible.',
  'product.noImage': 'Pas d’image',

  'nutrition.title': 'Valeurs nutritionnelles',
  'nutrition.per': 'Pour 100 g',
  'nutrition.servingSize': 'Portion : {size}',
  'nutrition.unavailable': 'Open Food Facts n’a pas de valeurs nutritionnelles pour ce produit.',
  'nutrition.locked.title': 'Débloquer les valeurs nutritionnelles',
  'nutrition.locked.body':
    'Les informations nutritionnelles détaillées sont incluses avec un abonnement actif.',
  'nutrition.locked.included':
    'Énergie, matières grasses, acides gras saturés, glucides, sucres, fibres, protéines et sel pour 100 g.',
  'nutrition.locked.price': '5 US$ par mois · résiliable à tout moment',
  'nutrition.locked.cta': 'Débloquer les valeurs',
  'nutrition.energyKcal': 'Énergie',
  'nutrition.fat': 'Matières grasses',
  'nutrition.saturatedFat': 'dont acides gras saturés',
  'nutrition.carbohydrates': 'Glucides',
  'nutrition.sugars': 'dont sucres',
  'nutrition.fiber': 'Fibres',
  'nutrition.proteins': 'Protéines',
  'nutrition.salt': 'Sel',

  'billing.subscribe': 'S’abonner – mensuel',
  'billing.subscribing': 'Redirection vers Stripe…',
  'billing.manage': 'Gérer l’abonnement',
  'billing.managing': 'Ouverture de Stripe…',
  'billing.active': 'Abonnement actif',
  'billing.active.title': 'Votre abonnement est actif',
  'billing.active.body':
    'Vous pouvez le gérer ou l’annuler dans Stripe. Les valeurs nutritionnelles restent débloquées tant qu’il est actif.',
  'billing.inactive.title': 'Votre abonnement n’est pas actif',
  'billing.inactive.body':
    'Les valeurs nutritionnelles sont verrouillées. Vous pouvez vous réabonner à tout moment.',
  'billing.inactive': 'Abonnement inactif',
  'billing.renews': 'Renouvellement le {date}',
  'billing.cancelsOn': 'Se termine le {date}',
  'billing.success.title': 'Merci, votre abonnement est en cours d’activation',
  'billing.success.body':
    'Stripe confirme les abonnements via un webhook, ce qui peut prendre quelques secondes.',
  'billing.success.pending': 'Pas encore actif. Actualisez dans un instant.',
  'billing.cancel.title': 'Paiement annulé',
  'billing.cancel.body': 'Aucun paiement n’a été effectué. Vous pouvez vous abonner à tout moment.',
  'billing.refresh': 'Actualiser le statut',

  'error.title': 'Une erreur est survenue',
  'error.retry': 'Réessayer',
  'error.VALIDATION_ERROR': 'Vérifiez votre terme de recherche et réessayez.',
  'error.NOT_FOUND': 'Ce produit est introuvable.',
  'error.UPSTREAM_ERROR': 'Open Food Facts est indisponible pour le moment. Réessayez bientôt.',
  'error.BILLING_UNAVAILABLE': 'La facturation est indisponible pour le moment. Réessayez bientôt.',
  'error.SUBSCRIPTION_REQUIRED': 'Un abonnement actif est requis.',
  'error.CONFLICT': 'Vous avez déjà un abonnement actif.',
  'error.INTERNAL_ERROR': 'Une erreur inattendue est survenue.',
  'error.NETWORK_ERROR': 'L’application n’a pas pu joindre l’API.',
};

const dictionaries: Record<Language, Dictionary> = { en, nl, de, fr };

export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

/** Returns a lookup function with {placeholder} substitution. */
export function getTranslator(language: Language): Translate {
  const dictionary = dictionaries[language];

  return (key, values) => {
    const template = dictionary[key];
    if (!values) return template;

    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
}

/** Maps an API error code onto a translated message, with a safe default. */
export function translateErrorCode(translate: Translate, code: string): string {
  const key = `error.${code}` as MessageKey;
  return key in dictionaries.en ? translate(key) : translate('error.INTERNAL_ERROR');
}

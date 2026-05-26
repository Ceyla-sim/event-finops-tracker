export interface Transaction {
  id?: string;
  "Date de la valeur (local)": string;
  "Montant total (TTC)": number;
  "Débit": number;
  "Crédit": number;
  "Solde": number;
  "Devise": string;
  "Nom de la contrepartie": string;
  "Note": string;
  "Catégorie de trésorerie": string;
  "Sous-catégorie de trésorerie": string;
  "Événement"?: string;
  [key: string]: any;
}

export interface FinancialKPIs {
  soldeActuel: number;
  burnRateMoyen: number;
  fluxNetMoyen: number;
  runwayMois: number;
  totalEntrees: number;
  totalSorties: number;
  resultatGlobal: number;
}

export interface EventPL {
  evenement: string;
  entrees: number;
  sorties: number;
  marge: number;
  roi: number;
}

import { Transaction, FinancialKPIs, EventPL } from "./types";

/**
 * Parse de manière robuste les dates au format français DD-MM-YYYY HH:mm:ss ou ISO YYYY-MM-DD HH:mm:ss
 */
export function parseRobustDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const trimmed = dateStr.trim();

  // Match DD-MM-YYYY (optionnellement suivi de l'heure HH:mm:ss)
  const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
  let match = trimmed.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  // Match YYYY-MM-DD (optionnellement suivi de l'heure HH:mm:ss)
  const ymdRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
  match = trimmed.match(ymdRegex);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  // Fallback natif
  const nativeParsed = new Date(trimmed);
  if (!isNaN(nativeParsed.getTime())) {
    return nativeParsed;
  }

  return new Date(NaN);
}

/**
 * Formate une date saine dans le style "YYYY-MM-DD HH:mm:ss" pour un traitement standardisé universel
 */
export function formatDateToISO(date: Date): string {
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Nettoie et prépare les transactions bancaires de manière robuste (similaire à Pandas)
 */
export function processRawTransactions(rawList: any[]): Transaction[] {
  const cleaned: Transaction[] = [];

  for (const item of rawList) {
    if (!item || !item["Date de la valeur (local)"]) continue;

    const rawDate = item["Date de la valeur (local)"];
    const parsedDate = parseRobustDate(rawDate);
    if (isNaN(parsedDate.getTime())) {
      continue; // Ignorer les lignes corrompues sans date valide
    }
    const formattedDate = formatDateToISO(parsedDate);

    // Fonction utilitaire pour parser les valeurs numériques francisées
    const parseAmount = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === "number") return val;
      const cleanStr = String(val)
        .replace(/[^\d,.-]/g, "") // Supprime l'euro et les espaces
        .replace(",", ".");       // Format FR en point
      const num = parseFloat(cleanStr);
      return isNaN(num) ? 0 : num;
    };

    const debit = Math.abs(parseAmount(item["Débit"]));
    const credit = parseAmount(item["Crédit"]);
    const solde = parseAmount(item["Solde"]);
    const ttc = parseAmount(item["Montant total (TTC)"]);

    const note = (item["Note"] || "").toString();
    const ref = (item["Référence"] || "").toString();
    const textToAnalyze = `${note} ${ref}`.toLowerCase();

    // Attribution de la soirée d'après analyse de contenu textuel
    let evenement = "Structure (Frais Fixes / Autres)";
    if (textToAnalyze.includes("dyketopia #1")) {
      evenement = "Dyketopia #1";
    } else if (textToAnalyze.includes("dyketopia #2")) {
      evenement = "Dyketopia #2";
    } else if (textToAnalyze.includes("dyketopia")) {
      evenement = "Dyketopia (Autres)";
    } else if (textToAnalyze.includes("berlin ritual #1")) {
      evenement = "Berlin Ritual #1";
    } else if (textToAnalyze.includes("berlin ritual #2")) {
      evenement = "Berlin Ritual #2";
    } else if (textToAnalyze.includes("berlin")) {
      evenement = "Berlin Ritual";
    } else if (textToAnalyze.includes("warehouse ritual")) {
      evenement = "Warehouse Ritual";
    } else if (textToAnalyze.includes("soirée") || textToAnalyze.includes("soiree")) {
      evenement = "Soirée Non Spécifiée";
    }

    cleaned.push({
      ...item,
      "Date de la valeur (local)": formattedDate,
      "Montant total (TTC)": ttc,
      "Débit": debit,
      "Crédit": credit,
      "Solde": solde,
      "Nom de la contrepartie": item["Nom de la contrepartie"] || "Inconnu",
      "Note": note,
      "Catégorie de trésorerie": item["Catégorie de trésorerie"] || "Non catégorisé",
      "Sous-catégorie de trésorerie": item["Sous-catégorie de trésorerie"] || "Non catégorisé",
      "Événement": evenement,
    });
  }

  // Trier par date d'opération chronologique
  return cleaned.sort((a, b) => {
    return (
      new Date(a["Date de la valeur (local)"]).getTime() -
      new Date(b["Date de la valeur (local)"]).getTime()
    );
  });
}

/**
 * Calcule tous les indicateurs clés de performance financiers (KPIs)
 */
export function calculateKPIs(transactions: Transaction[]): FinancialKPIs {
  if (transactions.length === 0) {
    return {
      soldeActuel: 0,
      burnRateMoyen: 0,
      fluxNetMoyen: 0,
      runwayMois: 0,
      totalEntrees: 0,
      totalSorties: 0,
      resultatGlobal: 0,
    };
  }

  // Solde actuel: derniere valeur chronologique détectée
  const soldeActuel = transactions[transactions.length - 1]["Solde"];

  // Analyse mensuelle par grouping
  const monthlyData: Record<string, { debits: number; credits: number }> = {};
  let totalEntrees = 0;
  let totalSorties = 0;

  transactions.forEach((tx) => {
    const rawDate = tx["Date de la valeur (local)"];
    if (!rawDate) return;

    // '22026-02-15' -> '2026-02'
    const monthKey = rawDate.substring(0, 7);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { debits: 0, credits: 0 };
    }

    monthlyData[monthKey].debits += tx["Débit"];
    monthlyData[monthKey].credits += tx["Crédit"];

    totalEntrees += tx["Crédit"];
    totalSorties += tx["Débit"];
  });

  const monthKeys = Object.keys(monthlyData).sort();
  const monthsCount = monthKeys.length;

  let burnRateMoyen = 0;
  let fluxNetMoyen = 0;

  if (monthsCount > 0) {
    // Prendre les 3 derniers mois si l'historique le permet
    const targetMonths = monthKeys.slice(-3);
    let sumDebits = 0;
    let sumNet = 0;

    targetMonths.forEach((m) => {
      const data = monthlyData[m];
      sumDebits += data.debits;
      sumNet += data.credits - data.debits;
    });

    burnRateMoyen = sumDebits / targetMonths.length;
    fluxNetMoyen = sumNet / targetMonths.length;
  }

  // Estimation du Runway
  // Si on perd de l'argent (fluxNetMoyen < 0), runway = Solde actuel / pertes moyennes
  let runwayMois = Infinity;
  if (fluxNetMoyen < 0) {
    runwayMois = soldeActuel / Math.abs(fluxNetMoyen);
  }

  const resultatGlobal = totalEntrees - totalSorties;

  return {
    soldeActuel,
    burnRateMoyen,
    fluxNetMoyen,
    runwayMois,
    totalEntrees,
    totalSorties,
    resultatGlobal,
  };
}

/**
 * Évalue le P&L (Profitability & Loss) par événement / soirée
 */
export function calculateEventPL(transactions: Transaction[]): EventPL[] {
  const groups: Record<string, { entrees: number; sorties: number }> = {};

  transactions.forEach((tx) => {
    const evtName = tx["Événement"] || "Structure (Frais Fixes / Autres)";
    if (!groups[evtName]) {
      groups[evtName] = { entrees: 0, sorties: 0 };
    }
    groups[evtName].entrees += tx["Crédit"];
    groups[evtName].sorties += tx["Débit"];
  });

  const plList: EventPL[] = Object.keys(groups).map((evt) => {
    const data = groups[evt];
    const marge = data.entrees - data.sorties;
    const roi = data.sorties > 0 ? (marge / data.sorties) * 100 : data.entrees > 0 ? 100 : 0;

    return {
      evenement: evt,
      entrees: data.entrees,
      sorties: data.sorties,
      marge,
      roi,
    };
  });

  // Trier par marge décroissante
  return plList.sort((a, b) => b.marge - a.marge);
}

/**
 * Formulateur d'euros
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

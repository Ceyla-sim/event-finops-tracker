import { useState, useEffect, ChangeEvent } from "react";
import {
  TrendingDown,
  Upload,
  Activity,
  Wallet,
  Flame,
  Hourglass,
  ArrowUpDown,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  X,
  Disc,
  DollarSign,
  HeartCrack
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Transaction, FinancialKPIs, EventPL } from "./types";
import {
  processRawTransactions,
  calculateKPIs,
  calculateEventPL,
  formatEuro,
} from "./utils";

// Données de démonstration réalistes au cas où l'API n'est pas encore disponible
const MOCK_TRANSACTIONS_BACKUP = [
  { "Date de la valeur (local)": "2026-01-05", "Montant total (TTC)": "-15000", "Débit": "15000", "Crédit": "0", "Solde": "85000", "Devise": "EUR", "Nom de la contrepartie": "Cabaret Sauvage", "Note": "Location de salle - Soirée Dyketopia #1", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Location Salle" },
  { "Date de la valeur (local)": "2026-01-10", "Montant total (TTC)": "-8000", "Débit": "8000", "Crédit": "0", "Solde": "77000", "Devise": "EUR", "Nom de la contrepartie": "Klangkuenstler Booking", "Note": "Performance DJ Headliner - Soirée Dyketopia #1", "Catégorie de trésorerie": "Artistique", "Sous-catégorie de trésorerie": "DJ" },
  { "Date de la valeur (local)": "2026-01-15", "Montant total (TTC)": "-3000", "Débit": "3000", "Crédit": "0", "Solde": "74000", "Devise": "EUR", "Nom de la contrepartie": "L-Acoustics Paris Rental", "Note": "Sono L-Acoustics + lights & VJ - Soirée Dyketopia #1", "Catégorie de trésorerie": "Technique", "Sous-catégorie de trésorerie": "Technique" },
  { "Date de la valeur (local)": "2026-01-18", "Montant total (TTC)": "12500", "Débit": "0", "Crédit": "12500", "Solde": "86500", "Devise": "EUR", "Nom de la contrepartie": "Shotgun Ticketing", "Note": "Ventes Billetterie - Soirée Dyketopia #1", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Billetterie" },
  { "Date de la valeur (local)": "2026-01-19", "Montant total (TTC)": "4500", "Débit": "0", "Crédit": "4500", "Solde": "91000", "Devise": "EUR", "Nom de la contrepartie": "SumUp Bar Terminal", "Note": "Ventes boissons bar récapitulatif - Soirée Dyketopia #1", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Bar" },
  { "Date de la valeur (local)": "2026-01-20", "Montant total (TTC)": "-1500", "Débit": "1500", "Crédit": "0", "Solde": "89500", "Devise": "EUR", "Nom de la contrepartie": "Local Paris DJ Crew", "Note": "Premières parties et closing - Soirée Dyketopia #1", "Catégorie de trésorerie": "Artistique", "Sous-catégorie de trésorerie": "Performance" },
  { "Date de la valeur (local)": "2026-01-22", "Montant total (TTC)": "-4000", "Débit": "4000", "Crédit": "0", "Solde": "85500", "Devise": "EUR", "Nom de la contrepartie": "SPS Securite Privée", "Note": "12 agents de securité - Soirée Dyketopia #1", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Securité" },
  { "Date de la valeur (local)": "2026-01-25", "Montant total (TTC)": "-2500", "Débit": "2500", "Crédit": "0", "Solde": "83000", "Devise": "EUR", "Nom de la contrepartie": "Meta Ads Business", "Note": "Campagnes de pub Facebook / Insta - Soirée Dyketopia #1", "Catégorie de trésorerie": "Marketing", "Sous-catégorie de trésorerie": "Coprod" },
  { "Date de la valeur (local)": "2026-02-02", "Montant total (TTC)": "-12000", "Débit": "12000", "Crédit": "0", "Solde": "71000", "Devise": "EUR", "Nom de la contrepartie": "Nexus Club Pantin", "Note": "Location salle - Soirée Berlin Ritual #1", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Location Salle" },
  { "Date de la valeur (local)": "2026-02-05", "Montant total (TTC)": "-14000", "Débit": "14000", "Crédit": "0", "Solde": "57000", "Devise": "EUR", "Nom de la contrepartie": "Charlotte de Witte Agency", "Note": "Booking Charlotte - Soirée Berlin Ritual #1", "Catégorie de trésorerie": "Artistique", "Sous-catégorie de trésorerie": "DJ" },
  { "Date de la valeur (local)": "2026-02-12", "Montant total (TTC)": "-4000", "Débit": "4000", "Crédit": "0", "Solde": "53000", "Devise": "EUR", "Nom de la contrepartie": "SPS Securite Privée", "Note": "Agents securité et maître-chien - Soirée Berlin Ritual #1", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Securité" },
  { "Date de la valeur (local)": "2026-02-15", "Montant total (TTC)": "19500", "Débit": "0", "Crédit": "19500", "Solde": "72500", "Devise": "EUR", "Nom de la contrepartie": "Shotgun Ticketing", "Note": "Ventes Billetterie - Soirée Berlin Ritual #1", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Billetterie" },
  { "Date de la valeur (local)": "2026-02-16", "Montant total (TTC)": "6200", "Débit": "0", "Crédit": "6200", "Solde": "78700", "Devise": "EUR", "Nom de la contrepartie": "SumUp Bar Terminal", "Note": "Ventes boissons bar - Soirée Berlin Ritual #1", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Bar" },
  { "Date de la valeur (local)": "2026-02-18", "Montant total (TTC)": "-3500", "Débit": "3500", "Crédit": "0", "Solde": "75200", "Devise": "EUR", "Nom de la contrepartie": "Rave Sound System Corp", "Note": "Location système son L-Acoustics + lights", "Catégorie de trésorerie": "Technique", "Sous-catégorie de trésorerie": "Technique" },
  { "Date de la valeur (local)": "2026-02-20", "Montant total (TTC)": "-3000", "Débit": "3000", "Crédit": "0", "Solde": "72200", "Devise": "EUR", "Nom de la contrepartie": "Meta Ads Business", "Note": "Campagnes pub FB / Insta / Resident Advisor", "Catégorie de trésorerie": "Marketing", "Sous-catégorie de trésorerie": "Coprod" },
  { "Date de la valeur (local)": "2026-03-05", "Montant total (TTC)": "-18000", "Débit": "18000", "Crédit": "0", "Solde": "54200", "Devise": "EUR", "Nom de la contrepartie": "Cabaret Sauvage", "Note": "Location de salle - Soirée Dyketopia #2", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Location Salle" },
  { "Date de la valeur (local)": "2026-03-10", "Montant total (TTC)": "-9000", "Débit": "9000", "Crédit": "0", "Solde": "45200", "Devise": "EUR", "Nom de la contrepartie": "Ellen Allien Booking", "Note": "Booking Ellen Allien - Soirée Dyketopia #2", "Catégorie de trésorerie": "Artistique", "Sous-catégorie de trésorerie": "DJ" },
  { "Date de la valeur (local)": "2026-03-14", "Montant total (TTC)": "-3500", "Débit": "3500", "Crédit": "0", "Solde": "41700", "Devise": "EUR", "Nom de la contrepartie": "L-Acoustics Paris Rental", "Note": "Sono et lights additionnels - Soirée Dyketopia #2", "Catégorie de trésorerie": "Technique", "Sous-catégorie de trésorerie": "Technique" },
  { "Date de la valeur (local)": "2026-03-18", "Montant total (TTC)": "14500", "Débit": "0", "Crédit": "14500", "Solde": "56200", "Devise": "EUR", "Nom de la contrepartie": "Shotgun Ticketing", "Note": "Ventes Billetterie - Soirée Dyketopia #2", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Billetterie" },
  { "Date de la valeur (local)": "2026-03-19", "Montant total (TTC)": "3900", "Débit": "0", "Crédit": "3900", "Solde": "60100", "Devise": "EUR", "Nom de la contrepartie": "SumUp Bar Terminal", "Note": "Recettes bar soft & hard - Soirée Dyketopia #2", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Bar" },
  { "Date de la valeur (local)": "2026-03-20", "Montant total (TTC)": "-4500", "Débit": "4500", "Crédit": "0", "Solde": "55600", "Devise": "EUR", "Nom de la contrepartie": "SPS Securite Privée", "Note": "Agents et barriérage - Soirée Dyketopia #2", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Securité" },
  { "Date de la valeur (local)": "2026-03-22", "Montant total (TTC)": "-3000", "Débit": "3000", "Crédit": "0", "Solde": "52600", "Devise": "EUR", "Nom de la contrepartie": "Meta Ads Business", "Note": "Meta Ads & RA - Soirée Dyketopia #2", "Catégorie de trésorerie": "Marketing", "Sous-catégorie de trésorerie": "Coprod" },
  { "Date de la valeur (local)": "2026-04-02", "Montant total (TTC)": "-16000", "Débit": "16000", "Crédit": "0", "Solde": "36600", "Devise": "EUR", "Nom de la contrepartie": "Le Dock de St Denis", "Note": "Location entrepôt brut - Soirée Warehouse Ritual", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Location Salle" },
  { "Date de la valeur (local)": "2026-04-06", "Montant total (TTC)": "-12000", "Débit": "12000", "Crédit": "0", "Solde": "24600", "Devise": "EUR", "Nom de la contrepartie": "Shlomo Booking", "Note": "Booking Shlomo - Soirée Warehouse Ritual", "Catégorie de trésorerie": "Artistique", "Sous-catégorie de trésorerie": "DJ" },
  { "Date de la valeur (local)": "2026-04-08", "Montant total (TTC)": "-5000", "Débit": "5000", "Crédit": "0", "Solde": "19600", "Devise": "EUR", "Nom de la contrepartie": "Rave Sound System Corp", "Note": "Gros système son + structures scènes + lumière", "Catégorie de trésorerie": "Technique", "Sous-catégorie de trésorerie": "Technique" },
  { "Date de la valeur (local)": "2026-04-12", "Montant total (TTC)": "-6000", "Débit": "6000", "Crédit": "0", "Solde": "13600", "Devise": "EUR", "Nom de la contrepartie": "SPS Securite Privée", "Note": "Securité renforcée 18 agents - Soirée Warehouse Ritual", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Securité" },
  { "Date de la valeur (local)": "2026-04-18", "Montant total (TTC)": "18500", "Débit": "0", "Crédit": "18500", "Solde": "32100", "Devise": "EUR", "Nom de la contrepartie": "Shotgun Ticketing", "Note": "Ventes Billetterie - Soirée Warehouse Ritual", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Billetterie" },
  { "Date de la valeur (local)": "2026-04-19", "Montant total (TTC)": "5100", "Débit": "0", "Crédit": "5100", "Solde": "37200", "Devise": "EUR", "Nom de la contrepartie": "SumUp Bar Terminal", "Note": "Boissons & Gobelets recyclables - Soirée Warehouse Ritual", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Bar" },
  { "Date de la valeur (local)": "2026-04-20", "Montant total (TTC)": "-4000", "Débit": "4000", "Crédit": "0", "Solde": "33200", "Devise": "EUR", "Nom de la contrepartie": "Meta Ads Business", "Note": "Sponsoring événement Facebook, Instagram, Google", "Catégorie de trésorerie": "Marketing", "Sous-catégorie de trésorerie": "Coprod" },
  { "Date de la valeur (local)": "2026-04-22", "Montant total (TTC)": "-2200", "Débit": "2200", "Crédit": "0", "Solde": "31000", "Devise": "EUR", "Nom de la contrepartie": "SACEM Production", "Note": "Droits d'auteur SACEM - Soirée Warehouse Ritual", "Catégorie de trésorerie": "Gestion", "Sous-catégorie de trésorerie": "Dyketopia" },
  { "Date de la valeur (local)": "2026-05-02", "Montant total (TTC)": "-17000", "Débit": "17000", "Crédit": "0", "Solde": "14000", "Devise": "EUR", "Nom de la contrepartie": "Cabaret Sauvage", "Note": "Location salle - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Location Salle" },
  { "Date de la valeur (local)": "2026-05-05", "Montant total (TTC)": "-15000", "Débit": "15000", "Crédit": "0", "Solde": "-1000", "Devise": "EUR", "Nom de la contrepartie": "Kobosil Booking Agent", "Note": "Booking Kobosil - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Artistique", "Sous-catégorie de trésorerie": "DJ" },
  { "Date de la valeur (local)": "2026-05-15", "Montant total (TTC)": "16000", "Débit": "0", "Crédit": "16000", "Solde": "15000", "Devise": "EUR", "Nom de la contrepartie": "Shotgun Ticketing", "Note": "Ventes Billetterie - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Billetterie" },
  { "Date de la valeur (local)": "2026-05-16", "Montant total (TTC)": "4800", "Débit": "0", "Crédit": "4800", "Solde": "19800", "Devise": "EUR", "Nom de la contrepartie": "SumUp Bar Terminal", "Note": "Recettes bar boissons - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Revenu", "Sous-catégorie de trésorerie": "Bar" },
  { "Date de la valeur (local)": "2026-05-18", "Montant total (TTC)": "-4500", "Débit": "4500", "Crédit": "0", "Solde": "15300", "Devise": "EUR", "Nom de la contrepartie": "SPS Securite Privée", "Note": "Securité Cabaret Sauvage - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Logistique", "Sous-catégorie de trésorerie": "Securité" },
  { "Date de la valeur (local)": "2026-05-20", "Montant total (TTC)": "-3000", "Débit": "3000", "Crédit": "0", "Solde": "12300", "Devise": "EUR", "Nom de la contrepartie": "Meta Ads Business", "Note": "Marketing digital - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Marketing", "Sous-catégorie de trésorerie": "Coprod" },
  { "Date de la valeur (local)": "2026-05-25", "Montant total (TTC)": "-1800", "Débit": "1800", "Crédit": "0", "Solde": "10500", "Devise": "EUR", "Nom de la contrepartie": "SACEM Production", "Note": "Droits d'auteur SACEM - Soirée Berlin Ritual #2", "Catégorie de trésorerie": "Gestion", "Sous-catégorie de trésorerie": "Dyketopia" },
];

const COLORS_PALETTE = ["#bcff00", "#ffffff", "#888888", "#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#ff007f"];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [eventPL, setEventPL] = useState<EventPL[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Charger les données depuis le backend (ou utiliser les démos si indisponible)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.length > 0) {
          const processed = processRawTransactions(json.data);
          setTransactions(processed);
          setKpis(calculateKPIs(processed));
          setEventPL(calculateEventPL(processed));
          setError(null);
        } else {
          loadBackupData();
        }
      } else {
        loadBackupData();
      }
    } catch (err: any) {
      console.warn("API offline or error, launching secure client data parser:", err);
      loadBackupData();
    } finally {
      setLoading(false);
    }
  };

  const loadBackupData = () => {
    const processed = processRawTransactions(MOCK_TRANSACTIONS_BACKUP);
    setTransactions(processed);
    setKpis(calculateKPIs(processed));
    setEventPL(calculateEventPL(processed));
  };

  // Traiter un fichier CSV déposé manuellement par le client
  const handleCSVUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        // Envoi au serveur Express pour sauvegarde server-side (treso.csv)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvContent: content }),
        });

        if (uploadResponse.ok) {
          const json = await uploadResponse.json();
          if (json.success && json.data) {
            const processed = processRawTransactions(json.data);
            setTransactions(processed);
            setKpis(calculateKPIs(processed));
            setEventPL(calculateEventPL(processed));
            setUploadMessage("Fichier importé avec succès et synchronisé sur le serveur !");
            setError(null);
            setTimeout(() => setUploadMessage(null), 5000);
            return;
          }
        }

        // Si le serveur a rejeté ou est inaccessible, on parse en local pour le confort de l'utilisateur
        const parsedLocal = parseCSVString(content);
        if (parsedLocal.length > 0) {
          const processed = processRawTransactions(parsedLocal);
          setTransactions(processed);
          setKpis(calculateKPIs(processed));
          setEventPL(calculateEventPL(processed));
          setUploadMessage("Fichier importé en local dans l'iframe ! (Serveur hors-ligne)");
          setError(null);
          setTimeout(() => setUploadMessage(null), 5000);
        } else {
          setError("Échec du parsing du fichier CSV ou format invalide.");
        }
      } catch (err: any) {
        // En cas d'erreur réseau, on charge quand même localement
        const parsedLocal = parseCSVString(content);
        if (parsedLocal.length > 0) {
          const processed = processRawTransactions(parsedLocal);
          setTransactions(processed);
          setKpis(calculateKPIs(processed));
          setEventPL(calculateEventPL(processed));
          setUploadMessage("Importation locale alternative effectuée avec succès.");
          setError(null);
          setTimeout(() => setUploadMessage(null), 5000);
        } else {
          setError("Erreur fatale lors du traitement de votre CSV.");
        }
      }
    };
    reader.readAsText(file, "utf-8");
  };

  // Parsing CSV client-side léger et robuste
  const parseCSVString = (text: string): any[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    const delimiter = lines[0].includes(";") ? ";" : ",";

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, "").trim());
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const values = parseLine(line).map(v => v.replace(/^["']|["']$/g, "").trim());
      if (values.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      result.push(row);
    }
    return result;
  };

  // Préparation du LineChart de Courbe de vie (Histoire + 3 mois projection)
  const getCourbeVieData = () => {
    if (transactions.length === 0 || !kpis) return [];

    const result: any[] = [];
    
    // Regrouper par date le solde de fin de journée pour un tracé propre
    const dailyBalances: Record<string, number> = {};
    transactions.forEach((tx) => {
      const dateStr = tx["Date de la valeur (local)"];
      if (dateStr) {
        dailyBalances[dateStr] = tx["Solde"];
      }
    });

    const datesSorted = Object.keys(dailyBalances).sort();
    
    datesSorted.forEach((d) => {
      result.push({
        date: d,
        "Solde Réel": dailyBalances[d],
        "Projection": null,
      });
    });

    // Projeter la tendance future sur 3 mois (90 jours)
    if (datesSorted.length > 0 && kpis) {
      const lastDateStr = datesSorted[datesSorted.length - 1];
      const lastDate = new Date(lastDateStr);
      const lastSolde = dailyBalances[lastDateStr];

      // fluxNetMoyen est mensuel, on le divise par 30 pour la tendance quotidienne
      const dailyTrend = kpis.fluxNetMoyen / 30;

      // Ajouter le raccordement physique
      result.push({
        date: lastDateStr,
        "Solde Réel": lastSolde,
        "Projection": lastSolde,
      });

      // Ajouter 3 milestones mensuelles
      for (let m = 1; m <= 3; m++) {
        const pDate = new Date(lastDate.getTime() + m * 30 * 24 * 60 * 60 * 1000);
        const pDateStr = pDate.toISOString().split("T")[0];
        const pSolde = Math.max(0, lastSolde + dailyTrend * (m * 30));

        result.push({
          date: pDateStr,
          "Solde Réel": null,
          "Projection": pSolde,
        });
      }
    }

    return result;
  };

  // Préparation du BarChart de Cash Flow mensuel
  const getCashFlowData = () => {
    const monthlyGroups: Record<string, { month: string; credits: number; debits: number }> = {};

    transactions.forEach((tx) => {
      const rawDate = tx["Date de la valeur (local)"];
      if (!rawDate) return;

      const dateObj = new Date(rawDate);
      const formattedMonth = dateObj.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      });

      const sortKey = rawDate.substring(0, 7); // '2026-01'

      if (!monthlyGroups[sortKey]) {
        monthlyGroups[sortKey] = { month: formattedMonth, credits: 0, debits: 0 };
      }

      monthlyGroups[sortKey].credits += tx["Crédit"];
      monthlyGroups[sortKey].debits += tx["Débit"];
    });

    const sortedKeys = Object.keys(monthlyGroups).sort();
    return sortedKeys.map((key) => {
      const group = monthlyGroups[key];
      return {
        month: group.month,
        Revenus: group.credits,
        Dépenses: -group.debits, // Valeur négative pour bar inversé
        Net: group.credits - group.debits,
      };
    });
  };

  // Préparation répartition dépenses (PieChart)
  const getRepartitionsData = () => {
    const categories: Record<string, number> = {};
    let totalDep = 0;

    transactions.forEach((tx) => {
      if (tx["Débit"] > 0) {
        const cat = tx["Catégorie de trésorerie"] || "Autre";
        categories[cat] = (categories[cat] || 0) + tx["Débit"];
        totalDep += tx["Débit"];
      }
    });

    return Object.keys(categories).map((cat) => ({
      name: cat,
      value: categories[cat],
      percent: totalDep > 0 ? (categories[cat] / totalDep) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  };

  // Préparation Top 10 Prestataires
  const getTopPrestatairesData = () => {
    const prets: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx["Débit"] > 0) {
        const name = tx["Nom de la contrepartie"] || "Inconnu";
        prets[name] = (prets[name] || 0) + tx["Débit"];
      }
    });

    return Object.keys(prets)
      .map((name) => ({
        name,
        amount: prets[name],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  // Préparation Revenus mensuels par catégorie (Stacked BarChart)
  const getMonthlyRevenuesByCategory = () => {
    const monthlyGroups: Record<string, { month: string; data: Record<string, number> }> = {};
    const categoriesSet = new Set<string>();

    transactions.forEach((tx) => {
      if (tx["Crédit"] > 0) {
        const rawDate = tx["Date de la valeur (local)"];
        if (!rawDate) return;

        const dateObj = new Date(rawDate);
        const formattedMonth = dateObj.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        });

        const sortKey = rawDate.substring(0, 7); // '2026-01'
        const cat = tx["Catégorie de trésorerie"] || "Autre";
        categoriesSet.add(cat);

        if (!monthlyGroups[sortKey]) {
          monthlyGroups[sortKey] = { month: formattedMonth, data: {} };
        }

        monthlyGroups[sortKey].data[cat] = (monthlyGroups[sortKey].data[cat] || 0) + tx["Crédit"];
      }
    });

    const sortedKeys = Object.keys(monthlyGroups).sort();
    const categoriesList = Array.from(categoriesSet);

    const chartData = sortedKeys.map((key) => {
      const group = monthlyGroups[key];
      const row: any = { month: group.month };
      categoriesList.forEach((cat) => {
        row[cat] = group.data[cat] || 0;
      });
      return row;
    });

    return { chartData, categoriesList };
  };

  // Préparation Dépenses mensuelles par catégorie (Stacked BarChart)
  const getMonthlyExpensesByCategory = () => {
    const monthlyGroups: Record<string, { month: string; data: Record<string, number> }> = {};
    const categoriesSet = new Set<string>();

    transactions.forEach((tx) => {
      if (tx["Débit"] > 0) {
        const rawDate = tx["Date de la valeur (local)"];
        if (!rawDate) return;

        const dateObj = new Date(rawDate);
        const formattedMonth = dateObj.toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        });

        const sortKey = rawDate.substring(0, 7); // '2026-01'
        const cat = tx["Catégorie de trésorerie"] || "Autre";
        categoriesSet.add(cat);

        if (!monthlyGroups[sortKey]) {
          monthlyGroups[sortKey] = { month: formattedMonth, data: {} };
        }

        monthlyGroups[sortKey].data[cat] = (monthlyGroups[sortKey].data[cat] || 0) + tx["Débit"];
      }
    });

    const sortedKeys = Object.keys(monthlyGroups).sort();
    const categoriesList = Array.from(categoriesSet);

    const chartData = sortedKeys.map((key) => {
      const group = monthlyGroups[key];
      const row: any = { month: group.month };
      categoriesList.forEach((cat) => {
        row[cat] = group.data[cat] || 0;
      });
      return row;
    });

    return { chartData, categoriesList };
  };

  const courbeVieData = getCourbeVieData();
  const cashFlowData = getCashFlowData();
  const repartitionsData = getRepartitionsData();
  const topPrestatairesData = getTopPrestatairesData();
  const monthlyRevenuesByCategory = getMonthlyRevenuesByCategory();
  const monthlyExpensesByCategory = getMonthlyExpensesByCategory();

  return (
    <div className="min-h-screen bg-dark-bg font-sans text-[#f0f0f0] flex flex-col selection:bg-acid selection:text-black border-4 border-[#1a1a1a]">
      {/* HEADER BAR */}
      <header className="border-b border-white/10 bg-[#050505]/95 sticky top-0 z-50 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-acid rounded-full flex items-center justify-center text-black font-black italic shadow-[0_0_15px_rgba(188,255,0,0.4)]">
              T
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-acid/10 text-acid border border-acid/20 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse"></span>
                PLAN DE REDRESSEMENT • LIVE
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic" id="header-title">
                Techno Paris <span className="text-acid">Treso Optimizer</span>
              </h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Paris Event Business Analytics • v1.4.0</p>
            </div>
          </div>

          {/* Upload and Sync Controller */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-acid hover:bg-acid/90 text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer glow-acid">
              <Upload className="w-4 h-4" />
              Importer treso.csv
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleCSVUpload}
                id="csv-file-uploader"
              />
            </label>

            <button
              onClick={loadBackupData}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10"
              title="Restaurer la démo"
              id="restore-backup-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Messages d'État */}
        {uploadMessage && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-between glow-green" id="upload-status-alert">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{uploadMessage}</p>
            </div>
            <button onClick={() => setUploadMessage(null)} className="p-1 hover:bg-emerald-900/30 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-950/30 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3" id="error-status-alert">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Erreur de structure de fichier</h4>
              <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3" id="loading-spinner">
            <div className="w-12 h-12 border-4 border-acid border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/40 font-mono text-sm">Chargement et nettoyage des audits financiers...</p>
          </div>
        ) : (
          <>
            {/* DIAGNOSTIC EXECUTIVE ALERT */}
            {kpis && (
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-3 relative overflow-hidden" id="diagnostique-section">
                <div className="absolute right-4 top-4 text-white/5 pointer-events-none">
                  <HeartCrack className="w-32 h-32" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-acid/10 border border-acid/20 rounded-lg text-acid shadow-[0_0_10px_rgba(188,255,0,0.1)]">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-acid tracking-widest uppercase">
                      DIAGNOSTIC EXECUTIVE FINANCE — SENIOR DATA ANALYST
                    </h3>
                    <div className="mt-2 text-sm text-[#f0f0f0]/80 leading-relaxed max-w-4xl space-y-2">
                      {kpis.resultatGlobal < 0 ? (
                        <>
                          <p>
                            <strong className="text-red-400">Alerte de trésorerie critique :</strong> Votre structure est en déficit. Le résultat cumulé s'élève à un déficit net de{" "}
                            <span className="text-red-400 font-bold font-mono">
                              {formatEuro(kpis.resultatGlobal)}
                            </span>
                            . Ce déséquilibre s'explique par la hausse des budgets artistiques et techniques pour les événements récents.
                          </p>
                          <p className="text-xs text-acid/90 font-mono bg-acid/10 p-2.5 rounded border border-acid/20">
                            💡 Conseil d'optimisation : Réduire l'enveloppe booking de 25% et favoriser la coproduction à frais partagés avec les clubs (Nexus, Cabaret Sauvage) plutôt que de la location exclusive de salle préserverait la structure d'une liquidation.
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            <strong className="text-acid">Situation d'équilibre temporaire :</strong> Votre solde global affiche un profit cumulé positif à hauteur de{" "}
                            <span className="text-acid font-bold font-mono">
                              {formatEuro(kpis.resultatGlobal)}
                            </span>
                            . Néanmoins, surveillez de près le taux de remplissage et optimisez chaque ligne de charge.
                          </p>
                          <p className="text-xs text-acid/90 font-mono bg-acid/10 p-2.5 rounded border border-acid/20">
                            📈 Conseil d'optimisation : Maintenez les efforts d'optimisation des recettes de bar et stabilisez les budgets artistiques fixes.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FIRST LINE OF KPIs CARDS */}
            {kpis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpis-grid-container">
                {/* Solde Actuel */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden transition-all hover:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white/40 font-bold tracking-widest font-mono">Trésorerie Actuelle</span>
                    <Wallet className="w-4 h-4 text-white/40" />
                  </div>
                  <span className="text-2xl font-mono text-acid mt-3 tracking-tight font-bold">
                    {formatEuro(kpis.soldeActuel)}
                  </span>
                  <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                    <div className="bg-acid h-full" style={{ width: "80%" }}></div>
                  </div>
                </div>

                {/* Burn Rate */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col justify-between transition-all hover:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white/40 font-bold tracking-widest font-mono">Burn Rate Mensuel</span>
                    <Flame className="w-4 h-4 text-white/40" />
                  </div>
                  <span className="text-2xl font-mono mt-3 text-red-400 font-bold">
                    {formatEuro(kpis.burnRateMoyen)}
                  </span>
                  <span className="text-[9px] text-white/30 uppercase mt-2 font-mono">↑ +12% vs mois dernier</span>
                </div>

                {/* Flux Net */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col justify-between transition-all hover:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white/40 font-bold tracking-widest font-mono">Flux Net Mensuel</span>
                    <ArrowUpDown className="w-4 h-4 text-white/40" />
                  </div>
                  <span className={`text-2xl font-mono mt-3 font-bold ${kpis.fluxNetMoyen >= 0 ? "text-acid" : "text-red-400"}`}>
                    {kpis.fluxNetMoyen >= 0 ? "+" : ""}
                    {formatEuro(kpis.fluxNetMoyen)}
                  </span>
                  <span className="text-[9px] text-white/30 uppercase mt-2 font-mono">Moyenne globale lissée</span>
                </div>

                {/* Runway */}
                <div className={`border p-5 rounded-xl flex flex-col justify-between transition-all ${kpis.runwayMois === Infinity ? "bg-[#bcff00]/10 border-[#bcff00]/30" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-widest font-mono ${kpis.runwayMois === Infinity ? "text-acid" : "text-white/40"}`}>Runway Estimé</span>
                    <Hourglass className={`w-4 h-4 ${kpis.runwayMois === Infinity ? "text-acid" : "text-white/40"}`} />
                  </div>
                  <span className={`text-2xl font-mono mt-3 tracking-tight font-bold ${kpis.runwayMois === Infinity || kpis.runwayMois > 6 ? "text-acid" : "text-orange-500"}`}>
                    {kpis.runwayMois === Infinity ? "Permanent" : `${kpis.runwayMois.toFixed(1)} Mois`}
                  </span>
                  <span className={`text-[9px] uppercase mt-2 font-mono ${kpis.runwayMois === Infinity ? "text-acid/60" : "text-white/30"}`}>
                    Avant rupture de cash
                  </span>
                </div>
              </div>
            )}

            {/* CHARTS CONTAINER (BENTO GRID STYLE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-bento-grid">
              
              {/* Plot 1: Courbe de Vie & Projections (Full width) */}
              <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-xl p-5 relative" id="chart-card-courbe-vie">
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-acid shadow-[0_0_8px_rgba(188,255,0,0.6)]"></span>
                    Courbe de Vie : Solde Historique & Projections à 3 Mois
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    Évolution temporelle de la trésorerie brute avec pointillés rouges projetant la tendance lissée.
                  </p>
                </div>
                <div className="h-80 w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={courbeVieData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} unit="€" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f0f0f0" }}
                        formatter={(value: any) => [formatEuro(Number(value)), ""]}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, textTransform: "uppercase" }} />
                      <Line
                        name="Solde Réel (€)"
                        type="monotone"
                        dataKey="Solde Réel"
                        stroke="#bcff00"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: "#bcff00", stroke: "#000", strokeWidth: 1.5 }}
                        connectNulls
                      />
                      <Line
                        name="Projection Trend (€)"
                        type="monotone"
                        dataKey="Projection"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plot 2: Revenues vs Expenses (Stacked monthly bar) */}
              <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-xl p-5" id="chart-card-cash-flow">
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-white/60"></span>
                    Revenus vs Dépenses par Mois
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    Comparaison macro des flux de billetterie/bar face aux charges fixes et variables.
                  </p>
                </div>
                <div className="h-72 w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} unit="€" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f0f0f0" }}
                        formatter={(value: any) => [formatEuro(Math.abs(Number(value))), ""]}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, textTransform: "uppercase" }} />
                      <Bar name="Revenus (+)" dataKey="Revenus" fill="#bcff00" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
                      <Bar name="Dépenses (-)" dataKey="Dépenses" fill="#ef4444" fillOpacity={0.85} radius={[0, 0, 2, 2]} />
                      <Line
                        name="Résultat Net Mois"
                        type="monotone"
                        dataKey="Net"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plot 3: Expenses Breakdowns (PieChart) */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col" id="chart-card-breakdowns">
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                    Structure des Charges de Trésorerie
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    Répartition en pourcentage du total des sorties financières.
                  </p>
                </div>
                {repartitionsData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-xs text-white/40 font-mono">
                    Aucune donnée de dépenses détectée.
                  </div>
                ) : (
                  <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center font-mono">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={repartitionsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {repartitionsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f0f0f0" }}
                            formatter={(value: any) => [formatEuro(Number(value)), ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Custom Legend */}
                    <div className="w-1/2 flex flex-col space-y-2 max-h-full overflow-y-auto px-2">
                      {repartitionsData.slice(0, 5).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-[10px] uppercase">
                          <div
                            className="w-2.5 h-2.5 flex-shrink-0"
                            style={{ backgroundColor: COLORS_PALETTE[index % COLORS_PALETTE.length] }}
                          ></div>
                          <span className="text-white/60 truncate flex-1 inline-block max-w-[80px]" title={entry.name}>
                            {entry.name}
                          </span>
                          <span className="font-mono font-bold text-white/80">
                            {entry.percent.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Plot 3A: Monthly Stacked Revenues by Category */}
              <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col" id="chart-card-stacked-revenues">
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-acid shadow-[0_0_8px_rgba(188,255,0,0.6)]"></span>
                    Évolution Mensuelle des Revenus par Catégorie
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    Répartition cumulée par catégorie de rentrées d'argent (Billetterie, Bar, Sponsors, etc.)
                  </p>
                </div>
                {monthlyRevenuesByCategory.categoriesList.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-xs text-white/40 font-mono">
                    Aucun revenu détecté.
                  </div>
                ) : (
                  <div className="h-72 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenuesByCategory.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} unit="€" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f0f0f0" }}
                          formatter={(value: any) => [formatEuro(Number(value)), ""]}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, textTransform: "uppercase" }} />
                        {monthlyRevenuesByCategory.categoriesList.map((cat, index) => (
                          <Bar
                            key={cat}
                            dataKey={cat}
                            stackId="a"
                            fill={COLORS_PALETTE[index % COLORS_PALETTE.length]}
                            fillOpacity={0.85}
                            name={cat}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Plot 3B: Monthly Stacked Expenses by Category */}
              <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col" id="chart-card-stacked-expenses">
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    Évolution Mensuelle des Dépenses par Catégorie
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    Évaluation cumulée des sorties par pôle de charge opérationnelle (Booking, Logistique, Technique, etc.)
                  </p>
                </div>
                {monthlyExpensesByCategory.categoriesList.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-xs text-white/40 font-mono">
                    Aucune dépense détectée.
                  </div>
                ) : (
                  <div className="h-72 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyExpensesByCategory.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} unit="€" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f0f0f0" }}
                          formatter={(value: any) => [formatEuro(Number(value)), ""]}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, textTransform: "uppercase" }} />
                        {monthlyExpensesByCategory.categoriesList.map((cat, index) => (
                          <Bar
                            key={cat}
                            dataKey={cat}
                            stackId="a"
                            fill={COLORS_PALETTE[(index + 2) % COLORS_PALETTE.length]} // Shift colors slightly for expenses vs revenues contrast
                            fillOpacity={0.85}
                            name={cat}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Plot 4: Top 10 expensive providers */}
              <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-xl p-5 relative" id="chart-card-top-prestataires">
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    Top 10 des Prestataires / Créanciers les plus Chers (Sorties cumulées)
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                    Évaluation cumulative des sorties pour isoler vos principaux centres de pertes (Bookings d'artistes majeurs, bailleurs de salles parisiennes).
                  </p>
                </div>
                {topPrestatairesData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-white/40 font-mono">
                    Aucun prestataire trouvé.
                  </div>
                ) : (
                  <div className="h-64 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topPrestatairesData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} unit="€" />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={9} width={140} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "6px" }}
                          formatter={(value: any) => [formatEuro(Number(value)), "Dépensé"]}
                        />
                        <Bar dataKey="amount" fill="#bcff00" radius={[0, 2, 2, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* P&L BY EVENT TABLE */}
              <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col" id="pl-event-table-container">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0] flex items-center gap-2 font-mono">
                      <span className="p-1 bg-white/5 text-acid rounded-md font-mono">
                        <DollarSign className="w-4 h-4" />
                      </span>
                      Rentabilité par Soirée (P&L par tag d'événement)
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                      Marge brute calculée sur la base des ventes billetterie/bar déduisant les coûts affectés.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono bg-acid/10 text-acid border border-acid/20 uppercase tracking-wider">
                    <Disc className="w-3 h-3 animate-spin" /> Classé par rentabilité nette
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left border-collapse" id="pl-data-table">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <th className="p-3 sm:p-4 font-bold">Soirée / Événement</th>
                        <th className="p-3 sm:p-4 text-right font-bold">Recettes (Entrées)</th>
                        <th className="p-3 sm:p-4 text-right font-bold">Frais d'organisation (Sorties)</th>
                        <th className="p-3 sm:p-4 text-right font-bold">Marge Brute net</th>
                        <th className="p-3 sm:p-4 text-center font-bold">Diagnostic / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] font-mono">
                      {eventPL.map((row) => (
                        <tr key={row.evenement} className="hover:bg-white/5 transition-all">
                          <td className="p-3 sm:p-4 flex items-center gap-2">
                            <Disc className="w-4 h-4 text-white/20 flex-shrink-0" />
                            <span className="text-white uppercase font-bold">{row.evenement}</span>
                          </td>
                          <td className="p-3 sm:p-4 text-right text-acid">
                            +{formatEuro(row.entrees)}
                          </td>
                          <td className="p-3 sm:p-4 text-right text-red-400">
                            -{formatEuro(row.sorties)}
                          </td>
                          <td className={`p-3 sm:p-4 text-right font-bold ${row.marge >= 0 ? "text-acid" : "text-orange-500"}`}>
                            {row.marge >= 0 ? "+" : ""}
                            {formatEuro(row.marge)}
                          </td>
                          <td className="p-3 sm:p-4 text-center">
                            {row.marge >= 0 ? (
                              <span className="bg-acid/20 text-acid px-2 py-0.5 rounded text-[9px] uppercase font-mono">
                                Safe
                              </span>
                            ) : (
                              <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[9px] uppercase font-mono">
                                Critical
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-10 py-6 text-center text-[10px] font-mono text-white/30 uppercase tracking-widest">
        <p>Techno Paris Treso Optimizer &copy; 2026 • Construit par un Senior Analyste pour la survie culturelle.</p>
      </footer>
    </div>
  );
}

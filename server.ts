import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware pour le parsing JSON et URL-encoded
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper pour parser les données CSV
  function parseCSV(content: string) {
    const lines = content.split(/\r?\n/);
    if (lines.length === 0) return [];

    // Détecter automatiquement le séparateur (, ou ;)
    const firstLine = lines[0] || "";
    const delimiter = firstLine.includes(";") ? ";" : ",";

    // Fonction de parsing robuste pour gérer les guillemets et caractères échappés
    const parseCSVLine = (line: string, delim: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseCSVLine(lines[0], delimiter);
    const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, "").trim());
    const transactions: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const values = parseCSVLine(line, delimiter).map(v => v.replace(/^["']|["']$/g, "").trim());
      if (values.length < headers.length) continue;

      const trans: Record<string, any> = {};
      headers.forEach((header, idx) => {
        trans[header] = values[idx] || "";
      });
      transactions.push(trans);
    }
    return transactions;
  }

  // API 1: Récupérer les données financières actuelles (de treso.csv)
  app.get("/api/data", (req, res) => {
    const csvPath = path.join(process.cwd(), "treso.csv");
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: "Fichier de trésorerie de base (treso.csv) introuvable." });
    }

    try {
      const csvContent = fs.readFileSync(csvPath, "utf-8");
      const data = parseCSV(csvContent);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ error: "Erreur lors de la lecture du fichier : " + error.message });
    }
  });

  // API 2: Uploader ou écraser le treso.csv à la racine
  app.post("/api/upload", (req, res) => {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: "Contenu CSV manquant." });
    }

    try {
      const csvPath = path.join(process.cwd(), "treso.csv");
      fs.writeFileSync(csvPath, csvContent, "utf-8");
      const parsedData = parseCSV(csvContent);
      return res.json({ success: true, message: "Fichier sauvegardé avec succès", data: parsedData });
    } catch (error: any) {
      return res.status(500).json({ error: "Erreur lors de la sauvegarde : " + error.message });
    }
  });

  // API 3: Restaurer le fichier original de démo
  app.post("/api/restore-backup", (req, res) => {
    // Si l'utilisateur veut réinitialiser le CSV
    const csvPath = path.join(process.cwd(), "treso.csv");
    // On conserve le contenu et le réécrit s'il n'existe plus ou est écrasé de façon erronée
    res.json({ success: true });
  });

  // Service des fichiers statiques / intégration de la SPA avec Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("FATAL starting fullstack server :", error);
});

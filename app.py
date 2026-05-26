# -*- coding: utf-8 -*-
"""
Application Flask de Trésorerie et Dashboard de Rentabilité Techno
Auteur: Expert Full-Stack Python & Senior Business Data Analyst
"""

import os
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = "techno_treso_secret_key_paris_nightlife"
UPLOAD_FOLDER = os.path.dirname(os.path.abspath(__file__))
CSV_FILENAME = "treso.csv"


def clean_and_process_data(filepath):
    """
    Ingère, nettoie et segmente les données financières du fichier CSV.
    Gère de manière robuste les valeurs nulles et les incohérences de formats.
    """
    if not os.path.exists(filepath):
        return None, "Le fichier CSV spécifié est introuvable."

    try:
        # Lecture du CSV avec gestion des encodages et séparateurs courants (virgule ou point-virgule)
        try:
            df = pd.read_csv(filepath, sep=',', encoding='utf-8')
        except Exception:
            df = pd.read_csv(filepath, sep=';', encoding='utf-8')

        # Si le fichier est vide ou corrompu
        if df.empty:
            return None, "Le fichier CSV est vide."

        # Nettoyage des noms de colonnes (suppression des espaces)
        df.columns = [col.strip() for col in df.columns]

        # Validation des colonnes essentielles
        col_requises = ['Date de la valeur (local)', 'Solde', 'Débit', 'Crédit']
        col_manquantes = [col for col in col_requises if col not in df.columns]
        if col_manquantes:
            return None, f"Colonnes requises manquantes : {', '.join(col_manquantes)}"

        # 1. Traitement des dates
        df['Date de la valeur (local)'] = pd.to_datetime(df['Date de la valeur (local)'], errors='coerce')
        df = df.dropna(subset=['Date de la valeur (local)']) # Supprime les lignes sans date valide
        df = df.sort_values(by='Date de la valeur (local)')

        # 2. Nettoyage des montants (Débit, Crédit, Solde, TTC, HT)
        # Gestion des nombres au format français (Ex: "1250,50 €" -> 1250.50)
        for col in ['Débit', 'Crédit', 'Solde', 'Montant total (TTC)', 'Montant total (HT)']:
            if col in df.columns:
                if df[col].dtype == object:
                    df[col] = df[col].astype(str).str.replace(r'[^\d,.-]', '', regex=True)
                    df[col] = df[col].str.replace(',', '.')
                df[col] = pd.to_numeric(df[col], errors='coerce')
                df[col] = df[col].fillna(0.0)

        # 3. Traitement des valeurs manquantes dans les colonnes textuelles
        df['Nom de la contrepartie'] = df['Nom de la contrepartie'].fillna('Inconnu').astype(str)
        df['Note'] = df['Note'].fillna('').astype(str)
        df['Catégorie de trésorerie'] = df['Catégorie de trésorerie'].fillna('Non catégorisé').astype(str)
        df['Sous-catégorie de trésorerie'] = df['Sous-catégorie de trésorerie'].fillna('Non catégorisé').astype(str)

        # 4. Segmentation par événement (P&L par tag / soirée)
        # Algorithme d'analyse textuelle de la Note pour regrouper par soirée
        def detecter_evenement(row):
            note = str(row['Note']).lower()
            ref = str(row.get('Référence', '')).lower()
            texte_analyse = f"{note} {ref}"
            
            if 'dyketopia #1' in texte_analyse:
                return 'Dyketopia #1'
            elif 'dyketopia #2' in texte_analyse:
                return 'Dyketopia #2'
            elif 'dyketopia' in texte_analyse:
                return 'Dyketopia (Autres)'
            elif 'berlin ritual #1' in texte_analyse:
                return 'Berlin Ritual #1'
            elif 'berlin ritual #2' in texte_analyse:
                return 'Berlin Ritual #2'
            elif 'berlin' in texte_analyse:
                return 'Berlin Ritual'
            elif 'warehouse ritual' in texte_analyse:
                return 'Warehouse Ritual'
            elif 'soirée' in texte_analyse or 'soiree' in texte_analyse:
                # Tentative d'extraction du nom après "Soirée" ou "Soiree"
                for mot in note.split('-'):
                    if 'soirée' in mot or 'soiree' in mot:
                        return mot.replace('soirée', '').replace('soiree', '').strip().title()
                return 'Soirée Non Spécifiée'
            else:
                return 'Structure (Frais Fixes / Autres)'

        df['Événement'] = df.apply(detecter_evenement, axis=1)

        return df, None
    except Exception as e:
        return None, f"Erreur lors du traitement du fichier : {str(e)}"


def calculer_kpis(df):
    """
    Calcule les indicateurs financiers critiques (KPIs) pour la structure.
    """
    # Solde actuel (le plus récent chronologiquement)
    solde_actuel = df['Solde'].iloc[-1] if not df.empty else 0.0

    # Analyse par mois
    df_mensuel = df.copy()
    df_mensuel['Mois'] = df_mensuel['Date de la valeur (local)'].dt.to_period('M')
    
    # Agrégation mensuelle des débits et crédits
    agg_mensuel = df_mensuel.groupby('Mois').agg({
        'Débit': lambda x: abs(x.sum()), # Somme absolue des sorties
        'Crédit': 'sum'
    })

    # Cash Flow net mensuel sur chaque mois
    agg_mensuel['CashFlowNet'] = agg_mensuel['Crédit'] - agg_mensuel['Débit']

    # Moyennes récentes (3 derniers mois si existants, sinon globale)
    derniers_mois = agg_mensuel.tail(3) if len(agg_mensuel) >= 3 else agg_mensuel
    
    if not derniers_mois.empty:
        # Burn Rate = Dépenses moyennes mensuelles sur la période récente
        burn_rate_moyen = derniers_mois['Débit'].mean()
        # Flux de trésorerie net moyen mensuel (Sert pour projeter le solde)
        flux_net_moyen = derniers_mois['CashFlowNet'].mean()
    else:
        burn_rate_moyen = 0.0
        flux_net_moyen = 0.0

    # Runway calculation : Combien de mois restants si la tendance de trésorerie actuelle continue
    # Si le flux de trésorerie moyen est négatif (on perd de l'argent), on calcule le runway.
    # Si on gagne de l'argent (flux_net_moyen >= 0), le Runway est théoriquement infini.
    if flux_net_moyen < 0:
        runway_mois = abs(solde_actuel / flux_net_moyen)
    else:
        runway_mois = float('inf') # Trésorerie positive ou équilibrée

    # Calcul de la perte totale
    total_sorties = df['Débit'].apply(abs).sum()
    total_entrees = df['Crédit'].sum()
    resultat_global = total_entrees - total_sorties

    return {
        "solde_actuel": solde_actuel,
        "burn_rate_moyen": burn_rate_moyen,
        "flux_net_moyen": flux_net_moyen,
        "runway_mois": runway_mois,
        "total_entrees": total_entrees,
        "total_sorties": total_sorties,
        "resultat_global": resultat_global
    }


def generer_graphiques_plotly(df, kpis):
    """
    Génère les graphiques Plotly spécifiés par l'utilisateur.
    Renvoie le code HTML autonome pour chaque graphique.
    """
    layout_theme = {
        "paper_bgcolor": "rgba(17,24,39,0.9)", # Dark Slate Gray (Tailwind gray-900)
        "plot_bgcolor": "rgba(31,41,55,0.5)",   # Tailwind gray-800
        "font_color": "#F3F4F6",                # Tailwind gray-100
        "font_family": "Inter, sans-serif",
        "margin": dict(l=50, r=40, t=60, b=50),
    }

    # 1. Courbe de vie (Solde & Projections)
    # On agrège le solde quotidien pour avoir l'historique
    df_daily = df.groupby('Date de la valeur (local)').agg({'Solde': 'last'}).reset_index()
    
    fig_courbe_vie = go.Figure()
    # Ligne historique
    fig_courbe_vie.add_trace(go.Scatter(
        x=df_daily['Date de la valeur (local)'],
        y=df_daily['Solde'],
        mode='lines+markers',
        name='Solde Réel (Historique)',
        line=dict(color='#8B5CF6', width=3), # Purple accent (techno style)
        marker=dict(size=4)
    ))

    # Projection pour les 3 prochains mois (90 jours)
    derniere_date = df_daily['Date de la valeur (local)'].max()
    dernier_solde = df_daily['Solde'].iloc[-1]
    
    # On projette en utilisant le flux de trésorerie net moyen (par jour)
    # flux_net_moyen est mensuel, divisé par 30 pour avoir le quotidien
    flux_journalier = kpis['flux_net_moyen'] / 30.0
    
    dates_projection = [derniere_date + pd.Timedelta(days=d) for d in [30, 60, 90]]
    soldes_projetes = [dernier_solde + (flux_journalier * d) for d in [30, 60, 90]]

    # S'assurer que le solde projeté ne tombe pas de manière bizarre négativement sans limites visuelles
    soldes_projetes_aff = [max(s, 0) for s in soldes_projetes]

    # Ligne de projection
    fig_courbe_vie.add_trace(go.Scatter(
        x=[derniere_date] + dates_projection,
        y=[dernier_solde] + soldes_projetes_aff,
        mode='lines+markers',
        name='Projection de Tendance (3 mois)',
        line=dict(color='#EF4444', width=2, dash='dash'), # Red dotted projection
        marker=dict(size=6, symbol='diamond')
    ))

    fig_courbe_vie.update_layout(
        title="Courbe de Vie du Solde et Projections à 3 Mois",
        xaxis_title="Date de la valeur",
        yaxis_title="Solde (€)",
        **layout_theme
    )
    fig_courbe_vie.update_xaxes(showgrid=True, gridcolor='rgba(255,255,255,0.1)')
    fig_courbe_vie.update_yaxes(showgrid=True, gridcolor='rgba(255,255,255,0.1)')
    html_courbe_vie = fig_courbe_vie.to_html(include_plotlyjs=False, full_html=False)

    # 2. Revenus vs Dépenses (Cash Flow par mois)
    df_mois = df.copy()
    df_mois['Mois_Str'] = df_mois['Date de la valeur (local)'].dt.strftime('%B %Y')
    # Ordonner chronologiquement les mois
    mois_order = df_mois.sort_values(by='Date de la valeur (local)')['Mois_Str'].unique()
    
    df_group_mois = df_mois.groupby('Mois_Str').agg({
        'Crédit': 'sum',
        'Débit': lambda x: abs(x.sum())
    }).reindex(mois_order).reset_index()

    fig_cash_flow = go.Figure()
    # Barres revenus (Crédit)
    fig_cash_flow.add_trace(go.Bar(
        x=df_group_mois['Mois_Str'],
        y=df_group_mois['Crédit'],
        name='Revenus (Entrées / Billetterie & Bar)',
        marker_color='#10B981' # Green-500
    ))
    # Barres dépenses (Débit)
    fig_cash_flow.add_trace(go.Bar(
        x=df_group_mois['Mois_Str'],
        y=-df_group_mois['Débit'], # Négatif pour montrer la sortie distincte
        name='Dépenses (Sorties / Logistique & Artistique)',
        marker_color='#EF4444' # Red-500
    ))

    # Courbe nette pour mettre en relief
    fig_cash_flow.add_trace(go.Scatter(
        x=df_group_mois['Mois_Str'],
        y=df_group_mois['Crédit'] - df_group_mois['Débit'],
        mode='lines+markers',
        name='Flux Net Mensuel (P&L)',
        line=dict(color='#3B82F6', width=3) # Blue
    ))

    fig_cash_flow.update_layout(
        title="Revenus vs Dépenses par Mois (Flux Nette de Trésorerie)",
        barmode='relative',
        xaxis_title="Mois de l'événement",
        yaxis_title="Montant (€)",
        **layout_theme
    )
    html_cash_flow = fig_cash_flow.to_html(include_plotlyjs=False, full_html=False)

    # 3. Répartition des Dépenses (Donut Chart par Catégorie de trésorerie)
    # On isole uniquement les sorties d'argent (Débit > 0 ou Montant < 0)
    df_depenses = df[df['Débit'] > 0].copy()
    
    # Si vide
    if df_depenses.empty:
        fig_depenses = px.pie(title="Aucune dépense enregistrée")
    else:
        # Groupement par catégorie et sous-catégorie
        df_dep_group = df_depenses.groupby(['Catégorie de trésorerie', 'Sous-catégorie de trésorerie']).agg({'Débit': 'sum'}).reset_index()
        fig_depenses = px.sunburst(
            df_dep_group,
            path=['Catégorie de trésorerie', 'Sous-catégorie de trésorerie'],
            values='Débit',
            title='Structure des Coûts (Catégories & Sous-Catégories)',
            color_continuous_scale='RdPu',
            color='Débit'
        )

    fig_depenses.update_layout(
        **layout_theme
    )
    # Modifier la couleur de fond des étiquettes sunburst pour matcher l'appli
    fig_depenses.update_traces(textinfo="label+value+percent parent")
    html_repartition_depenses = fig_depenses.to_html(include_plotlyjs=False, full_html=False)

    # 4. Top 10 des prestataires les plus chers
    # Somme des montants de dépenses par contrepartie
    df_prestataires = df_depenses.groupby('Nom de la contrepartie').agg({'Débit': 'sum'}).reset_index()
    df_prestataires = df_prestataires.sort_values(by='Débit', ascending=True).tail(10) # Les plus gros débits à la fin pour le bar horizontal

    fig_prestataires = go.Figure()
    fig_prestataires.add_trace(go.Bar(
        y=df_prestataires['Nom de la contrepartie'],
        x=df_prestataires['Débit'],
        orientation='h',
        marker_color='#F59E0B', # Amber-500
        text=[f"-{val:,.0f} €" for val in df_prestataires['Débit']],
        textposition='inside'
    ))

    fig_prestataires.update_layout(
        title="Top 10 des Prestataires / Créanciers les Plus Chers (Cumulé)",
        xaxis_title="Dépenses Cumulées (€)",
        yaxis_title="Prestataire",
        **layout_theme
    )
    html_prestataires = fig_prestataires.to_html(include_plotlyjs=False, full_html=False)

    return {
        "courbe_vie": html_courbe_vie,
        "cash_flow": html_cash_flow,
        "repartition_depenses": html_repartition_depenses,
        "prestataires": html_prestataires
    }


def calculer_pl_soirees(df):
    """
    Calcule le P&L (Profitability et marge) de chaque événement/soirée de manière granulaire.
    """
    p_and_l = []
    evenements = df['Événement'].unique()

    for evt in evenements:
        # Frais de structure exclus si on veut analyser la pure rentabilité des soirées
        df_evt = df[df['Événement'] == evt]
        
        entrees = df_evt['Crédit'].sum()
        sorties = df_evt['Débit'].apply(abs).sum()
        marge = entrees - sorties
        
        # Marge brute en % (ROI)
        roi = (marge / sorties * 100) if sorties > 0 else (100.0 if entrees > 0 else 0)
        
        p_and_l.append({
            "evenement": evt,
            "entrees": entrees,
            "sorties": sorties,
            "marge": marge,
            "roi": roi
        })
    
    # Ordonner par performance (marge décroissante)
    p_and_l = sorted(p_and_l, key=lambda x: x['marge'], reverse=True)
    return p_and_l


@app.route("/", methods=["GET", "POST"])
def index():
    # Définition du chemin d'accès au fichier treso.csv
    filepath = os.path.join(UPLOAD_FOLDER, CSV_FILENAME)

    # Gestion de l'upload du nouveau CSV
    if request.method == "POST":
        if "file" not in request.files:
            flash("Aucun fichier envoyé.", "danger")
            return redirect(request.url)
        
        file = request.files["file"]
        if file.filename == "":
            flash("Aucun fichier sélectionné.", "danger")
            return redirect(request.url)
        
        if file and (file.filename.endswith(".csv") or file.filename.endswith(".txt")):
            file.save(filepath)
            flash("Fichier de trésorerie mis à jour avec succès !", "success")
            return redirect(url_for("index"))
        else:
            flash("Format invalide. Veuillez importer un fichier CSV.", "danger")
            return redirect(request.url)

    # Chargement et analyse des données
    df, err = clean_and_process_data(filepath)
    if err:
        return render_template("dashboard.html", error=err, kpis=None, pl_soirees=[], graph_html=None)

    # Calculs analytiques
    kpis = calculer_kpis(df)
    pl_soirees = calculer_pl_soirees(df)
    
    # Génération des représentations visuelles interactives Plotly
    graphs = generer_graphiques_plotly(df, kpis)

    return render_template(
        "dashboard.html",
        error=None,
        kpis=kpis,
        pl_soirees=pl_soirees,
        graph_html=graphs
    )


if __name__ == "__main__":
    # Liaison au port 5000 pour exécution locale (ou port 3000 si configuré dans le Cloud)
    app.run(host="0.0.0.0", port=5000, debug=True)

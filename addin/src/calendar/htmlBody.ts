/**
 * Génère le body HTML d'un événement score all-day.
 * Le HTML est rendu par Outlook dans le popover quand l'utilisateur clique sur l'événement.
 * Utilise uniquement des styles inline (standard email HTML).
 */
import type { ScoreData } from "./demoData";

const COLORS = {
  good: "#107C10",
  warn: "#BC4B09",
  bad: "#B10E1C",
  neutral: "#0F6CBD",
  ok: "#107C10",
  ko: "#B10E1C",
  alert: "#BC4B09",
};

export function generateScoreHtml(data: ScoreData): string {
  const scoreColor = data.score >= 80 ? COLORS.good : data.score >= 50 ? COLORS.warn : COLORS.bad;

  let html = `<div style="font-family:'Segoe UI',sans-serif;font-size:14px;color:#242424;max-width:400px;">`;

  // Score header
  html += `<table style="width:100%;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e0e0e0;"><tr>`;
  html += `<td style="width:60px;vertical-align:top;"><span style="font-size:28px;font-weight:700;color:${scoreColor};">${data.score}%</span></td>`;
  html += `<td style="vertical-align:middle;color:#424242;font-size:14px;line-height:1.4;">${data.label}</td>`;
  html += `</tr></table>`;

  // Factors
  data.factors.forEach((factor) => {
    const summaryColor = COLORS[factor.cls] || "#242424";

    html += `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;">`;

    // Factor header
    html += `<table style="width:100%;margin-bottom:4px;"><tr>`;
    html += `<td style="font-weight:600;font-size:14px;">${factor.name}</td>`;
    html += `<td style="text-align:right;font-weight:700;font-size:13px;color:${summaryColor};">${factor.summary}</td>`;
    html += `</tr></table>`;

    // Factor rows
    factor.rows.forEach((row) => {
      const valColor = COLORS[row.cls] || "#424242";
      html += `<table style="width:100%;"><tr>`;
      html += `<td style="padding:2px 0 2px 12px;font-size:12px;color:#616161;">${row.label}</td>`;
      html += `<td style="text-align:right;font-size:12px;font-weight:500;color:${valColor};white-space:nowrap;padding-left:8px;">${row.val}</td>`;
      html += `</tr></table>`;
    });

    html += `</div>`;
  });

  // Footer QVCT
  html += `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e0e0e0;font-size:11px;color:#616161;font-style:italic;text-align:center;">`;
  html += `Ces indicateurs sont définis dans le cadre de la politique QVCT de l'entreprise.`;
  html += `</div>`;

  html += `</div>`;
  return html;
}

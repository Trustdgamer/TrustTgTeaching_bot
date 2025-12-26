function renderScores(players, highlightId = null) {
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);

  let text = "📊 <b>Scores</b>\n";

  sorted.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
    const name = p.id === highlightId ? "You" : p.name;
    text += `${medal} ${name}: <b>${p.score}</b> pts\n`;
  });

  return text;
}

module.exports = { renderScores };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { words } = JSON.parse(event.body);
    if (!Array.isArray(words) || words.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Žádná slovíčka' }) };
    }

    const results = await Promise.all(words.map(async (word) => {
      const cs = await translateWord(word.trim());
      return { en: word.trim(), cs };
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

async function translateWord(word) {
  // Primární: MyMemory
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|cs&de=slovicka@app.cz`;
    const resp = await fetch(url);
    const data = await resp.json();
    const translation = data?.responseData?.translatedText || '';

    if (
      translation &&
      translation.toLowerCase() !== word.toLowerCase() &&
      translation.toUpperCase() !== translation
    ) {
      return translation.trim();
    }

    // Zkus alternativní překlady z MyMemory
    const matches = data?.matches || [];
    for (const match of matches) {
      const t = match?.translation || '';
      if (t && t.toLowerCase() !== word.toLowerCase()) {
        return t.trim();
      }
    }
  } catch (e) {}

  // Záložní: Google Translate
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=cs&dt=t&q=${encodeURIComponent(word)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const translation = data?.[0]?.[0]?.[0] || '';
    if (translation && translation.toLowerCase() !== word.toLowerCase()) {
      return translation.trim();
    }
  } catch (e) {}

  return '';
}

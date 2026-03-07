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
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|cs`;
        const resp = await fetch(url);
        const data = await resp.json();
        const cs = data?.responseData?.translatedText || '';
        return { en: word, cs: cs.trim() };
      } catch (e) {
        return { en: word, cs: '' };
      }
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

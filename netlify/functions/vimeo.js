const https = require('https');

exports.handler = async (event) => {
  const token = process.env.VIMEO_TOKEN;

  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Vimeo token not configured' })
    };
  }

  // Build Vimeo API URL
  const params = event.queryStringParameters || {};
  const query  = params.query || '';
  const page   = params.page  || 1;
  const perPage = 12;

  const apiPath = query
    ? `/me/videos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&fields=uri,name,description,pictures,duration,privacy`
    : `/me/videos?per_page=${perPage}&page=${page}&fields=uri,name,description,pictures,duration,privacy`;

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.vimeo.com',
      path: apiPath,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Extract just what the widget needs
          const videos = (json.data || []).map(v => ({
            id:        v.uri.replace('/videos/', ''),
            title:     v.name,
            duration:  formatDuration(v.duration),
            thumbnail: v.pictures && v.pictures.sizes
              ? v.pictures.sizes.find(s => s.width >= 640)?.link || v.pictures.sizes[v.pictures.sizes.length - 1]?.link
              : null,
            embedUrl:  `https://player.vimeo.com/video/${v.uri.replace('/videos/', '')}`
          }));
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              videos,
              total: json.total || 0,
              page:  json.page  || 1,
              pages: Math.ceil((json.total || 0) / perPage)
            })
          });
        } catch (e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Parse error' }) });
        }
      });
    }).on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });
  });
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

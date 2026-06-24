const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const folder = event.queryStringParameters && event.queryStringParameters.folder;

  // Whitelist allowed folders for security
  const allowed = ['data/projects', 'data/keywords'];
  if (!folder || !allowed.includes(folder)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid folder' })
    };
  }

  try {
    const dir = path.join(process.cwd(), folder);
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json') && f !== 'manifest.json');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(files)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

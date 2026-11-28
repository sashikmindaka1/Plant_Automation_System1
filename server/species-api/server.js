import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const directory = dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.PLANT_SPECIES_DB ?? join(directory, 'species.db');
const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const database = new DatabaseSync(databasePath);
database.exec(readFileSync(join(directory, 'schema.sql'), 'utf8'));

const categories = new Set(['Succulents', 'Herbs', 'Indoor', 'Tropical']);
const fields = `
  id,
  code,
  name,
  scientific_name AS scientificName,
  category,
  description,
  min_moisture AS minMoisture,
  max_moisture AS maxMoisture,
  min_light_lux AS minLightLux,
  max_light_lux AS maxLightLux,
  min_temp_c AS minTempC,
  max_temp_c AS maxTempC
`;

function send(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function parsePositiveInteger(value, name, defaultValue, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null) return defaultValue;
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} must be between 1 and ${maximum}.`);
  }
  return parsed;
}

function findSpecies(column, value) {
  return database.prepare(`SELECT ${fields} FROM plant_species WHERE ${column} = ?`).get(value);
}

const server = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    send(response, 204, {});
    return;
  }

  if (request.method !== 'GET') {
    send(response, 405, { error: 'Only GET requests are supported.' });
    return;
  }

  let url;
  try {
    url = new URL(request.url ?? '/', 'http://localhost');
  } catch {
    send(response, 400, { error: 'Invalid request URL.' });
    return;
  }

  try {
    if (url.pathname === '/api/species') {
      const category = url.searchParams.get('category');
      if (category && !categories.has(category)) {
        send(response, 400, {
          error: `category must be one of: ${Array.from(categories).join(', ')}.`,
        });
        return;
      }

      const query = url.searchParams.get('q')?.trim() ?? '';
      if (query.length > 100) {
        send(response, 400, { error: 'q must be 100 characters or fewer.' });
        return;
      }

      const page = parsePositiveInteger(url.searchParams.get('page'), 'page', 1);
      const pageSize = parsePositiveInteger(url.searchParams.get('pageSize'), 'pageSize', 10, 50);
      const filters = [];
      const values = [];

      if (category) {
        filters.push('category = ?');
        values.push(category);
      }
      if (query) {
        filters.push('(name LIKE ? OR scientific_name LIKE ? OR code LIKE ?)');
        const searchTerm = `%${query}%`;
        values.push(searchTerm, searchTerm, searchTerm);
      }

      const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      const total = database
        .prepare(`SELECT COUNT(*) AS total FROM plant_species ${where}`)
        .get(...values).total;
      const data = database
        .prepare(
          `SELECT ${fields} FROM plant_species ${where} ORDER BY name LIMIT ? OFFSET ?`
        )
        .all(...values, pageSize, (page - 1) * pageSize);

      send(response, 200, { data, total, page, pageSize });
      return;
    }

    const route = url.pathname.match(/^\/api\/species\/([^/]+)(?:\/([^/]+))?$/);
    if (!route) {
      send(response, 404, { error: 'Endpoint not found.' });
      return;
    }

    const [, rawIdentifier, action] = route;
    let identifier;
    try {
      identifier = decodeURIComponent(rawIdentifier);
    } catch {
      send(response, 400, { error: 'Invalid species identifier.' });
      return;
    }

    let species;
    if (identifier === 'lookup' && action) {
      let code;
      try {
        code = decodeURIComponent(action).toUpperCase();
      } catch {
        send(response, 400, { error: 'Invalid plant code.' });
        return;
      }
      species = findSpecies('code', code);
    } else if (action === 'thresholds' || action === undefined) {
      species = findSpecies('id', identifier);
    }

    if (!species) {
      send(response, 404, { error: 'Plant species not found.' });
      return;
    }

    if (action === 'thresholds') {
      send(response, 200, {
        id: species.id,
        code: species.code,
        minMoisture: species.minMoisture,
        maxMoisture: species.maxMoisture,
        minLightLux: species.minLightLux,
        maxLightLux: species.maxLightLux,
        minTempC: species.minTempC,
        maxTempC: species.maxTempC,
      });
      return;
    }

    send(response, 200, species);
  } catch (error) {
    if (error instanceof Error && /^(page|pageSize) /.test(error.message)) {
      send(response, 400, { error: error.message });
      return;
    }
    console.error('Species API request failed:', error);
    send(response, 500, { error: 'Could not process the species request.' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Species API listening on http://localhost:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

function close() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', close);
process.on('SIGTERM', close);

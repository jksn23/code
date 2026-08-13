import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(configDirectory, '../..');
const hostingerBuildMarker = `${path.sep}hbuilds${path.sep}`;
const hostingerMarkerIndex = appDirectory.indexOf(hostingerBuildMarker);
const hostingerEnvironmentFile = hostingerMarkerIndex >= 0
  ? path.join(appDirectory.slice(0, hostingerMarkerIndex), '.env.production')
  : null;
const environmentFile = process.env.ENV_FILE
  || (hostingerEnvironmentFile && fs.existsSync(hostingerEnvironmentFile)
    ? hostingerEnvironmentFile
    : path.join(appDirectory, '.env'));

dotenv.config({ path: environmentFile });

import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const ROOT_DIRECTORY = dirname(dirname(fileURLToPath(import.meta.url)));

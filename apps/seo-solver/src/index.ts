import { run } from 'cmd-ts';
import { app } from './app';

run(app, process.argv.slice(2));

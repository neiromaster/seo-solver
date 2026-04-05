import { run } from 'cmd-ts';
import { createApp } from './create-app';

const { app } = createApp();

run(app, process.argv.slice(2));

import { bold, cyan, dim, gray } from 'ansis';
import type { CommandHelpData, HelpFormatter } from 'cmd-ts';

type VercelFormatterConfig = {
  cliName?: string;
  logo?: string;
};

function getArgHint(helpTopics: CommandHelpData['helpTopics']): string {
  return helpTopics
    .filter((topic) => topic.category === 'arguments')
    .map((topic) => topic.usage)
    .join(' ');
}

function formatCommandName(name: string, aliases?: string[]): string {
  if (!aliases?.length) {
    return name;
  }

  const [shortestAlias] = [...aliases].sort((a, b) => a.length - b.length);
  return `${shortestAlias} | ${name}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createVercelFormatter(config: VercelFormatterConfig = {}): HelpFormatter {
  const { cliName, logo = '▲' } = config;

  return {
    formatCommand(data) {
      const lines: string[] = [];
      const displayName = cliName ?? data.name;
      let header = displayName;

      if (data.version) {
        header += ` ${data.version}`;
      }

      lines.push(gray(header));
      lines.push('');

      const path = data.path.length > 0 ? data.path.join(' ') : data.name;
      lines.push(`${logo} ${bold(path)} [options]`);

      if (data.description) {
        lines.push('');
        lines.push(dim(data.description));
      }

      const byCategory = new Map<string, CommandHelpData['helpTopics']>();
      for (const topic of data.helpTopics) {
        const existing = byCategory.get(topic.category) ?? [];
        existing.push(topic);
        byCategory.set(topic.category, existing);
      }

      for (const [category, topics] of byCategory) {
        lines.push('');
        lines.push(dim(`${capitalize(category)}:`));
        lines.push('');

        const maxUsageWidth = Math.max(...topics.map((topic) => topic.usage.length));
        for (const topic of topics) {
          const defaults = topic.defaults.length > 0 ? dim(` [${topic.defaults.join(', ')}]`) : '';
          lines.push(`    ${topic.usage.padEnd(maxUsageWidth + 2)}${dim(topic.description)}${defaults}`);
        }
      }

      if (data.examples && data.examples.length > 0) {
        lines.push('');
        lines.push(dim('Examples:'));

        for (const example of data.examples) {
          lines.push('');
          lines.push(`${gray('–')} ${example.description}`);
          lines.push('');
          lines.push(cyan(`  $ ${example.command}`));
        }
      }

      lines.push('');
      return lines.join('\n');
    },

    formatSubcommands(data) {
      const lines: string[] = [];
      const path = data.path.length > 0 ? data.path.join(' ') : data.name;
      const displayName = cliName ?? path;

      lines.push(data.version ? gray(`${displayName} ${data.version}`) : gray(displayName));
      lines.push('');
      lines.push(`${logo} ${bold(path)} [options] <command>`);
      lines.push('');
      lines.push(dim(`For command help, run \`${path} <command> --help\``));
      lines.push('');
      lines.push(dim('Commands:'));
      lines.push('');

      const commandNames = data.commands.map((command) => formatCommandName(command.name, command.aliases));
      const maxNameWidth = Math.max(...commandNames.map((name) => name.length));
      const argHints = data.commands.map((command) => getArgHint(command.helpTopics));
      const maxArgWidth = Math.max(...argHints.map((argHint) => argHint.length), 0);

      for (const [index, command] of data.commands.entries()) {
        const displayCommandName = commandNames[index] ?? command.name;
        const argHint = argHints[index] ?? '';
        lines.push(
          `    ${displayCommandName.padEnd(maxNameWidth + 2)}${dim(argHint.padEnd(maxArgWidth + 2))}${dim(command.description ?? '')}`,
        );
      }

      if (data.examples && data.examples.length > 0) {
        lines.push('');
        lines.push(dim('Examples:'));

        for (const example of data.examples) {
          lines.push('');
          lines.push(`${gray('–')} ${example.description}`);
          lines.push('');
          lines.push(cyan(`  $ ${example.command}`));
        }
      }

      lines.push('');
      return lines.join('\n');
    },
  };
}

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { prompt } from 'enquirer';
import { execCommand } from '../shared';
import { locales } from '../locales';
import type { Lang } from '../locales';

interface PromptObject {
  types: string;
  scopes: string;
  description: string;
}

/**
 * Git commit with Conventional Commits standard
 *
 * @param lang
 */
export async function gitCommit(lang: Lang = 'en-us') {
  const { gitCommitMessages, gitCommitTypes, gitCommitScopes } = locales[lang];

  const typesChoices = gitCommitTypes.map(([value, msg]) => {
    const nameWithSuffix = `${value}:`;

    const message = `${nameWithSuffix.padEnd(12)}${msg}`;

    return {
      name: value,
      message
    };
  });

  const scopesChoices = gitCommitScopes.map(([value, msg]) => ({
    name: value,
    message: `${value.padEnd(30)} (${msg})`
  }));

  const result = await prompt<PromptObject>([
    {
      name: 'types',
      type: 'select',
      message: gitCommitMessages.types,
      choices: typesChoices
    },
    {
      name: 'scopes',
      type: 'select',
      message: gitCommitMessages.scopes,
      choices: scopesChoices
    },
    {
      name: 'description',
      type: 'text',
      message: gitCommitMessages.description
    }
  ]);

  const breaking = result.description.startsWith('!') ? '!' : '';

  const description = result.description.replace(/^!/, '').trim();

  const commitMsg = `${result.types}(${result.scopes})${breaking}: ${description}`;

  await execCommand('git', ['commit', '-m', commitMsg], { stdio: 'inherit' });
}

/** Git commit message verify */
export async function gitCommitVerify() {
  return true;
}

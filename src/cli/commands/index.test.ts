import { describe, expect, test } from 'bun:test';

import { diffCommand, validateCommand } from '.';

// ── suite ──────────────────────────────────────────────────────────────────────

describe('commands barrel', () => {
  test('exports validateCommand', () => {
    // Arrange — (none)

    // Act — (none, reading module export)

    // Assert
    expect(validateCommand).toBeDefined();
  });

  test('exports diffCommand', () => {
    // Arrange — (none)

    // Act — (none, reading module export)

    // Assert
    expect(diffCommand).toBeDefined();
  });
});

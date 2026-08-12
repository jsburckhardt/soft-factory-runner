import { DEFAULT_CONFIGURATION, parseConfiguration } from "./config";
import { RunnerError } from "./errors";
import { renderError } from "./render";

function configurationError(text: string): RunnerError {
  try {
    parseConfiguration(text);
  } catch (cause: unknown) {
    if (cause instanceof RunnerError) return cause;
    throw cause;
  }
  throw new Error("Expected configuration parsing to fail");
}

function assertValueFreeFailure(
  text: string,
  field: string,
  reason: string,
  sentinels: readonly string[],
): void {
  const error = configurationError(text);
  expect(error).toMatchObject({
    code: "CONFIG_INVALID",
    details: { field, reason },
  });
  const surfaces = [
    error.message,
    error.remediation,
    JSON.stringify(error.details),
    renderError(error, false),
    renderError(error, true),
  ];
  for (const sentinel of sentinels)
    for (const surface of surfaces) expect(surface).not.toContain(sentinel);
}

describe("V-1 Copilot child environment configuration", () => {
  it.each([
    ["absent file", null],
    ["blank file", ""],
    ["empty copilot mapping", "copilot:\n"],
    ["empty environment mapping", "copilot:\n  environment:\n"],
  ])("parses %s as an immutable empty mapping", (_name, text) => {
    const result = parseConfiguration(text);
    expect(result.copilotEnvironment).toEqual({});
    expect(Object.isFrozen(result.copilotEnvironment)).toBe(true);
    expect(result.copilotEnvironment).toEqual(
      DEFAULT_CONFIGURATION.copilotEnvironment,
    );
  });

  it("preserves valid plain, quoted, and explicitly empty strings", () => {
    const result = parseConfiguration(
      "copilot:\n" +
        "  environment:\n" +
        '    COPILOT_OTEL_ENABLED: "true"\n' +
        "    COPILOT_OTEL_EXPORTER_TYPE: otlp\n" +
        '    OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.invalid/v1"\n' +
        '    OPTIONAL_EMPTY: ""\n',
    );
    expect(result.copilotEnvironment).toEqual({
      COPILOT_OTEL_ENABLED: "true",
      COPILOT_OTEL_EXPORTER_TYPE: "otlp",
      OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.invalid/v1",
      OPTIONAL_EMPTY: "",
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.copilotEnvironment)).toBe(true);
  });
});

describe("V-2 value-free strict Copilot environment validation", () => {
  const first = "fixture-private-first-value";
  const second = "fixture-private-second-value";

  it("rejects duplicate environment names", () => {
    assertValueFreeFailure(
      'copilot:\n  environment:\n    SAFE_NAME: "' +
        first +
        '"\n    SAFE_NAME: "' +
        second +
        '"\n',
      "copilot.environment.SAFE_NAME",
      "field is duplicated",
      [first, second],
    );
  });

  it.each([
    ["hyphen", "BAD-NAME"],
    ["leading digit", "1BAD"],
    ["space", "BAD NAME"],
  ])("rejects an invalid environment name: %s", (_name, invalidName) => {
    assertValueFreeFailure(
      "copilot:\n  environment:\n    " + invalidName + ': "' + first + '"\n',
      "copilot.environment." + invalidName,
      "environment name has invalid syntax",
      [first],
    );
  });

  it.each([
    ["number", "17"],
    ["boolean", "true"],
    ["null", "null"],
    ["flow sequence", '["' + first + '"]'],
    ["flow mapping", '{ nested: "' + first + '" }'],
  ])("rejects a non-string or nested value: %s", (_name, value) => {
    const expectedReason =
      value.startsWith("[") || value.startsWith("{")
        ? "nested or flow values are not supported"
        : "environment value must be a string scalar";
    assertValueFreeFailure(
      "copilot:\n  environment:\n    SAFE_NAME: " + value + "\n",
      "copilot.environment.SAFE_NAME",
      expectedReason,
      [first],
    );
  });

  it("rejects a block nested value", () => {
    assertValueFreeFailure(
      'copilot:\n  environment:\n    SAFE_NAME:\n      nested: "' +
        first +
        '"\n',
      "copilot.environment.SAFE_NAME",
      "environment value must be a string scalar",
      [first],
    );
  });

  it.each([
    ["alias", "copilot:\n  environment:\n    SAFE_NAME: *private\n"],
    [
      "anchor",
      'copilot:\n  environment:\n    SAFE_NAME: &private "' + first + '"\n',
    ],
    ["merge key", "copilot:\n  environment:\n    <<: *private\n"],
  ])("rejects prohibited YAML construct: %s", (name, text) => {
    const reason =
      name === "alias"
        ? "YAML aliases are not supported"
        : name === "anchor"
          ? "YAML anchors are not supported"
          : "YAML merge keys are not supported";
    const field =
      name === "merge key"
        ? "copilot.environment.<<"
        : "copilot.environment.SAFE_NAME";
    assertValueFreeFailure(text, field, reason, [first]);
  });

  it("rejects unsupported Copilot keys", () => {
    assertValueFreeFailure(
      'copilot:\n  unsupported: "' + first + '"\n',
      "copilot.unsupported",
      "field is not supported",
      [first],
    );
  });

  it.each([
    [
      "malformed line",
      "copilot:\n  environment:\n    SAFE_NAME = " + first + "\n",
      "line has malformed mapping syntax",
    ],
    [
      "odd indentation",
      'copilot:\n  environment:\n   SAFE_NAME: "' + first + '"\n',
      "indentation must use two-space levels",
    ],
  ])("rejects %s without echoing source text", (_name, text, reason) => {
    assertValueFreeFailure(text, ".soft-factory/config.yml", reason, [first]);
  });

  it("is shared by Doctor-compatible parsing", () => {
    const error = configurationError(
      'protocol_version: 1\ncopilot:\n  environment:\n    SAFE_NAME: "' +
        first +
        '"\n    SAFE_NAME: "' +
        second +
        '"\n',
    );
    expect(error.code).toBe("CONFIG_INVALID");
    expect(error.details).toEqual({
      field: "copilot.environment.SAFE_NAME",
      reason: "field is duplicated",
    });
    expect(renderError(error, true)).not.toContain(first);
    expect(renderError(error, true)).not.toContain(second);
  });
});

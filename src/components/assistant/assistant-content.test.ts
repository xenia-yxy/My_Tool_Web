import assert from "node:assert/strict";
import test from "node:test";
import {
  assistantPrompts,
  fallbackAssistantAnswer,
  getAssistantAnswer,
} from "./assistant-content";

test("site introduction questions return an AI Practice answer", () => {
  const answer = getAssistantAnswer("这个网站是做什么的？");

  assert.match(answer, /AI Practice/);
  assert.match(answer, /个人 AI 实践/);
});

test("SOP questions return a service-oriented answer", () => {
  const answer = getAssistantAnswer("SOP 服务适合谁？");

  assert.match(answer, /SOP/);
  assert.match(answer, /流程/);
});

test("unknown questions return the fallback answer", () => {
  const answer = getAssistantAnswer("今天天气怎么样？");

  assert.equal(answer, fallbackAssistantAnswer);
});

test("preset prompts are available for first-time visitors", () => {
  assert.ok(assistantPrompts.length >= 4);
  assert.ok(assistantPrompts.every((prompt) => prompt.label.length > 0));
  assert.ok(assistantPrompts.every((prompt) => prompt.question.length > 0));
});

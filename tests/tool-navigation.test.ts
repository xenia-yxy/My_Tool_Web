import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getActiveGroupId,
  getActiveNavId,
  navGroups,
} from "../src/components/tools/nav-config";
import { resolveFashionPromptsRedirectTarget } from "../src/lib/fashion-prompts-routing";
import nextConfig from "../next.config";

test("ecommerce sidebar exposes menswear and womenswear as separate tools", () => {
  const ecommerce = navGroups.find((group) => group.id === "ecommerce");

  assert.ok(ecommerce);
  assert.deepEqual(
    ecommerce.items.map((item) => item.id),
    ["menswear", "womenswear", "snack-grocery", "social-commerce", "digital-product-pack"],
  );
});

test("menswear and womenswear routes activate their own sidebar entries", () => {
  assert.equal(getActiveNavId("/tools/menswear"), "menswear");
  assert.equal(getActiveNavId("/tools/womenswear"), "womenswear");
  assert.equal(getActiveGroupId("/tools/menswear"), "ecommerce");
  assert.equal(getActiveGroupId("/tools/womenswear"), "ecommerce");
});

test("digital product pack route activates ecommerce sidebar entry", () => {
  assert.equal(getActiveNavId("/tools/digital-product-pack"), "digital-product-pack");
  assert.equal(getActiveGroupId("/tools/digital-product-pack"), "ecommerce");
});

test("series video analyzer route activates create sidebar entry", () => {
  const create = navGroups.find((group) => group.id === "create");

  assert.ok(create);
  assert.equal(
    create.items.some((item) => item.id === "series-video-analyzer"),
    true,
  );
  assert.equal(
    getActiveNavId("/tools/series-video-analyzer"),
    "series-video-analyzer",
  );
  assert.equal(getActiveGroupId("/tools/series-video-analyzer"), "create");
});

test("IP derivative factory route activates create sidebar entry", () => {
  const create = navGroups.find((group) => group.id === "create");

  assert.ok(create);
  assert.equal(create.items.some((item) => item.id === "ip-factory"), true);
  assert.equal(getActiveNavId("/tools/ip-factory"), "ip-factory");
  assert.equal(getActiveGroupId("/tools/ip-factory"), "create");
});

test("legacy fashion prompt route redirects to isolated gender tools", () => {
  assert.equal(resolveFashionPromptsRedirectTarget(), "/tools/menswear");
  assert.equal(resolveFashionPromptsRedirectTarget("menswear"), "/tools/menswear");
  assert.equal(resolveFashionPromptsRedirectTarget("womenswear"), "/tools/womenswear");
  assert.equal(resolveFashionPromptsRedirectTarget("general"), "/tools/menswear");
});

test("next redirects do not send isolated gender tools back to the legacy combined page", async () => {
  const redirects = await nextConfig.redirects?.();
  const redirectSources = new Set((redirects ?? []).map((item) => item.source));

  assert.equal(redirectSources.has("/tools/menswear"), false);
  assert.equal(redirectSources.has("/tools/womenswear"), false);
});

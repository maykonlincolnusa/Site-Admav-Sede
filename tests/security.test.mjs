import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("public pages do not load cadastro or auth ui scripts", () => {
    for (const page of ["index.html", "programa-casados.html"]) {
        const html = read(page);
        assert.doesNotMatch(html, /auth-ui-bridge\.js|programa-casados\.js|loginModal|googleLogin|loginBtn|programaCasadosForm|casadosLoginForm/);
    }
});

test("manifest exposes an installable PWA app", () => {
    const manifest = JSON.parse(read("manifest.json"));
    assert.equal(manifest.start_url, "./index.html");
    assert.equal(manifest.scope, "./");
    assert.equal(manifest.display, "standalone");
    assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
    assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
});

test("service worker provides app shell and offline navigation fallback", () => {
    const source = read("sw.js");
    assert.match(source, /APP_SHELL/);
    assert.match(source, /\.\/index\.html/);
    assert.match(source, /\.\/programa-casados\.html/);
    assert.match(source, /request\.mode === 'navigate'/);
    assert.match(source, /caches\.match\('\.\/index\.html'\)/);
});

test("package.json exposes the automated test command", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.scripts.test, "node tests/run-tests.mjs");
});

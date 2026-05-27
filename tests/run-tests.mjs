import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

function run(name, fn) {
    try {
        fn();
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error.message);
        process.exitCode = 1;
    }
}

const htmlPages = readdirSync(root).filter((file) => file.endsWith(".html"));

for (const page of htmlPages) {
    run(`${page} exposes basic page structure`, () => {
        const html = read(page);
        assert.match(html, /<title>[\s\S]+?<\/title>/i);
        assert.match(html, /<meta\s+name="description"\s+content="[^"]+"/i);
        assert.match(html, /<(main|section)\b/i);
        assert.match(html, /<footer\b/i);
    });
}

run("programa-casados uses local media assets", () => {
    const html = read("programa-casados.html");
    assert.doesNotMatch(html, /images\.unsplash\.com/i);
    const matches = [...html.matchAll(/(?:src|poster)="(media\/programa-casados\/[^"]+)"/g)];
    assert.ok(matches.length >= 4);
    for (const [, asset] of matches) assert.ok(existsSync(path.join(root, asset)), `Missing asset ${asset}`);
});

run("public pages use local branch media instead of stock imagery", () => {
    for (const page of htmlPages) {
        const html = read(page);
        assert.doesNotMatch(html, /images\.unsplash\.com/i);
    }
    const home = read("index.html");
    assert.match(home, /media\/pastores presidentes\/WhatsApp Image 2026-04-28 at 16\.59\.54\.jpeg/);
    for (const page of ["sede.html", "colonia.html", "campo-grande.html", "praca-seca.html", "recreio.html"]) {
        assert.match(read(page), /branch-gallery/);
    }
});

run("official ADMAV logo is used across the site and PWA cache", () => {
    for (const page of htmlPages) {
        const html = read(page);
        assert.match(html, /media\/logo-oficial-admav\.jpeg/);
    }
    assert.match(read("sw.js"), /media\/logo-oficial-admav\.jpeg/);
    assert.ok(existsSync(path.join(root, "media/logo-oficial-admav.jpeg")));
});

run("branch pages expose editorial sections built from local media", () => {
    for (const page of ["freguesia.html", "colonia.html", "campo-grande.html", "praca-seca.html", "recreio.html"]) {
        const html = read(page);
        assert.match(html, /class="branch-page/);
        assert.match(html, /id="identidade"/);
        assert.match(html, /branch-story-layout/);
        assert.match(html, /media\//);
    }
});

run("programa-casados exposes public app landmarks without cadastro", () => {
    const html = read("programa-casados.html");
    for (const id of ["hero", "lideranca", "jornada", "galeria", "video", "contato", "faq"]) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.doesNotMatch(html, /programaCasadosForm|casadosLoginForm|casadosLoggedPanel/);
    assert.doesNotMatch(html, /type="password"/i);
    assert.doesNotMatch(html, /programa-casados\.js/);
});

run("index exposes the home session for Casados, Intercessao and IBMAV", () => {
    const html = read("index.html");
    assert.match(html, /id="programacao"/);
    assert.match(html, /Programa de Casados/);
    assert.match(html, /Terca de Intercessao/);
    assert.match(html, /IBMAV/);
    assert.match(html, /href="programa-casados\.html"/);
    for (const token of ["Pastores presidentes", "Cultura ADMAV", "Primeira visita", "home-branch-showcase"]) {
        assert.match(html, new RegExp(token));
    }
});

run("public pages do not load cadastro or auth ui scripts", () => {
    for (const page of htmlPages) {
        const html = read(page);
        assert.doesNotMatch(html, /auth-ui-bridge\.js|programa-casados\.js|loginModal|googleLogin|loginBtn|programaCasadosForm|casadosLoginForm/);
    }
});

run("manifest exposes an installable PWA app", () => {
    const manifest = JSON.parse(read("manifest.json"));
    assert.equal(manifest.start_url, "./index.html");
    assert.equal(manifest.scope, "./");
    assert.equal(manifest.display, "standalone");
    assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
    assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
    assert.ok(Array.isArray(manifest.shortcuts));
});

run("service worker provides app shell and offline navigation fallback", () => {
    const source = read("sw.js");
    for (const token of ["APP_SHELL", "./index.html", "./programa-casados.html", "request.mode === 'navigate'", "caches.match('./index.html')"]) {
        assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
});

run("package.json exposes the automated test command", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.scripts.test, "node tests/run-tests.mjs");
});

if (process.exitCode) {
    process.exit(process.exitCode);
}

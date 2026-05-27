import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const htmlPages = readdirSync(root).filter((file) => file.endsWith(".html"));
const read = (file) => readFileSync(path.join(root, file), "utf8");

for (const page of htmlPages) {
    test(`${page} exposes basic page structure`, () => {
        const html = read(page);
        assert.match(html, /<title>[\s\S]+?<\/title>/i);
        assert.match(html, /<meta\s+name="description"\s+content="[^"]+"/i);
        assert.match(html, /<(main|section)\b/i);
        assert.match(html, /<footer\b/i);
    });
}

test("programa-casados uses local media assets", () => {
    const html = read("programa-casados.html");
    assert.doesNotMatch(html, /images\.unsplash\.com/i);
    const matches = [...html.matchAll(/(?:src|poster)="(media\/programa-casados\/[^"]+)"/g)];
    assert.ok(matches.length >= 4);
    for (const [, asset] of matches) assert.ok(existsSync(path.join(root, asset)), `Missing asset ${asset}`);
});

test("public pages use local branch media instead of stock imagery", () => {
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

test("official ADMAV logo is used across the site", () => {
    for (const page of htmlPages) {
        const html = read(page);
        assert.match(html, /media\/logo-oficial-admav\.jpeg/);
    }
    assert.ok(existsSync(path.join(root, "media/logo-oficial-admav.jpeg")));
});

test("branch pages expose editorial sections built from local media", () => {
    for (const page of ["freguesia.html", "colonia.html", "campo-grande.html", "praca-seca.html", "recreio.html"]) {
        const html = read(page);
        assert.match(html, /class="branch-page/);
        assert.match(html, /id="identidade"/);
        assert.match(html, /branch-story-layout/);
        assert.match(html, /media\//);
    }
});

test("programa-casados exposes public app landmarks without cadastro", () => {
    const html = read("programa-casados.html");
    for (const id of ["hero", "lideranca", "jornada", "galeria", "video", "contato", "faq"]) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.doesNotMatch(html, /programaCasadosForm|casadosLoginForm|casadosLoggedPanel/);
    assert.doesNotMatch(html, /type="password"/i);
    assert.doesNotMatch(html, /programa-casados\.js/);
});

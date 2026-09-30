const fs = require('fs');
const path = require('path');

const LEET = {
    '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's',
    '6': 'g', '7': 't', '8': 'b', '9': 'g',
    '@': 'a', '$': 's', '!': 'i', '+': 't', '*': '',
};

const HOMO = {
    '\u0430':'a','\u0435':'e','\u043e':'o','\u0440':'p','\u0441':'c','\u0443':'y',
    '\u0445':'x','\u0456':'i','\u0457':'i','\u0458':'j','\u0501':'d',
    '\u0391':'a','\u0395':'e','\u0399':'i','\u039f':'o','\u03bf':'o','\u03c1':'p',
    '\u03c5':'y','\u03c7':'x','\uff41':'a','\uff49':'i','\uff4f':'o',
};

function foldHomoglyphs(s) {
    let out = '';
    for (const ch of s) out += HOMO[ch] || ch;
    return out;
}

function stripAccents(s) {
    return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function normalize(s) {
    let t = String(s || '').normalize('NFKC').toLowerCase();
    t = t.replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '');
    t = foldHomoglyphs(t);
    t = stripAccents(t);
    t = t.replace(/[0-9@$!+*]/g, (ch) => (LEET[ch] != null ? LEET[ch] : ch));
    t = t.replace(/(.)\1{2,}/g, '$1$1'); // fuuuuck -> fuuck
    t = t.replace(/[^a-z\s]/g, ' ');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
}

function squash(s) {
    return normalize(s).replace(/\s+/g, '');
}

function loadWords() {
    const raw = fs.readFileSync(path.join(__dirname, 'bad-words.txt'), 'utf8');
    const exact = new Set();
    const phrases = [];
    const compact = [];
    for (const line of raw.split(/\n/)) {
        const w = line.trim();
        if (!w || w.startsWith('#')) continue;
        const n = normalize(w);
        if (!n) continue;
        if (n.includes(' ')) phrases.push(n);
        else exact.add(n);
        const c = squash(w);
        if (c.length >= 5) compact.push(c);
    }
    // variantes comunes que la gente escribe pegadas
    for (const extra of [
        'hitler', 'hittler', 'adolfhitler', 'heilhitler', 'siegheil',
        'neonazi', 'whitepower',
    ]) exact.add(normalize(extra));
    return { exact, phrases, compact };
}

const { exact: EXACT, phrases: PHRASES, compact: COMPACT } = loadWords();

function containsBadWord(text) {
    const n = normalize(text);
    if (!n) return false;
    const tokens = n.split(' ');
    for (const t of tokens) {
        if (EXACT.has(t)) return true;
        // fuuuck already collapsed; also try collapsing doubles
        const tight = t.replace(/(.)\1+/g, '$1');
        if (tight.length >= 3 && EXACT.has(tight)) return true;
    }
    for (let i = 0; i < tokens.length; i++) {
        let acc = tokens[i];
        for (let j = i + 1; j < Math.min(tokens.length, i + 5); j++) {
            acc += ' ' + tokens[j];
            if (EXACT.has(acc)) return true;
            for (const p of PHRASES) {
                if (acc === p) return true;
            }
        }
    }
    const packed = squash(text);
    if (packed.length >= 5) {
        for (const w of COMPACT) {
            if (packed.includes(w)) return true;
        }
    }
    return false;
}

module.exports = { containsBadWord };

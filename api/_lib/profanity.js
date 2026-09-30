const fs = require('fs');
const path = require('path');

const LEET = {
    '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's',
    '6': 'g', '7': 't', '8': 'b', '9': 'g',
    '@': 'a', '$': 's', '!': 'i', '+': 't', '*': '',
};

function stripAccents(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalize(s) {
    let t = String(s || '').toLowerCase();
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

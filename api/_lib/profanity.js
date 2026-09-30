// Filtro de groserías EN + ES (incluye variantes con números/símbolos).
// Si pega, el comentario se rechaza.

const WORDS = [
    'anal', 'anus', 'arse', 'ass', 'asshole', 'balls', 'bastard', 'bitch', 'biatch',
    'blowjob', 'bollock', 'boner', 'boob', 'boobs', 'bukkake', 'bullshit',
    'buttplug', 'chink', 'clit', 'clitoris', 'cock', 'coon', 'crap', 'cum',
    'cunt', 'dick', 'dildo', 'dyke', 'fag', 'faggot', 'feck', 'felch', 'fellate',
    'fellatio', 'feltch', 'fuck', 'fucker', 'fucking', 'fucktard', 'fuckwit',
    'goddamn', 'homo', 'hooker', 'horny', 'jerkoff', 'jizz', 'kike', 'labia',
    'milf', 'motherfucker', 'nazi', 'nigga', 'nigger', 'nutsack', 'orgasm',
    'pedo', 'paedo', 'penis', 'piss', 'porn', 'porno', 'pussy', 'queer',
    'rape', 'rapist', 'retard', 'rimjob', 'semen', 'sex', 'shit', 'shitty',
    'slut', 'smegma', 'spunk', 'tits', 'titties', 'tranny', 'twat', 'vagina',
    'wank', 'whore',
    'pendejo', 'pendeja', 'pendejos', 'pendejas', 'idiota', 'estupido', 'estupida',
    'imbecil', 'imbécil', 'cabron', 'cabrón', 'cabrona', 'pinche', 'chingar',
    'chingada', 'chingado', 'chingas', 'chinga', 'chingatumadre', 'chinga tu madre',
    'putamadre', 'puta madre', 'hijo de puta', 'hijueputa', 'hp',
    'puta', 'puto', 'putos', 'putas', 'putita', 'putito', 'zorra', 'zorro',
    'perra', 'perro', 'culero', 'culera', 'culo', 'culito',
    'vergas', 'verga', 'vergudo', 'pito', 'polla', 'pija', 'picha', 'penco',
    'coño', 'cono', 'cojones', 'joder', 'jodido', 'jodete', 'jódete',
    'mamada', 'mamon', 'mamón', 'mames', 'mamando', 'chupa', 'chupar',
    'nalgas', 'nalga', 'tetas', 'teta', 'senos',
    'marica', 'maricon', 'maricón', 'joto', 'puto wey',
    'mierda', 'miércoles', 'carajo', 'carajos', 'maldito', 'maldita',
    'gonorrea', 'hpta', 'hijueputa', 'malparido', 'malparida',
    'guey pendejo', 'pinche wey', 'culiad', 'weon', 'weón', 'huevon', 'huevón',
    'conchetumare', 'conchatumare', 'ctm', 'ptm', 'hdp', 'hp',
    'boludo', 'pelotudo', 'forro', 'la concha', 'la puta',
    'gilipollas', 'capullo', 'subnormal', 'retrasado', 'retrasada',
    'tonto', 'tonta', 'pendejez', 'mamaguevo', 'mamagüevo',
    'panocha', 'chocha', 'chocho', 'papaya',
    'fck', 'fuk', 'fuq', 'sht', 'btch', 'b1tch', 'fvck', 'fcking',
    'n1gga', 'n1gger', 'nlgga',
];

const LEET = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
    '@': 'a', '$': 's', '!': 'i', '+': 't',
};

function normalize(s) {
    return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[0-9@$!+]/g, (ch) => LEET[ch] || ch)
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function squash(s) {
    return normalize(s).replace(/\s+/g, '');
}

const EXACT = new Set(WORDS.map((w) => normalize(w)).filter(Boolean));
const COMPACT = WORDS.map((w) => squash(w)).filter((w) => w.length >= 3);

function containsBadWord(text) {
    const n = normalize(text);
    if (!n) return false;
    const tokens = n.split(' ');
    for (const t of tokens) {
        if (EXACT.has(t)) return true;
    }
    // frases de 2-4 tokens
    for (let i = 0; i < tokens.length; i++) {
        let acc = tokens[i];
        for (let j = i + 1; j < Math.min(tokens.length, i + 4); j++) {
            acc += ' ' + tokens[j];
            if (EXACT.has(acc)) return true;
        }
    }
    const packed = squash(text);
    for (const w of COMPACT) {
        if (packed.includes(w)) return true;
    }
    return false;
}

module.exports = { containsBadWord };

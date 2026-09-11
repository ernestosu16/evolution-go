// Translates the string literals of the compiled Manager bundle using a
// pt -> en dictionary. The bundle is tokenized with acorn so only string /
// template literal tokens are touched; identifiers, regexes and code are
// never modified.
//
// Usage:
//   node translate.mjs            # rewrite manager/dist in place
//   node translate.mjs --check    # report untranslated Portuguese strings
import * as acorn from 'acorn';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '..', 'dist');
const dict = JSON.parse(fs.readFileSync(path.join(here, 'pt-en.json'), 'utf8'));
const check = process.argv.includes('--check');

const bundles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.js'));
if (bundles.length !== 1) throw new Error(`expected one js bundle in dist/assets, found ${bundles.length}`);
const bundlePath = path.join(distDir, 'assets', bundles[0]);
const src = fs.readFileSync(bundlePath, 'utf8');

const escapeTemplate = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const ptLike = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]|\b(n[aã]o|voc[eê]|inst[aâ]ncias?|mensagens?|configura[cç][oõ]es|chave|acesso|licen[cç]a|bot[aã]o|botoes|c[oó]digo|falha|inv[aá]lido|obrigat[oó]ri[oa]|enviar|abrir|fechar|salvar|cancelar|confirmar|excluir|criar|conectar|desconectar|atualizar|carregando|aguarde|erro|sucesso|nenhum|nenhuma|selecione|digite|clique|voltar|entrar|sair|buscar|copiar|baixar|ativar|desativar|habilitar|aguardando|gerar|gerencie|eventos|conex[aã]o|usu[aá]rio|senha|executar|remover|deletar|opcional|padr[aã]o)\b/i;

const tokens = [];
acorn.parse(src, {
  ecmaVersion: 'latest', sourceType: 'module',
  onToken: t => { if ((t.type.label === 'string' || t.type.label === 'template') && t.value) tokens.push(t); },
});

let out = '', last = 0, replaced = 0;
const missing = new Map();
for (const t of tokens) {
  const en = dict[t.value];
  if (en === undefined) {
    if (check && ptLike.test(t.value) && t.value.length < 300) missing.set(t.value, (missing.get(t.value) || 0) + 1);
    continue;
  }
  const repl = t.type.label === 'string' ? JSON.stringify(en) : escapeTemplate(en);
  out += src.slice(last, t.start) + repl;
  last = t.end;
  replaced++;
}
out += src.slice(last);

if (check) {
  const list = [...missing].sort((a, b) => a[0].localeCompare(b[0]));
  console.log(`${replaced} tokens matched the dictionary; ${list.length} suspicious untranslated strings:`);
  for (const [k, n] of list) console.log(`${n}\t${JSON.stringify(k)}`);
  process.exit(0);
}

acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'module' }); // must still parse
fs.writeFileSync(bundlePath, out);

const htmlPath = path.join(distDir, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8').replace('lang="pt-BR"', 'lang="en"');
fs.writeFileSync(htmlPath, html);
console.log(`replaced ${replaced} string tokens in ${path.basename(bundlePath)}; index.html lang=en`);

// Charge un module Node installé localement ou globalement (playwright, axe-core).
const { execSync } = require('child_process');
const path = require('path');
module.exports = function load(name) {
  try { return require(name); } catch (e) { /* essai global */ }
  try { return require(path.join(execSync('npm root -g').toString().trim(), name)); } catch (e) { /* suite */ }
  try { return require(path.join(process.cwd(), 'node_modules', name)); } catch (e) { /* suite */ }
  throw new Error(`Module « ${name} » introuvable : npm i -D ${name} (dans tools/ ou le dossier courant)`);
};
module.exports.resolve = function resolve(name) {
  for (const base of [undefined, execSync('npm root -g').toString().trim(), path.join(process.cwd(), 'node_modules')]) {
    try { return base ? require.resolve(path.join(base, name)) : require.resolve(name); } catch (e) { /* suivant */ }
  }
  throw new Error(`Fichier « ${name} » introuvable : npm i -D ${name.split('/')[0]}`);
};

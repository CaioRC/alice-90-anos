/*
 * Lista de convidados — 90 anos de Dona Alice Costa
 * HTML, CSS e JavaScript puros: sem compilação e sem servidor.
 * As alterações ficam guardadas no próprio navegador (localStorage).
 *
 * Partes deste arquivo:
 *   1. Configurações (senha e nomes usados no armazenamento)
 *   2. Lista inicial, transcrita das folhas manuscritas
 *   3. Utilidades
 *   4. Dados: carregar, validar, salvar e contar
 *   5. Acesso por senha
 *   6. Desenho da tela
 *   7. Avisos, desfazer e janelas
 *   8. Alterações rápidas (situação e grupo inteiro)
 *   9. Pessoa: adicionar, editar, remover
 *  10. Grupo: criar, renomear, excluir
 *  11. Texto para WhatsApp
 *  12. Cópia de segurança
 *  14. Eventos e início
 */
(function () {
  'use strict';

  /* ======================================================================
   * 1. CONFIGURAÇÕES
   * ====================================================================== */

  const NOME_EVENTO = '90 anos de Dona Alice Costa';

  // Senha de acesso. Aqui fica SOMENTE o resultado do PBKDF2 (SHA-256) com
  // salt aleatório; a senha em si não aparece em nenhum arquivo.
  // Para trocar a senha, veja o LEIAME.md (gera-se um novo salt e hash).
  const CONFIG_SENHA = {
    iteracoes: 600000,
    salt: 'R7fVmFGy3KeohZspjOyUpw==',
    hash: 'c/fGECSLpMCoePHx9zYi38NceNyOX7SX/0xP8BaUcmM='
  };

  const CHAVE_DADOS = 'alice90.convidados';
  const CHAVE_ACESSO = 'alice90.acesso';
  const CHAVE_DICA = 'alice90.dica-vista';
  const CHAVE_ULTIMA_COPIA = 'alice90.ultima-copia';
  const TIPO_DADOS = 'lista-convidados-alice-90-anos';
  const VERSAO_DADOS = 1;
  const SEM_GRUPO = 'sem-grupo';
  const NOVO_GRUPO = 'novo-grupo';
  const MAX_NOME = 80;
  const MAX_GRUPO = 60;
  const MAX_OBS = 160;
  const MAX_ACOMPANHANTES = 10;
  const TEXTO_LONGO = 4000;

  const SITUACOES = {
    confirmado: { icone: '✅', nome: 'Confirmado', curto: 'Confirmado' },
    aguardando: { icone: '⏳', nome: 'Aguardando resposta', curto: 'Aguardando' },
    nao_vai: { icone: '❌', nome: 'Não vai', curto: 'Não vai' }
  };
  const ORDEM_SITUACOES = ['confirmado', 'aguardando', 'nao_vai'];

  /* ======================================================================
   * 2. LISTA INICIAL — transcrita das duas folhas manuscritas
   *    (“Convites enviados”). Cada item é uma linha da folha, e "situacao"
   *    vale para a linha inteira. Linhas sem “Confirmado” escrito ficaram
   *    como "aguardando". Linhas e palavras riscadas não entraram.
   *    Esta lista só é usada no PRIMEIRO uso em cada navegador. Depois,
   *    valem os dados salvos no aparelho, e esta lista não sobrescreve nada.
   * ====================================================================== */

  const OBS_ZENAIDE = 'Zenaide aparece duas vezes na folha (com Ariana e com filho e nora). Confira se é a mesma pessoa; se for, remova um dos dois cadastros.';
  const OBS_FERNANDA = 'Há duas pessoas chamadas Fernanda na folha. Confira se não é a mesma pessoa; se for, remova um dos dois cadastros.';
  const OBS_RAFAEL = 'Há duas pessoas chamadas Rafael na folha. Confira se não é a mesma pessoa; se for, remova um dos dois cadastros.';

  const LISTA_INICIAL = [
    // Folha 1 — “Convites enviados / Família:”
    { grupo: 'Grupo de Carlos', situacao: 'confirmado', pessoas: ['Carlos', 'Marise', 'Sarah', 'Lucas'] },
    { grupo: 'Grupo de Augusto', situacao: 'confirmado', pessoas: ['Augusto', { nome: 'Fernanda', obs: OBS_FERNANDA }, 'Caio', 'Letícia'] },
    { grupo: 'Grupo de Marco', situacao: 'confirmado', pessoas: ['Marco', 'Lurdinha', 'Giovani'] },
    { grupo: 'Grupo de Afinha', situacao: 'confirmado', pessoas: ['Afinha', 'Júnior', 'Isadora'] },
    { grupo: 'Grupo de Marta', situacao: 'aguardando', pessoas: ['Marta', 'Onésimo', 'Fátima'] },
    { grupo: 'Grupo de Claudinir', situacao: 'confirmado', pessoas: ['Claudinir', 'Adriana', { nome: 'Rafael', obs: OBS_RAFAEL }] },
    { grupo: 'Grupo de Darlene', situacao: 'confirmado', pessoas: ['Darlene', 'Fabíola', 'Irina', 'Aristóteles'] },
    { grupo: 'Grupo de Lamark', situacao: 'confirmado', pessoas: ['Lamark', 'Aninha', 'Raquel'] },
    { grupo: 'Grupo de Rayssa', situacao: 'confirmado', pessoas: ['Rayssa', 'João', 'Dulce'] },
    { grupo: 'Grupo de Janaína', situacao: 'confirmado', pessoas: ['Janaína'] },
    { grupo: 'Grupo de Analice', situacao: 'confirmado', pessoas: ['Analice', 'Benício', 'Ítalo', 'Igor', 'Sophia'] },
    { grupo: "Grupo de Joana D'arc", situacao: 'confirmado', pessoas: ["Joana D'arc", 'Diassis'] },
    { grupo: 'Grupo de Fátima (Samaritana)', situacao: 'confirmado', pessoas: ['Fátima (Samaritana)'] },
    { grupo: "Grupo de D'Jesus", situacao: 'confirmado', pessoas: ["D'Jesus", 'Tio Francisco', 'Tia Graça'] },
    { grupo: 'Grupo de Eleutério', situacao: 'confirmado', pessoas: ['Eleutério', 'Gorete'] },
    // (Linha riscada na folha: “Marina, mestre Freire → Confirmado” — não incluída.)
    { grupo: 'Grupo de Zenaide e Ariana', situacao: 'aguardando', pessoas: [{ nome: 'Zenaide', obs: OBS_ZENAIDE }, 'Ariana'] },
    { grupo: 'Grupo de D. Socorro', situacao: 'aguardando', pessoas: ['D. Socorro', 'Ana Alice', 'Matise', 'Nogueira'] },
    { grupo: 'Grupo de Bene', situacao: 'confirmado', pessoas: ['Bene', { nome: 'Namorado de Bene', acompanhante: true, obs: 'Na folha: “Bene, namorado”.' }] },
    { grupo: 'Grupo de Nastacha', situacao: 'confirmado', pessoas: ['Nastacha', 'João (Darlene)'] },
    {
      grupo: 'Grupo de Zenaide, filho e nora', situacao: 'confirmado', pessoas: [
        { nome: 'Zenaide', obs: OBS_ZENAIDE },
        { nome: 'Filho de Zenaide', acompanhante: true, obs: 'Na folha: “Zenaide, filho, nora”.' },
        { nome: 'Nora de Zenaide', acompanhante: true, obs: 'Na folha: “Zenaide, filho, nora”.' }
      ]
    },
    { grupo: 'Grupo de Fernanda e Rafael', situacao: 'confirmado', pessoas: [{ nome: 'Fernanda', obs: OBS_FERNANDA }, { nome: 'Rafael', obs: OBS_RAFAEL }] },
    { grupo: 'Grupo de Eliana', situacao: 'confirmado', pessoas: ['Eliana', 'Kaster'] },
    { grupo: 'Grupo de Humberto', situacao: 'confirmado', pessoas: ['Humberto', 'Lúcia'] },
    { grupo: 'Grupo de Vavá', situacao: 'confirmado', pessoas: [{ nome: 'Vavá', obs: 'Na folha, “(filhos)” está riscado; os filhos não foram incluídos.' }, 'Nira'] },
    { grupo: 'Grupo de Rocilda', situacao: 'confirmado', pessoas: ['Rocilda'] },
    { grupo: 'Grupo de Maria (Benício)', situacao: 'confirmado', pessoas: ['Maria (Benício)', 'Dorinha'] },
    { grupo: 'Grupo de Nita', situacao: 'confirmado', pessoas: ['Nita'] },
    {
      grupo: 'Pires', situacao: 'confirmado', pessoas: [
        { nome: 'Ana Paula', obs: 'Na folha: “Pires – Ana Paula, Andréa”. Se Pires for uma pessoa (e não o nome da família), adicione neste grupo.' },
        'Andréa'
      ]
    },
    { grupo: 'Grupo de Mª Evanice', situacao: 'confirmado', pessoas: [{ nome: 'Mª Evanice', obs: 'Na folha: “confirmada (Sarah)”.' }] },
    // Folha 2
    { grupo: 'Grupo de Victoria Régia', situacao: 'confirmado', pessoas: [{ nome: 'Victoria Régia', obs: 'Na folha: “confirmado (Sarah)”.' }] },
    { grupo: 'Grupo de João de Sousa', situacao: 'confirmado', pessoas: [{ nome: 'João de Sousa', obs: 'Na folha: “confirmado (Sarah)”.' }] },
    { grupo: 'Grupo de Miguel', situacao: 'confirmado', pessoas: ['Miguel', 'Tereza Cristina'] }
  ];

  /* ======================================================================
   * 3. UTILIDADES
   * ====================================================================== */

  function $(id) {
    return document.getElementById(id);
  }

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  }

  function esvaziar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // Deixa o texto comparável: sem acentos, sem maiúsculas e sem pontuação.
  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/['’‘`´]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function limparTexto(texto, max) {
    if (typeof texto !== 'string') return '';
    return texto.replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function plural(n, singular, varios) {
    return n === 1 ? '1 ' + singular : n + ' ' + varios;
  }

  function nPessoas(n) {
    return plural(n, 'pessoa', 'pessoas');
  }

  function doisDigitos(n) {
    return String(n).padStart(2, '0');
  }

  function formatarDataHora(valor) {
    const d = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(d.getTime())) return '';
    return doisDigitos(d.getDate()) + '/' + doisDigitos(d.getMonth() + 1) + '/' + d.getFullYear() +
      ' às ' + doisDigitos(d.getHours()) + ':' + doisDigitos(d.getMinutes());
  }

  function dataParaArquivo(d) {
    return d.getFullYear() + '-' + doisDigitos(d.getMonth() + 1) + '-' + doisDigitos(d.getDate()) +
      '-' + doisDigitos(d.getHours()) + 'h' + doisDigitos(d.getMinutes());
  }

  let contadorIds = 0;
  function novoId(prefixo) {
    contadorIds += 1;
    return prefixo + Date.now().toString(36) + contadorIds.toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function lerLocal(chave) {
    try { return window.localStorage.getItem(chave); } catch (e) { return null; }
  }

  function gravarLocal(chave, valor) {
    try { window.localStorage.setItem(chave, valor); return true; } catch (e) { return false; }
  }

  function apagarLocal(chave) {
    try { window.localStorage.removeItem(chave); } catch (e) { /* sem acesso ao armazenamento */ }
  }

  function lerSessao(chave) {
    try { return window.sessionStorage.getItem(chave); } catch (e) { return null; }
  }

  function gravarSessao(chave, valor) {
    try { window.sessionStorage.setItem(chave, valor); return true; } catch (e) { return false; }
  }

  function apagarSessao(chave) {
    try { window.sessionStorage.removeItem(chave); } catch (e) { /* sem acesso ao armazenamento */ }
  }

  function paraBase64(bytes) {
    let binario = '';
    for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
    return btoa(binario);
  }

  function deBase64(texto) {
    const binario = atob(texto);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return bytes;
  }

  function bytesIguais(a, b) {
    if (a.length !== b.length) return false;
    let diferenca = 0;
    for (let i = 0; i < a.length; i++) diferenca |= a[i] ^ b[i];
    return diferenca === 0;
  }

  function mostrarErro(caixa, texto) {
    caixa.textContent = texto;
    caixa.hidden = false;
  }

  function esconderErro(caixa) {
    caixa.textContent = '';
    caixa.hidden = true;
  }

  function erroCampo(campo, caixa, texto) {
    mostrarErro(caixa, texto);
    campo.setAttribute('aria-invalid', 'true');
    campo.focus();
  }

  function focarSemRolar(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function lerArquivoComoTexto(arquivo) {
    return new Promise(function (resolve, reject) {
      const leitor = new FileReader();
      leitor.onload = function () { resolve(String(leitor.result || '')); };
      leitor.onerror = function () { reject(leitor.error); };
      leitor.readAsText(arquivo, 'utf-8');
    });
  }

  /* ======================================================================
   * 4. DADOS
   * ====================================================================== */

  let estado = null;            // { tipo, versao, grupos: [...], pessoas: [...], atualizadoEm }
  let desfazerAntes = null;     // cópia (texto) da lista antes da última alteração
  let armazenamentoOk = true;
  let problemaAoCarregar = false;
  const filtros = { busca: '', situacao: 'todos', grupo: '' };

  function criarEstadoInicial() {
    const grupos = [];
    const pessoas = [];
    LISTA_INICIAL.forEach(function (linha) {
      const grupo = { id: novoId('g'), nome: linha.grupo };
      grupos.push(grupo);
      linha.pessoas.forEach(function (item) {
        const dados = typeof item === 'string' ? { nome: item } : item;
        pessoas.push({
          id: novoId('p'),
          nome: dados.nome,
          grupoId: grupo.id,
          situacao: dados.situacao || linha.situacao || 'aguardando',
          acompanhante: dados.acompanhante === true,
          obs: dados.obs || ''
        });
      });
    });
    return { tipo: TIPO_DADOS, versao: VERSAO_DADOS, grupos: grupos, pessoas: pessoas, atualizadoEm: new Date().toISOString() };
  }

  function idValido(id) {
    return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id) && id !== SEM_GRUPO && id !== NOVO_GRUPO;
  }

  function situacaoValida(s) {
    return typeof s === 'string' && Object.prototype.hasOwnProperty.call(SITUACOES, s);
  }

  // Confere uma lista vinda do armazenamento ou de um arquivo de cópia.
  function validarDados(obj) {
    function falha(motivo) { return { ok: false, motivo: motivo }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return falha('o conteúdo não está no formato esperado');
    if (obj.tipo !== TIPO_DADOS) return falha('não é uma cópia de segurança desta lista de convidados');
    if (!Array.isArray(obj.grupos) || !Array.isArray(obj.pessoas)) return falha('faltam os grupos ou as pessoas');
    if (obj.grupos.length > 2000 || obj.pessoas.length > 5000) return falha('tem itens demais');

    const grupos = [];
    const idsGrupos = new Set();
    for (const g of obj.grupos) {
      if (!g || typeof g !== 'object' || !idValido(g.id) || idsGrupos.has(g.id)) return falha('há um grupo com identificação inválida ou repetida');
      const nome = limparTexto(g.nome, MAX_GRUPO);
      if (!nome) return falha('há um grupo sem nome');
      idsGrupos.add(g.id);
      grupos.push({ id: g.id, nome: nome });
    }

    const pessoas = [];
    const idsPessoas = new Set();
    for (const p of obj.pessoas) {
      if (!p || typeof p !== 'object' || !idValido(p.id) || idsPessoas.has(p.id)) return falha('há uma pessoa com identificação inválida ou repetida');
      const nome = limparTexto(p.nome, MAX_NOME);
      if (!nome) return falha('há uma pessoa sem nome');
      if (!situacaoValida(p.situacao)) return falha('a situação de “' + nome + '” não é válida');
      idsPessoas.add(p.id);
      pessoas.push({
        id: p.id,
        nome: nome,
        grupoId: typeof p.grupoId === 'string' && idsGrupos.has(p.grupoId) ? p.grupoId : null,
        situacao: p.situacao,
        acompanhante: p.acompanhante === true,
        obs: limparTexto(p.obs, MAX_OBS)
      });
    }

    const data = new Date(obj.atualizadoEm);
    return {
      ok: true,
      dados: {
        tipo: TIPO_DADOS,
        versao: VERSAO_DADOS,
        grupos: grupos,
        pessoas: pessoas,
        atualizadoEm: isNaN(data.getTime()) ? new Date().toISOString() : data.toISOString()
      }
    };
  }

  function testarArmazenamento() {
    const chave = 'alice90.teste';
    if (!gravarLocal(chave, '1')) return false;
    apagarLocal(chave);
    return true;
  }

  // A lista inicial só entra quando ainda não existe nada salvo neste navegador.
  function carregarEstado() {
    const bruto = lerLocal(CHAVE_DADOS);
    if (bruto !== null) {
      let resultado = null;
      try { resultado = validarDados(JSON.parse(bruto)); } catch (e) { resultado = null; }
      if (resultado && resultado.ok) return resultado.dados;
      // Dados ilegíveis: guarda o texto original à parte, para não perder nada.
      gravarLocal(CHAVE_DADOS + '.ilegivel.' + Date.now(), bruto);
      problemaAoCarregar = true;
    }
    const inicial = criarEstadoInicial();
    armazenamentoOk = gravarLocal(CHAVE_DADOS, JSON.stringify(inicial)) && armazenamentoOk;
    return inicial;
  }

  function salvarEstado() {
    estado.atualizadoEm = new Date().toISOString();
    armazenamentoOk = gravarLocal(CHAVE_DADOS, JSON.stringify(estado));
    $('aviso-armazenamento').hidden = armazenamentoOk;
    return armazenamentoOk;
  }

  function contar(pessoas) {
    const c = { total: 0, confirmado: 0, aguardando: 0, nao_vai: 0, acompanhantes: 0 };
    pessoas.forEach(function (p) {
      c.total += 1;
      c[p.situacao] += 1;
      if (p.acompanhante) c.acompanhantes += 1;
    });
    return c;
  }

  function acharPessoa(id) {
    return estado.pessoas.find(function (p) { return p.id === id; }) || null;
  }

  function acharGrupo(id) {
    return estado.grupos.find(function (g) { return g.id === id; }) || null;
  }

  // grupoId null = pessoas sem grupo
  function pessoasDoGrupo(grupoId) {
    return estado.pessoas.filter(function (p) { return p.grupoId === grupoId; });
  }

  function nomeDoGrupo(grupoId) {
    const g = grupoId ? acharGrupo(grupoId) : null;
    return g ? g.nome : 'Sem grupo';
  }

  function resumoDoGrupo(c) {
    const partes = [];
    if (c.confirmado) partes.push(c.confirmado + (c.confirmado === 1 ? ' confirmada' : ' confirmadas'));
    if (c.aguardando) partes.push(c.aguardando + ' aguardando');
    if (c.nao_vai) partes.push(c.nao_vai + (c.nao_vai === 1 ? ' não vai' : ' não vão'));
    return partes.join(', ');
  }

  /* ======================================================================
   * 5. ACESSO POR SENHA
   *    Barreira simples: confere a senha com PBKDF2 (Web Crypto) e compara
   *    com o hash guardado. Não protege os dados dos arquivos publicados.
   * ====================================================================== */

  let acessoNestaPagina = false;

  function marcadorAcesso() {
    return CONFIG_SENHA.salt + '|' + CONFIG_SENHA.hash;
  }

  function acessoLiberado() {
    const marcador = marcadorAcesso();
    return lerLocal(CHAVE_ACESSO) === marcador || lerSessao(CHAVE_ACESSO) === marcador ||
      (acessoNestaPagina && !armazenamentoOk);
  }

  function liberarAcesso(lembrar) {
    const marcador = marcadorAcesso();
    acessoNestaPagina = true;
    if (lembrar) {
      gravarLocal(CHAVE_ACESSO, marcador);
      apagarSessao(CHAVE_ACESSO);
    } else {
      gravarSessao(CHAVE_ACESSO, marcador);
      apagarLocal(CHAVE_ACESSO);
    }
  }

  function prepararSenha(texto) {
    return String(texto || '').trim().normalize('NFC');
  }

  async function calcularHash(senha, salt, iteracoes) {
    const chave = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iteracoes }, chave, 256);
    return new Uint8Array(bits);
  }

  function criptografiaDisponivel() {
    return !!(window.crypto && window.crypto.subtle && typeof TextEncoder !== 'undefined');
  }

  function falhaSenha(texto) {
    mostrarErro($('erro-senha'), texto);
    $('campo-senha').setAttribute('aria-invalid', 'true');
    $('campo-senha').focus();
  }

  async function tentarEntrar(evento) {
    evento.preventDefault();
    const campo = $('campo-senha');
    const botao = $('botao-entrar');
    esconderErro($('erro-senha'));
    campo.removeAttribute('aria-invalid');
    $('msg-saida').hidden = true;

    const senha = prepararSenha(campo.value);
    if (!senha) {
      falhaSenha('Digite a senha.');
      return;
    }
    if (!criptografiaDisponivel()) {
      falhaSenha('Este navegador não conseguiu conferir a senha. Abra a página pelo endereço que começa com https://, no Chrome ou no Safari atualizados.');
      return;
    }

    botao.disabled = true;
    botao.textContent = 'Conferindo a senha…';
    try {
      const hash = await calcularHash(senha, deBase64(CONFIG_SENHA.salt), CONFIG_SENHA.iteracoes);
      if (bytesIguais(hash, deBase64(CONFIG_SENHA.hash))) {
        liberarAcesso($('lembrar-acesso').checked);
        campo.value = '';
        entrarNoApp();
      } else {
        falhaSenha('Senha incorreta. Confira as letras maiúsculas e minúsculas e tente de novo.');
        campo.select();
      }
    } catch (e) {
      falhaSenha('Não foi possível conferir a senha neste navegador. Atualize a página e tente de novo.');
    } finally {
      botao.disabled = false;
      botao.textContent = 'Entrar';
    }
  }

  function alternarMostrarSenha() {
    const campo = $('campo-senha');
    const botao = $('botao-mostrar-senha');
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    botao.textContent = mostrar ? 'Ocultar' : 'Mostrar';
    botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    campo.focus();
  }

  function mostrarTelaSenha(mensagem) {
    $('app').hidden = true;
    $('tela-senha').hidden = false;
    const msg = $('msg-saida');
    msg.textContent = mensagem || '';
    msg.hidden = !mensagem;
    const campo = $('campo-senha');
    campo.value = '';
    campo.type = 'password';
    campo.removeAttribute('aria-invalid');
    $('botao-mostrar-senha').textContent = 'Mostrar';
    $('botao-mostrar-senha').setAttribute('aria-label', 'Mostrar senha');
    esconderErro($('erro-senha'));
    window.scrollTo(0, 0);
    setTimeout(function () { campo.focus(); }, 50);
  }

  function entrarNoApp() {
    if (!estado) estado = carregarEstado();
    $('tela-senha').hidden = true;
    $('app').hidden = false;
    $('aviso-armazenamento').hidden = armazenamentoOk;
    $('aviso-carregamento').hidden = !problemaAoCarregar;
    $('dica-inicial').hidden = lerLocal(CHAVE_DICA) === 'sim';
    desenhar();
    window.scrollTo(0, 0);
    atualizarBotaoTopo();
  }

  function sair() {
    apagarLocal(CHAVE_ACESSO);
    apagarSessao(CHAVE_ACESSO);
    acessoNestaPagina = false;
    document.querySelectorAll('dialog').forEach(fecharDialogo);
    fecharAviso();
    esvaziar($('lista'));
    filtros.busca = '';
    filtros.situacao = 'todos';
    filtros.grupo = '';
    $('campo-busca').value = '';
    desfazerAntes = null;
    estado = null;
    $('botao-topo').hidden = true;
    mostrarTelaSenha('Você saiu. As alterações continuam guardadas neste aparelho.');
  }

  /* ======================================================================
   * 6. DESENHO DA TELA
   * ====================================================================== */

  function termoDeBusca() {
    return normalizar(filtros.busca);
  }

  function filtrandoPessoas() {
    return !!termoDeBusca() || filtros.situacao !== 'todos';
  }

  function filtroLigado() {
    return filtrandoPessoas() || !!filtros.grupo;
  }

  function pessoaPassaNoFiltro(p) {
    if (filtros.situacao !== 'todos' && p.situacao !== filtros.situacao) return false;
    if (filtros.grupo) {
      if (filtros.grupo === SEM_GRUPO ? p.grupoId !== null : p.grupoId !== filtros.grupo) return false;
    }
    const termo = termoDeBusca();
    if (termo && normalizar(p.nome).indexOf(termo) === -1) return false;
    return true;
  }

  function desenhar() {
    if (!estado) return;
    const ativo = document.activeElement;
    const chaveFoco = ativo && ativo.closest && ativo.closest('#lista') ? ativo.getAttribute('data-chave') : null;
    desenharResumo();
    desenharFiltros();
    desenharLista();
    if (chaveFoco) {
      const novo = document.querySelector('#lista [data-chave="' + chaveFoco + '"]');
      if (novo) focarSemRolar(novo);
    }
  }

  function desenharResumo() {
    const c = contar(estado.pessoas);
    $('texto-confirmados').textContent = c.confirmado === 1 ? '✅ pessoa confirmada' : '✅ pessoas confirmadas';
    $('n-total').textContent = c.total;
    $('n-confirmados').textContent = c.confirmado;
    $('n-aguardando').textContent = c.aguardando;
    $('n-nao-vao').textContent = c.nao_vai;
    const extra = $('resumo-extra');
    if (c.acompanhantes) {
      extra.textContent = 'Inclui ' + plural(c.acompanhantes, 'acompanhante sem nome', 'acompanhantes sem nome') +
        ' (cada acompanhante conta como 1 pessoa).';
      extra.hidden = false;
    } else {
      extra.hidden = true;
    }
    $('ultima-alteracao').textContent = estado.atualizadoEm ? 'Última alteração: ' + formatarDataHora(estado.atualizadoEm) + '.' : '';
    atualizarInfoCopia();
  }

  function desenharFiltros() {
    const c = contar(estado.pessoas);
    document.querySelectorAll('#filtros-situacao [data-filtro]').forEach(function (botao) {
      const f = botao.getAttribute('data-filtro');
      botao.setAttribute('aria-pressed', String(filtros.situacao === f));
      botao.querySelector('.filtro-n').textContent = '(' + (f === 'todos' ? c.total : c[f]) + ')';
    });

    const semGrupo = pessoasDoGrupo(null).length;
    if (filtros.grupo === SEM_GRUPO ? !semGrupo : filtros.grupo && !acharGrupo(filtros.grupo)) filtros.grupo = '';
    const select = $('filtro-grupo');
    esvaziar(select);
    select.appendChild(new Option('Todos os grupos', ''));
    estado.grupos.forEach(function (g) {
      select.appendChild(new Option(g.nome + ' (' + pessoasDoGrupo(g.id).length + ')', g.id));
    });
    if (semGrupo) select.appendChild(new Option('Sem grupo (' + semGrupo + ')', SEM_GRUPO));
    select.value = filtros.grupo;
    guardarOpcoes(select, $('busca-filtro-grupo'));

    const partes = [];
    if (termoDeBusca()) partes.push('nome com “' + filtros.busca.trim() + '”');
    if (filtros.situacao !== 'todos') partes.push('situação “' + SITUACOES[filtros.situacao].nome + '”');
    if (filtros.grupo) partes.push('grupo “' + nomeDoGrupo(filtros.grupo === SEM_GRUPO ? null : filtros.grupo) + '”');
    const visiveis = estado.pessoas.filter(pessoaPassaNoFiltro).length;
    let info;
    if (!c.total) info = 'A lista ainda está vazia.';
    else if (partes.length) info = 'Mostrando ' + visiveis + ' de ' + nPessoas(c.total) + '. Filtro ligado: ' + partes.join(', ') + '.';
    else info = c.total === 1 ? 'Mostrando 1 pessoa.' : 'Mostrando todas as ' + c.total + ' pessoas.';
    $('info-filtro').textContent = info;
    $('botao-limpar-filtros').hidden = !partes.length;
    $('botao-limpar-busca').hidden = !filtros.busca;
  }

  function desenharLista() {
    const lista = $('lista');
    if (!estado.pessoas.length && !estado.grupos.length) {
      lista.innerHTML =
        '<div class="vazio">' +
        '<p class="vazio-titulo">A lista está vazia.</p>' +
        '<p>Toque em <strong>➕ Adicionar pessoa</strong> para começar. Para organizar por família, toque antes em <strong>👥 Criar grupo</strong>.</p>' +
        '<button type="button" class="botao botao-principal" data-acao="adicionar" data-chave="vazio:adicionar">➕ Adicionar pessoa</button>' +
        '</div>';
      return;
    }

    const blocos = estado.grupos.map(function (g) { return { grupo: g, pessoas: pessoasDoGrupo(g.id) }; });
    const semGrupo = pessoasDoGrupo(null);
    if (semGrupo.length) blocos.push({ grupo: null, pessoas: semGrupo });

    const partes = [];
    blocos.forEach(function (bloco) {
      const chave = bloco.grupo ? bloco.grupo.id : SEM_GRUPO;
      if (filtros.grupo && filtros.grupo !== chave) return;
      const visiveis = bloco.pessoas.filter(pessoaPassaNoFiltro);
      if (filtrandoPessoas() && !visiveis.length) return;
      partes.push(htmlGrupo(bloco.grupo, bloco.pessoas, visiveis));
    });

    if (!partes.length) {
      let explicacao = 'Nenhuma pessoa combina com o filtro escolhido.';
      if (termoDeBusca()) explicacao = 'Nenhum nome com “' + filtros.busca.trim() + '”' + (filtros.situacao !== 'todos' || filtros.grupo ? ' com este filtro' : '') + '. Confira se está escrito certo.';
      else if (filtros.situacao !== 'todos') explicacao = 'Ninguém está como “' + SITUACOES[filtros.situacao].nome + '” no momento.';
      lista.innerHTML =
        '<div class="vazio" role="status">' +
        '<p class="vazio-titulo">Ninguém encontrado.</p>' +
        '<p>' + escaparHtml(explicacao) + '</p>' +
        '<button type="button" class="botao botao-secundario" data-acao="limpar-filtros" data-chave="vazio:limpar">Mostrar todos de novo</button>' +
        '</div>';
      return;
    }
    lista.innerHTML = partes.join('');
  }

  function htmlGrupo(grupo, todas, visiveis) {
    const id = grupo ? grupo.id : SEM_GRUPO;
    const nome = escaparHtml(grupo ? grupo.nome : 'Sem grupo');
    const c = contar(todas);
    const resumo = todas.length ? nPessoas(c.total) + ': ' + resumoDoGrupo(c) : 'Nenhuma pessoa ainda';
    const faltam = todas.some(function (p) { return p.situacao !== 'confirmado'; });

    let h = '<article class="grupo' + (grupo ? '' : ' grupo-sem-grupo') + '" id="grupo-' + id + '" aria-labelledby="titulo-grupo-' + id + '">';
    h += '<div class="grupo-cabeca"><div>';
    h += '<h3 class="grupo-nome" id="titulo-grupo-' + id + '">' + nome + '</h3>';
    h += '<p class="grupo-resumo">' + escaparHtml(resumo) + '</p></div>';
    h += '</div>';
    if (grupo) {
      h += '<div class="grupo-acoes">' +
        '<button type="button" class="botao botao-secundario botao-grupo" data-acao="adicionar-no-grupo" data-id="' + id +
        '" data-chave="gadd:' + id + '" aria-label="Adicionar pessoa no ' + nome + '">➕ Adicionar</button>' +
        '<button type="button" class="botao botao-secundario botao-grupo" data-acao="renomear-grupo" data-id="' + id +
        '" data-chave="gren:' + id + '" aria-label="Renomear ' + nome + '">✏️ Renomear</button>' +
        '<button type="button" class="botao botao-perigo botao-grupo" data-acao="excluir-grupo" data-id="' + id +
        '" data-chave="gdel:' + id + '" aria-label="Excluir ' + nome + '">🗑️ Excluir</button>' +
        '</div>';
    }
    if (filtrandoPessoas() && visiveis.length < todas.length) {
      h += '<p class="grupo-filtrado">Mostrando ' + visiveis.length + ' de ' + todas.length + ' (filtro ligado).</p>';
    }
    if (grupo && faltam && !filtrandoPessoas()) {
      h += '<button type="button" class="botao botao-secundario botao-confirmar-grupo" data-acao="confirmar-grupo" data-id="' + id +
        '" data-chave="gconf:' + id + '">✅ Confirmar presença de todos</button>';
    }
    if (!todas.length) {
      h += '<p class="vazio-grupo">Este grupo ainda não tem pessoas. Toque em <strong>➕ Adicionar</strong>.</p>';
    }
    h += '<ul class="pessoas">' + visiveis.map(htmlPessoa).join('') + '</ul>';
    h += '</article>';
    return h;
  }

  // Uma linha por pessoa: nome e situação à esquerda; os três botões de situação à direita.
  function htmlPessoa(p) {
    const nome = escaparHtml(p.nome);
    const s = SITUACOES[p.situacao];
    let extra = '';
    if (p.acompanhante) extra = '👤 nome a confirmar';
    else if (p.obs) extra = '📝 ' + escaparHtml(p.obs);
    let h = '<li class="pessoa"><div class="linha-pessoa linha--' + p.situacao + '">';
    h += '<button type="button" class="linha-nome-btn" data-acao="editar-pessoa" data-id="' + p.id + '" data-chave="pedit:' + p.id +
      '" aria-label="' + nome + ', ' + s.nome + '. Toque para editar.">' +
      '<span class="linha-nome">' + nome + '</span>' +
      '<span class="linha-situacao sit-texto--' + p.situacao + '">' + s.icone + ' ' + s.nome + '</span>' +
      (extra ? '<span class="linha-extra">' + extra + '</span>' : '') + '</button>';
    h += '<div class="mini-sit" role="group" aria-label="Situação de ' + nome + '">';
    ORDEM_SITUACOES.forEach(function (k) {
      h += '<button type="button" class="mini mini--' + k + '" aria-pressed="' + (p.situacao === k) + '" data-acao="situacao" data-id="' + p.id +
        '" data-valor="' + k + '" data-chave="sit:' + p.id + ':' + k + '" aria-label="' + SITUACOES[k].nome + '" title="' + SITUACOES[k].nome + '">' +
        SITUACOES[k].icone + '</button>';
    });
    h += '</div></div></li>';
    return h;
  }

  // Escolha de grupo com autocompletar: um campo de texto mostra, logo abaixo,
  // os grupos que combinam com o que foi digitado. A <select> escondida guarda
  // o valor escolhido, e o resto da página continua lendo dela.
  function guardarOpcoes(select, campo) {
    select._todas = Array.from(select.options).map(function (o) { return { texto: o.text, valor: o.value }; });
    if (document.activeElement !== campo) campo.value = textoEscolhido(select);
    if (campo._lista && !campo._lista.hidden) mostrarSugestoes(select, campo, false);
  }

  function textoEscolhido(select) {
    const o = (select._todas || []).find(function (x) { return x.valor === select.value; });
    return o ? o.texto : '';
  }

  function mostrarSugestoes(select, campo, todos) {
    const lista = campo._lista;
    const termo = todos ? '' : normalizar(campo.value);
    const fixa = function (o) { return o.valor === '' || o.valor === NOVO_GRUPO; };
    const itens = (select._todas || []).filter(function (o) {
      return fixa(o) || !termo || normalizar(o.texto).indexOf(termo) !== -1;
    });
    esvaziar(lista);
    let achou = false;
    itens.forEach(function (o) {
      if (!fixa(o)) achou = true;
      const li = criar('li', 'auto-item', o.texto);
      li.setAttribute('role', 'option');
      li.setAttribute('data-valor', o.valor);
      li.setAttribute('aria-selected', String(o.valor === select.value));
      lista.appendChild(li);
    });
    if (termo && !achou) {
      const aviso = criar('li', 'auto-vazio', 'Nenhum grupo com “' + campo.value.trim() + '”.');
      lista.insertBefore(aviso, lista.children[1] || null);
    }
    lista.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
  }

  function fecharSugestoes(campo) {
    campo._lista.hidden = true;
    campo.setAttribute('aria-expanded', 'false');
  }

  function escolherGrupo(select, campo, valor) {
    const mudou = select.value !== valor;
    select.value = valor;
    campo.value = textoEscolhido(select);
    fecharSugestoes(campo);
    campo.blur();
    if (mudou) select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function ligarAutocompletar(select, campo) {
    const lista = criar('ul', 'auto-lista');
    lista.id = campo.id + '-sugestoes';
    lista.setAttribute('role', 'listbox');
    lista.hidden = true;
    campo.parentNode.insertBefore(lista, campo.nextSibling);
    campo._lista = lista;
    campo.setAttribute('role', 'combobox');
    campo.setAttribute('aria-autocomplete', 'list');
    campo.setAttribute('aria-controls', lista.id);
    campo.setAttribute('aria-expanded', 'false');

    campo.addEventListener('focus', function () {
      campo.select();
      mostrarSugestoes(select, campo, true);
    });
    campo.addEventListener('input', function () { mostrarSugestoes(select, campo, false); });
    campo.addEventListener('blur', function () {
      setTimeout(function () {
        if (document.activeElement === campo) return;
        fecharSugestoes(campo);
        campo.value = textoEscolhido(select);
      }, 200);
    });
    campo.addEventListener('keydown', function (e) {
      if (lista.hidden) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        const primeiro = lista.querySelector('[data-valor]:not([data-valor=""]):not([data-valor="' + NOVO_GRUPO + '"])') ||
          lista.querySelector('[data-valor]');
        if (primeiro) escolherGrupo(select, campo, primeiro.getAttribute('data-valor'));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        fecharSugestoes(campo);
      }
    });
    lista.addEventListener('mousedown', function (e) { e.preventDefault(); });
    lista.addEventListener('click', function (e) {
      const item = e.target.closest('[data-valor]');
      if (item) escolherGrupo(select, campo, item.getAttribute('data-valor'));
    });
  }

  function limparFiltros() {
    filtros.busca = '';
    filtros.situacao = 'todos';
    filtros.grupo = '';
    $('campo-busca').value = '';
    desenhar();
  }

  function mostrarGrupo(id) {
    const el = document.getElementById('grupo-' + id);
    if (!el) return;
    el.classList.add('grupo-destaque');
    setTimeout(function () { el.classList.remove('grupo-destaque'); }, 2600);
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
  }

  function atualizarInfoCopia() {
    const ultima = lerLocal(CHAVE_ULTIMA_COPIA);
    const texto = ultima
      ? 'Última cópia de segurança salva neste aparelho: ' + formatarDataHora(ultima) + '.'
      : 'Ainda não foi salva nenhuma cópia de segurança neste aparelho.';
    $('info-ultima-copia').textContent = texto;
  }

  /* ======================================================================
   * 7. AVISOS, DESFAZER E JANELAS
   * ====================================================================== */

  let temporizadorAviso = null;

  function avisar(texto, opcoes) {
    const comDesfazer = !!(opcoes && opcoes.desfazer && desfazerAntes);
    const area = $('avisos');
    clearTimeout(temporizadorAviso);
    esvaziar(area);

    const caixa = criar('div', 'aviso-flutuante');
    caixa.appendChild(criar('p', null, texto));
    const botoes = criar('div', 'aviso-flutuante-botoes');
    if (comDesfazer) {
      const desfazerBotao = criar('button', 'botao botao-claro', 'Desfazer');
      desfazerBotao.type = 'button';
      desfazerBotao.addEventListener('click', desfazer);
      botoes.appendChild(desfazerBotao);
    }
    const ok = criar('button', 'botao botao-claro', 'OK');
    ok.type = 'button';
    ok.addEventListener('click', fecharAviso);
    botoes.appendChild(ok);
    caixa.appendChild(botoes);
    caixa.addEventListener('focusin', function () { clearTimeout(temporizadorAviso); });
    area.appendChild(caixa);
    temporizadorAviso = setTimeout(fecharAviso, comDesfazer ? 10000 : 6000);
  }

  function fecharAviso() {
    clearTimeout(temporizadorAviso);
    esvaziar($('avisos'));
  }

  // Toda alteração passa por aqui: guarda a versão anterior (para “Desfazer”),
  // salva no aparelho, redesenha a tela e mostra “Alteração salva”.
  function aplicarMudanca(alterar, mensagem) {
    const antes = JSON.stringify(estado);
    alterar();
    const salvou = salvarEstado();
    desfazerAntes = antes;
    desenhar();
    const texto = typeof mensagem === 'function' ? mensagem() : mensagem;
    avisar(texto + (salvou ? ' Alteração salva.' : ' Atenção: não foi possível salvar neste aparelho.'), { desfazer: true });
  }

  function desfazer() {
    if (!desfazerAntes) return;
    let anterior;
    try { anterior = JSON.parse(desfazerAntes); } catch (e) { return; }
    desfazerAntes = null;
    estado = anterior;
    const salvou = salvarEstado();
    desenhar();
    avisar('↩️ Pronto: a última alteração foi desfeita.' + (salvou ? ' Alteração salva.' : ''));
  }

  const pilhaDialogos = [];

  function abrirDialogo(dlg, focar) {
    const ativo = document.activeElement;
    pilhaDialogos.push({ dlg: dlg, elemento: ativo, chave: ativo && ativo.getAttribute ? ativo.getAttribute('data-chave') : null });
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.classList.add('dialogo-alternativo');
      dlg.setAttribute('open', '');
    }
    document.documentElement.classList.add('com-dialogo');
    dlg.scrollTop = 0;
    if (focar) setTimeout(function () { focarSemRolar(focar); }, 60);
  }

  function fecharDialogo(dlg) {
    if (!dlg || !dlg.hasAttribute('open')) return;
    if (typeof dlg.close === 'function') {
      dlg.close(); // dispara o evento "close", tratado em aoFecharDialogo
    } else {
      dlg.removeAttribute('open');
      aoFecharDialogo(dlg);
    }
  }

  function aoFecharDialogo(dlg) {
    let registro = null;
    for (let i = pilhaDialogos.length - 1; i >= 0; i--) {
      if (pilhaDialogos[i].dlg === dlg) {
        registro = pilhaDialogos.splice(i, 1)[0];
        break;
      }
    }
    if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('com-dialogo');
    if (!registro) return;
    let alvo = registro.elemento;
    if ((!alvo || !document.body.contains(alvo)) && registro.chave) {
      alvo = document.querySelector('[data-chave="' + registro.chave + '"]');
    }
    if (alvo && alvo !== document.body && document.body.contains(alvo) && typeof alvo.focus === 'function') {
      focarSemRolar(alvo);
    }
  }

  // Janela de confirmação. Devolve true (sim) ou false (cancelar).
  let respostaPendente = null;

  function perguntar(opcoes) {
    return new Promise(function (resolve) {
      if (respostaPendente) respostaPendente(false);
      respostaPendente = resolve;
      $('confirmar-titulo').textContent = opcoes.titulo;
      const corpo = $('confirmar-texto');
      esvaziar(corpo);
      (opcoes.paragrafos || []).forEach(function (t) { corpo.appendChild(criar('p', null, t)); });
      if (opcoes.itens && opcoes.itens.length) {
        const ul = criar('ul', 'confirmar-itens');
        opcoes.itens.forEach(function (t) { ul.appendChild(criar('li', null, t)); });
        corpo.appendChild(ul);
      }
      (opcoes.depois || []).forEach(function (t) { corpo.appendChild(criar('p', null, t)); });
      const sim = $('confirmar-sim');
      sim.textContent = opcoes.sim || 'Sim';
      sim.className = 'botao ' + (opcoes.perigo ? 'botao-perigo-cheio' : 'botao-principal');
      $('confirmar-nao').textContent = opcoes.nao || 'Cancelar';
      abrirDialogo($('dlg-confirmar'), opcoes.perigo ? $('confirmar-nao') : sim);
    });
  }

  function responder(valor) {
    const resolver = respostaPendente;
    respostaPendente = null;
    fecharDialogo($('dlg-confirmar'));
    if (resolver) resolver(valor);
  }

  /* ======================================================================
   * 8. ALTERAÇÕES RÁPIDAS
   * ====================================================================== */

  function mudarSituacao(id, situacao) {
    const p = acharPessoa(id);
    if (!p || !situacaoValida(situacao)) return;
    if (p.situacao === situacao) {
      avisar(p.nome + ' já está como “' + SITUACOES[situacao].nome + '”.');
      return;
    }
    aplicarMudanca(function () { p.situacao = situacao; }, function () {
      let texto = SITUACOES[situacao].icone + ' ' + p.nome + ': ' + SITUACOES[situacao].nome + '. Confirmados agora: ' + contar(estado.pessoas).confirmado + '.';
      if (filtroLigado() && !pessoaPassaNoFiltro(p)) texto += ' (Não aparece mais neste filtro.)';
      return texto;
    });
  }

  async function confirmarGrupo(grupoId) {
    const g = acharGrupo(grupoId);
    if (!g) return;
    const pendentes = pessoasDoGrupo(grupoId).filter(function (p) { return p.situacao !== 'confirmado'; });
    if (!pendentes.length) {
      avisar('Todas as pessoas do “' + g.nome + '” já estão confirmadas.');
      return;
    }
    const ok = await perguntar({
      titulo: 'Confirmar presença de todos?',
      paragrafos: [pendentes.length === 1
        ? 'Esta pessoa do “' + g.nome + '” vai ficar como ✅ Confirmado:'
        : 'Estas ' + pendentes.length + ' pessoas do “' + g.nome + '” vão ficar como ✅ Confirmado:'],
      itens: pendentes.map(function (p) { return p.nome + ' (antes: ' + SITUACOES[p.situacao].nome + ')'; }),
      depois: ['Depois, se alguém não for, é só ajustar na própria pessoa.'],
      sim: '✅ Sim, confirmar todos'
    });
    if (!ok) return;
    const ids = pendentes.map(function (p) { return p.id; });
    const nomeGrupo = g.nome;
    aplicarMudanca(function () {
      estado.pessoas.forEach(function (p) { if (ids.indexOf(p.id) !== -1) p.situacao = 'confirmado'; });
    }, function () {
      return '✅ ' + (ids.length === 1 ? '1 pessoa confirmada' : ids.length + ' pessoas confirmadas') + ' no “' + nomeGrupo +
        '”. Confirmados agora: ' + contar(estado.pessoas).confirmado + '.';
    });
  }

  function aoClicarNaLista(evento) {
    const alvo = evento.target.closest('[data-acao]');
    if (!alvo) return;
    const id = alvo.getAttribute('data-id');
    switch (alvo.getAttribute('data-acao')) {
      case 'situacao':
        mudarSituacao(id, alvo.getAttribute('data-valor'));
        break;
      case 'editar-pessoa':
        abrirFormPessoa({ modo: 'editar', pessoaId: id });
        break;
      case 'renomear-grupo':
        abrirFormGrupo({ modo: 'editar', grupoId: id });
        break;
      case 'excluir-grupo':
        excluirGrupo(id);
        break;
      case 'confirmar-grupo':
        confirmarGrupo(id);
        break;
      case 'adicionar-no-grupo':
        abrirFormPessoa({ modo: 'novo', grupoId: id === SEM_GRUPO ? null : id });
        break;
      case 'adicionar':
        abrirFormPessoa({ modo: 'novo', grupoId: null });
        break;
      case 'limpar-filtros':
        limparFiltros();
        break;
      default:
        break;
    }
  }

  /* ======================================================================
   * 9. PESSOA: ADICIONAR, EDITAR, REMOVER
   * ====================================================================== */

  const formPessoa = { modo: 'novo', pessoaId: null, duplicadoAceito: false, eraAcompanhante: false, nomeOriginal: '' };

  function preencherGruposDoFormulario(selecionado) {
    const select = $('pessoa-grupo');
    esvaziar(select);
    select.appendChild(new Option('— Sem grupo —', ''));
    estado.grupos.forEach(function (g) { select.appendChild(new Option(g.nome, g.id)); });
    select.appendChild(new Option('➕ Criar um grupo novo…', NOVO_GRUPO));
    select.value = selecionado && acharGrupo(selecionado) ? selecionado : '';
    guardarOpcoes(select, $('busca-pessoa-grupo'));
  }

  function marcarSituacaoNoFormulario(valor) {
    document.querySelectorAll('input[name="pessoa-situacao"]').forEach(function (r) { r.checked = r.value === valor; });
  }

  function situacaoDoFormulario() {
    const r = document.querySelector('input[name="pessoa-situacao"]:checked');
    return r && situacaoValida(r.value) ? r.value : 'aguardando';
  }

  function esconderAvisoDuplicadoPessoa() {
    formPessoa.duplicadoAceito = false;
    $('pessoa-salvar').textContent = 'Salvar';
    const caixa = $('pessoa-aviso-duplicado');
    caixa.hidden = true;
    esvaziar(caixa);
  }

  function limparMensagensPessoa() {
    esconderErro($('pessoa-nome-erro'));
    esconderErro($('pessoa-novo-grupo-erro'));
    $('pessoa-nome').removeAttribute('aria-invalid');
    $('pessoa-novo-grupo').removeAttribute('aria-invalid');
    esconderAvisoDuplicadoPessoa();
  }

  function abrirFormPessoa(opcoes) {
    const p = opcoes.modo === 'editar' ? acharPessoa(opcoes.pessoaId) : null;
    if (opcoes.modo === 'editar' && !p) return;
    formPessoa.modo = opcoes.modo;
    formPessoa.pessoaId = p ? p.id : null;
    formPessoa.eraAcompanhante = !!(p && p.acompanhante);
    formPessoa.nomeOriginal = p ? p.nome : '';

    let titulo = 'Adicionar pessoa';
    let intro = 'Cada pessoa conta uma vez. O nome do grupo não entra na contagem.';
    if (p && p.acompanhante) {
      titulo = 'Informar nome do acompanhante';
      intro = 'Escreva o nome verdadeiro no lugar da identificação provisória. A pessoa continua contando uma vez só.';
    } else if (p) {
      titulo = 'Editar pessoa';
      intro = 'Corrija o que precisar e toque em “Salvar”. Para cancelar, toque em “Cancelar”: nada muda.';
    }
    $('pessoa-titulo').textContent = titulo;
    $('pessoa-intro').textContent = intro;
    $('pessoa-nome').value = p ? p.nome : '';
    $('pessoa-acompanhante').checked = !!(p && p.acompanhante);
    $('pessoa-quantidade').value = '1';
    preencherGruposDoFormulario(p ? p.grupoId : opcoes.grupoId);
    $('pessoa-novo-grupo').value = '';
    marcarSituacaoNoFormulario(p ? p.situacao : 'aguardando');
    $('pessoa-obs').value = p ? p.obs : '';
    $('pessoa-salvar-outra').hidden = opcoes.modo !== 'novo';
    $('pessoa-area-remover').hidden = opcoes.modo !== 'editar';
    $('pessoa-sucesso').hidden = true;
    limparMensagensPessoa();
    atualizarFormPessoa();
    abrirDialogo($('dlg-pessoa'), $('pessoa-nome'));
    if (p && p.acompanhante) setTimeout(function () { $('pessoa-nome').select(); }, 90);
  }

  function atualizarFormPessoa() {
    const acompanhante = $('pessoa-acompanhante').checked;
    const novo = formPessoa.modo === 'novo';
    $('campo-quantidade').hidden = !(novo && acompanhante);
    $('pessoa-nome-rotulo').textContent = acompanhante ? (novo ? 'Como identificar (opcional)' : 'Nome ou identificação') : 'Nome';
    $('pessoa-nome-dica').textContent = acompanhante
      ? (novo
        ? 'Exemplo: Namorado de Bene. Se deixar em branco, a página cria “Acompanhante 1”, “Acompanhante 2”…'
        : 'Quando souber o nome, escreva aqui. A marcação “Ainda não sei o nome” sai sozinha.')
      : 'Escreva como vocês chamam a pessoa. Exemplo: Tia Graça';
    $('campo-novo-grupo').hidden = $('pessoa-grupo').value !== NOVO_GRUPO;
    atualizarAvisoAcompanhantes();
  }

  // Ao adicionar alguém num grupo que tem acompanhante sem nome, oferece dar
  // o nome ao acompanhante, para a mesma pessoa não ser contada duas vezes.
  function atualizarAvisoAcompanhantes() {
    const caixa = $('pessoa-aviso-acompanhantes');
    esvaziar(caixa);
    caixa.hidden = true;
    const grupoId = $('pessoa-grupo').value;
    if (formPessoa.modo !== 'novo' || $('pessoa-acompanhante').checked || !grupoId || grupoId === NOVO_GRUPO) return;
    const provisorios = pessoasDoGrupo(grupoId).filter(function (p) { return p.acompanhante; });
    if (!provisorios.length) return;
    caixa.appendChild(criar('p', null,
      'Este grupo tem ' + plural(provisorios.length, 'acompanhante sem nome', 'acompanhantes sem nome') +
      '. Se a pessoa que você está adicionando é ' + (provisorios.length === 1 ? 'esse acompanhante' : 'um desses acompanhantes') +
      ', escreva o nome acima e toque no botão abaixo. Assim ninguém é contado duas vezes.'));
    const lista = criar('div', 'lista-acompanhantes');
    provisorios.forEach(function (a) {
      const botao = criar('button', 'botao botao-secundario', 'Dar este nome a “' + a.nome + '”');
      botao.type = 'button';
      botao.setAttribute('data-acompanhante', a.id);
      lista.appendChild(botao);
    });
    caixa.appendChild(lista);
    caixa.hidden = false;
  }

  function usarNomeNoAcompanhante(id) {
    const nome = limparTexto($('pessoa-nome').value, MAX_NOME);
    if (!nome) {
      erroCampo($('pessoa-nome'), $('pessoa-nome-erro'), 'Primeiro escreva o nome da pessoa no campo “Nome”. Depois toque de novo no botão.');
      return;
    }
    const acompanhante = acharPessoa(id);
    if (!acompanhante) return;
    const antigo = acompanhante.nome;
    const situacao = SITUACOES[acompanhante.situacao].nome;
    fecharDialogo($('dlg-pessoa'));
    aplicarMudanca(function () {
      const x = acharPessoa(id);
      if (x) {
        x.nome = nome;
        x.acompanhante = false;
      }
    }, '✏️ “' + antigo + '” agora se chama “' + nome + '” e continua contando como 1 pessoa (situação mantida: ' + situacao + ').');
  }

  function aoDigitarNomePessoa() {
    esconderErro($('pessoa-nome-erro'));
    $('pessoa-nome').removeAttribute('aria-invalid');
    $('pessoa-sucesso').hidden = true;
    if (formPessoa.duplicadoAceito) esconderAvisoDuplicadoPessoa();
    if (formPessoa.modo === 'editar' && formPessoa.eraAcompanhante && $('pessoa-acompanhante').checked &&
        limparTexto($('pessoa-nome').value, MAX_NOME) !== formPessoa.nomeOriginal) {
      $('pessoa-acompanhante').checked = false;
      atualizarFormPessoa();
    }
  }

  function ajustarQuantidade(delta) {
    const campo = $('pessoa-quantidade');
    const atual = parseInt(campo.value, 10) || 1;
    campo.value = String(Math.min(MAX_ACOMPANHANTES, Math.max(1, atual + delta)));
  }

  function mostrarAvisoDuplicadoPessoa(nome, iguais) {
    const caixa = $('pessoa-aviso-duplicado');
    esvaziar(caixa);
    const onde = iguais.map(function (p) { return '“' + p.nome + '” (' + nomeDoGrupo(p.grupoId) + ')'; }).join(', ');
    caixa.appendChild(criar('p', null, '⚠️ Já existe ' + onde + ' na lista.'));
    caixa.appendChild(criar('p', null, 'Se for outra pessoa com o mesmo nome, toque em “Salvar mesmo assim”. Se for a mesma pessoa, toque em “Cancelar”.'));
    caixa.hidden = false;
    formPessoa.duplicadoAceito = true;
    $('pessoa-salvar').textContent = 'Salvar mesmo assim';
    try { caixa.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignora */ }
  }

  function gerarNomes(nomeBase, acompanhante, quantidade, grupoId, nomeGrupo) {
    if (!acompanhante) return [nomeBase];
    const nomes = [];
    if (nomeBase) {
      if (quantidade === 1) return [nomeBase];
      for (let i = 1; i <= quantidade; i++) nomes.push((nomeBase + ' ' + i).slice(0, MAX_NOME));
      return nomes;
    }
    const jaExistem = estado.pessoas.filter(function (p) { return p.acompanhante && p.grupoId === grupoId; }).length;
    for (let i = 1; i <= quantidade; i++) {
      const numero = jaExistem + i;
      nomes.push((nomeGrupo ? 'Acompanhante ' + numero + ' (' + nomeGrupo + ')' : 'Acompanhante ' + numero).slice(0, MAX_NOME));
    }
    return nomes;
  }

  function salvarPessoa(continuar) {
    esconderErro($('pessoa-nome-erro'));
    esconderErro($('pessoa-novo-grupo-erro'));
    $('pessoa-nome').removeAttribute('aria-invalid');
    $('pessoa-novo-grupo').removeAttribute('aria-invalid');

    const acompanhante = $('pessoa-acompanhante').checked;
    const nome = limparTexto($('pessoa-nome').value, MAX_NOME);
    const situacao = situacaoDoFormulario();
    const obs = limparTexto($('pessoa-obs').value, MAX_OBS);
    const escolhaGrupo = $('pessoa-grupo').value;

    if (!nome && !acompanhante) {
      erroCampo($('pessoa-nome'), $('pessoa-nome-erro'), 'Escreva o nome da pessoa. Se ainda não souber o nome, marque “Ainda não sei o nome (acompanhante)”.');
      return;
    }
    if (!nome && formPessoa.modo === 'editar') {
      erroCampo($('pessoa-nome'), $('pessoa-nome-erro'), 'Escreva o nome ou uma identificação. Exemplo: Acompanhante de Bene.');
      return;
    }
    let nomeNovoGrupo = '';
    if (escolhaGrupo === NOVO_GRUPO) {
      nomeNovoGrupo = limparTexto($('pessoa-novo-grupo').value, MAX_GRUPO);
      if (!nomeNovoGrupo) {
        erroCampo($('pessoa-novo-grupo'), $('pessoa-novo-grupo-erro'), 'Escreva o nome do novo grupo (exemplo: Família Oliveira) ou escolha um grupo da lista.');
        return;
      }
    }
    if (nome && !formPessoa.duplicadoAceito) {
      const iguais = estado.pessoas.filter(function (p) { return p.id !== formPessoa.pessoaId && normalizar(p.nome) === normalizar(nome); });
      if (iguais.length) {
        mostrarAvisoDuplicadoPessoa(nome, iguais);
        return;
      }
    }

    // Grupo de destino (pode ser um grupo novo criado agora)
    let grupoDestino = escolhaGrupo && escolhaGrupo !== NOVO_GRUPO && acharGrupo(escolhaGrupo) ? escolhaGrupo : null;
    let grupoNovo = null;
    let grupoReaproveitado = null;
    if (nomeNovoGrupo) {
      grupoReaproveitado = estado.grupos.find(function (g) { return normalizar(g.nome) === normalizar(nomeNovoGrupo); }) || null;
      if (grupoReaproveitado) {
        grupoDestino = grupoReaproveitado.id;
      } else {
        grupoNovo = { id: novoId('g'), nome: nomeNovoGrupo };
        grupoDestino = grupoNovo.id;
      }
    }

    if (formPessoa.modo === 'novo') {
      adicionarPessoas({ nome: nome, acompanhante: acompanhante, situacao: situacao, obs: obs, grupoDestino: grupoDestino, grupoNovo: grupoNovo, grupoReaproveitado: grupoReaproveitado, continuar: continuar });
    } else {
      editarPessoa({ nome: nome, acompanhante: acompanhante, situacao: situacao, obs: obs, grupoDestino: grupoDestino, grupoNovo: grupoNovo });
    }
  }

  function adicionarPessoas(d) {
    const quantidade = d.acompanhante ? Math.min(MAX_ACOMPANHANTES, Math.max(1, parseInt($('pessoa-quantidade').value, 10) || 1)) : 1;
    const nomeGrupo = d.grupoNovo ? d.grupoNovo.nome : (d.grupoDestino ? nomeDoGrupo(d.grupoDestino) : '');
    const nomes = gerarNomes(d.nome, d.acompanhante, quantidade, d.grupoDestino, nomeGrupo);
    const descricao = nomes.length === 1 ? '“' + nomes[0] + '”' : nomes.length + ' acompanhantes sem nome';

    if (!d.continuar) fecharDialogo($('dlg-pessoa'));
    aplicarMudanca(function () {
      if (d.grupoNovo) estado.grupos.push(d.grupoNovo);
      nomes.forEach(function (n) {
        estado.pessoas.push({ id: novoId('p'), nome: n, grupoId: d.grupoDestino, situacao: d.situacao, acompanhante: d.acompanhante, obs: d.obs });
      });
    }, function () {
      let texto = '➕ ' + descricao + (nomes.length === 1 ? ' entrou' : ' entraram') + ' na lista (' + (d.grupoDestino ? nomeDoGrupo(d.grupoDestino) : 'sem grupo') + ').';
      if (d.grupoNovo) texto += ' Grupo “' + d.grupoNovo.nome + '” criado.';
      if (d.grupoReaproveitado) texto += ' O grupo “' + d.grupoReaproveitado.nome + '” já existia e foi usado.';
      return texto;
    });

    if (d.continuar) {
      // Mantém a janela aberta para a próxima pessoa do mesmo grupo.
      preencherGruposDoFormulario(d.grupoDestino);
      $('pessoa-nome').value = '';
      $('pessoa-obs').value = '';
      $('pessoa-acompanhante').checked = false;
      $('pessoa-quantidade').value = '1';
      $('pessoa-novo-grupo').value = '';
      limparMensagensPessoa();
      atualizarFormPessoa();
      const sucesso = $('pessoa-sucesso');
      sucesso.textContent = '✓ ' + descricao + (nomes.length === 1 ? ' entrou' : ' entraram') + ' na lista. Alteração salva. Pode escrever a próxima pessoa.';
      sucesso.hidden = false;
      $('dlg-pessoa').scrollTop = 0;
      $('pessoa-nome').focus();
    }
  }

  function editarPessoa(d) {
    const p = acharPessoa(formPessoa.pessoaId);
    if (!p) {
      fecharDialogo($('dlg-pessoa'));
      return;
    }
    const mudou = p.nome !== d.nome || p.grupoId !== d.grupoDestino || p.situacao !== d.situacao ||
      p.obs !== d.obs || p.acompanhante !== d.acompanhante || !!d.grupoNovo;
    fecharDialogo($('dlg-pessoa'));
    if (!mudou) {
      avisar('Nada foi alterado.');
      return;
    }
    const antes = { nome: p.nome, grupoId: p.grupoId, situacao: p.situacao, acompanhante: p.acompanhante };
    const id = p.id;
    aplicarMudanca(function () {
      if (d.grupoNovo) estado.grupos.push(d.grupoNovo);
      const x = acharPessoa(id);
      if (!x) return;
      x.nome = d.nome;
      x.grupoId = d.grupoDestino;
      x.situacao = d.situacao;
      x.obs = d.obs;
      x.acompanhante = d.acompanhante;
    }, function () {
      const partes = [];
      if (antes.nome !== d.nome) {
        partes.push('✏️ “' + antes.nome + '” agora se chama “' + d.nome + '”' +
          (antes.acompanhante ? ' e continua contando como 1 pessoa.' : '.'));
      } else {
        partes.push('✏️ Alterações salvas para “' + d.nome + '”.');
      }
      if (antes.grupoId !== d.grupoDestino) {
        partes.push(d.grupoDestino ? 'Agora está no grupo “' + nomeDoGrupo(d.grupoDestino) + '”.' : 'Agora está em “Sem grupo”.');
      }
      if (antes.situacao !== d.situacao) partes.push('Situação: ' + SITUACOES[d.situacao].nome + '.');
      if (d.grupoNovo) partes.push('Grupo “' + d.grupoNovo.nome + '” criado.');
      return partes.join(' ');
    });
  }

  async function removerPessoaDoFormulario() {
    const p = acharPessoa(formPessoa.pessoaId);
    if (!p) return;
    const ok = await perguntar({
      titulo: 'Remover da lista?',
      paragrafos: ['Você vai remover “' + p.nome + '” (' + nomeDoGrupo(p.grupoId) + ').', 'Essa pessoa deixa de ser contada nos totais.'],
      sim: '🗑️ Sim, remover',
      nao: 'Não, manter na lista',
      perigo: true
    });
    if (!ok) return;
    const id = p.id;
    const nome = p.nome;
    fecharDialogo($('dlg-pessoa'));
    aplicarMudanca(function () {
      estado.pessoas = estado.pessoas.filter(function (x) { return x.id !== id; });
    }, function () {
      return '🗑️ “' + nome + '” não está mais na lista. Convidados agora: ' + contar(estado.pessoas).total + '.';
    });
  }

  /* ======================================================================
   * 10. GRUPO: CRIAR, RENOMEAR, EXCLUIR
   * ====================================================================== */

  const formGrupo = { modo: 'novo', grupoId: null, duplicadoAceito: false };

  function esconderAvisoDuplicadoGrupo() {
    formGrupo.duplicadoAceito = false;
    $('grupo-salvar').textContent = 'Salvar';
    const caixa = $('grupo-aviso-duplicado');
    caixa.hidden = true;
    esvaziar(caixa);
  }

  function abrirFormGrupo(opcoes) {
    const g = opcoes.modo === 'editar' ? acharGrupo(opcoes.grupoId) : null;
    if (opcoes.modo === 'editar' && !g) return;
    formGrupo.modo = opcoes.modo;
    formGrupo.grupoId = g ? g.id : null;
    $('grupo-titulo').textContent = g ? 'Editar grupo' : 'Criar grupo';
    $('grupo-nome').value = g ? g.nome : '';
    const info = $('grupo-info');
    if (g) {
      const n = pessoasDoGrupo(g.id).length;
      info.textContent = n ? 'Este grupo tem ' + nPessoas(n) + '. Para trocar o nome do grupo, escreva abaixo.' : 'Este grupo ainda não tem pessoas.';
      info.hidden = false;
    } else {
      info.hidden = true;
    }
    esconderErro($('grupo-nome-erro'));
    $('grupo-nome').removeAttribute('aria-invalid');
    esconderAvisoDuplicadoGrupo();
    abrirDialogo($('dlg-grupo'), $('grupo-nome'));
  }

  function salvarGrupo() {
    esconderErro($('grupo-nome-erro'));
    $('grupo-nome').removeAttribute('aria-invalid');
    const nome = limparTexto($('grupo-nome').value, MAX_GRUPO);
    if (!nome) {
      erroCampo($('grupo-nome'), $('grupo-nome-erro'), 'Escreva o nome do grupo. Exemplo: Família Oliveira.');
      return;
    }
    if (!formGrupo.duplicadoAceito) {
      const igual = estado.grupos.find(function (g) { return g.id !== formGrupo.grupoId && normalizar(g.nome) === normalizar(nome); });
      if (igual) {
        const caixa = $('grupo-aviso-duplicado');
        esvaziar(caixa);
        caixa.appendChild(criar('p', null, '⚠️ Já existe um grupo chamado “' + igual.nome + '”.'));
        caixa.appendChild(criar('p', null, 'Se quiser mesmo outro grupo com esse nome, toque em “Salvar mesmo assim”. Se não, toque em “Cancelar”.'));
        caixa.hidden = false;
        formGrupo.duplicadoAceito = true;
        $('grupo-salvar').textContent = 'Salvar mesmo assim';
        return;
      }
    }

    if (formGrupo.modo === 'novo') {
      const grupo = { id: novoId('g'), nome: nome };
      fecharDialogo($('dlg-grupo'));
      aplicarMudanca(function () { estado.grupos.push(grupo); }, function () {
        let texto = '👥 Grupo “' + nome + '” criado. Agora toque em “➕ Adicionar pessoa neste grupo”.';
        if (!document.getElementById('grupo-' + grupo.id)) texto += ' Para ver o grupo, toque em “Mostrar todos de novo”.';
        return texto;
      });
      mostrarGrupo(grupo.id);
      return;
    }

    const g = acharGrupo(formGrupo.grupoId);
    fecharDialogo($('dlg-grupo'));
    if (!g) return;
    if (g.nome === nome) {
      avisar('Nada foi alterado.');
      return;
    }
    const antigo = g.nome;
    const id = g.id;
    aplicarMudanca(function () {
      const x = acharGrupo(id);
      if (x) x.nome = nome;
    }, '✏️ O grupo “' + antigo + '” agora se chama “' + nome + '”.');
  }

  async function excluirGrupo(grupoId) {
    const g = acharGrupo(grupoId);
    if (!g) return;
    const membros = pessoasDoGrupo(g.id);
    let explicacao = 'O grupo está vazio.';
    if (membros.length === 1) explicacao = 'A pessoa do grupo NÃO será apagada. Ela vai para “Sem grupo”:';
    else if (membros.length > 1) explicacao = 'As ' + membros.length + ' pessoas do grupo NÃO serão apagadas. Elas vão para “Sem grupo”:';
    const ok = await perguntar({
      titulo: 'Excluir este grupo?',
      paragrafos: ['Você vai excluir o grupo “' + g.nome + '”.', explicacao],
      itens: membros.map(function (p) { return p.nome; }),
      sim: '🗑️ Sim, excluir o grupo',
      nao: 'Não, manter o grupo',
      perigo: true
    });
    if (!ok) return;
    const id = g.id;
    const nome = g.nome;
    const n = membros.length;
    fecharDialogo($('dlg-opcoes-grupo'));
    aplicarMudanca(function () {
      estado.grupos = estado.grupos.filter(function (x) { return x.id !== id; });
      estado.pessoas.forEach(function (p) { if (p.grupoId === id) p.grupoId = null; });
      if (filtros.grupo === id) filtros.grupo = '';
    }, '🗑️ Grupo “' + nome + '” excluído.' + (n ? ' ' + (n === 1 ? '1 pessoa foi' : n + ' pessoas foram') + ' para “Sem grupo”.' : ''));
  }

  /* ======================================================================
   * 11. TEXTO PARA WHATSAPP
   * ====================================================================== */

  function tipoTextoEscolhido() {
    const r = document.querySelector('input[name="tipo-texto"]:checked');
    return r ? r.value : 'completa';
  }

  function gerarTextoWhatsApp(tipo) {
    const c = contar(estado.pessoas);
    const titulos = {
      completa: 'Lista de convidados',
      confirmados: 'Lista de convidados — somente confirmados',
      pendentes: 'Lista de convidados — quem ainda não respondeu'
    };
    let incluir = function () { return true; };
    if (tipo === 'confirmados') incluir = function (p) { return p.situacao === 'confirmado'; };
    if (tipo === 'pendentes') incluir = function (p) { return p.situacao === 'aguardando'; };

    const linhas = [];
    linhas.push('🎂 *' + NOME_EVENTO + '*');
    linhas.push('*' + (titulos[tipo] || titulos.completa) + '*');
    linhas.push('Atualizada em: ' + formatarDataHora(new Date()));
    linhas.push('');
    linhas.push('👥 Convidados: ' + c.total);
    linhas.push('✅ Confirmados: ' + c.confirmado);
    linhas.push('⏳ Aguardando resposta: ' + c.aguardando);
    linhas.push('❌ Não vão: ' + c.nao_vai);

    const mostradas = estado.pessoas.filter(incluir).length;
    if (tipo === 'confirmados' || tipo === 'pendentes') {
      linhas.push('');
      linhas.push('📌 *Filtro aplicado: ' + (tipo === 'confirmados' ? 'somente confirmados' : 'somente quem ainda não respondeu') +
        '* (' + mostradas + ' de ' + nPessoas(c.total) + '). Os totais acima são da lista inteira.');
    }

    const blocos = estado.grupos.map(function (g) { return { nome: g.nome, pessoas: pessoasDoGrupo(g.id) }; });
    const semGrupo = pessoasDoGrupo(null);
    if (semGrupo.length) blocos.push({ nome: 'Sem grupo', pessoas: semGrupo });
    blocos.forEach(function (bloco) {
      const pessoas = bloco.pessoas.filter(incluir);
      if (!pessoas.length) return;
      linhas.push('');
      linhas.push('*' + bloco.nome + '*');
      pessoas.forEach(function (p) {
        linhas.push(SITUACOES[p.situacao].icone + ' ' + p.nome + (p.acompanhante ? ' _(nome a confirmar)_' : ''));
      });
    });
    if (!mostradas) {
      linhas.push('');
      linhas.push(tipo === 'pendentes' ? 'Todos já responderam. 🎉' : 'Ninguém nesta situação no momento.');
    }

    linhas.push('');
    linhas.push('*Quantidade confirmada para o buffet: ' + nPessoas(c.confirmado) + '.*');
    linhas.push('');
    linhas.push('Legenda: ✅ Confirmado | ⏳ Aguardando resposta | ❌ Não vai');
    return linhas.join('\n');
  }

  function atualizarTextoWhatsApp() {
    const texto = gerarTextoWhatsApp(tipoTextoEscolhido());
    $('texto-whatsapp').value = texto;
    const info = $('texto-info');
    if (texto.length > TEXTO_LONGO) {
      info.textContent = 'Texto longo (' + texto.length + ' caracteres). Se o envio falhar, use “Copiar texto” ou escolha uma opção menor, como “Somente confirmados”.';
      info.hidden = false;
    } else {
      info.hidden = true;
    }
    return texto;
  }

  function mensagemCompartilhar(texto, sucesso) {
    const msg = $('msg-compartilhar');
    msg.className = sucesso ? 'mensagem-ok' : 'mensagem-neutra';
    msg.textContent = texto;
  }

  function abrirCompartilhar() {
    atualizarTextoWhatsApp();
    mensagemCompartilhar('', true);
    $('botao-compartilhar-nativo').hidden = typeof navigator.share !== 'function';
    abrirDialogo($('dlg-compartilhar'), document.querySelector('input[name="tipo-texto"]:checked'));
  }

  async function copiarTexto(texto, areaDeTexto) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch (e) { /* tenta do jeito antigo abaixo */ }
    }
    try {
      areaDeTexto.focus();
      areaDeTexto.select();
      areaDeTexto.setSelectionRange(0, areaDeTexto.value.length);
      return !!document.execCommand('copy');
    } catch (e) {
      return false;
    }
  }

  async function copiarTextoWhatsApp() {
    const texto = atualizarTextoWhatsApp();
    const ok = await copiarTexto(texto, $('texto-whatsapp'));
    if (ok) {
      mensagemCompartilhar('✓ Texto copiado. Agora abra o WhatsApp, escolha a conversa, toque e segure no campo de mensagem e escolha “Colar”.', true);
    } else {
      mensagemCompartilhar('Não deu para copiar sozinho. Toque e segure no texto acima, escolha “Selecionar tudo” e depois “Copiar”.', false);
    }
  }

  async function compartilharNativo() {
    const texto = atualizarTextoWhatsApp();
    try {
      await navigator.share({ text: texto });
      mensagemCompartilhar('✓ Texto entregue ao aplicativo escolhido. Lá, confira a conversa e toque em enviar.', true);
    } catch (e) {
      if (e && e.name === 'AbortError') mensagemCompartilhar('Compartilhamento cancelado. Nada foi enviado.', false);
      else mensagemCompartilhar('Não deu para compartilhar por aqui. Toque em “📋 Copiar texto” e cole no WhatsApp.', false);
    }
  }

  /* ======================================================================
   * 12. CÓPIA DE SEGURANÇA (arquivo .json)
   * ====================================================================== */

  function abrirCopia() {
    $('msg-salvar-copia').textContent = '';
    $('msg-restaurar').textContent = '';
    esconderErro($('erro-copia'));
    atualizarInfoCopia();
    abrirDialogo($('dlg-copia'), $('botao-salvar-copia'));
  }

  function salvarCopia() {
    const agora = new Date();
    const dados = {
      tipo: TIPO_DADOS,
      versao: VERSAO_DADOS,
      evento: NOME_EVENTO,
      salvoEm: agora.toISOString(),
      atualizadoEm: estado.atualizadoEm,
      grupos: estado.grupos,
      pessoas: estado.pessoas
    };
    const nomeArquivo = 'convidados-alice-90-anos-' + dataParaArquivo(agora) + '.json';
    esconderErro($('erro-copia'));
    try {
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const endereco = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = endereco;
      link.download = nomeArquivo;
      link.rel = 'noopener';
      link.hidden = true;
      $('dlg-copia').appendChild(link);
      link.click();
      setTimeout(function () {
        URL.revokeObjectURL(endereco);
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 5000);
      gravarLocal(CHAVE_ULTIMA_COPIA, agora.toISOString());
      atualizarInfoCopia();
      $('msg-salvar-copia').textContent = '✓ Arquivo “' + nomeArquivo + '” criado, com ' + nPessoas(estado.pessoas.length) +
        '. Ele costuma ficar na pasta Downloads (ou “Transferências”) do aparelho. Envie esse arquivo para o seu WhatsApp ou e-mail para guardar.';
    } catch (e) {
      $('msg-salvar-copia').textContent = '';
      mostrarErro($('erro-copia'), 'Não foi possível criar o arquivo neste navegador. Tente pelo Chrome ou pelo Safari.');
    }
  }

  function escolherArquivoCopia() {
    esconderErro($('erro-copia'));
    $('msg-restaurar').textContent = '';
    const campo = $('arquivo-copia');
    campo.value = '';
    campo.click();
  }

  async function arquivoEscolhido() {
    const campo = $('arquivo-copia');
    const arquivo = campo.files && campo.files[0];
    if (!arquivo) return;
    const erro = $('erro-copia');
    esconderErro(erro);
    $('msg-restaurar').textContent = '';

    if (arquivo.size > 3 * 1024 * 1024) {
      mostrarErro(erro, 'Este arquivo é grande demais para ser uma cópia desta lista. Nada foi alterado.');
      campo.value = '';
      return;
    }
    let resultado;
    try {
      resultado = validarDados(JSON.parse(await lerArquivoComoTexto(arquivo)));
    } catch (e) {
      resultado = { ok: false, motivo: 'não deu para ler o conteúdo' };
    }
    campo.value = '';
    if (!resultado.ok) {
      mostrarErro(erro, 'Este arquivo não pôde ser usado: ' + resultado.motivo + '. Escolha um arquivo criado em “Salvar cópia de segurança”. Nada foi alterado.');
      return;
    }

    const novo = resultado.dados;
    const cNovo = contar(novo.pessoas);
    const cAtual = contar(estado.pessoas);
    const ok = await perguntar({
      titulo: 'Substituir a lista atual?',
      paragrafos: [
        'A cópia “' + arquivo.name + '” tem ' + nPessoas(cNovo.total) + ' em ' + plural(novo.grupos.length, 'grupo', 'grupos') + ': ' +
          cNovo.confirmado + ' confirmadas, ' + cNovo.aguardando + ' aguardando resposta e ' + cNovo.nao_vai + ' que não vão.',
        'Última alteração nessa cópia: ' + formatarDataHora(novo.atualizadoEm) + '.',
        'A lista que está agora neste aparelho (' + nPessoas(cAtual.total) + ', ' + cAtual.confirmado + ' confirmadas) será substituída por ela.',
        'Se mudar de ideia logo depois, use o botão “Desfazer”.'
      ],
      sim: 'Sim, restaurar esta cópia',
      nao: 'Não, manter a lista atual',
      perigo: true
    });
    if (!ok) {
      $('msg-restaurar').textContent = 'Restauração cancelada. Nada foi alterado.';
      return;
    }
    fecharDialogo($('dlg-copia'));
    aplicarMudanca(function () { estado = novo; }, '📂 Cópia restaurada: ' + nPessoas(cNovo.total) + ', ' + cNovo.confirmado + ' confirmadas.');
  }

  /* ======================================================================
   * 14. EVENTOS E INÍCIO
   * ====================================================================== */

  function aoMudarEmOutraAba(evento) {
    if (evento.key !== CHAVE_DADOS || !evento.newValue || !estado || $('app').hidden) return;
    try {
      const resultado = validarDados(JSON.parse(evento.newValue));
      if (resultado.ok) {
        estado = resultado.dados;
        desfazerAntes = null;
        desenhar();
        avisar('A lista foi atualizada em outra aba deste navegador.');
      }
    } catch (e) { /* ignora */ }
  }

  function ligarEventos() {
    // Senha e saída
    $('form-senha').addEventListener('submit', tentarEntrar);
    $('botao-mostrar-senha').addEventListener('click', alternarMostrarSenha);
    document.querySelectorAll('[data-sair]').forEach(function (b) { b.addEventListener('click', sair); });

    // Ações principais
    $('botao-fechar-dica').addEventListener('click', function () {
      gravarLocal(CHAVE_DICA, 'sim');
      $('dica-inicial').hidden = true;
      avisar('Certo! Se precisar, a “Ajuda rápida” fica no fim da página.');
    });
    $('botao-adicionar').addEventListener('click', function () {
      abrirFormPessoa({ modo: 'novo', grupoId: filtros.grupo && filtros.grupo !== SEM_GRUPO ? filtros.grupo : null });
    });
    $('botao-criar-grupo').addEventListener('click', function () { abrirFormGrupo({ modo: 'novo' }); });
    $('botao-compartilhar').addEventListener('click', abrirCompartilhar);
    document.querySelectorAll('[data-abrir-copia]').forEach(function (b) { b.addEventListener('click', abrirCopia); });

    // Busca e filtros
    $('campo-busca').addEventListener('input', function (e) {
      filtros.busca = e.target.value;
      desenhar();
    });
    $('campo-busca').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur(); // fecha o teclado do celular
      }
    });
    $('botao-limpar-busca').addEventListener('click', function () {
      filtros.busca = '';
      $('campo-busca').value = '';
      desenhar();
      $('campo-busca').focus();
    });
    $('filtros-situacao').addEventListener('click', function (e) {
      const botao = e.target.closest('[data-filtro]');
      if (!botao) return;
      filtros.situacao = botao.getAttribute('data-filtro');
      desenhar();
    });
    $('filtro-grupo').addEventListener('change', function (e) {
      filtros.grupo = e.target.value;
      desenhar();
    });
    $('botao-limpar-filtros').addEventListener('click', limparFiltros);
    ligarAutocompletar($('filtro-grupo'), $('busca-filtro-grupo'));
    ligarAutocompletar($('pessoa-grupo'), $('busca-pessoa-grupo'));

    // Lista
    $('lista').addEventListener('click', aoClicarNaLista);

    // Janelas
    document.querySelectorAll('dialog').forEach(function (d) {
      d.addEventListener('close', function () { aoFecharDialogo(d); });
    });
    document.querySelectorAll('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', function () { fecharDialogo(b.closest('dialog')); });
    });

    // Janela de pessoa
    $('form-pessoa').addEventListener('submit', function (e) {
      e.preventDefault();
      salvarPessoa(false);
    });
    $('pessoa-salvar-outra').addEventListener('click', function () { salvarPessoa(true); });
    $('pessoa-remover').addEventListener('click', removerPessoaDoFormulario);
    $('pessoa-nome').addEventListener('input', aoDigitarNomePessoa);
    $('pessoa-acompanhante').addEventListener('change', function () {
      esconderAvisoDuplicadoPessoa();
      atualizarFormPessoa();
    });
    $('pessoa-grupo').addEventListener('change', function () {
      atualizarFormPessoa();
      if ($('pessoa-grupo').value === NOVO_GRUPO) setTimeout(function () { $('pessoa-novo-grupo').focus(); }, 50);
    });
    $('pessoa-novo-grupo').addEventListener('input', function () {
      esconderErro($('pessoa-novo-grupo-erro'));
      $('pessoa-novo-grupo').removeAttribute('aria-invalid');
    });
    $('campo-quantidade').addEventListener('click', function (e) {
      const botao = e.target.closest('[data-quantidade]');
      if (botao) ajustarQuantidade(parseInt(botao.getAttribute('data-quantidade'), 10));
    });
    $('pessoa-aviso-acompanhantes').addEventListener('click', function (e) {
      const botao = e.target.closest('[data-acompanhante]');
      if (botao) usarNomeNoAcompanhante(botao.getAttribute('data-acompanhante'));
    });

    // Janela de grupo
    $('form-grupo').addEventListener('submit', function (e) {
      e.preventDefault();
      salvarGrupo();
    });
    $('grupo-nome').addEventListener('input', function () {
      esconderErro($('grupo-nome-erro'));
      $('grupo-nome').removeAttribute('aria-invalid');
      if (formGrupo.duplicadoAceito) esconderAvisoDuplicadoGrupo();
    });

    // Janela de confirmação
    $('confirmar-sim').addEventListener('click', function () { responder(true); });
    $('confirmar-nao').addEventListener('click', function () { responder(false); });
    $('dlg-confirmar').addEventListener('close', function () { if (respostaPendente) responder(false); });

    // Compartilhar
    document.querySelectorAll('input[name="tipo-texto"]').forEach(function (r) {
      r.addEventListener('change', function () {
        atualizarTextoWhatsApp();
        mensagemCompartilhar('', true);
      });
    });
    $('botao-copiar-texto').addEventListener('click', copiarTextoWhatsApp);
    $('botao-compartilhar-nativo').addEventListener('click', compartilharNativo);

    // Cópia de segurança
    $('botao-salvar-copia').addEventListener('click', salvarCopia);
    $('botao-restaurar-copia').addEventListener('click', escolherArquivoCopia);
    $('arquivo-copia').addEventListener('change', arquivoEscolhido);


    // Mudanças feitas em outra aba do mesmo navegador
    window.addEventListener('storage', aoMudarEmOutraAba);
  }

  /* Janela “Situação de …” (abre ao tocar numa pessoa) */
  let pessoaNaJanela = null;

  function abrirSituacao(id) {
    const p = acharPessoa(id);
    if (!p) return;
    pessoaNaJanela = p.id;
    $('situacao-nome').textContent = p.nome;
    $('situacao-grupo').textContent = p.grupoId ? 'Grupo: ' + nomeDoGrupo(p.grupoId) : 'Sem grupo';
    const extras = [];
    if (p.acompanhante) extras.push('👤 Acompanhante, nome a confirmar.');
    if (p.obs) extras.push('📝 ' + p.obs);
    $('situacao-extra').textContent = extras.join(' ');
    $('situacao-extra').hidden = !extras.length;
    let atual = null;
    document.querySelectorAll('#dlg-situacao [data-situacao]').forEach(function (b) {
      const marcado = b.getAttribute('data-situacao') === p.situacao;
      b.setAttribute('aria-pressed', String(marcado));
      b.querySelector('.opcao-atual').hidden = !marcado;
      if (marcado) atual = b;
    });
    $('situacao-editar').textContent = p.acompanhante ? '✏️ Informar nome' : '✏️ Editar nome, grupo ou observação';
    abrirDialogo($('dlg-situacao'), atual);
  }

  /* Janela “Opções do grupo” */
  let grupoNaJanela = null;

  function abrirOpcoesGrupo(id) {
    const g = acharGrupo(id);
    if (!g) return;
    grupoNaJanela = id;
    const membros = pessoasDoGrupo(id);
    const c = contar(membros);
    $('opcoes-grupo-nome').textContent = g.nome;
    $('opcoes-grupo-resumo').textContent = membros.length ? nPessoas(c.total) + ': ' + resumoDoGrupo(c) + '.' : 'Nenhuma pessoa ainda.';
    $('og-confirmar').hidden = !membros.some(function (p) { return p.situacao !== 'confirmado'; });
    abrirDialogo($('dlg-opcoes-grupo'), $('og-adicionar'));
  }

  function atualizarBotaoTopo() {
    $('botao-topo').hidden = $('app').hidden || window.pageYOffset < 700;
  }

  function ligarEventosExtras() {
    document.querySelectorAll('#dlg-situacao [data-situacao]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = pessoaNaJanela;
        fecharDialogo($('dlg-situacao'));
        mudarSituacao(id, b.getAttribute('data-situacao'));
      });
    });
    $('situacao-editar').addEventListener('click', function () {
      const id = pessoaNaJanela;
      fecharDialogo($('dlg-situacao'));
      abrirFormPessoa({ modo: 'editar', pessoaId: id });
    });
    $('og-adicionar').addEventListener('click', function () {
      fecharDialogo($('dlg-opcoes-grupo'));
      abrirFormPessoa({ modo: 'novo', grupoId: grupoNaJanela });
    });
    $('og-confirmar').addEventListener('click', function () {
      fecharDialogo($('dlg-opcoes-grupo'));
      confirmarGrupo(grupoNaJanela);
    });
    $('og-renomear').addEventListener('click', function () {
      fecharDialogo($('dlg-opcoes-grupo'));
      abrirFormGrupo({ modo: 'editar', grupoId: grupoNaJanela });
    });
    $('og-excluir').addEventListener('click', function () { excluirGrupo(grupoNaJanela); });
    $('botao-ajuda').addEventListener('click', function () { abrirDialogo($('dlg-ajuda'), null); });
    $('botao-topo').addEventListener('click', function () {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    });
    window.addEventListener('scroll', atualizarBotaoTopo, { passive: true });
  }

  function mostrarFalhaGeral() {
    const aviso = $('carregando');
    if (!aviso) return;
    aviso.textContent = 'Algo deu errado nesta página. Atualize a página. Se continuar, avise quem cuida da página.';
    aviso.hidden = false;
  }

  function iniciar() {
    window.addEventListener('error', mostrarFalhaGeral);
    window.addEventListener('unhandledrejection', mostrarFalhaGeral);
    armazenamentoOk = testarArmazenamento();
    ligarEventos();
    ligarEventosExtras();
    $('carregando').hidden = true;
    if (acessoLiberado()) entrarNoApp();
    else mostrarTelaSenha();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

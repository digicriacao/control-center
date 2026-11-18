// Digi | Prudential Control Center — base de dados única (localStorage) + regras de negócio
(function () {
  if (window.DigiStore) return;
  const KEY = 'digi-prudential-v1';

  const C = {
    gray: ['#5F6470', '#EEF0F3'], blue: ['#2F5BD3', '#E8EEFC'], amber: ['#9A6200', '#FFF3DC'],
    violet: ['#6C3FD1', '#F0EAFD'], orange: ['#C2560E', '#FFEBDD'], teal: ['#0E7C70', '#E1F5F2'],
    indigo: ['#4338CA', '#E8E7FB'], red: ['#C4213B', '#FDE6EA'], cyan: ['#0B6E99', '#E0F2FA'], green: ['#1F7A3A', '#E3F4E8']
  };
  const STATUS = [
    ['Nova demanda', 'Nova demanda', 'gray'], ['Em pauta', 'Em pauta', 'blue'],
    ['Aguardando briefing ou informações', 'Aguardando briefing', 'amber'],
    ['Texto em produção', 'Texto em produção', 'violet'], ['Texto em aprovação', 'Texto em aprovação', 'orange'],
    ['Texto aprovado', 'Texto aprovado', 'teal'], ['Em produção de DA', 'Produção de DA', 'violet'],
    ['Em produção de Motion', 'Produção de Motion', 'indigo'], ['Em aprovação do cliente', 'Aprovação do cliente', 'orange'],
    ['Ajustes solicitados', 'Ajustes solicitados', 'red'], ['Peça enviada', 'Peça enviada', 'cyan'],
    ['Concluído', 'Concluído', 'green'], ['Cancelado', 'Cancelado', 'gray']
  ].map(([nome, curto, cor], i) => ({ nome, curto, i, fg: C[cor][0], bg: C[cor][1] }));
  const SN = STATUS.map(s => s.nome);
  const G = {
    producao: ['Texto em produção', 'Em produção de DA', 'Em produção de Motion', 'Ajustes solicitados'],
    aprovacao: ['Texto em aprovação', 'Em aprovação do cliente'],
    aguardandoCliente: ['Aguardando briefing ou informações', 'Texto em aprovação', 'Em aprovação do cliente'],
    fechado: ['Peça enviada', 'Concluído', 'Cancelado']
  };
  const CATEGORIAS = ['Réguas', 'Demandas avulsas', 'Instagram', 'News', 'Campanhas', 'Vídeos', 'E-mail marketing', 'WhatsApp', 'PDFs', 'Apresentações', 'Outros materiais'];
  const TIPOS_IG = ['Feed · Peça única', 'Feed · Carrossel', 'Feed · Reels', 'Feed · GIF', 'Feed · Trend', 'Stories · Campanha', 'Stories · Sequência', 'Stories · Enquete', 'Stories · Interação', 'Stories · Outro'];
  const TIPOS = ['Peça estática', 'E-mail marketing', 'Banner', 'Vídeo', 'Motion', 'PDF', 'Apresentação', 'WhatsApp', 'Landing page', 'Material de apoio', 'Outro'];
  const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
  const RESP = ['Isabella Coelho', 'Luma Ferreira', 'Redação', 'Equipe DA', 'Equipe Motion'];
  const APROV = ['Cliente — Prudential', 'Isabella Coelho', 'Luma Ferreira'];
  const REGRAS = { producao: 'Ao entrar em produção de DA/Motion', enviada: 'Ao ser enviada ao cliente', concluido: 'Somente quando concluída' };
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => ymd(new Date());
  const addDays = (n, base) => { const d = base ? new Date(base + 'T12:00') : new Date(); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((new Date(a + 'T12:00') - new Date(b + 'T12:00')) / 864e5);
  const monthOf = d => (d || '').slice(0, 7);
  const monthLabel = m => { if (!m) return '—'; const [y, mm] = m.split('-'); return MESES[+mm - 1] + ' ' + y; };
  const shiftMonth = (m, n) => { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + n, 1); return ymd(d).slice(0, 7); };
  const fmt = d => { if (!d) return '—'; const [, m, dd] = d.split('-'); return +dd + ' ' + MES3[+m - 1]; };
  const fmtLong = d => { if (!d) return '—'; const x = new Date(d + 'T12:00'); return DIAS[x.getDay()] + ', ' + x.getDate() + ' ' + MES3[x.getMonth()]; };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const weekStart = d => { const x = new Date((d || today()) + 'T12:00'); const dw = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dw); return ymd(x); };

  function seed() {
    const now = Date.now(), M = '2026-11';
    const D = (nome, categoria, tipo, qtd, status, x = {}) => ({
      id: uid(), nome, cliente: 'Prudential', categoria, tipo, descricao: x.descricao || '', qtd,
      recebimento: '', entrega: x.entrega || '', mesRef: M, respInterno: '', respAprov: '',
      prioridade: 'Média', status, briefing: '', arquivos: '', obs: x.obs || '',
      contrato: { modo: x.modo || 'auto', campanha: x.campanha || '' },
      statusDesde: now, historico: [{ ts: now, txt: 'Importado do levantamento de pedidos de novembro' }]
    });
    const AG = 'Vídeos campanha agenciamento Corretor';
    return {
      v: 2, exemplo: false,
      settings: { regra: 'enviada', limites: { geral: 50, feed: 6, stories: 4 }, diasParada: 3, diasPrazo: 2 },
      recorrentes: [
        { id: uid(), titulo: 'Reunião de resultados do Instagram', tipo: 'reuniao', semana: 5 },
        { id: uid(), titulo: 'Enviar e-mail com reporte semanal', tipo: 'relatorio', semana: 5 },
        { id: uid(), titulo: 'Enviar One-Pager semanal ao cliente', tipo: 'relatorio', semana: 5 },
        { id: uid(), titulo: 'Planejar calendário do Instagram do mês seguinte', tipo: 'planejamento', mes: 20 }
      ],
      reunioes: [],
      demandas: [
        D('Régua Unicred', 'Réguas', 'WhatsApp', 3, 'Concluído', { descricao: '3 peças de WhatsApp' }),
        D('Régua Passaporte Prudential — Peça 1', 'Réguas', 'Peça estática', 1, 'Peça enviada', { descricao: 'Régua com 2 peças' }),
        D('Régua Passaporte Prudential — Peça 2', 'Réguas', 'Peça estática', 1, 'Em pauta', { descricao: 'Régua com 2 peças', obs: 'Status da peça 2 a confirmar' }),
        D('Comunicação CNP', 'Demandas avulsas', 'WhatsApp', 4, 'Concluído', { descricao: '3 peças diferentes de WhatsApp + 1 PDF' }),
        D('Cobertura Cônjuge', 'Demandas avulsas', 'WhatsApp', 7, 'Texto em aprovação', { descricao: '6 peças diferentes de WhatsApp + 1 e-mail' }),
        D('Atualização DG Vitalício Itaú', 'Demandas avulsas', 'WhatsApp', 5, 'Concluído', { descricao: '2 peças de WhatsApp + 1 peça de e-mail + 1 roteiro + edição de vídeo' }),
        D('Painel recepção — Premiação Top Tri Prudential', 'Demandas avulsas', 'Vídeo', 1, 'Concluído', { descricao: '1 vídeo para o telão de recepção' }),
        D('Material para Aniversários', 'Demandas avulsas', 'E-mail marketing', 1, 'Concluído', { descricao: '1 peça de e-mail' }),
        D('Campanha Comissão Adicional — Lançamento', 'Campanhas', 'Peça estática', 1, 'Peça enviada', { campanha: '' }),
        D('Campanha Comissão Adicional — Reforço', 'Campanhas', 'Peça estática', 1, 'Texto em aprovação'),
        D('Campanha Comissão Adicional — Reta final', 'Campanhas', 'Peça estática', 1, 'Texto em aprovação', { descricao: 'Peça de reta final para dezembro' }),
        D('Vídeo Mass Lean', 'Vídeos', 'Vídeo', 1, 'Concluído', { descricao: '1 vídeo completo' }),
        D('Agenciamento Corretor — Fórmula 1 | “Acelerando o agenciamento”', 'Vídeos', 'Vídeo', 1, 'Peça enviada', { descricao: AG }),
        D('Agenciamento Corretor — Natal | “O presente chegou mais cedo”', 'Vídeos', 'Vídeo', 1, 'Peça enviada', { descricao: AG }),
        D('Agenciamento Corretor — vídeo extra', 'Vídeos', 'Vídeo', 1, 'Peça enviada', { descricao: AG }),
        D('Agenciamento Corretor — “Erro de cálculo”', 'Vídeos', 'Vídeo', 1, 'Peça enviada', { descricao: AG }),
        D('Agenciamento Corretor — Pegadinha | “De novo 100%?”', 'Vídeos', 'Vídeo', 1, 'Em pauta', { descricao: AG }),
        D('Conecta PEM — News 22', 'News', 'E-mail marketing', 4, 'Concluído', { descricao: 'News 22 + 3 cards extras', obs: 'O Feed Troféu JRS está contabilizado no Instagram (06/11)' }),
        D('Conecta PEM — News 23', 'News', 'E-mail marketing', 1, 'Concluído'),
        D('Conecta PEM — News 25', 'News', 'E-mail marketing', 1, 'Em pauta', { obs: 'Em aberto' }),
        D('Prudential Partners News — News 10', 'News', 'E-mail marketing', 1, 'Concluído', { descricao: '3 versões diferentes' }),
        D('Feed Monte Bravo', 'Instagram', 'Feed · Peça única', 1, 'Concluído', { entrega: '2026-11-03', obs: 'Postado' }),
        D('Story Monte Bravo', 'Instagram', 'Stories · Campanha', 1, 'Concluído', { entrega: '2026-11-03', campanha: 'Monte Bravo', obs: 'Postado' }),
        D('Carrossel Passaporte Prudential', 'Instagram', 'Feed · Carrossel', 1, 'Cancelado', { entrega: '2026-11-05' }),
        D('Feed Troféu JRS', 'Instagram', 'Feed · Peça única', 1, 'Concluído', { entrega: '2026-11-06', obs: 'Postado' }),
        D('Feed Novembro Azul', 'Instagram', 'Feed · Peça única', 1, 'Concluído', { entrega: '2026-11-10', obs: 'Postado' }),
        D('Story Novembro Azul', 'Instagram', 'Stories · Campanha', 1, 'Concluído', { entrega: '2026-11-10', campanha: 'Novembro Azul', obs: 'Postado' }),
        D('Trend', 'Instagram', 'Feed · Trend', 1, 'Em produção de DA', { entrega: '2026-11-12' }),
        D('Documentário TOP27', 'Instagram', 'Feed · Reels', 1, 'Em produção de Motion', { entrega: '2026-11-18' }),
        D('Carrossel Passaporte Prudential — mecânica 3 carimbos', 'Instagram', 'Feed · Carrossel', 1, 'Em pauta', { entrega: '2026-11-26' }),
        D('Story Passaporte Prudential — mecânica 3 carimbos', 'Instagram', 'Stories · Campanha', 1, 'Em pauta', { entrega: '2026-11-26', campanha: 'Passaporte 3 carimbos' })
      ]
    };
  }

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
  if (!data || !data.demandas || (data.exemplo && (data.v || 1) < 2)) data = seed();
  if ((data.v || 1) < 3) {
    const now = Date.now();
    data.demandas = data.demandas.map(d => d.status === 'Peça enviada' ? { ...d, status: 'Concluído', statusDesde: now, historico: [{ ts: now, txt: 'Status: Peça enviada → Concluído' }, ...(d.historico || [])] } : d);
    data.v = 3;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { }
  }
  if (!data.recorrentes.some(x => x.id === 'daily')) {
    data.recorrentes.unshift({ id: 'daily', titulo: 'Daily · alinhamento de pauta da semana', tipo: 'reuniao', semanas: [1, 5], hora: '10:30', link: '', excecoes: [] });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { }
  }
  if (!data.reguas) {
    data.reguas = [
      { id: uid(), nome: 'Régua Unicred', chave: 'Unicred', descricao: '', inicio: '', fim: '2026-12-31', kv: '', ppt: '', pasta: '', obs: '' },
      { id: uid(), nome: 'Régua Passaporte Prudential', chave: 'Passaporte', descricao: '', inicio: '', fim: '2026-12-31', kv: '', ppt: '', pasta: '', obs: '' },
      { id: uid(), nome: 'Régua TOP27', chave: 'TOP27', descricao: '', inicio: '', fim: '2027-05-31', kv: '', ppt: '', pasta: '', obs: '' }
    ];
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { }
  }
  const subs = new Set();
  const commit = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { alert('Não foi possível salvar: o espaço de armazenamento do navegador está cheio. Use imagens menores ou exporte um backup.'); } subs.forEach(f => { try { f(); } catch (e) { console.error(e); } }); };

  const statusMeta = n => STATUS.find(s => s.nome === n) || STATUS[0];
  const mesRef = d => d.mesRef || monthOf(d.entrega) || monthOf(d.recebimento);
  const bucketOf = d => d.categoria === 'Instagram' ? ((d.tipo || '').startsWith('Stories') ? 'stories' : 'feed') : 'geral';
  const atrasada = d => !!d.entrega && d.entrega < today() && !G.fechado.includes(d.status);
  const prazoProximo = d => !!d.entrega && !G.fechado.includes(d.status) && diffDays(d.entrega, today()) >= 0 && diffDays(d.entrega, today()) <= data.settings.diasPrazo;
  const diasNoStatus = d => Math.floor((Date.now() - (d.statusDesde || Date.now())) / 864e5);
  const parada = d => G.aguardandoCliente.includes(d.status) && diasNoStatus(d) >= data.settings.diasParada;
  const stageOk = (s, regra) => regra === 'producao' ? statusMeta(s).i >= statusMeta('Em produção de DA').i : regra === 'enviada' ? ['Peça enviada', 'Concluído'].includes(s) : s === 'Concluído';
  // situação contratual: 'contabilizada' | 'prevista' | 'nao'
  function situacao(d) {
    const modo = (d.contrato || {}).modo || 'auto';
    if (modo === 'nao') return 'nao';
    if (d.status === 'Cancelado') return modo === 'sim' ? 'contabilizada' : 'nao';
    return stageOk(d.status, data.settings.regra) ? 'contabilizada' : 'prevista';
  }
  function contrato(mes) {
    const L = data.settings.limites, out = {};
    const list = data.demandas.filter(d => mesRef(d) === mes);
    ['geral', 'feed', 'stories'].forEach(b => {
      const itens = list.filter(d => bucketOf(d) === b).map(d => ({ d, sit: situacao(d) }));
      let usado = 0, previsto = 0;
      if (b === 'stories') {
        const groups = {};
        itens.filter(x => x.sit !== 'nao').forEach(x => { const k = (x.d.contrato.campanha || '').trim().toLowerCase() || x.d.id; (groups[k] = groups[k] || []).push(x); });
        Object.values(groups).forEach(g => { if (g.some(x => x.sit === 'contabilizada')) usado++; else previsto++; });
        out[b] = { grupos: groups };
      } else {
        itens.forEach(x => { if (x.sit === 'contabilizada') usado += +x.d.qtd || 0; else if (x.sit === 'prevista') previsto += +x.d.qtd || 0; });
        out[b] = {};
      }
      const limite = L[b];
      Object.assign(out[b], { limite, usado, previsto, comprometido: usado + previsto, restante: limite - usado, livre: limite - usado - previsto, pct: limite ? Math.round(usado / limite * 100) : 0, pctComp: limite ? Math.round((usado + previsto) / limite * 100) : 0, itens });
    });
    out.total = { limite: L.geral + L.feed + L.stories, usado: out.geral.usado + out.feed.usado + out.stories.usado, previsto: out.geral.previsto + out.feed.previsto + out.stories.previsto };
    out.total.restante = out.total.limite - out.total.usado;
    return out;
  }
  const BN = { geral: 'peças gerais', feed: 'peças de feed', stories: 'unidades de stories' };
  function alertas() {
    const a = [], ds = data.demandas;
    ds.filter(atrasada).forEach(d => a.push({ nivel: 'erro', tipo: 'Atrasada', txt: d.nome, sub: 'Entrega era ' + fmt(d.entrega) + ' · ' + statusMeta(d.status).curto, id: d.id }));
    ds.filter(prazoProximo).forEach(d => a.push({ nivel: 'aviso', tipo: 'Prazo próximo', txt: d.nome, sub: (diffDays(d.entrega, today()) === 0 ? 'Entrega hoje' : 'Entrega ' + fmt(d.entrega)) + ' · ' + statusMeta(d.status).curto, id: d.id }));
    ds.filter(parada).forEach(d => a.push({ nivel: 'aviso', tipo: 'Parada', txt: d.nome, sub: diasNoStatus(d) + ' dias em "' + statusMeta(d.status).curto + '"', id: d.id }));
    const c = contrato(monthOf(today()));
    ['geral', 'feed', 'stories'].forEach(b => {
      const x = c[b];
      if (x.comprometido > x.limite) a.push({ nivel: 'erro', tipo: 'Contrato', txt: 'Limite de ' + BN[b] + ' ultrapassado', sub: x.comprometido + ' de ' + x.limite + ' (contabilizadas + previstas)', mod: 'contrato' });
      else if (x.comprometido >= x.limite * 0.8) a.push({ nivel: 'aviso', tipo: 'Contrato', txt: 'Limite de ' + BN[b] + ' próximo', sub: x.comprometido + ' de ' + x.limite + ' comprometidas', mod: 'contrato' });
    });
    Object.keys(data.ig || {}).forEach(m => igMes(m).etapas.forEach(e => { if (e.prazo && e.prazo < today() && e.status !== 'Concluída') a.push({ nivel: 'erro', tipo: 'Instagram', txt: 'Etapa atrasada: ' + e.nome, sub: 'Calendário de ' + monthLabel(m) + ' · prazo ' + fmt(e.prazo), mod: 'instagram' }); }));
    const wd = new Date(today() + 'T12:00').getDay(), ws = weekStart(today());
    if ((wd === 4 || wd === 5) && !(data.onepagers || []).some(o => o.status === 'Enviado' && o.semana === ws)) a.push({ nivel: 'aviso', tipo: 'One-Pager', txt: 'One-Pager da semana ainda não enviado', sub: 'Semana de ' + fmt(ws), mod: 'onepager' });
    const dm = +today().slice(8, 10);
    if (dm >= 15 && dm <= 20) a.push({ nivel: 'aviso', tipo: 'Instagram', txt: 'Calendário do mês seguinte vence dia 20', sub: 'Planejamento de ' + monthLabel(shiftMonth(monthOf(today()), 1)), mod: 'instagram' });
    return a;
  }
  function compromissos(de, ate) {
    const out = [];
    for (let d = de; d <= ate; d = addDays(1, d)) {
      const x = new Date(d + 'T12:00');
      data.recorrentes.forEach(r => { if ((r.excecoes || []).includes(d)) return; if ((r.semana != null && x.getDay() === r.semana) || ((r.semanas || []).includes(x.getDay())) || (r.mes != null && x.getDate() === r.mes)) out.push({ ...r, rid: r.id, data: d, recorrente: true }); });
    }
    data.reunioes.filter(r => r.data >= de && r.data <= ate).forEach(r => out.push({ ...r, tipo: 'reuniao' }));
    return out.sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')));
  }
  const LABELS = { nome: 'Nome', categoria: 'Categoria', tipo: 'Tipo de material', descricao: 'Descrição', qtd: 'Quantidade de peças', recebimento: 'Recebimento', entrega: 'Entrega', mesRef: 'Mês de referência', respInterno: 'Responsável interno', respAprov: 'Aprovação', prioridade: 'Prioridade', status: 'Status', briefing: 'Link do briefing', arquivos: 'Link dos arquivos', obs: 'Observações', cliente: 'Cliente' };

  const ETAPAS_IG = ['Planejamento estratégico', 'Alinhamento com o cliente', 'Definição das campanhas e datas', 'Envio do calendário para aprovação', 'Aprovação do calendário', 'Produção dos textos', 'Envio dos textos para aprovação', 'Aprovação dos textos', 'Abertura dos cards para DA', 'Produção das peças', 'Aprovação final', 'Programação e publicação'];
  const ALINHAMENTO = [['campanhas', 'Campanhas do mês'], ['datas', 'Datas importantes'], ['temas', 'Temas'], ['formatos', 'Formatos de publicação'], ['tendencias', 'Possíveis tendências'], ['eventos', 'Eventos'], ['livres', 'Datas livres'], ['prioridades', 'Prioridades comerciais']];
  const REF_IG = {
    '2026-11': {
      titulo: 'Prudential · Calendário de conteúdo · Sugestão',
      tags: { 'TOP 27': ['#2F5BD3', '#E8EEFC'], 'Passaporte': ['#1F7A3A', '#E3F4E8'], 'Produto': ['#7A3FB8', '#F1E9FA'], 'Efeméride': ['#B3470C', '#FDEBDD'], 'Trend': ['#5F6470', '#EEF0F3'] },
      legenda: [['TOP 27', '5 posts'], ['Passaporte', '2 posts'], ['Produto', '2 posts'], ['Efeméride', '2 posts'], ['Trend', '1 post']],
      dias: {
        2: { nota: 'Finados · sem post' },
        3: { grupo: 'Efeméride', tag: 'Efeméride', titulo: 'Novembro Azul', txt: 'Cuidar da saúde também é planejamento. Abertura do mês com o laço azul e convite para o parceiro levar o tema para a conversa com clientes, de forma leve e sem alarmismo.', formato: 'Estático · Feed + Stories' },
        4: { grupo: 'TOP 27', tag: 'TOP 27 · Sustentação', titulo: 'Novembro é o mês da virada', txt: 'Reel com cortes rápidos de Boston e a pergunta: “Quanto falta para você?”. Lembrar prazo e critérios da campanha em tela final.', formato: 'Reel · Feed + Stories' },
        6: { grupo: 'Passaporte', tag: 'Passaporte · Prêmios', titulo: 'Quem recebeu em outubro', txt: 'Mosaico com fotos reais de parceiros recebendo os prêmios do mês anterior. CTA: “O próximo pode ser seu.”', formato: 'Carrossel · Feed + Stories + Whats' },
        9: { grupo: 'Produto', tag: 'Produto', titulo: 'Doenças graves: a cobertura que entra na conversa', txt: 'Gancho com Novembro Azul: como apresentar a cobertura para doenças graves ao cliente. Roteiro de 3 perguntas para abrir o assunto.', formato: 'Carrossel · Feed + Stories' },
        11: { grupo: 'TOP 27', tag: 'TOP 27 · Sustentação', titulo: 'Checklist para Boston', txt: 'Stories interativos em formato de checklist: passaporte ✓, mala ✓, roteiro ✓, meta batida ☐. Enquete: “Em qual item você está?”', formato: 'Stories interativos' },
        13: { grupo: 'Trend', tag: 'Trend', titulo: 'Trend da semana', txt: 'Adaptar um viral da semana ao universo do corretor (rotina, metas, reunião com cliente). Definir na pauta do dia 10.', formato: 'Feed' },
        15: { nota: 'Proclamação da República · sem post' },
        17: { grupo: 'Produto', tag: 'Produto', titulo: 'Sucessão empresarial: pessoa-chave', txt: 'Continuação da pauta de outubro. “Quem é a pessoa que sua empresa não pode perder?” Explicar o seguro de pessoa-chave com um caso simples de sócio e operação.', formato: 'Feed + Stories' },
        18: { grupo: 'TOP 27', tag: 'TOP 27 · Sustentação', titulo: 'Quem já foi conta', txt: 'Depoimento curto de um parceiro que já participou de uma viagem de reconhecimento: o que mais marcou e o que fez a diferença para chegar lá.', formato: 'Reel + desdobrar em Stories' },
        19: { grupo: 'Passaporte', tag: 'Passaporte · Sustentação', titulo: 'A mecânica em 3 carimbos', txt: 'Explicar a campanha como um passaporte sendo carimbado: venda, avanço, prêmio. Antecipado para quinta por causa do feriado de sexta.', formato: 'Carrossel · Feed + Stories + Whats' },
        23: { grupo: 'Efeméride', tag: 'Efeméride', titulo: 'Novembro Azul: como falar com o cliente', txt: 'Conteúdo para o parceiro compartilhar: frases prontas para abordar saúde do homem com clientes sem soar comercial.', formato: 'Carrossel · Feed + Stories' },
        25: { grupo: 'TOP 27', tag: 'TOP 27 · Sustentação', titulo: 'Thanksgiving em Boston', txt: 'Gancho com o feriado americano (26/11): como Boston celebra o Thanksgiving. No fim: “Gratidão pelo caminho até aqui. Agora, a reta final do TOP27.”', formato: 'Stories' },
        30: { grupo: 'TOP 27', tag: 'TOP 27 + Pietro', titulo: 'Pietro fecha a mala', txt: 'Continuação do “Arrume a mala” de outubro: Pietro fecha a mala e faz o balanço do mês. Pergunta final: “E a sua, já está pronta?”', formato: 'Reel · Feed + Stories' }
      },
      notas: [['Frequência', 'TOP 27 toda quarta (+ fechamento dia 30). Passaporte Prudential a cada 15 dias, sempre com versão para WhatsApp.'], ['Produto', 'Doenças graves (gancho Novembro Azul) e pessoa-chave (continuação de sucessão empresarial).'], ['Efemérides', 'Novembro Azul (3 e 23) e Thanksgiving em Boston (26, via TOP 27). Finados e 15/11 sem post.']]
    }
  };
  function igMes(m) {
    data.ig = data.ig || {};
    const x = data.ig[m] || {};
    return { aprovacao: x.aprovacao || 'Não enviado', aprovadoEm: x.aprovadoEm || '', alinhamento: x.alinhamento || {}, etapas: ETAPAS_IG.map((nome, i) => ({ nome, status: 'Pendente', prazo: '', ...((x.etapas || [])[i] || {}) })) };
  }

  function snapshotOP(mes) {
    const C = contrato(mes), ds = data.demandas.filter(d => mesRef(d) === mes), t = today();
    const geral = C.geral.comprometido, ig = C.feed.comprometido + C.stories.comprometido, limite = C.total.limite;
    const isIG = d => d.categoria === 'Instagram';
    const badge = d => {
      if (d.status === 'Concluído') return [isIG(d) ? 'Postado' : 'Concluído', 'ok'];
      if (d.status === 'Peça enviada') return ['Enviado', 'ok'];
      if (d.status === 'Cancelado') return ['Cancelado', 'err'];
      if (d.entrega && !isIG(d)) return ['Entrega: ' + d.entrega.slice(8, 10) + '/' + d.entrega.slice(5, 7), 'info'];
      return [statusMeta(d.status).curto, 'info'];
    };
    const det = d => d.descricao || ((+d.qtd || 0) + ((+d.qtd === 1) ? ' peça' : ' peças'));
    const group = list => {
      const g = {}, order = [];
      list.forEach(d => { const k = d.nome.includes(' — ') ? d.nome.split(' — ')[0] : d.nome; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(d); });
      return order.map(k => g[k].length === 1
        ? { titulo: g[k][0].nome, multi: false, det: det(g[k][0]), badge: badge(g[k][0]) }
        : { titulo: k, multi: true, linhas: g[k].map(d => { const sub = d.nome.split(' — ').slice(1).join(' — ') || d.nome; const ds = (d.descricao || '').trim(); return { txt: ds && ds !== sub && !ds.startsWith('Régua com') && !ds.startsWith('Vídeos campanha') ? (ds.startsWith(sub) ? ds : sub + ' - ' + ds) : sub, badge: badge(d) }; }) });
    };
    const reguas = group(ds.filter(d => d.categoria === 'Réguas'));
    const outros = group(ds.filter(d => !['Réguas', 'News', 'Instagram'].includes(d.categoria)));
    const news = group(ds.filter(d => d.categoria === 'News'));
    const igs = ds.filter(isIG).slice().sort((a, b) => (a.entrega || '9999').localeCompare(b.entrega || '9999'));
    const base = n => n.split(' ').slice(1).join(' ');
    const igRows = [];
    igs.forEach(d => {
      const prev = igRows.find(r => r.entrega === d.entrega && r.base === base(d.nome) && r.status === d.status);
      if (prev) prev.formatos.push(d.nome.split(' ')[0]);
      else igRows.push({ entrega: d.entrega, base: base(d.nome), status: d.status, formatos: [d.nome.split(' ')[0]], badge: badge(d) });
    });
    const instagram = igRows.map(r => ({ txt: (r.entrega ? r.entrega.slice(8, 10) + '/' + r.entrega.slice(5, 7) + ' - ' : '') + r.formatos.join(' + ') + ' ' + r.base, badge: r.status === 'Concluído' || r.status === 'Cancelado' ? r.badge : null }));
    const sum = st => ds.filter(d => st.includes(d.status)).reduce((n, d) => n + (+d.qtd || 0), 0);
    return {
      mes, atualizado: t, limite, geral, ig, aberta: limite - geral - ig,
      reguas, avulsos: outros.filter(x => !x.multi), grupos: outros.filter(x => x.multi), news, instagram,
      semana: { concluidas: sum(['Concluído']), enviadas: sum(['Peça enviada']), producao: sum(G.producao), aprovacao: ds.filter(d => G.aprovacao.includes(d.status)).length, pendencias: ds.filter(d => d.status === 'Aguardando briefing ou informações' || d.status === 'Ajustes solicitados').length, proximas: data.demandas.filter(d => d.entrega >= t && d.entrega <= addDays(7) && !G.fechado.includes(d.status)).map(d => d.nome) }
    };
  }

  const api = {
    snapshotOP,
    demandasDaRegua(r) { const ks = (r.chave || '').split(',').map(k => k.trim().toLowerCase().replace(/\s+/g, '')).filter(Boolean); if (!ks.length) return []; return data.demandas.filter(d => { const n = d.nome.toLowerCase().replace(/\s+/g, ''); return ks.some(k => n.includes(k)); }); },
    salvarRegua(r) { if (r.id) data.reguas = data.reguas.map(x => x.id === r.id ? { ...x, ...r } : x); else { r = { ...r, id: uid() }; data.reguas.push(r); } try { commit(); } catch (e) { } return r.id; },
    excluirRegua(id) { data.reguas = data.reguas.filter(x => x.id !== id); commit(); },
    salvarOP(op) { data.onepagers = data.onepagers || []; if (op.id) data.onepagers = data.onepagers.map(x => x.id === op.id ? { ...x, ...op } : x); else { op = { ...op, id: uid(), ts: Date.now() }; data.onepagers.unshift(op); } commit(); return op.id; },
    excluirOP(id) { data.onepagers = (data.onepagers || []).filter(x => x.id !== id); commit(); },
    ETAPAS_IG, ALINHAMENTO, REF_IG, igMes,
    setIg(m, patch) { data.ig = data.ig || {}; const cur = igMes(m); data.ig[m] = { ...cur, ...patch }; commit(); },
    STATUS, SN, G, CATEGORIAS, TIPOS, TIPOS_IG, PRIORIDADES, RESP, APROV, REGRAS, MESES,
    ymd, today, addDays, diffDays, monthOf, monthLabel, shiftMonth, fmt, fmtLong, uid, weekStart,
    statusMeta, mesRef, bucketOf, atrasada, prazoProximo, parada, diasNoStatus, situacao, contrato, alertas, compromissos,
    get: () => data,
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    novaDemanda(p = {}) {
      return { id: '', nome: '', cliente: 'Prudential', categoria: 'Demandas avulsas', tipo: 'Peça estática', descricao: '', qtd: 1, recebimento: today(), entrega: '', mesRef: '', respInterno: '', respAprov: '', prioridade: 'Média', status: 'Nova demanda', briefing: '', arquivos: '', obs: '', contrato: { modo: 'auto', campanha: '' }, historico: [], ...p };
    },
    salvarDemanda(f) {
      const now = Date.now();
      if (!f.id) {
        const d = { ...f, id: uid(), statusDesde: now, historico: [{ ts: now, txt: 'Demanda cadastrada · status "' + f.status + '"' }] };
        data.demandas.unshift(d); commit(); return d.id;
      }
      data.demandas = data.demandas.map(d => {
        if (d.id !== f.id) return d;
        const ch = [];
        Object.keys(LABELS).forEach(k => { if (String(d[k] ?? '') !== String(f[k] ?? '')) ch.push(k === 'status' ? 'Status: ' + d.status + ' → ' + f.status : ['descricao', 'obs'].includes(k) ? LABELS[k] + ' atualizada' : LABELS[k] + ': ' + (d[k] || '—') + ' → ' + (f[k] || '—')); });
        if (d.contrato.modo !== f.contrato.modo) ch.push('Contrato: ' + d.contrato.modo + ' → ' + f.contrato.modo);
        if ((d.contrato.campanha || '') !== (f.contrato.campanha || '')) ch.push('Campanha de stories: ' + (f.contrato.campanha || '—'));
        const n = { ...d, ...f, historico: [...ch.map(txt => ({ ts: now, txt })), ...d.historico] };
        if (d.status !== f.status) n.statusDesde = now;
        return n;
      });
      commit(); return f.id;
    },
    setStatus(id, s) { const d = data.demandas.find(x => x.id === id); if (d && d.status !== s) api.salvarDemanda({ ...d, status: s }); },
    setContratoModo(id, modo) { const d = data.demandas.find(x => x.id === id); if (d) api.salvarDemanda({ ...d, contrato: { ...d.contrato, modo } }); },
    excluirDemanda(id) { data.demandas = data.demandas.filter(d => d.id !== id); commit(); },
    setSettings(p) { data.settings = { ...data.settings, ...p }; commit(); },
    addReuniao(r) { data.reunioes.push({ id: uid(), ...r }); commit(); },
    salvarReuniao(r) { if (r.id) data.reunioes = data.reunioes.map(x => x.id === r.id ? { ...x, ...r } : x); else data.reunioes.push({ ...r, id: uid() }); commit(); },
    salvarRecorrente(id, p) { data.recorrentes = data.recorrentes.map(x => x.id === id ? { ...x, ...p } : x); commit(); },
    addRecorrente(p) { data.recorrentes.push({ id: uid(), tipo: 'reuniao', excecoes: [], ...p }); commit(); },
    excluirRecorrente(id) { data.recorrentes = data.recorrentes.filter(x => x.id !== id); commit(); },
    pularOcorrencia(id, d) { data.recorrentes = data.recorrentes.map(x => x.id === id ? { ...x, excecoes: [...(x.excecoes || []), d] } : x); commit(); },
    removeReuniao(id) { data.reunioes = data.reunioes.filter(r => r.id !== id); commit(); },
    limparExemplo() { data = { ...seed(), exemplo: false, demandas: [], reunioes: [] }; commit(); },
    restaurarExemplo() { data = seed(); commit(); },
    exportar() { return JSON.stringify(data, null, 2); },
    importar(json) { const d = JSON.parse(json); if (!d.demandas) throw new Error('Arquivo inválido'); data = d; commit(); }
  };
  window.DigiStore = api;
})();

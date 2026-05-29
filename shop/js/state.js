(function () {
  const STORAGE_KEY = "techzone_state_v4";
  const ESTOQUE_BAIXO = 5;
  const EMAIL_REGEX = /^[a-z0-9._%+-]+@(gmail|hotmail|outlook|live|yahoo|icloud)\.com(\.br)?$/i;
  const PHONE_REGEX = /^\(\d{2}\)\s9\d{4}-\d{4}$/;

  const shippingOptions = [
    { id: "padrao", nome: "Entrega padrão", prazo: "5 a 7 dias úteis", valor: 19.9 },
    { id: "expresso", nome: "Entrega expressa", prazo: "2 a 3 dias úteis", valor: 34.9 },
    { id: "retirada", nome: "Retirada na loja", prazo: "Disponível em 1 dia útil", valor: 0 }
  ];

  const defaultState = {
    clientes: [
      {
        id: 1,
        nome: "Cliente Padrão",
        email: "cliente@gmail.com",
        telefone: "(11) 99999-9999",
        usuario: "cliente",
        senha: "123",
        saldo: 500
      }
    ],
    produtos: [
      {
        id: 1,
        nome: "Mouse Gamer RGB",
        descricao: "Mouse gamer de alta precisão com sensor óptico de 16000 DPI, iluminação RGB personalizável e design ergonômico para sessões longas.",
        descricao_completa: "Projetado para jogos competitivos e uso diário, o Mouse Gamer RGB combina sensor de alta precisão, ajuste rápido de DPI e botões programáveis. A construção leve melhora a resposta nos movimentos rápidos e o acabamento texturizado ajuda na pegada.",
        preco: 99.9,
        quantidade: 10,
        imagem: "images/mouse.jpg",
        especificacoes: ["16000 DPI", "6 botões", "RGB configurável", "USB 2.0", "Cabo de 1,8 m", "Garantia de 12 meses"]
      },
      {
        id: 2,
        nome: "Teclado Mecânico",
        descricao: "Teclado mecânico ABNT2 com switches blue, iluminação por tecla, anti-ghosting e estrutura reforçada.",
        descricao_completa: "Um teclado mecânico robusto para digitação precisa e jogos. Os switches blue entregam resposta tátil clara, enquanto o anti-ghosting evita falhas em comandos simultâneos. O layout ABNT2 facilita o uso em português.",
        preco: 249.9,
        quantidade: 4,
        imagem: "images/keyboard.jpg",
        especificacoes: ["Switch blue", "Layout ABNT2", "Anti-ghosting", "Iluminação RGB", "Base reforçada", "Teclas removíveis"]
      },
      {
        id: 3,
        nome: "Headset Pro 7.1",
        descricao: "Headset gamer com som surround virtual 7.1, microfone removível e almofadas com espuma de memória.",
        descricao_completa: "O Headset Pro 7.1 entrega imersão para jogos, reuniões e streaming. O microfone removível tem cancelamento de ruído e as almofadas reduzem fadiga em uso prolongado.",
        preco: 179.9,
        quantidade: 8,
        imagem: "images/headset.jpg",
        especificacoes: ["Som 7.1 virtual", "Microfone removível", "Conexão USB", "Espuma de memória", "Controle no cabo", "Compatível com PC"]
      },
      {
        id: 4,
        nome: "Monitor Curvo 27\"",
        descricao: "Monitor curvo de 27 polegadas com painel QHD, 165Hz, 1ms e alta fluidez para jogos e produtividade.",
        descricao_completa: "A tela curva aumenta a sensação de imersão e a resolução QHD oferece mais área útil para trabalho e jogos. A taxa de 165Hz com tempo de resposta de 1ms reduz borrões em cenas rápidas.",
        preco: 1499.9,
        quantidade: 2,
        imagem: "images/monitor.jpg",
        especificacoes: ["27 polegadas", "QHD", "165Hz", "1ms", "Curvatura 1500R", "HDMI e DisplayPort"]
      },
      {
        id: 5,
        nome: "Mousepad RGB XL",
        descricao: "Mousepad estendido com borda RGB, superfície de microtecido e base antiderrapante.",
        descricao_completa: "Com área ampla para teclado e mouse, o Mousepad RGB XL organiza o setup e oferece superfície consistente para sensores ópticos. A base emborrachada evita deslocamentos durante movimentos intensos.",
        preco: 89.9,
        quantidade: 15,
        imagem: "images/mousepad.jpg",
        especificacoes: ["900 x 400 mm", "Borda RGB", "Microtecido", "Base antiderrapante", "Controle por botão", "Cabo removível"]
      },
      {
        id: 6,
        nome: "Webcam Full HD",
        descricao: "Webcam 1080p com ring light integrado, autofoco, microfone duplo e instalação plug-and-play.",
        descricao_completa: "Ideal para aulas, reuniões e transmissões, a Webcam Full HD melhora a imagem em ambientes de baixa luz com ring light integrado. O microfone duplo ajuda a captar voz com mais clareza.",
        preco: 199.9,
        quantidade: 0,
        imagem: "images/webcam.jpg",
        especificacoes: ["1080p", "Ring light", "Autofoco", "Microfone duplo", "Plug-and-play", "Clipe universal"]
      }
    ],
    carrinho: [],
    pedidos: [],
    pagamentos: [],
    vendas: [],
    chamados: [],
    avaliacoes: [],
    currentUser: null,
    counters: {
      cliente: 2,
      produto: 7,
      pedido: 1,
      pagamento: 1,
      venda: 1,
      chamado: 1,
      avaliacao: 1
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);

    try {
      const parsed = JSON.parse(raw);
      return {
        ...clone(defaultState),
        ...parsed,
        counters: { ...defaultState.counters, ...(parsed.counters || {}) }
      };
    } catch (error) {
      console.warn("Estado local inválido. Criando uma base nova.", error);
      return clone(defaultState);
    }
  }

  const state = loadState();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function getCurrentUser() {
    if (!state.currentUser) return null;
    if (state.currentUser.role === "admin") return state.currentUser;
    const cliente = state.clientes.find((item) => item.id === state.currentUser.id);
    return cliente ? { ...cliente, role: "client" } : null;
  }

  function isAdmin() {
    return Boolean(state.currentUser && state.currentUser.role === "admin");
  }

  function currentClientId() {
    const user = getCurrentUser();
    return user && user.role === "client" ? user.id : null;
  }

  function requireClient() {
    const user = getCurrentUser();
    if (!user || user.role !== "client") {
      window.location.href = "login.html";
      return null;
    }
    return user;
  }

  function requireStoreAccess() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return null;
    }
    return user;
  }

  function requireAdmin() {
    if (!isAdmin()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  function login(usuario, senha) {
    if (usuario === "adm" && senha === "123") {
      state.currentUser = { role: "admin", usuario: "adm" };
      save();
      return { ok: true, redirect: "admin.html" };
    }

    const cliente = state.clientes.find((item) => item.usuario === usuario && item.senha === senha);
    if (!cliente) return { ok: false, message: "Usuário ou senha incorretos." };

    state.currentUser = { role: "client", id: cliente.id };
    save();
    return { ok: true, redirect: "catalogo.html" };
  }

  function registerClient(data) {
    const nome = data.nome.trim();
    const email = data.email.trim();
    const telefone = data.telefone.trim();
    const usuario = data.usuario.trim();
    const senha = data.senha.trim();
    const saldo = Number(data.saldo || 0);

    if (!nome || !email || !telefone || !usuario || !senha) {
      return { ok: false, message: "Preencha todos os campos obrigatórios." };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { ok: false, message: "Use um e-mail válido de provedor conhecido, como Gmail, Hotmail ou Outlook." };
    }

    if (!PHONE_REGEX.test(telefone)) {
      return { ok: false, message: "Use o telefone no formato (11) 99999-9999." };
    }

    if (usuario.toLowerCase() === "adm" || state.clientes.some((item) => item.usuario === usuario)) {
      return { ok: false, message: "Este usuário já está em uso." };
    }

    const cliente = {
      id: state.counters.cliente++,
      nome,
      email,
      telefone,
      usuario,
      senha,
      saldo: roundMoney(Math.max(0, saldo))
    };

    state.clientes.push(cliente);
    state.currentUser = { role: "client", id: cliente.id };
    save();
    return { ok: true, redirect: "catalogo.html" };
  }

  function updateClientAccount(data) {
    const cliente = getClient(currentClientId());
    if (!cliente) return { ok: false, message: "Sessão expirada. Faça login novamente." };

    const nome = data.nome.trim();
    const email = data.email.trim();
    const telefone = data.telefone.trim();
    const usuario = data.usuario.trim();
    const senha = data.senha.trim();

    if (!nome || !email || !telefone || !usuario) {
      return { ok: false, message: "Preencha nome, e-mail, telefone e usuário." };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { ok: false, message: "Use um e-mail válido de provedor conhecido, como Gmail, Hotmail ou Outlook." };
    }

    if (!PHONE_REGEX.test(telefone)) {
      return { ok: false, message: "Use o telefone no formato (11) 99999-9999." };
    }

    if (usuario.toLowerCase() === "adm" || state.clientes.some((item) => item.usuario === usuario && item.id !== cliente.id)) {
      return { ok: false, message: "Este usuário já está em uso." };
    }

    cliente.nome = nome;
    cliente.email = email;
    cliente.telefone = telefone;
    cliente.usuario = usuario;
    if (senha) cliente.senha = senha;
    save();
    return { ok: true, message: "Conta atualizada com sucesso." };
  }

  function depositBalance(value) {
    const cliente = getClient(currentClientId());
    const amount = roundMoney(Number(value));
    if (!cliente) return { ok: false, message: "Sessão expirada. Faça login novamente." };
    if (!amount || amount <= 0) return { ok: false, message: "Informe um valor de depósito maior que zero." };

    cliente.saldo = roundMoney(cliente.saldo + amount);
    save();
    return { ok: true, message: `Depósito de ${fmt(amount)} realizado.`, saldo: cliente.saldo };
  }

  function logout() {
    state.currentUser = null;
    save();
    window.location.href = "login.html";
  }

  function getProduct(id) {
    return state.produtos.find((produto) => produto.id === Number(id));
  }

  function getClient(id) {
    return state.clientes.find((cliente) => cliente.id === Number(id));
  }

  function productReviews(productId) {
    return state.avaliacoes
      .filter((avaliacao) => avaliacao.id_produto === Number(productId))
      .map((avaliacao) => {
        const cliente = getClient(avaliacao.id_cliente);
        return {
          ...avaliacao,
          nome_cliente: cliente?.nome || avaliacao.nome_cliente || "Cliente removido"
        };
      })
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  }

  function clientReview(productId) {
    const idCliente = currentClientId();
    if (!idCliente) return null;
    return state.avaliacoes.find((avaliacao) => avaliacao.id_produto === Number(productId) && avaliacao.id_cliente === idCliente) || null;
  }

  function reviewSummary(productId) {
    const avaliacoes = productReviews(productId);
    const porNota = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    avaliacoes.forEach((avaliacao) => {
      porNota[avaliacao.nota] = (porNota[avaliacao.nota] || 0) + 1;
    });
    const total = avaliacoes.length;
    const soma = avaliacoes.reduce((sum, avaliacao) => sum + avaliacao.nota, 0);
    return {
      total,
      media: total ? Math.round((soma / total) * 10) / 10 : 0,
      porNota
    };
  }

  function saveReview(productId, data) {
    const cliente = getClient(currentClientId());
    const produto = getProduct(productId);
    const nota = Number(data.nota);
    const comentario = String(data.comentario || "").trim();

    if (!cliente) return { ok: false, message: "Apenas clientes podem comentar e avaliar produtos." };
    if (!produto) return { ok: false, message: "Produto não encontrado." };
    if (!Number.isInteger(nota) || nota < 0 || nota > 5) return { ok: false, message: "Informe uma nota de 0 a 5 estrelas." };
    if (!comentario) return { ok: false, message: "Escreva um comentário para publicar sua avaliação." };

    const existente = state.avaliacoes.find((avaliacao) => avaliacao.id_produto === produto.id && avaliacao.id_cliente === cliente.id);
    const now = new Date().toISOString();
    if (existente) {
      existente.nota = nota;
      existente.comentario = comentario;
      existente.nome_cliente = cliente.nome;
      existente.atualizado_em = now;
      save();
      return { ok: true, message: "Avaliação atualizada com sucesso.", avaliacao: existente, updated: true };
    }

    const avaliacao = {
      id: state.counters.avaliacao++,
      id_produto: produto.id,
      id_cliente: cliente.id,
      nome_cliente: cliente.nome,
      nota,
      comentario,
      criado_em: now,
      atualizado_em: now
    };
    state.avaliacoes.push(avaliacao);
    save();
    return { ok: true, message: "Comentário publicado com sucesso.", avaliacao, updated: false };
  }

  function generateProtocol(ticketId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `TZ-${year}${month}${day}-${String(ticketId).padStart(5, "0")}`;
  }

  function createSupportTicket(data) {
    const cliente = getClient(currentClientId());
    const nomeContato = String(data.nome || cliente?.nome || "").trim();
    const emailContato = String(data.email || cliente?.email || "").trim();
    const categoria = String(data.categoria || "").trim();
    const mensagem = String(data.mensagem || "").trim();

    if (!cliente) return { ok: false, message: "Sessão expirada. Faça login novamente." };
    if (!nomeContato || !emailContato) return { ok: false, message: "Preencha nome e e-mail para contato." };
    if (!EMAIL_REGEX.test(emailContato)) return { ok: false, message: "Use um e-mail válido para contato." };
    if (!categoria) return { ok: false, message: "Selecione uma categoria de atendimento." };
    if (!mensagem || mensagem.length < 10) return { ok: false, message: "Descreva o chamado com pelo menos 10 caracteres." };

    const id = state.counters.chamado++;
    const chamado = {
      id,
      protocolo: generateProtocol(id),
      id_cliente: cliente.id,
      nome_cliente: cliente.nome,
      nome_contato: nomeContato,
      email_contato: emailContato,
      categoria,
      mensagem,
      status: "Pendente",
      resposta: "",
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      encerrado_em: null
    };

    state.chamados.push(chamado);
    save();
    return { ok: true, message: `Chamado aberto. Protocolo: ${chamado.protocolo}.`, chamado };
  }

  function getClientTickets() {
    const idCliente = currentClientId();
    if (!idCliente) return [];
    return state.chamados
      .filter((chamado) => chamado.id_cliente === idCliente)
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  }

  function findSupportTicket(protocol) {
    const normalized = String(protocol || "").trim().toUpperCase();
    return state.chamados.find((chamado) => chamado.protocolo.toUpperCase() === normalized);
  }

  function updateSupportTicket(protocol, data) {
    const chamado = findSupportTicket(protocol);
    const allowed = ["Pendente", "Em andamento", "Resolvido"];
    if (!chamado) return { ok: false, message: "Chamado não encontrado." };

    if (data.status && !allowed.includes(data.status)) {
      return { ok: false, message: "Status inválido." };
    }

    if (data.status) chamado.status = data.status;
    if (typeof data.resposta === "string") chamado.resposta = data.resposta.trim();
    if (data.encerrar) chamado.status = "Resolvido";
    chamado.encerrado_em = chamado.status === "Resolvido" ? (chamado.encerrado_em || new Date().toISOString()) : null;
    chamado.atualizado_em = new Date().toISOString();
    save();
    return { ok: true, message: "Chamado atualizado.", chamado };
  }

  function cartItems() {
    const idCliente = currentClientId();
    if (!idCliente) return [];
    return state.carrinho.filter((item) => item.id_cliente === idCliente);
  }

  function cartCount() {
    return cartItems().reduce((sum, item) => sum + item.quantidade, 0);
  }

  function cartSubtotal() {
    return cartItems().reduce((sum, item) => {
      const produto = getProduct(item.id_produto);
      return sum + (produto ? produto.preco * item.quantidade : 0);
    }, 0);
  }

  function addToCart(productId, qty = 1) {
    const idCliente = currentClientId();
    const produto = getProduct(productId);
    const quantidade = Math.max(1, Number(qty) || 1);

    if (!idCliente) return { ok: false, message: "Faça login para usar o carrinho." };
    if (!produto) return { ok: false, message: "Produto não encontrado." };
    if (produto.quantidade <= 0) return { ok: false, message: "Produto sem estoque." };

    const item = state.carrinho.find((entry) => entry.id_cliente === idCliente && entry.id_produto === produto.id);
    const quantidadeAtual = item ? item.quantidade : 0;
    if (quantidadeAtual + quantidade > produto.quantidade) {
      return { ok: false, message: "Quantidade solicitada excede o estoque disponível." };
    }

    if (item) item.quantidade += quantidade;
    else state.carrinho.push({ id_cliente: idCliente, id_produto: produto.id, quantidade });

    save();
    return { ok: true, message: "Produto adicionado ao carrinho." };
  }

  function setCartQty(productId, qty) {
    const idCliente = currentClientId();
    const produto = getProduct(productId);
    const item = state.carrinho.find((entry) => entry.id_cliente === idCliente && entry.id_produto === Number(productId));
    if (!produto || !item) return { ok: false, message: "Item não encontrado." };

    const quantidade = Number(qty);
    if (quantidade <= 0) {
      state.carrinho = state.carrinho.filter((entry) => entry !== item);
      save();
      return { ok: true };
    }

    if (quantidade > produto.quantidade) {
      return { ok: false, message: "Quantidade maior que o estoque disponível." };
    }

    item.quantidade = quantidade;
    save();
    return { ok: true };
  }

  function removeCartItem(productId) {
    const idCliente = currentClientId();
    state.carrinho = state.carrinho.filter((item) => !(item.id_cliente === idCliente && item.id_produto === Number(productId)));
    save();
  }

  function checkout(options) {
    const cliente = getClient(currentClientId());
    const items = cartItems();
    const frete = shippingOptions.find((item) => item.id === options.shippingId) || shippingOptions[0];
    const produtosTotal = roundMoney(cartSubtotal());
    const seguro = options.insurance ? roundMoney(produtosTotal * 0.04) : 0;
    const total = roundMoney(produtosTotal + frete.valor + seguro);

    if (!cliente) return { ok: false, message: "Sessão expirada. Faça login novamente." };
    if (!items.length) return { ok: false, message: "Seu carrinho está vazio." };

    for (const item of items) {
      const produto = getProduct(item.id_produto);
      if (!produto || produto.quantidade < item.quantidade) {
        return { ok: false, message: "Um produto do carrinho não possui estoque suficiente." };
      }
    }

    if (cliente.saldo < total) {
      return { ok: false, message: `Saldo insuficiente. Total necessário: ${fmt(total)}.` };
    }

    const itensPedido = items.map((item) => {
      const produto = getProduct(item.id_produto);
      return {
        id_produto: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: item.quantidade
      };
    });

    const pedido = {
      id: state.counters.pedido++,
      id_cliente: cliente.id,
      itens: itensPedido,
      num_itens: itensPedido.length,
      total_produtos: produtosTotal,
      frete: { ...frete },
      seguro,
      valor_total: total,
      pago: true,
      criado_em: new Date().toISOString()
    };

    cliente.saldo = roundMoney(cliente.saldo - total);
    pedido.itens.forEach((item) => {
      const produto = getProduct(item.id_produto);
      produto.quantidade -= item.quantidade;
      state.vendas.push({
        id: state.counters.venda++,
        id_produto: produto.id,
        id_pedido: pedido.id,
        quantidade: item.quantidade,
        valor_total: roundMoney(item.preco * item.quantidade)
      });
    });

    state.pedidos.push(pedido);
    state.pagamentos.push({
      id: state.counters.pagamento++,
      id_pedido: pedido.id,
      id_cliente: cliente.id,
      valor: total,
      criado_em: pedido.criado_em
    });
    state.carrinho = state.carrinho.filter((item) => item.id_cliente !== cliente.id);
    save();

    return { ok: true, message: `Pedido #${pedido.id} pago com sucesso.`, pedido };
  }

  function statusEstoque(produto) {
    if (produto.quantidade <= 0) return { label: "Sem estoque", className: "stock-out" };
    if (produto.quantidade <= ESTOQUE_BAIXO) return { label: `Estoque baixo: ${produto.quantidade}`, className: "stock-low" };
    return { label: `Estoque: ${produto.quantidade}`, className: "stock-ok" };
  }

  function addProduct(data) {
    const produto = {
      id: state.counters.produto++,
      nome: data.nome.trim(),
      descricao: data.descricao.trim() || "Produto sem descrição.",
      descricao_completa: data.descricao_completa.trim() || data.descricao.trim() || "Produto sem descrição detalhada.",
      preco: roundMoney(Number(data.preco)),
      quantidade: Number(data.quantidade),
      imagem: data.imagem.trim() || "images/mouse.jpg",
      especificacoes: data.especificacoes.split(",").map((item) => item.trim()).filter(Boolean)
    };

    if (!produto.nome || produto.preco <= 0 || produto.quantidade < 0) {
      return { ok: false, message: "Informe nome, preço positivo e estoque válido." };
    }

    state.produtos.push(produto);
    save();
    return { ok: true, message: "Produto cadastrado." };
  }

  function removeProduct(productId) {
    const produto = getProduct(productId);
    if (!produto) return { ok: false, message: "Produto não encontrado." };

    state.produtos = state.produtos.filter((item) => item.id !== produto.id);
    state.carrinho = state.carrinho.filter((item) => item.id_produto !== produto.id);
    state.avaliacoes = state.avaliacoes.filter((item) => item.id_produto !== produto.id);
    save();
    return { ok: true, message: `${produto.nome} removido do catálogo.` };
  }

  function moveStock(productId, quantity) {
    const produto = getProduct(productId);
    const qtd = Number(quantity);
    if (!produto) return { ok: false, message: "Produto não encontrado." };
    if (!Number.isInteger(qtd) || qtd === 0) return { ok: false, message: "Informe uma quantidade inteira diferente de zero." };
    if (produto.quantidade + qtd < 0) return { ok: false, message: "Saída maior que o estoque disponível." };
    produto.quantidade += qtd;
    save();
    return { ok: true, message: "Estoque atualizado." };
  }

  function adjustPrices(productId, percent) {
    const pct = Number(percent);
    if (Number.isNaN(pct)) return { ok: false, message: "Informe um percentual válido." };
    const factor = 1 + pct / 100;
    const list = productId ? [getProduct(productId)].filter(Boolean) : state.produtos;
    if (!list.length) return { ok: false, message: "Produto não encontrado." };
    list.forEach((produto) => {
      produto.preco = roundMoney(Math.max(0.01, produto.preco * factor));
    });
    save();
    return { ok: true, message: "Reajuste aplicado." };
  }

  window.TechZone = {
    ESTOQUE_BAIXO,
    EMAIL_REGEX,
    PHONE_REGEX,
    shippingOptions,
    state,
    save,
    fmt,
    roundMoney,
    getCurrentUser,
    isAdmin,
    requireClient,
    requireStoreAccess,
    requireAdmin,
    login,
    registerClient,
    updateClientAccount,
    depositBalance,
    logout,
    getProduct,
    getClient,
    productReviews,
    clientReview,
    reviewSummary,
    saveReview,
    createSupportTicket,
    getClientTickets,
    findSupportTicket,
    updateSupportTicket,
    cartItems,
    cartCount,
    cartSubtotal,
    addToCart,
    setCartQty,
    removeCartItem,
    checkout,
    statusEstoque,
    addProduct,
    removeProduct,
    moveStock,
    adjustPrices
  };
})();

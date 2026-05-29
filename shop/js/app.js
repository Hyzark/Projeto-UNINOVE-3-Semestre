(function () {
  const TZ = window.TechZone;
  const page = document.body.dataset.page;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function toast(message, type = "") {
    const root = $("#toast-root");
    if (!root) return;
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;
    root.appendChild(item);
    setTimeout(() => item.remove(), 3200);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function formatPhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function fmtDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function initPhoneMasks() {
    $$("[data-phone-mask]").forEach((input) => {
      input.value = formatPhone(input.value);
      input.addEventListener("input", () => {
        input.value = formatPhone(input.value);
      });
    });
  }

  function stockBadge(produto) {
    const status = TZ.statusEstoque(produto);
    return `<span class="stock-badge ${status.className}">${status.label}</span>`;
  }

  function stars(nota, muted = false) {
    const value = Number(nota) || 0;
    return `
      <span class="rating-stars ${muted ? "muted-stars" : ""}" aria-label="${value} de 5 estrelas">
        ${[1, 2, 3, 4, 5].map((item) => `<span class="${item <= value ? "filled" : ""}">&#9733;</span>`).join("")}
      </span>
    `;
  }

  function ratingDashboard(productId) {
    const summary = TZ.reviewSummary(productId);
    return `
      <aside class="rating-dashboard">
        <div class="rating-average">
          <span>Total de avaliações</span>
          <strong>${summary.total}</strong>
        </div>
        <div class="rating-average">
          <span>Média das notas</span>
          ${summary.total ? `<strong>${summary.media.toFixed(1)}</strong>${stars(Math.round(summary.media))}` : `${stars(0, true)}<strong class="empty-rating-text">Sem avaliações</strong>`}
        </div>
        <div class="rating-breakdown">
          ${[5, 4, 3, 2, 1, 0].map((nota) => `
            <div>
              <span>${nota} estrelas</span>
              <strong>${summary.porNota[nota]} avaliações</strong>
            </div>
          `).join("")}
        </div>
      </aside>
    `;
  }

  function reviewForm(productId) {
    const user = TZ.getCurrentUser();
    if (!user || user.role !== "client") {
      return `<div class="review-form locked"><strong>Apenas clientes podem comentar e avaliar produtos.</strong></div>`;
    }

    const existing = TZ.clientReview(productId);
    const currentScore = existing ? existing.nota : 5;
    return `
      <form id="review-form" class="review-form">
        <div>
          <h3>${existing ? "Editar avaliação" : "Adicionar comentário"}</h3>
          <p class="muted">Sua nova publicação substitui a avaliação anterior neste produto.</p>
        </div>
        <input id="review-score" type="hidden" value="${currentScore}">
        <div class="rating-input" aria-label="Nota de 0 a 5 estrelas">
          ${[0, 1, 2, 3, 4, 5].map((nota) => `
            <button class="${nota === currentScore ? "active" : ""}" type="button" data-review-score="${nota}">
              ${nota === 0 ? "0" : stars(nota)}
            </button>
          `).join("")}
        </div>
        <label>Comentário
          <textarea id="review-comment" rows="4" placeholder="Conte sua experiêcia com o produto.">${escapeHtml(existing?.comentario || "")}</textarea>
        </label>
        <button class="btn primary small" type="submit">${existing ? "Atualizar avaliação" : "Publicar comentário"}</button>
      </form>
    `;
  }

  function reviewList(productId, preview) {
    const root = $("#product-reviews");
    const reviews = TZ.productReviews(productId);
    const visible = preview ? 3 : Number(root?.dataset.visibleReviews || 6);
    const shown = reviews.slice(0, visible);

    if (!reviews.length) {
      return `<div class="review-list"><div class="review-card empty-review"><strong>Sem comentários</strong></div></div>`;
    }

    return `
      <div class="review-list">
        ${shown.map((review) => `
          <article class="review-card">
            <header>
              <div>
                <strong>${escapeHtml(review.nome_cliente)}</strong>
                <span>${fmtDate(review.criado_em)}</span>
              </div>
              ${stars(review.nota)}
            </header>
            <p>${escapeHtml(review.comentario)}</p>
          </article>
        `).join("")}
      </div>
      ${preview && reviews.length > 3 ? `<a class="btn ghost small reviews-more" href="comentarios.html?id=${productId}">Ver todos os comentários</a>` : ""}
      ${!preview && reviews.length > visible ? `<button class="btn ghost small reviews-more" type="button" data-load-more-reviews>Carregar mais comentários</button>` : ""}
    `;
  }

  function renderProductReviews(productId, preview = true) {
    const root = $("#product-reviews");
    if (!root) return;
    root.dataset.reviewMode = preview ? "preview" : "full";
    if (!preview && !root.dataset.visibleReviews) root.dataset.visibleReviews = "6";
    root.innerHTML = `
      <div class="section-title-row">
        <div>
          <p class="eyebrow">Avaliações</p>
          <h2>Comentários dos clientes</h2>
        </div>
      </div>
      <div class="reviews-layout">
        ${ratingDashboard(productId)}
        <div class="reviews-main">
          ${reviewForm(productId)}
          ${reviewList(productId, preview)}
        </div>
      </div>
    `;
  }

  function bindReviewEvents(productId) {
    const root = $("#product-reviews");
    if (!root) return;

    root.addEventListener("click", (event) => {
      const scoreButton = event.target.closest("[data-review-score]");
      if (scoreButton) {
        const score = Number(scoreButton.dataset.reviewScore);
        $("#review-score", root).value = score;
        $$("[data-review-score]", root).forEach((button) => {
          button.classList.toggle("active", Number(button.dataset.reviewScore) === score);
        });
        return;
      }

      const loadMore = event.target.closest("[data-load-more-reviews]");
      if (loadMore) {
        root.dataset.visibleReviews = String(Number(root.dataset.visibleReviews || 6) + 6);
        renderProductReviews(productId, false);
      }
    });

    root.addEventListener("submit", (event) => {
      if (!event.target.matches("#review-form")) return;
      event.preventDefault();
      const result = TZ.saveReview(productId, {
        nota: Number($("#review-score", event.target).value),
        comentario: $("#review-comment", event.target).value
      });
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) renderProductReviews(productId, root.dataset.reviewMode !== "full");
    });
  }

  function initHeader() {
    const user = TZ.getCurrentUser();
    const cartCount = $("#cart-count");
    const logoutBtn = $("#logout-btn");
    const adminLink = $("#admin-link");
    const clientLinks = $$(".client-link");
    const accountAvatar = $("#account-avatar");

    if (cartCount) {
      cartCount.textContent = TZ.cartCount();
    }

    if (accountAvatar && user && user.role === "client") {
      accountAvatar.textContent = (user.usuario || user.nome || "U").trim()[0].toUpperCase();
      accountAvatar.title = "Minha Conta";
    }

    if (adminLink && TZ.isAdmin()) {
      adminLink.classList.remove("hidden");
    }

    clientLinks.forEach((link) => {
      link.classList.toggle("hidden", !user || user.role !== "client");
    });

    if (logoutBtn) {
      if (!user) logoutBtn.textContent = "Entrar";
      logoutBtn.addEventListener("click", () => {
        if (user) TZ.logout();
        else window.location.href = "login.html";
      });
    }
  }

  function initLogin() {
    if (TZ.getCurrentUser()) {
      window.location.href = TZ.isAdmin() ? "admin.html" : "catalogo.html";
      return;
    }

    initPhoneMasks();

    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.authTab;
        $$(".tab").forEach((item) => item.classList.toggle("active", item === tab));
        $("#login-form").classList.toggle("hidden", target !== "login");
        $("#register-form").classList.toggle("hidden", target !== "cadastro");
      });
    });

    $("#login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const result = TZ.login($("#login-user").value.trim(), $("#login-pass").value.trim());
      if (!result.ok) {
        toast(result.message, "error");
        return;
      }
      window.location.href = result.redirect;
    });

    $("#register-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const result = TZ.registerClient({
        nome: $("#reg-name").value,
        email: $("#reg-email").value,
        telefone: $("#reg-phone").value,
        usuario: $("#reg-user").value,
        senha: $("#reg-pass").value,
        saldo: 0
      });

      if (!result.ok) {
        toast(result.message, "error");
        return;
      }

      window.location.href = result.redirect;
    });
  }

  function renderCatalog() {
    const grid = $("#products-grid");
    if (!grid) return;
    const user = TZ.getCurrentUser();
    const canBuy = user && user.role === "client";

    const term = ($("#product-search")?.value || "").trim().toLowerCase();
    const filter = $("#stock-filter")?.value || "todos";
    let produtos = TZ.state.produtos.filter((produto) => {
      const matchesTerm = `${produto.nome} ${produto.descricao}`.toLowerCase().includes(term);
      const matchesStock =
        filter === "todos" ||
        (filter === "disponiveis" && produto.quantidade > 0) ||
        (filter === "baixo" && produto.quantidade > 0 && produto.quantidade <= TZ.ESTOQUE_BAIXO);
      return matchesTerm && matchesStock;
    });

    if (!produtos.length) {
      grid.innerHTML = `<div class="cart-item"><strong>Nenhum produto encontrado.</strong></div>`;
      return;
    }

    grid.innerHTML = produtos.map((produto) => `
      <article class="product-card" data-product-id="${produto.id}">
        <img src="${produto.imagem}" alt="${escapeHtml(produto.nome)}" loading="lazy">
        <div class="product-card-body">
          <div>
            <h2>${escapeHtml(produto.nome)}</h2>
            <p>${escapeHtml(produto.descricao)}</p>
          </div>
          <span class="price">${TZ.fmt(produto.preco)}</span>
          ${stockBadge(produto)}
          <button class="btn primary full" type="button" data-add-cart="${produto.id}" ${!canBuy || produto.quantidade <= 0 ? "disabled" : ""}>
            ${produto.quantidade <= 0 ? "Indisponível" : (canBuy ? "Adicionar ao carrinho" : "Visualização admin")}
          </button>
        </div>
      </article>
    `).join("");
  }

  function initCatalog() {
    if (!TZ.requireStoreAccess()) return;
    renderCatalog();
    $("#product-search").addEventListener("input", renderCatalog);
    $("#stock-filter").addEventListener("change", renderCatalog);
    $("#products-grid").addEventListener("click", (event) => {
      const addBtn = event.target.closest("[data-add-cart]");
      if (addBtn) {
        event.stopPropagation();
        const result = TZ.addToCart(Number(addBtn.dataset.addCart));
        toast(result.message, result.ok ? "success" : "error");
        initHeader();
        return;
      }

      const card = event.target.closest("[data-product-id]");
      if (card) window.location.href = `produto.html?id=${card.dataset.productId}`;
    });
  }

  function initProduct() {
    const user = TZ.requireStoreAccess();
    if (!user) return;
    const canBuy = user.role === "client";
    const root = $("#product-detail");
    const id = new URLSearchParams(window.location.search).get("id");
    const produto = TZ.getProduct(id);

    if (!produto) {
      root.innerHTML = `<div class="cart-item"><strong>Produto não encontrado.</strong><a class="btn ghost small" href="catalogo.html">Voltar</a></div>`;
      return;
    }

    root.innerHTML = `
      <div class="product-media">
        <img src="${produto.imagem}" alt="${escapeHtml(produto.nome)}">
      </div>
      <div class="detail-copy">
        <div>
          <p class="eyebrow">Produto #${produto.id}</p>
          <h1>${escapeHtml(produto.nome)}</h1>
        </div>
        <span class="price">${TZ.fmt(produto.preco)}</span>
        ${stockBadge(produto)}
        <p class="muted">${escapeHtml(produto.descricao_completa || produto.descricao)}</p>
        <div class="spec-grid">
          ${produto.especificacoes.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
        <div class="buy-box">
          <div class="qty-row">
            <label>Quantidade
              <div class="stepper">
                <button type="button" data-step="-1">-</button>
                <input id="detail-qty" value="1" inputmode="numeric">
                <button type="button" data-step="1">+</button>
              </div>
            </label>
            <small class="muted">${produto.quantidade} un. disponíveis</small>
          </div>
          <button id="detail-add" class="btn primary full" type="button" ${!canBuy || produto.quantidade <= 0 ? "disabled" : ""}>${canBuy ? "Adicionar ao carrinho" : "Visualização admin"}</button>
        </div>
      </div>
      <section id="product-reviews" class="reviews-panel"></section>
    `;

    const qty = $("#detail-qty");
    $("[data-step='-1']").addEventListener("click", () => {
      qty.value = Math.max(1, Number(qty.value || 1) - 1);
    });
    $("[data-step='1']").addEventListener("click", () => {
      qty.value = Math.min(produto.quantidade, Number(qty.value || 1) + 1);
    });
    $("#detail-add").addEventListener("click", () => {
      const result = TZ.addToCart(produto.id, Number(qty.value || 1));
      toast(result.message, result.ok ? "success" : "error");
      initHeader();
    });
    renderProductReviews(produto.id, true);
    bindReviewEvents(produto.id);
  }

  function initCommentsPage() {
    const user = TZ.requireStoreAccess();
    if (!user) return;

    const root = $("#comments-detail");
    const id = new URLSearchParams(window.location.search).get("id");
    const produto = TZ.getProduct(id);

    if (!produto) {
      root.innerHTML = `<div class="cart-item"><strong>Produto nÃ£o encontrado.</strong><a class="btn ghost small" href="catalogo.html">Voltar</a></div>`;
      return;
    }

    root.innerHTML = `
      <a class="back-link" href="produto.html?id=${produto.id}">â† Voltar ao produto</a>
      <section class="comments-product-head">
        <img src="${produto.imagem}" alt="${escapeHtml(produto.nome)}">
        <div>
          <p class="eyebrow">Produto #${produto.id}</p>
          <h1>${escapeHtml(produto.nome)}</h1>
          <p class="muted">${escapeHtml(produto.descricao)}</p>
        </div>
      </section>
      <section id="product-reviews" class="reviews-panel"></section>
    `;
    renderProductReviews(produto.id, false);
    bindReviewEvents(produto.id);
  }

  function selectedCheckoutOptions() {
    const selectedShipping = $("input[name='shipping']:checked")?.value || "padrao";
    return {
      shippingId: selectedShipping,
      insurance: Boolean($("#insurance-check")?.checked)
    };
  }

  function renderCart() {
    const list = $("#cart-list");
    if (!list) return;
    const items = TZ.cartItems();
    
    // Mapeando os blocos que precisam sumir quando o carrinho esvazia
    const checkoutOptions = $(".checkout-options");
    const summaryBox = $(".summary-box");

    if (!items.length) {
      // Exibe apenas a mensagem de carrinho vazio
      list.innerHTML = `
        <div class="cart-item" style="text-align: center; padding: 24px;">
          <strong>Carrinho vazio.</strong><br>
          <span class="muted">Adicione produtos pelo catálogo.</span>
        </div>
      `;
      
      // Oculta frete, seguro e botão de finalizar compra
      if (checkoutOptions) checkoutOptions.classList.add("hidden");
      if (summaryBox) summaryBox.classList.add("hidden");
      
    } else {
      // Exibe as opções de frete e resumo novamente
      if (checkoutOptions) checkoutOptions.classList.remove("hidden");
      if (summaryBox) summaryBox.classList.remove("hidden");
      
      list.innerHTML = items.map((item) => {
        const produto = TZ.getProduct(item.id_produto);
        if (!produto) return "";
        return `
          <article class="cart-item">
            <img src="${produto.imagem}" alt="${escapeHtml(produto.nome)}">
            <div>
              <h3>${escapeHtml(produto.nome)}</h3>
              <div class="cart-meta"><span>${TZ.fmt(produto.preco)} cada</span><strong>${TZ.fmt(produto.preco * item.quantidade)}</strong></div>
              <small class="muted">Disponível: ${produto.quantidade}</small>
            </div>
            <div class="cart-item-actions">
              <div class="stepper">
                <button type="button" data-cart-step="${produto.id}" data-delta="-1">-</button>
                <input value="${item.quantidade}" aria-label="Quantidade de ${escapeHtml(produto.nome)}" data-cart-input="${produto.id}">
                <button type="button" data-cart-step="${produto.id}" data-delta="1">+</button>
              </div>
              <button class="btn ghost small full" type="button" data-remove-cart="${produto.id}">Remover</button>
            </div>
          </article>
        `;
      }).join("");
    }

    renderCheckoutSummary();
    initHeader();
  }

  function renderCheckoutSummary() {
    const options = selectedCheckoutOptions();
    const shipping = TZ.shippingOptions.find((item) => item.id === options.shippingId) || TZ.shippingOptions[0];
    const products = TZ.roundMoney(TZ.cartSubtotal());
    const insurance = options.insurance ? TZ.roundMoney(products * 0.04) : 0;
    const total = TZ.roundMoney(products + shipping.valor + insurance);

    $("#summary-products").textContent = TZ.fmt(products);
    $("#summary-shipping").textContent = TZ.fmt(shipping.valor);
    $("#summary-insurance").textContent = TZ.fmt(insurance);
    $("#summary-total").textContent = TZ.fmt(total);
  }

  function renderShippingOptions() {
    const root = $("#shipping-options");
    root.innerHTML = TZ.shippingOptions.map((option, index) => `
      <label class="radio-card">
        <input type="radio" name="shipping" value="${option.id}" ${index === 0 ? "checked" : ""}>
        <span><strong>${option.nome} - ${TZ.fmt(option.valor)}</strong><small>${option.prazo}</small></span>
      </label>
    `).join("");
  }

  function renderOrders() {
    const root = $("#orders-list");
    if (!root) return;
    const user = TZ.getCurrentUser();
    const pedidos = TZ.state.pedidos
      .filter((pedido) => pedido.id_cliente === user.id)
      .sort((a, b) => b.id - a.id);

    if (!pedidos.length) {
      root.innerHTML = `<div class="order-card"><strong>Nenhum pedido registrado.</strong><span class="muted">Suas compras aparecerão aqui após o pagamento.</span></div>`;
      return;
    }

    root.innerHTML = pedidos.map((pedido) => `
      <article class="order-card">
        <header>
          <h3>Pedido #${pedido.id}</h3>
          <span class="status-badge ${pedido.pago ? "status-paid" : "status-pending"}">${pedido.pago ? "Pago" : "Pendente"}</span>
        </header>
        ${pedido.itens.map((item) => `
          <div class="order-line"><span>${escapeHtml(item.nome)} x${item.quantidade}</span><strong>${TZ.fmt(item.preco * item.quantidade)}</strong></div>
        `).join("")}
        <div class="order-line"><span>Frete (${escapeHtml(pedido.frete.nome)})</span><strong>${TZ.fmt(pedido.frete.valor)}</strong></div>
        <div class="order-line"><span>Seguro</span><strong>${TZ.fmt(pedido.seguro)}</strong></div>
        <div class="order-line"><span>Prazo</span><strong>${escapeHtml(pedido.frete.prazo)}</strong></div>
        <div class="order-line"><span>Total</span><strong>${TZ.fmt(pedido.valor_total)}</strong></div>
      </article>
    `).join("");
  }

  function initOrders() {
    if (!TZ.requireClient()) return;
    renderShippingOptions();
    renderCart();
    renderOrders();

    $("#shipping-options").addEventListener("change", renderCheckoutSummary);
    $("#insurance-check").addEventListener("change", renderCheckoutSummary);

    $("#cart-list").addEventListener("click", (event) => {
      const step = event.target.closest("[data-cart-step]");
      const remove = event.target.closest("[data-remove-cart]");
      if (step) {
        const id = Number(step.dataset.cartStep);
        const item = TZ.cartItems().find((entry) => entry.id_produto === id);
        const nextQty = (item?.quantidade || 0) + Number(step.dataset.delta);
        const result = TZ.setCartQty(id, nextQty);
        if (!result.ok) toast(result.message, "error");
        renderCart();
      }
      if (remove) {
        TZ.removeCartItem(Number(remove.dataset.removeCart));
        renderCart();
      }
    });

    $("#cart-list").addEventListener("change", (event) => {
      const input = event.target.closest("[data-cart-input]");
      if (!input) return;
      const result = TZ.setCartQty(Number(input.dataset.cartInput), Number(input.value));
      if (!result.ok) toast(result.message, "error");
      renderCart();
    });

    $("#checkout-pay").addEventListener("click", () => {
      const result = TZ.checkout(selectedCheckoutOptions());
      toast(result.message, result.ok ? "success" : "error");
      renderCart();
      renderOrders();
    });
  }

  function initAccount() {
    const user = TZ.requireClient();
    if (!user) return;
    initPhoneMasks();

    $("#account-name").value = user.nome;
    $("#account-email").value = user.email;
    $("#account-phone").value = formatPhone(user.telefone);
    $("#account-user").value = user.usuario;
    let balanceVisible = false;
    const balanceValue = $("#account-balance");
    const toggleBalance = $("#toggle-balance");

    function renderAccountBalance() {
      const current = TZ.getCurrentUser();
      balanceValue.textContent = balanceVisible ? TZ.fmt(current.saldo) : "••••••";
      balanceValue.dataset.hidden = String(!balanceVisible);
      toggleBalance.setAttribute("aria-label", balanceVisible ? "Ocultar saldo" : "Mostrar saldo");
    }

    renderAccountBalance();
    toggleBalance.addEventListener("click", () => {
      balanceVisible = !balanceVisible;
      renderAccountBalance();
    });

    $("#account-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const result = TZ.updateClientAccount({
        nome: $("#account-name").value,
        email: $("#account-email").value,
        telefone: $("#account-phone").value,
        usuario: $("#account-user").value,
        senha: $("#account-pass").value
      });
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        $("#account-pass").value = "";
        initHeader();
      }
    });

    $("#deposit-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const result = TZ.depositBalance($("#deposit-value").value);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        $("#deposit-value").value = "";
        renderAccountBalance();
        initHeader();
      }
    });
  }

  function initAbout() {
    const user = TZ.getCurrentUser();
    if (!user) {
      const logoutBtn = $("#logout-btn");
      if (logoutBtn) logoutBtn.textContent = "Entrar";
    }
  }

  const supportMessages = {
    compra: {
      title: "Problema ao efetuar a compra",
      body: "Confira se há estoque disponível, saldo suficiente em Minha Conta e se o carrinho possui uma opção de frete selecionada. Se o erro continuar, abra um chamado direto com o suporte e informe o produto e o valor total exibido."
    },
    conta: {
      title: "Problemas com a conta",
      body: "Acesse Minha Conta para alterar nome, e-mail, telefone, usuário e senha. O e-mail precisa usar um provedor válido e o telefone deve seguir o padrão (11) 99999-9999."
    },
    uso: {
      title: "Como utilizar o site",
      body: "Entre com sua conta, navegue pelo Catálogo, abra a página do produto para ver detalhes ou adicione direto ao carrinho. Em Pedidos você escolhe frete, seguro e finaliza a compra com saldo."
    },
    regras: {
      title: "Regras de funcionamento",
      body: "Os dados são salvos no localStorage do navegador. Compras descontam saldo, reduzem estoque e geram histórico. Chamados recebem protocolo único e podem ficar como Pendente, Em andamento ou Resolvido."
    }
  };

  function renderSupportGuidance(topic) {
    const guidance = $("#support-guidance");
    const form = $("#support-form");
    if (!guidance || !form) return;

    if (topic === "suporte") {
      guidance.innerHTML = `
        <div class="support-message">
          <h2>Falar diretamente com o suporte</h2>
          <p>Descreva seu problema, dúvida, reclamação ou crítica. Depois do envio, um protocolo único será gerado automaticamente.</p>
        </div>
      `;
      form.classList.remove("hidden");
      return;
    }

    const item = supportMessages[topic] || supportMessages.compra;
    guidance.innerHTML = `
      <div class="support-message">
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.body)}</p>
      </div>
    `;
    form.classList.add("hidden");
  }

  function renderClientTickets() {
    const root = $("#client-ticket-list");
    if (!root) return;
    const tickets = TZ.getClientTickets();
    if (!tickets.length) {
      root.innerHTML = `<div class="ticket-card"><strong>Nenhum chamado aberto.</strong><span class="muted">Quando você enviar uma mensagem ao suporte, o protocolo aparecerá aqui.</span></div>`;
      return;
    }

    root.innerHTML = tickets.map((ticket) => `
      <article class="ticket-card">
        <header>
          <div>
            <strong>${escapeHtml(ticket.protocolo)}</strong>
            <span>${escapeHtml(ticket.categoria)} • ${fmtDate(ticket.criado_em)}</span>
          </div>
          <span class="status-badge ${ticket.status === "Resolvido" ? "status-paid" : ticket.status === "Em andamento" ? "status-pending" : "status-critical"}">${escapeHtml(ticket.status)}</span>
        </header>
        <div class="ticket-block"><span>Mensagem enviada</span><p>${escapeHtml(ticket.mensagem)}</p></div>
        <div class="ticket-block"><span>Resposta do suporte</span><p>${ticket.resposta ? escapeHtml(ticket.resposta) : "Aguardando resposta da equipe."}</p></div>
      </article>
    `).join("");
  }

  function initSupport() {
    const user = TZ.requireClient();
    if (!user) return;
    renderSupportGuidance("suporte");
    renderClientTickets();
    $("#contact-name").value = user.nome || "";
    $("#contact-email").value = user.email || "";

    $("#support-options").addEventListener("click", (event) => {
      const button = event.target.closest("[data-support-topic]");
      if (!button) return;
      $$(".support-option").forEach((item) => item.classList.toggle("active", item === button));
      renderSupportGuidance(button.dataset.supportTopic);
    });

    $("#support-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const result = TZ.createSupportTicket({
        nome: $("#contact-name").value,
        email: $("#contact-email").value,
        categoria: $("#ticket-category").value,
        mensagem: $("#ticket-message").value
      });
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        $("#ticket-message").value = "";
        renderClientTickets();
      }
    });
  }

  function table(headers, rows) {
    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
    `;
  }

  function renderAdminTickets(query = "") {
    const normalized = query.trim().toUpperCase();
    const tickets = TZ.state.chamados
      .filter((ticket) => !normalized || ticket.protocolo.toUpperCase().includes(normalized))
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

    return `
      <div class="admin-page-head">
        <div>
          <h1>Chamados de suporte</h1>
          <p class="muted">Gerencie protocolos, respostas e status de atendimento.</p>
        </div>
      </div>
      <form id="ticket-search-form" class="admin-form support-admin-search">
        <label>Buscar por protocolo
          <input id="ticket-search" placeholder="Ex: TZ-20260526-00001" value="${escapeHtml(query)}">
        </label>
        <button class="btn primary small" type="submit">Buscar chamado</button>
        <button class="btn ghost small" type="button" id="ticket-clear-search">Limpar</button>
      </form>
      <div class="ticket-admin-list">
        ${tickets.length ? tickets.map((ticket) => {
          const cliente = TZ.getClient(ticket.id_cliente);
          return `
            <article class="ticket-card ticket-admin-card" data-ticket-protocol="${escapeHtml(ticket.protocolo)}">
              <header>
                <div>
                  <strong>${escapeHtml(ticket.protocolo)}</strong>
                  <span>${escapeHtml(cliente?.nome || ticket.nome_cliente || "Cliente removido")} • ${fmtDate(ticket.criado_em)}</span>
                  <span>${escapeHtml(cliente?.email || ticket.nome_cliente || "Cliente removido")}</span>
                </div>
                <span class="status-badge ${ticket.status === "Resolvido" ? "status-paid" : ticket.status === "Em andamento" ? "status-pending" : "status-critical"}">${escapeHtml(ticket.status)}</span>
              </header>
              <div class="ticket-detail-grid">
                <div class="ticket-block"><span>Categoria</span><p>${escapeHtml(ticket.categoria)}</p></div>
                <div class="ticket-block"><span>Status atual</span><p>${escapeHtml(ticket.status)}</p></div>
                <div class="ticket-block wide"><span>Mensagem enviada</span><p>${escapeHtml(ticket.mensagem)}</p></div>
                <div class="ticket-block wide"><span>Resposta do administrador</span><p>${ticket.resposta ? escapeHtml(ticket.resposta) : "Sem resposta registrada."}</p></div>
              </div>
              <form class="ticket-admin-form" data-ticket-form="${escapeHtml(ticket.protocolo)}">
                <label>Status
                  <select data-ticket-status>
                    <option ${ticket.status === "Pendente" ? "selected" : ""}>Pendente</option>
                    <option ${ticket.status === "Em andamento" ? "selected" : ""}>Em andamento</option>
                    <option ${ticket.status === "Resolvido" ? "selected" : ""}>Resolvido</option>
                  </select>
                </label>
                <label>Resposta ao usuário
                  <textarea data-ticket-response rows="3" placeholder="Digite a resposta do suporte.">${escapeHtml(ticket.resposta)}</textarea>
                </label>
                <div class="ticket-actions">
                  <button class="btn primary small" type="submit">Responder / atualizar</button>
                  <button class="btn ghost small" type="button" data-close-ticket="${escapeHtml(ticket.protocolo)}">Encerrar chamado</button>
                </div>
              </form>
            </article>
          `;
        }).join("") : `<div class="ticket-card"><strong>Nenhum chamado encontrado.</strong><span class="muted">Os chamados enviados pelos clientes aparecerão aqui.</span></div>`}
      </div>
    `;
  }

  function bindAdminTicketEvents() {
    const root = $("#admin-content");
    $("#ticket-search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      root.innerHTML = renderAdminTickets($("#ticket-search").value);
      bindAdminTicketEvents();
    });

    $("#ticket-clear-search").addEventListener("click", () => {
      root.innerHTML = renderAdminTickets("");
      bindAdminTicketEvents();
    });

    $$(".ticket-admin-form", root).forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const protocol = form.dataset.ticketForm;
        const result = TZ.updateSupportTicket(protocol, {
          status: $("[data-ticket-status]", form).value,
          resposta: $("[data-ticket-response]", form).value
        });
        toast(result.message, result.ok ? "success" : "error");
        root.innerHTML = renderAdminTickets($("#ticket-search")?.value || "");
        bindAdminTicketEvents();
      });
    });

    $$("[data-close-ticket]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const result = TZ.updateSupportTicket(button.dataset.closeTicket, {
          status: "Resolvido",
          encerrar: true
        });
        toast(result.message, result.ok ? "success" : "error");
        root.innerHTML = renderAdminTickets($("#ticket-search")?.value || "");
        bindAdminTicketEvents();
      });
    });
  }

  function renderAdmin(section = "dashboard") {
    const root = $("#admin-content");
    root.onclick = null;
    const totalVendido = TZ.state.vendas.reduce((sum, venda) => sum + venda.valor_total, 0);
    const estoqueBaixo = TZ.state.produtos.filter((produto) => produto.quantidade <= TZ.ESTOQUE_BAIXO);

    const head = (title, subtitle = "") => `
      <div class="admin-page-head">
        <div><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</div>
      </div>
    `;

    if (section === "dashboard") {
      root.innerHTML = `
        ${head("Dashboard operacional", "Resumo dos dados persistidos no localStorage.")}
        <div class="kpi-grid">
          <div class="kpi"><span>Clientes</span><strong>${TZ.state.clientes.length}</strong></div>
          <div class="kpi"><span>Produtos</span><strong>${TZ.state.produtos.length}</strong></div>
          <div class="kpi"><span>Pedidos</span><strong>${TZ.state.pedidos.length}</strong></div>
          <div class="kpi"><span>Chamados</span><strong>${TZ.state.chamados.length}</strong></div>
          <div class="kpi"><span>Pagamentos</span><strong>${TZ.state.pagamentos.length}</strong></div>
          <div class="kpi"><span>Total vendido</span><strong>${TZ.fmt(totalVendido)}</strong></div>
        </div>
        <section class="admin-alerts">
          <h2>Alertas críticos de estoque</h2>
          ${estoqueBaixo.length ? estoqueBaixo.map((produto) => `
            <div class="alert-line"><span>#${produto.id} ${escapeHtml(produto.nome)}</span><strong>${produto.quantidade} un.</strong></div>
          `).join("") : `<p class="muted">Nenhum produto em alerta.</p>`}
        </section>
        ${table(["ID", "Produto", "Preço", "Estoque", "Status"], TZ.state.produtos.map((produto) => `
          <tr><td>#${produto.id}</td><td><strong>${escapeHtml(produto.nome)}</strong></td><td>${TZ.fmt(produto.preco)}</td><td>${produto.quantidade}</td><td>${stockBadge(produto)}</td></tr>
        `))}
      `;
    }

    if (section === "produtos") {
      root.innerHTML = `
        ${head("Produtos", "Cadastro e consulta rápida do catálogo.")}
        <form id="admin-product-form" class="admin-form">
          <h2>Novo produto</h2>
          <div class="admin-form-grid">
            <label>Nome<input id="adm-prod-name" required></label>
            <label>Preço<input id="adm-prod-price" type="number" step="0.01" min="0.01" required></label>
            <label>Estoque<input id="adm-prod-stock" type="number" min="0" step="1" required></label>
            <label>Imagem<input id="adm-prod-image" placeholder="images/mouse.jpg"></label>
          </div>
          <label>Descrição<textarea id="adm-prod-desc" rows="2"></textarea></label>
          <label>Descrição completa<textarea id="adm-prod-full" rows="3"></textarea></label>
          <label>Especificações separadas por vírgula<input id="adm-prod-specs" placeholder="RGB, USB, Garantia"></label>
          <button class="btn primary small" type="submit">Cadastrar produto</button>
        </form>
        ${table(["ID", "Nome", "Descrição", "Preço", "Estoque", "Ações"], TZ.state.produtos.map((produto) => `
          <tr><td>#${produto.id}</td><td><strong>${escapeHtml(produto.nome)}</strong></td><td>${escapeHtml(produto.descricao)}</td><td>${TZ.fmt(produto.preco)}</td><td>${stockBadge(produto)}</td><td><button class="btn danger small" type="button" data-remove-product="${produto.id}">Remover</button></td></tr>
        `))}
      `;

      $("#admin-product-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const result = TZ.addProduct({
          nome: $("#adm-prod-name").value,
          preco: $("#adm-prod-price").value,
          quantidade: $("#adm-prod-stock").value,
          imagem: $("#adm-prod-image").value,
          descricao: $("#adm-prod-desc").value,
          descricao_completa: $("#adm-prod-full").value,
          especificacoes: $("#adm-prod-specs").value
        });
        toast(result.message, result.ok ? "success" : "error");
        if (result.ok) renderAdmin("produtos");
      });

      root.onclick = (event) => {
        const button = event.target.closest("[data-remove-product]");
        if (!button) return;
        const produto = TZ.getProduct(Number(button.dataset.removeProduct));
        if (!produto) return;
        if (!window.confirm(`Remover ${produto.nome} do catálogo?`)) return;
        const result = TZ.removeProduct(produto.id);
        toast(result.message, result.ok ? "success" : "error");
        if (result.ok) renderAdmin("produtos");
      };
    }

    if (section === "clientes") {
      root.innerHTML = `
        ${head("Clientes", "Dados cadastrais.")}
        ${table(["ID", "Nome", "E-mail", "Telefone", "Usuário"], TZ.state.clientes.map((cliente) => `
          <tr><td>#${cliente.id}</td><td><strong>${escapeHtml(cliente.nome)}</strong></td><td>${escapeHtml(cliente.email)}</td><td>${escapeHtml(cliente.telefone)}</td><td>${escapeHtml(cliente.usuario)}</td></tr>
        `))}
      `;
    }

    if (section === "pedidos") {
      root.innerHTML = `
        ${head("Pedidos", "Histórico consolidado de compras.")}
        ${table(["ID", "Cliente", "Itens", "Frete", "Seguro", "Total", "Status"], TZ.state.pedidos.map((pedido) => {
          const cliente = TZ.getClient(pedido.id_cliente);
          return `<tr><td>#${pedido.id}</td><td>${escapeHtml(cliente?.nome || "Cliente removido")}</td><td>${pedido.itens.map((item) => `${escapeHtml(item.nome)} x${item.quantidade}`).join("<br>")}</td><td>${TZ.fmt(pedido.frete.valor)}</td><td>${TZ.fmt(pedido.seguro)}</td><td><strong>${TZ.fmt(pedido.valor_total)}</strong></td><td>${pedido.pago ? "Pago" : "Pendente"}</td></tr>`;
        }))}
      `;
    }

    if (section === "chamados") {
      root.innerHTML = renderAdminTickets("");
      bindAdminTicketEvents();
    }

    if (section === "estoque") {
      root.innerHTML = `
        ${head("Estoque", "Entrada e saída de unidades com validação de disponibilidade.")}
        <form id="stock-form" class="admin-form">
          <h2>Movimentar estoque</h2>
          <div class="admin-form-grid">
            <label>ID do produto<input id="stock-product-id" type="number" min="1" required></label>
            <label>Quantidade<input id="stock-quantity" type="number" step="1" placeholder="Ex: 5 ou -2" required></label>
          </div>
          <button class="btn primary small" type="submit">Aplicar movimento</button>
        </form>
        ${table(["ID", "Produto", "Preço", "Estoque", "Status"], TZ.state.produtos.map((produto) => `
          <tr><td>#${produto.id}</td><td><strong>${escapeHtml(produto.nome)}</strong></td><td>${TZ.fmt(produto.preco)}</td><td>${produto.quantidade}</td><td>${stockBadge(produto)}</td></tr>
        `))}
      `;
      $("#stock-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const result = TZ.moveStock($("#stock-product-id").value, Number($("#stock-quantity").value));
        toast(result.message, result.ok ? "success" : "error");
        if (result.ok) renderAdmin("estoque");
      });
    }

    if (section === "vendas") {
      root.innerHTML = `
        ${head("Vendas", `Total vendido: ${TZ.fmt(totalVendido)}`)}
        ${table(["ID", "Pedido", "Produto", "Quantidade", "Valor"], TZ.state.vendas.map((venda) => {
          const produto = TZ.getProduct(venda.id_produto);
          return `<tr><td>#${venda.id}</td><td>#${venda.id_pedido}</td><td>${escapeHtml(produto?.nome || "Produto removido")}</td><td>${venda.quantidade}</td><td>${TZ.fmt(venda.valor_total)}</td></tr>`;
        }))}
      `;
    }

    if (section === "reajuste") {
      root.innerHTML = `
        ${head("Reajuste de preços", "Use percentual positivo para aumento e negativo para desconto.")}
        <form id="adjust-form" class="admin-form">
          <h2>Aplicar reajuste</h2>
          <div class="admin-form-grid">
            <label>ID do produto opcional<input id="adjust-product-id" type="number" min="1" placeholder="Vazio = todos"></label>
            <label>Percentual<input id="adjust-percent" type="number" step="0.01" required></label>
          </div>
          <button class="btn primary small" type="submit">Aplicar</button>
        </form>
        ${table(["ID", "Produto", "Preço atual", "Estoque"], TZ.state.produtos.map((produto) => `
          <tr><td>#${produto.id}</td><td><strong>${escapeHtml(produto.nome)}</strong></td><td>${TZ.fmt(produto.preco)}</td><td>${produto.quantidade}</td></tr>
        `))}
      `;
      $("#adjust-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const productId = $("#adjust-product-id").value ? Number($("#adjust-product-id").value) : null;
        const result = TZ.adjustPrices(productId, $("#adjust-percent").value);
        toast(result.message, result.ok ? "success" : "error");
        if (result.ok) renderAdmin("reajuste");
      });
    }
  }

  function initAdmin() {
    if (!TZ.requireAdmin()) return;
    renderAdmin("dashboard");
    $$(".admin-nav").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".admin-nav").forEach((item) => item.classList.toggle("active", item === button));
        renderAdmin(button.dataset.adminSection);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    if (page === "login") initLogin();
    if (page === "catalogo") initCatalog();
    if (page === "produto") initProduct();
    if (page === "comentarios") initCommentsPage();
    if (page === "pedidos") initOrders();
    if (page === "conta") initAccount();
    if (page === "fale-conosco") initSupport();
    if (page === "sobre") initAbout();
    if (page === "admin") initAdmin();
  });
})();

// PRODUTOS (Agora com suporte a múltiplas imagens para a Galeria)
const produtos = [
    { id: 1, nome: "Vestido Luz e Trevas", preco: 850.00, tipo: "vestido", img: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", "https://images.unsplash.com/photo-1583391733958-d2597d9e1151?w=500&q=80", "https://images.unsplash.com/photo-1509631179647-0c115821922f?w=500&q=80"], desc: "Um vestido esvoaçante que brinca com as sombras. Feito em seda nobre." },
    { id: 2, nome: "Blazer Dark Corporate", preco: 500.00, tipo: "casaco", img: ["https://images.unsplash.com/photo-1583391733958-d2597d9e1151?w=500&q=80"], desc: "A atitude de quem comanda a noite. Alfaiataria impecável e corte acinturado." },
    { id: 3, nome: "Conjunto Heretiça", preco: 850.00, tipo: "conjunto", img: ["https://images.unsplash.com/photo-1550614000-4b95d466f272?w=500&q=80"], desc: "Duas peças que se completam em um visual ousado e gótico." },
    { id: 4, nome: "Macacão Hora do Susto", preco: 1080.00, tipo: "macacao", img: ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&q=80"], desc: "Presença forte e inesquecível. Macacão longo com decote profundo." },
    { id: 5, nome: "Sobretudo Raixão", preco: 950.00, tipo: "casaco", img: ["https://images.unsplash.com/photo-1520975954732-57dd22299614?w=500&q=80"], desc: "Aqueça-se com estilo. Longo, misterioso e forrado." },
    { id: 6, nome: "Conjunto Adanis", preco: 1150.00, tipo: "conjunto", img: ["https://images.unsplash.com/photo-1495385794356-15371f348c31?w=500&q=80"], desc: "Estética urbana encontra a nobreza dos tecidos escuros." },
    { id: 7, nome: "Macacão Couro Sintético", preco: 800.00, tipo: "macacao", img: ["https://images.unsplash.com/photo-1485231183945-fc14442240e3?w=500&q=80"], desc: "Ousadia em forma de roupa. Acabamento brilhante e textura de couro." },
    { id: 8, nome: "Vestido Veludo Escuro", preco: 700.00, tipo: "vestido", img: ["https://images.unsplash.com/photo-1509631179647-0c115821922f?w=500&q=80"], desc: "Toque macio e visual impactante para noites especiais." }
];

let carrinho = JSON.parse(localStorage.getItem('db_carrinho')) || [];
let favoritos = JSON.parse(localStorage.getItem('db_favoritos')) || [];
let categoriaAtual = 'todos';
let tamanhoSelecionado = 'P';

// FUNÇÕES BÁSICAS E NAVEGAÇÃO
function formatarMoeda(v) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }
function showToast(msg) { const t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
function toggleMenu() { document.getElementById('sidebar').classList.toggle('active'); }

function navigate(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0,0);
    if (document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    
    if (pageId === 'cart') atualizarCarrinho();
    if (pageId === 'favoritos') renderizarFavoritos();
    if (pageId === 'minha-conta') carregarHistoricoPedidos();
}

// BUSCA, FILTRO E ORDENAÇÃO
function filtrarCategoria(tipo) {
    categoriaAtual = tipo;
    document.getElementById('input-busca').value = ''; // Limpa a busca ao trocar de categoria
    document.getElementById('sort-options').value = 'padrao';
    const titulo = document.getElementById('titulo-categoria');
    
    if(tipo === 'todos') titulo.innerText = "NOSSO ACERVO";
    else if(tipo === 'vestido') titulo.innerText = "VESTIDOS EXCLUSIVOS";
    else if(tipo === 'conjunto') titulo.innerText = "CONJUNTOS";
    else if(tipo === 'macacao') titulo.innerText = "MACACÕES";
    
    aplicarFiltros();
    navigate('home');
}

function aplicarFiltros() {
    let texto = document.getElementById('input-busca').value.toLowerCase();
    let ordem = document.getElementById('sort-options').value;
    
    // 1. Filtra por categoria
    let filtrados = categoriaAtual === 'todos' ? produtos : produtos.filter(p => p.tipo === categoriaAtual);
    
    // 2. Filtra por texto da barra de busca
    if (texto) filtrados = filtrados.filter(p => p.nome.toLowerCase().includes(texto));
    
    // 3. Ordena os produtos
    if(ordem === 'preco-asc') filtrados.sort((a,b) => a.preco - b.preco);
    if(ordem === 'preco-desc') filtrados.sort((a,b) => b.preco - a.preco);
    if(ordem === 'az') filtrados.sort((a,b) => a.nome.localeCompare(b.nome));

    renderizarGrade(filtrados, 'produtos-grid');
}

function renderizarGrade(lista, elementId) {
    const grid = document.getElementById(elementId);
    grid.innerHTML = '';
    
    if (lista.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#888; width:100%;">Nenhuma peça encontrada na escuridão.</p>';
        return;
    }

    lista.forEach(prod => {
        const isFav = favoritos.includes(prod.id) ? 'active' : '';
        // Pega a primeira imagem do array de imagens do produto
        const imagemPrincipal = Array.isArray(prod.img) ? prod.img[0] : prod.img;
        
        grid.innerHTML += `
            <div class="product-card">
                <i class="fas fa-heart btn-fav ${isFav}" onclick="toggleFavorito(${prod.id}, event)"></i>
                <img src="${imagemPrincipal}" onclick="abrirProduto(${prod.id})">
                <div class="product-title" onclick="abrirProduto(${prod.id})">${prod.nome}</div>
                <div class="product-price">${formatarMoeda(prod.preco)}</div>
            </div>
        `;
    });
}

// LISTA DE DESEJOS (WISH LIST)
function toggleFavorito(id, event) {
    event.stopPropagation(); // Evita clicar na foto por acidente
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(f => f !== id);
        showToast("Removido dos favoritos.");
    } else {
        favoritos.push(id);
        showToast("Adicionado aos favoritos!");
    }
    localStorage.setItem('db_favoritos', JSON.stringify(favoritos));
    aplicarFiltros(); // Atualiza corações na Home
    if(document.getElementById('favoritos').classList.contains('active')) renderizarFavoritos();
}

function renderizarFavoritos() {
    const listaFav = produtos.filter(p => favoritos.includes(p.id));
    renderizarGrade(listaFav, 'favoritos-grid');
}

// PÁGINA DE PRODUTO E GALERIA
function abrirProduto(id) {
    const prod = produtos.find(p => p.id === id);
    const imagemPrincipal = Array.isArray(prod.img) ? prod.img[0] : prod.img;
    
    document.getElementById('detalhe-img').src = imagemPrincipal;
    document.getElementById('detalhe-nome').innerText = prod.nome;
    document.getElementById('detalhe-preco').innerText = formatarMoeda(prod.preco);
    document.getElementById('detalhe-desc').innerText = prod.desc;
    
    // Gera as miniaturas (Se houver mais de uma foto)
    const thumbsContainer = document.getElementById('detalhe-thumbnails');
    thumbsContainer.innerHTML = '';
    if (Array.isArray(prod.img)) {
        prod.img.forEach(url => {
            thumbsContainer.innerHTML += `<img src="${url}" onclick="document.getElementById('detalhe-img').src = '${url}'">`;
        });
    }
    
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.size-btn').classList.add('active');
    tamanhoSelecionado = 'P';

    document.getElementById('btn-add-detalhe').onclick = () => adicionarAoCarrinho(prod.id);
    navigate('produto-detalhe');
}

function selecionarTamanho(btn, tam) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tamanhoSelecionado = tam;
}

// CARRINHO DE COMPRAS E PEDIDOS
function salvarCarrinho() {
    localStorage.setItem('db_carrinho', JSON.stringify(carrinho));
    atualizarIconeCarrinho();
}

function atualizarIconeCarrinho() {
    const count = document.getElementById('cart-count');
    const totalItems = carrinho.reduce((acc, item) => acc + item.qtd, 0);
    count.style.display = totalItems > 0 ? 'block' : 'none';
    count.innerText = totalItems;
}

function adicionarAoCarrinho(id) {
    const produto = produtos.find(p => p.id === id);
    const itemExistente = carrinho.find(p => p.id === id && p.tamanho === tamanhoSelecionado);
    
    if(itemExistente) itemExistente.qtd++;
    else carrinho.push({...produto, qtd: 1, tamanho: tamanhoSelecionado, imgUnica: Array.isArray(produto.img) ? produto.img[0] : produto.img});
    
    salvarCarrinho();
    showToast(`${produto.nome} adicionado ao carrinho!`);
}

function atualizarCarrinho() {
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-display');
    container.innerHTML = ''; let total = 0;

    if(carrinho.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach((item, index) => {
            const subtotal = item.preco * item.qtd;
            total += subtotal;
            container.innerHTML += `
                <div class="cart-item">
                    <div style="display:flex; align-items:center;">
                        <img src="${item.imgUnica}" style="width: 50px; height: 70px; object-fit: cover; margin-right: 15px;">
                        <div>
                            <div style="font-family: var(--font-logo);">${item.nome}</div>
                            <div style="color: #aaa; font-size: 0.9rem;">Tam: ${item.tamanho} | Qtd: ${item.qtd}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="color: var(--accent-rose); font-weight:bold;">${formatarMoeda(subtotal)}</div>
                        <i class="fas fa-trash" style="cursor:pointer; color:#777;" onclick="removerDoCarrinho(${index})"></i>
                    </div>
                </div>
            `;
        });
    }
    totalDisplay.innerHTML = `Total: ${formatarMoeda(total)}`;
}

function removerDoCarrinho(index) { carrinho.splice(index, 1); salvarCarrinho(); atualizarCarrinho(); }

function goToCheckout() { 
    if(carrinho.length === 0) return showToast("Carrinho vazio!"); 
    if(localStorage.getItem('db_usuarioLogado')) navigate('checkout');
    else { showToast("Faça login para finalizar a compra."); navigate('login'); }
}

function processarPagamento() {
    const userLogado = JSON.parse(localStorage.getItem('db_usuarioLogado'));
    
    // Salva o pedido no Histórico
    let pedidos = JSON.parse(localStorage.getItem('db_pedidos_' + userLogado.email)) || [];
    let total = carrinho.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    
    pedidos.push({
        data: new Date().toLocaleDateString(),
        codigo: Math.floor(Math.random() * 1000000),
        valor: total,
        status: "Preparando Envio"
    });
    
    localStorage.setItem('db_pedidos_' + userLogado.email, JSON.stringify(pedidos));

    showToast("Pagamento Aprovado! Verifique seus pedidos na Minha Conta.");
    carrinho = []; 
    salvarCarrinho();
    setTimeout(() => navigate('minha-conta'), 2500);
}

// SISTEMA DE USUÁRIOS E HISTÓRICO
function toggleAuthForm(tipo) {
    document.getElementById('form-login').style.display = tipo === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tipo === 'register' ? 'block' : 'none';
}

function criarConta() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    if(!nome || !email || !senha) return showToast("Preencha todos os campos!");
    
    const usuario = { nome, email, senha };
    localStorage.setItem('db_usuario_' + email, JSON.stringify(usuario));
    showToast("Conta criada! Faça o login.");
    toggleAuthForm('login');
}

function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const usuarioSalvo = localStorage.getItem('db_usuario_' + email);
    
    if(usuarioSalvo) {
        const dados = JSON.parse(usuarioSalvo);
        if(dados.senha === senha) {
            localStorage.setItem('db_usuarioLogado', JSON.stringify(dados));
            showToast(`Bem-vinda, ${dados.nome}!`);
            atualizarInterfaceLogin();
            if(carrinho.length > 0) navigate('cart');
            else navigate('home');
        } else { showToast("Senha incorreta."); }
    } else { showToast("Usuário não encontrado."); }
}

function fazerLogout() {
    localStorage.removeItem('db_usuarioLogado');
    atualizarInterfaceLogin();
    showToast("Você saiu da conta.");
    navigate('home');
}

function atualizarInterfaceLogin() {
    const userLogado = localStorage.getItem('db_usuarioLogado');
    const saudacao = document.getElementById('user-greeting');
    const iconeLogin = document.getElementById('icon-login');

    if(userLogado) {
        const dados = JSON.parse(userLogado);
        saudacao.innerText = `Olá, ${dados.nome.split(' ')[0]}`;
        saudacao.style.display = 'block';
        iconeLogin.style.display = 'none';
        
        if(document.getElementById('perfil-nome')){
            document.getElementById('perfil-nome').innerText = dados.nome;
            document.getElementById('perfil-email').innerText = dados.email;
        }
    } else {
        saudacao.style.display = 'none';
        iconeLogin.style.display = 'block';
    }
}

function carregarHistoricoPedidos() {
    const userLogado = JSON.parse(localStorage.getItem('db_usuarioLogado'));
    const container = document.getElementById('historico-pedidos');
    
    if(!userLogado) return;

    const pedidos = JSON.parse(localStorage.getItem('db_pedidos_' + userLogado.email)) || [];
    container.innerHTML = '';

    if(pedidos.length === 0) {
        container.innerHTML = '<p style="color:#aaa;">Você ainda não fez nenhum pedido conosco.</p>';
    } else {
        pedidos.reverse().forEach(ped => {
            container.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 3px solid var(--accent-rose);">
                    <div style="display:flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong>Pedido #${ped.codigo}</strong>
                        <span style="color: var(--accent-rose);">${formatarMoeda(ped.valor)}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: #888;">
                        Data: ${ped.data} <br>
                        Status: <span style="color: #fff;">${ped.status}</span>
                    </div>
                </div>
            `;
        });
    }
}

function verificarLoginClick() {
    if(localStorage.getItem('db_usuarioLogado')) navigate('minha-conta');
    else navigate('login');
}

// INICIALIZAÇÃO DA PÁGINA
window.onload = () => {
    aplicarFiltros();
    atualizarInterfaceLogin();
    atualizarIconeCarrinho();
};

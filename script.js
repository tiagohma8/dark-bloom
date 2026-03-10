// IMPORTAÇÕES DO FIREBASE (SDK Moderno v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// COLOQUE AS SUAS CHAVES AQUI (Copie do Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDVDwBe1zk5NvpSGvryn8INzfSjOUsaX7s",
  authDomain: "dark-bloom-a5f2a.firebaseapp.com",
  projectId: "dark-bloom-a5f2a",
  storageBucket: "dark-bloom-a5f2a.firebasestorage.app",
  messagingSenderId: "729629680341",
  appId: "1:729629680341:web:12562654c78bc9fe3db85c"
};


// INICIALIZAÇÃO
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// BANCO DE DADOS DE PRODUTOS
const produtos = [
    { id: 1, nome: "Vestido Luz e Trevas", preco: 850.00, tipo: "vestido", img: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", "https://images.unsplash.com/photo-1583391733958-d2597d9e1151?w=500&q=80"], desc: "Um vestido esvoaçante que brinca com as sombras. Feito em seda nobre." },
    { id: 2, nome: "Blazer Dark Corporate", preco: 500.00, tipo: "casaco", img: ["https://images.unsplash.com/photo-1583391733958-d2597d9e1151?w=500&q=80"], desc: "A atitude de quem comanda a noite. Alfaiataria impecável e corte acinturado." },
    { id: 3, nome: "Conjunto Heretiça", preco: 850.00, tipo: "conjunto", img: ["https://images.unsplash.com/photo-1550614000-4b95d466f272?w=500&q=80"], desc: "Duas peças que se completam em um visual ousado e gótico." },
    { id: 4, nome: "Macacão Hora do Susto", preco: 1080.00, tipo: "macacao", img: ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&q=80"], desc: "Presença forte e inesquecível. Macacão longo com decote profundo." },
    { id: 5, nome: "Sobretudo Raixão", preco: 950.00, tipo: "casaco", img: ["https://images.unsplash.com/photo-1520975954732-57dd22299614?w=500&q=80"], desc: "Aqueça-se com estilo. Longo, misterioso e forrado." },
    { id: 6, nome: "Conjunto Adanis", preco: 1150.00, tipo: "conjunto", img: ["https://images.unsplash.com/photo-1495385794356-15371f348c31?w=500&q=80"], desc: "Estética urbana encontra a nobreza dos tecidos escuros." },
    { id: 7, nome: "Macacão Couro Sintético", preco: 800.00, tipo: "macacao", img: ["https://images.unsplash.com/photo-1485231183945-fc14442240e3?w=500&q=80"], desc: "Ousadia em forma de roupa. Acabamento brilhante e textura de couro." },
    { id: 8, nome: "Vestido Veludo Escuro", preco: 700.00, tipo: "vestido", img: ["https://images.unsplash.com/photo-1509631179647-0c115821922f?w=500&q=80"], desc: "Toque macio e visual impactante para noites especiais." }
];

// VARIÁVEIS DE ESTADO
let usuarioLogadoData = null;
let carrinho = JSON.parse(localStorage.getItem('db_carrinho')) || [];
let favoritos = JSON.parse(localStorage.getItem('db_favoritos')) || [];
let categoriaAtual = 'todos';
let tamanhoSelecionado = 'P';

// FUNÇÕES DE UTILIDADE
const formatarMoeda = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const showToast = (msg) => { const t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); };

// NAVEGAÇÃO
window.navigate = function(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0,0);
    if (document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    
    if (pageId === 'cart') atualizarCarrinho();
    if (pageId === 'favoritos') renderizarFavoritos();
    if (pageId === 'minha-conta') carregarHistoricoPedidos();
};

window.toggleMenu = () => document.getElementById('sidebar').classList.toggle('active');

// BUSCA E FILTROS
window.filtrarCategoria = (tipo) => {
    categoriaAtual = tipo;
    document.getElementById('input-busca').value = '';
    document.getElementById('titulo-categoria').innerText = tipo === 'todos' ? "NOSSO ACERVO" : tipo.toUpperCase();
    aplicarFiltros();
    navigate('home');
};

window.aplicarFiltros = () => {
    let texto = document.getElementById('input-busca').value.toLowerCase();
    let ordem = document.getElementById('sort-options').value;
    let filtrados = categoriaAtual === 'todos' ? produtos : produtos.filter(p => p.tipo === categoriaAtual);
    if (texto) filtrados = filtrados.filter(p => p.nome.toLowerCase().includes(texto));
    
    if(ordem === 'preco-asc') filtrados.sort((a,b) => a.preco - b.preco);
    if(ordem === 'preco-desc') filtrados.sort((a,b) => b.preco - a.preco);
    if(ordem === 'az') filtrados.sort((a,b) => a.nome.localeCompare(b.nome));

    renderizarGrade(filtrados, 'produtos-grid');
};

function renderizarGrade(lista, elementId) {
    const grid = document.getElementById(elementId);
    grid.innerHTML = lista.length ? '' : '<p style="text-align:center; color:#888; width:100%;">Nenhuma peça encontrada.</p>';
    lista.forEach(prod => {
        const isFav = favoritos.includes(prod.id) ? 'active' : '';
        grid.innerHTML += `
            <div class="product-card">
                <i class="fas fa-heart btn-fav ${isFav}" onclick="toggleFavorito(${prod.id}, event)"></i>
                <img src="${prod.img[0]}" onclick="abrirProduto(${prod.id})">
                <div class="product-title" onclick="abrirProduto(${prod.id})">${prod.nome}</div>
                <div class="product-price">${formatarMoeda(prod.preco)}</div>
            </div>`;
    });
}

// FAVORITOS
window.toggleFavorito = (id, event) => {
    event.stopPropagation();
    favoritos = favoritos.includes(id) ? favoritos.filter(f => f !== id) : [...favoritos, id];
    localStorage.setItem('db_favoritos', JSON.stringify(favoritos));
    aplicarFiltros();
    showToast(favoritos.includes(id) ? "Adicionado aos favoritos!" : "Removido.");
};

function renderizarFavoritos() {
    renderizarGrade(produtos.filter(p => favoritos.includes(p.id)), 'favoritos-grid');
}

// PRODUTO DETALHE
window.abrirProduto = (id) => {
    const prod = produtos.find(p => p.id === id);
    document.getElementById('detalhe-img').src = prod.img[0];
    document.getElementById('detalhe-nome').innerText = prod.nome;
    document.getElementById('detalhe-preco').innerText = formatarMoeda(prod.preco);
    document.getElementById('detalhe-desc').innerText = prod.desc;
    
    const thumbs = document.getElementById('detalhe-thumbnails');
    thumbs.innerHTML = '';
    prod.img.forEach(url => { thumbs.innerHTML += `<img src="${url}" onclick="document.getElementById('detalhe-img').src='${url}'">`; });
    
    tamanhoSelecionado = 'P';
    document.getElementById('btn-add-detalhe').onclick = () => adicionarAoCarrinho(prod.id);
    navigate('produto-detalhe');
};

window.selecionarTamanho = (btn, tam) => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tamanhoSelecionado = tam;
};

// CARRINHO
window.adicionarAoCarrinho = (id) => {
    const prod = produtos.find(p => p.id === id);
    carrinho.push({...prod, tamanho: tamanhoSelecionado, imgUnica: prod.img[0], qtd: 1});
    localStorage.setItem('db_carrinho', JSON.stringify(carrinho));
    atualizarIconeCarrinho();
    showToast("Adicionado ao carrinho!");
};

function atualizarIconeCarrinho() {
    const count = document.getElementById('cart-count');
    count.style.display = carrinho.length ? 'block' : 'none';
    count.innerText = carrinho.length;
}

function atualizarCarrinho() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = carrinho.length ? '' : '<p style="text-align:center;">Vazio.</p>';
    let total = 0;
    carrinho.forEach((item, i) => {
        total += item.preco;
        container.innerHTML += `<div class="cart-item">
            <span>${item.nome} (${item.tamanho})</span>
            <span>${formatarMoeda(item.preco)} <i class="fas fa-trash" onclick="removerDoCarrinho(${i})"></i></span>
        </div>`;
    });
    document.getElementById('cart-total-display').innerText = `Total: ${formatarMoeda(total)}`;
}

window.removerDoCarrinho = (i) => { carrinho.splice(i, 1); localStorage.setItem('db_carrinho', JSON.stringify(carrinho)); atualizarCarrinho(); atualizarIconeCarrinho(); };

window.goToCheckout = () => {
    if(!usuarioLogadoData) { showToast("Faça login primeiro."); return navigate('login'); }
    if(!carrinho.length) return showToast("Carrinho vazio.");
    navigate('checkout');
};

// FIREBASE: AUTENTICAÇÃO
onAuthStateChanged(auth, (user) => {
    usuarioLogadoData = user;
    const saudacao = document.getElementById('user-greeting');
    const icone = document.getElementById('icon-login');
    if(user) {
        saudacao.innerText = `Olá, ${localStorage.getItem('nome_'+user.email) || 'Cliente'}`;
        saudacao.style.display = 'block'; icone.style.display = 'none';
    } else {
        saudacao.style.display = 'none'; icone.style.display = 'block';
    }
});

window.criarConta = async () => {
    const n = document.getElementById('reg-nome').value, e = document.getElementById('reg-email').value, s = document.getElementById('reg-senha').value;
    try {
        await createUserWithEmailAndPassword(auth, e, s);
        localStorage.setItem('nome_'+e, n);
        showToast("Sucesso!"); toggleAuthForm('login');
    } catch (err) { showToast("Erro ao criar conta."); }
};

window.fazerLogin = async () => {
    const e = document.getElementById('login-email').value, s = document.getElementById('login-senha').value;
    try { await signInWithEmailAndPassword(auth, e, s); navigate('home'); } catch (err) { showToast("Login falhou."); }
};

window.fazerLogout = async () => { await signOut(auth); navigate('home'); };

window.toggleAuthForm = (t) => {
    document.getElementById('form-login').style.display = t === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = t === 'register' ? 'block' : 'none';
};

window.verificarLoginClick = () => usuarioLogadoData ? navigate('minha-conta') : navigate('login');

// FIREBASE: FIRESTORE (PEDIDOS)
window.processarPagamento = async () => {
    const total = carrinho.reduce((acc, i) => acc + i.preco, 0);
    const pedido = { email: usuarioLogadoData.email, valor: total, data: new Date().toLocaleDateString(), status: "Aprovado", codigo: Math.floor(Math.random()*10000) };
    try {
        await addDoc(collection(db, "pedidos"), pedido);
        carrinho = []; localStorage.setItem('db_carrinho', '[]');
        showToast("Compra finalizada!"); navigate('minha-conta');
    } catch (err) { showToast("Erro no banco de dados."); }
};

window.carregarHistoricoPedidos = async () => {
    const container = document.getElementById('historico-pedidos');
    container.innerHTML = "Carregando...";
    const q = query(collection(db, "pedidos"), where("email", "==", usuarioLogadoData.email));
    const snap = await getDocs(q);
    container.innerHTML = snap.empty ? "Nenhum pedido." : "";
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `<div class="review-card">Pedido #${p.codigo} - ${p.data}<br>Total: ${formatarMoeda(p.valor)} - <strong>${p.status}</strong></div>`;
    });
};

// INICIAR
window.onload = () => { aplicarFiltros(); atualizarIconeCarrinho(); };

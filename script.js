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


// INICIALIZAÇÃO DO FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// VARIAVEIS GLOBAIS
let usuarioLogadoData = null; // Guarda os dados do usuário atual
let carrinho = JSON.parse(localStorage.getItem('db_carrinho')) || [];
let categoriaAtual = 'todos';
let tamanhoSelecionado = 'P';

// --- (O CÓDIGO DE PRODUTOS, FILTROS, CARRINHO E RENDERIZAÇÃO CONTINUA O MESMO AQUI) ---
// Mantenha os arrays de produtos e as funções navigate(), formatarMoeda(), showToast(), 
// renderizarGrade(), toggleMenu(), filtrarCategoria(), aplicarFiltros(), abrirProduto() 
// e todo o sistema do Carrinho exatamente como estavam antes. 
// O que muda é a parte de Autenticação e Finalização de Compra abaixo:

// ---------------------------------------------------------
// NOVO SISTEMA DE USUÁRIOS COM FIREBASE AUTH
// ---------------------------------------------------------

// Monitora se o usuário está logado ou não em tempo real
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioLogadoData = user;
        atualizarInterfaceLogin(user);
    } else {
        usuarioLogadoData = null;
        atualizarInterfaceLogin(null);
    }
});

// A função de botões do HTML precisam ser anexadas ao window no formato Module
window.criarConta = async function() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    
    if(!nome || !email || !senha) return showToast("Preencha todos os campos!");
    
    try {
        // Cria no Firebase
        await createUserWithEmailAndPassword(auth, email, senha);
        // Salvamos o nome no localStorage só por conveniência visual imediata
        localStorage.setItem(`nome_${email}`, nome); 
        showToast("Conta criada com sucesso!");
        toggleAuthForm('login');
    } catch (error) {
        showToast("Erro: " + error.message);
    }
}

window.fazerLogin = async function() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, senha);
        showToast(`Bem-vinda de volta!`);
        if(carrinho.length > 0) navigate('cart');
        else navigate('home');
    } catch (error) {
        showToast("E-mail ou senha incorretos.");
    }
}

window.fazerLogout = async function() {
    await signOut(auth);
    showToast("Você saiu da conta.");
    navigate('home');
}

function atualizarInterfaceLogin(user) {
    const saudacao = document.getElementById('user-greeting');
    const iconeLogin = document.getElementById('icon-login');

    if(user) {
        // Tenta pegar o nome salvo ou usa o início do e-mail
        let nomeDisplay = localStorage.getItem(`nome_${user.email}`) || user.email.split('@')[0];
        saudacao.innerText = `Olá, ${nomeDisplay}`;
        saudacao.style.display = 'block';
        iconeLogin.style.display = 'none';
        
        if(document.getElementById('perfil-nome')){
            document.getElementById('perfil-nome').innerText = nomeDisplay;
            document.getElementById('perfil-email').innerText = user.email;
        }
    } else {
        saudacao.style.display = 'none';
        iconeLogin.style.display = 'block';
    }
}

window.verificarLoginClick = function() {
    if(usuarioLogadoData) navigate('minha-conta');
    else navigate('login');
}

// ---------------------------------------------------------
// NOVO SISTEMA DE COMPRAS COM FIREBASE FIRESTORE (BANCO DE DADOS)
// ---------------------------------------------------------

window.processarPagamento = async function() {
    if(!usuarioLogadoData) return showToast("Faça login para comprar.");
    
    let total = carrinho.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    
    const pedido = {
        email_cliente: usuarioLogadoData.email,
        data: new Date().toLocaleDateString(),
        codigo: Math.floor(Math.random() * 1000000),
        valor: total,
        itens: carrinho,
        status: "Preparando Envio"
    };
    
    try {
        // Salva na coleção "pedidos" do Firebase Firestore
        await addDoc(collection(db, "pedidos"), pedido);
        
        showToast("Pagamento Aprovado! Pedido salvo no sistema.");
        carrinho = []; 
        localStorage.setItem('db_carrinho', JSON.stringify([]));
        atualizarCarrinho();
        atualizarIconeCarrinho();
        
        setTimeout(() => navigate('minha-conta'), 2500);
    } catch (e) {
        showToast("Erro ao processar pedido: " + e.message);
    }
}

window.carregarHistoricoPedidos = async function() {
    const container = document.getElementById('historico-pedidos');
    if(!usuarioLogadoData) return;

    container.innerHTML = '<p style="color:#aaa;">Buscando pedidos na nuvem...</p>';

    try {
        // Busca no banco de dados apenas os pedidos deste e-mail
        const q = query(collection(db, "pedidos"), where("email_cliente", "==", usuarioLogadoData.email));
        const querySnapshot = await getDocs(q);
        
        container.innerHTML = '';
        
        if(querySnapshot.empty) {
            container.innerHTML = '<p style="color:#aaa;">Você ainda não fez nenhum pedido conosco.</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const ped = doc.data();
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
    } catch (e) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar pedidos.</p>';
    }
}

// Para garantir que o resto do código antigo rode na nova estrutura:
window.navigate = navigate;
window.toggleMenu = toggleMenu;
window.filtrarCategoria = filtrarCategoria;
window.aplicarFiltros = aplicarFiltros;
window.abrirProduto = abrirProduto;
window.selecionarTamanho = selecionarTamanho;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.goToCheckout = goToCheckout;
window.toggleAuthForm = toggleAuthForm;
// Certifique-se de colar o restante das funções do script antigo no topo (produtos, filtros, carrinho)!

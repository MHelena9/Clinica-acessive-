(function () {
    const pagina = document.documentElement;
    const statusAcessibilidade = document.getElementById('acessibilidade-status');

    try {
        if (localStorage.getItem('acessibilidade-texto') === '1') pagina.classList.add('texto-medio');
        if (localStorage.getItem('acessibilidade-texto') === '2') pagina.classList.add('texto-grande');
        if (localStorage.getItem('acessibilidade-contraste') === '1') pagina.classList.add('contraste-alto');
    } catch (erro) {}

    function anunciar(mensagem) {
        if (statusAcessibilidade) statusAcessibilidade.textContent = mensagem;
    }

    let tamanho = pagina.classList.contains('texto-grande') ? 2 : pagina.classList.contains('texto-medio') ? 1 : 0;
    const botaoMenos = document.getElementById('acessibilidade-diminuir');
    const botaoMais = document.getElementById('acessibilidade-aumentar');
    const botaoContraste = document.getElementById('acessibilidade-contraste');

    if (botaoContraste) {
        botaoContraste.setAttribute('aria-pressed', String(pagina.classList.contains('contraste-alto')));
    }

    // A home carrega script.js e mockup.js. Dois ouvintes no mesmo botão ligam e desligam o contraste no mesmo clique.
    let scriptPrincipalNaPagina = !!window.mlAcessibilidadePronta;
    const scriptsDaPagina = document.getElementsByTagName('script');
    for (let i = 0; i < scriptsDaPagina.length; i++) {
        const origem = scriptsDaPagina[i].getAttribute('src') || '';
        if (origem.indexOf('script.js') !== -1) scriptPrincipalNaPagina = true;
    }
    if (!scriptPrincipalNaPagina) {
        if (botaoMenos) {
            botaoMenos.addEventListener('click', function () {
                if (tamanho === 0) {
                    anunciar('O texto já está no tamanho padrão.');
                    return;
                }
                tamanho -= 1;
                pagina.classList.remove('texto-medio', 'texto-grande');
                if (tamanho === 1) pagina.classList.add('texto-medio');
                try { localStorage.setItem('acessibilidade-texto', String(tamanho)); } catch (erro) {}
                anunciar('Tamanho do texto diminuído.');
            });
        }

        if (botaoMais) {
            botaoMais.addEventListener('click', function () {
                if (tamanho === 2) {
                    anunciar('O texto já está no tamanho máximo.');
                    return;
                }
                tamanho += 1;
                pagina.classList.remove('texto-medio', 'texto-grande');
                pagina.classList.add(tamanho === 1 ? 'texto-medio' : 'texto-grande');
                try { localStorage.setItem('acessibilidade-texto', String(tamanho)); } catch (erro) {}
                anunciar('Tamanho do texto aumentado.');
            });
        }

        if (botaoContraste) {
            botaoContraste.addEventListener('click', function () {
                const ativo = pagina.classList.toggle('contraste-alto');
                botaoContraste.setAttribute('aria-pressed', String(ativo));
                try { localStorage.setItem('acessibilidade-contraste', ativo ? '1' : '0'); } catch (erro) {}
                anunciar(ativo ? 'Alto contraste ativado.' : 'Cores originais restauradas.');
            });
        }

        const botaoLibras = document.getElementById('acessibilidade-libras');
        const botaoLeitor = document.getElementById('acessibilidade-leitor');
        let leituraAtiva = false;

        function hostVLibras() {
            const elementos = document.querySelectorAll('div');
            for (let i = 0; i < elementos.length; i++) {
                const sombra = elementos[i].shadowRoot;
                if (sombra && sombra.getElementById('vlibras-button')) {
                    return elementos[i];
                }
            }
            return null;
        }

        function marcarHostVLibras() {
            const host = hostVLibras();
            if (host) host.classList.add('vlibras-flutuante');
        }

        if (botaoLibras) {
            botaoLibras.addEventListener('click', function () {
                const host = hostVLibras();
                if (!host) {
                    anunciar('O tradutor de Libras não carregou. Verifique sua conexão com a internet.');
                    return;
                }
                const botaoVLibras = host.shadowRoot.getElementById('vlibras-button');
                const ativo = botaoLibras.getAttribute('aria-pressed') !== 'true';
                if (ativo) pagina.classList.add('libras-ativo');
                botaoVLibras.click();
                botaoLibras.setAttribute('aria-pressed', String(ativo));
                if (ativo) {
                    anunciar('Tradutor de Libras ativado.');
                } else {
                    pagina.classList.remove('libras-ativo');
                    anunciar('Tradutor de Libras fechado.');
                }
            });
        }

        if (botaoLeitor) {
            botaoLeitor.addEventListener('click', function () {
                if (!window.speechSynthesis) {
                    anunciar('Seu navegador não oferece leitura em voz alta.');
                    return;
                }
                if (leituraAtiva) {
                    speechSynthesis.cancel();
                    leituraAtiva = false;
                    botaoLeitor.setAttribute('aria-pressed', 'false');
                    anunciar('Leitura em voz alta interrompida.');
                    return;
                }
                const conteudo = document.getElementById('conteudo-principal');
                const fala = new SpeechSynthesisUtterance(conteudo ? conteudo.innerText : document.body.innerText);
                fala.lang = 'pt-BR';
                fala.rate = 1;
                fala.onend = function () {
                    leituraAtiva = false;
                    botaoLeitor.setAttribute('aria-pressed', 'false');
                    anunciar('Leitura em voz alta concluída.');
                };
                leituraAtiva = true;
                botaoLeitor.setAttribute('aria-pressed', 'true');
                anunciar('Leitura em voz alta iniciada.');
                speechSynthesis.speak(fala);
            });
        }

        if (window.VLibras) {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
        }
        window.addEventListener('load', function () {
            marcarHostVLibras();
            setTimeout(marcarHostVLibras, 1000);
        });
    }

    const botaoSair = document.getElementById('botao-sair');
    if (botaoSair) {
        botaoSair.addEventListener('click', function () {
            try { localStorage.removeItem('ml-sessao'); } catch (erro) {}
            window.location.href = 'entrar.html';
        });
    }

    const linkEntrar = document.getElementById('link-entrar');
    const linkCriar = document.getElementById('link-criar');
    if (linkEntrar) {
        try {
            const sessao = JSON.parse(localStorage.getItem('ml-sessao') || 'null');
            if (sessao && sessao.papel === 'paciente') {
                linkEntrar.href = 'conta.html';
                linkEntrar.textContent = 'Minha conta';
                if (linkCriar) linkCriar.hidden = true;
            } else if (sessao && (sessao.papel === 'secretaria' || sessao.papel === 'admin')) {
                linkEntrar.href = 'painel.html?papel=' + sessao.papel;
                linkEntrar.textContent = 'Painel';
                if (linkCriar) linkCriar.hidden = true;
            }
        } catch (erro) {}
    }
})();

const CONTAS = {
    'paciente@ml.com': { senha: '123456', nome: 'Ana Souza', papel: 'paciente' },
    'paula@ml.com': { senha: '123456', nome: 'Paula', papel: 'secretaria' },
    'admin@ml.com': { senha: '123456', nome: 'Administração', papel: 'admin' }
};

const PEDIDOS_INICIAIS = [
    { id: 'p1', paciente: 'Ana Souza', especialista: 'Dra. Maria Luiza — Clínica Geral', data: '16/10/2026', turno: 'Manhã (8h às 12h)', status: 'Confirmado' },
    { id: 'p2', paciente: 'Ana Souza', especialista: 'Dr. Carlos Silva — Implantodontia', data: '20/10/2026', turno: 'Tarde (13h às 18h)', status: 'Pendente' },
    { id: 'p3', paciente: 'João Lima', especialista: 'Dra. Ana Costa — Ortodontia', data: '17/10/2026', turno: 'Tarde (13h às 18h)', status: 'Pendente' },
    { id: 'p4', paciente: 'Carla Mendes', especialista: 'Dr. Roberto Mendes — Endodontia', data: '20/10/2026', turno: 'Manhã (8h às 12h)', status: 'Pendente' }
];

function obterPedidos() {
    try {
        const salvo = localStorage.getItem('ml-pedidos');
        if (salvo) return JSON.parse(salvo);
    } catch (erro) {}
    return PEDIDOS_INICIAIS.slice();
}

function salvarPedidos(lista) {
    try { localStorage.setItem('ml-pedidos', JSON.stringify(lista)); } catch (erro) {}
}

function obterSessao() {
    try { return JSON.parse(localStorage.getItem('ml-sessao') || 'null'); } catch (erro) { return null; }
}

function gravarSessao(email) {
    const conta = CONTAS[email];
    if (!conta) return null;
    const dados = { email: email, nome: conta.nome, papel: conta.papel };
    try { localStorage.setItem('ml-sessao', JSON.stringify(dados)); } catch (erro) {}
    return dados;
}

function irParaArea(papel) {
    if (papel === 'paciente') {
        window.location.href = 'conta.html';
    } else {
        window.location.href = 'painel.html?papel=' + papel;
    }
}

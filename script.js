// MENU MOBILE
// Mantém aria-expanded sincronizado para leitores de tela
// saberem se o menu está aberto ou fechado.
// ==================================================

const botaoMenu = document.querySelector('.menu-alternar');
const listaMenu = document.getElementById('menu-lista-principal');

if (botaoMenu && listaMenu) {
    botaoMenu.addEventListener('click', function () {
        const aberto = botaoMenu.getAttribute('aria-expanded') === 'true';
        botaoMenu.setAttribute('aria-expanded', String(!aberto));
        listaMenu.classList.toggle('menu-lista--aberto');
    });

    listaMenu.addEventListener('click', function (evento) {
        if (evento.target.tagName === 'A') {
            botaoMenu.setAttribute('aria-expanded', 'false');
            listaMenu.classList.remove('menu-lista--aberto');
        }
    });
}


// ==================================================
// BARRA DE ACESSIBILIDADE
// A-, A+, contraste, Libras e leitura em voz alta.
// ==================================================

const pagina = document.documentElement;
const botaoDiminuirTexto = document.getElementById('acessibilidade-diminuir');
const botaoAumentarTexto = document.getElementById('acessibilidade-aumentar');
const botaoContraste = document.getElementById('acessibilidade-contraste');
const botaoLibras = document.getElementById('acessibilidade-libras');
const botaoLeitor = document.getElementById('acessibilidade-leitor');
const statusAcessibilidade = document.getElementById('acessibilidade-status');

let tamanhoTexto = 0;
let leituraAtiva = false;

function anunciarAcessibilidade(mensagem) {
    statusAcessibilidade.textContent = mensagem;
}

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

    if (host) {
        host.classList.add('vlibras-flutuante');
    }
}

function aplicarTamanhoTexto() {
    pagina.classList.remove('texto-medio', 'texto-grande');

   if (tamanhoTexto === 1) {
        pagina.classList.add('texto-medio');
    }

    if (tamanhoTexto === 2) {
        pagina.classList.add('texto-grande');
    }

    try {
        localStorage.setItem('acessibilidade-texto', String(tamanhoTexto));
   } catch (erro) {
        // Sem localStorage, a escolha vale só enquanto a página estiver aberta
    }
}

function sincronizarContraste() {
    if (!botaoContraste) return;
    const ativo = pagina.classList.contains('contraste-alto');
    botaoContraste.setAttribute('aria-pressed', String(ativo));
}

if (pagina.classList.contains('texto-grande')) {
    tamanhoTexto = 2;
} else if (pagina.classList.contains('texto-medio')) {
    tamanhoTexto = 1;
}

sincronizarContraste();


botaoDiminuirTexto.addEventListener('click', function () {
    if (tamanhoTexto === 0) {
        anunciarAcessibilidade('O texto já está no tamanho padrão.');
        return;
    }

    tamanhoTexto = tamanhoTexto - 1;
    aplicarTamanhoTexto();
    anunciarAcessibilidade('Tamanho do texto diminuído.');
});
botaoAumentarTexto.addEventListener('click', function () {
    if (tamanhoTexto === 2) {
        anunciarAcessibilidade('O texto já está no tamanho máximo.');
        return;
    }

    tamanhoTexto = tamanhoTexto + 1;
    aplicarTamanhoTexto();
    anunciarAcessibilidade('Tamanho do texto aumentado.');
});

if (botaoContraste) {
    botaoContraste.addEventListener('click', function () {
        const ativo = pagina.classList.toggle('contraste-alto');

        botaoContraste.setAttribute('aria-pressed', String(ativo));

        try {
            localStorage.setItem('acessibilidade-contraste', ativo ? '1' : '0');
        } catch (erro) {
           // Sem localStorage, a escolha vale só enquanto a página estiver aberta
        }

        if (ativo) {
            anunciarAcessibilidade('Alto contraste ativado.');
        } else {
            anunciarAcessibilidade('Cores originais restauradas.');
        }
    });
}

window.mlAcessibilidadePronta = true;

botaoLibras.addEventListener('click', function () {
    const host = hostVLibras();

    if (!host) {
        anunciarAcessibilidade('O tradutor de Libras não carregou. Verifique sua conexão com a internet.');
        return;
    }

    const botaoVLibras = host.shadowRoot.getElementById('vlibras-button');
    const ativo = botaoLibras.getAttribute('aria-pressed') !== 'true';
    if (ativo) {
        pagina.classList.add('libras-ativo');
    }

    botaoVLibras.click();
    botaoLibras.setAttribute('aria-pressed', String(ativo));

    if (ativo) {
        anunciarAcessibilidade('Tradutor de Libras ativado.');
   } else {
        pagina.classList.remove('libras-ativo');
        anunciarAcessibilidade('Tradutor de Libras fechado.');
    }
});

botaoLeitor.addEventListener('click', function () {
    if (!window.speechSynthesis) {
        anunciarAcessibilidade('Seu navegador não oferece leitura em voz alta.');
        return;
   }

    if (leituraAtiva) {
        speechSynthesis.cancel();
        leituraAtiva = false;
        botaoLeitor.setAttribute('aria-pressed', 'false');
        anunciarAcessibilidade('Leitura em voz alta interrompida.');
        return;
    }

   const conteudo = document.getElementById('conteudo-principal');
    const fala = new SpeechSynthesisUtterance(conteudo.innerText);

    fala.lang = 'pt-BR';
    fala.rate = 1;

    fala.onend = function () {
        leituraAtiva = false;
        botaoLeitor.setAttribute('aria-pressed', 'false');
        anunciarAcessibilidade('Leitura em voz alta concluída.');
   };

    leituraAtiva = true;
    botaoLeitor.setAttribute('aria-pressed', 'true');
    anunciarAcessibilidade('Leitura em voz alta iniciada.');
    speechSynthesis.speak(fala);
});


if (window.VLibras) {
   new window.VLibras.Widget('https://vlibras.gov.br/app');
}

window.addEventListener('load', function () {
    marcarHostVLibras();
    setTimeout(marcarHostVLibras, 1000);
});


// ==================================================
// FORMULÁRIO DE AGENDAMENTO
// Fluxo: validar → se houver erro, focar o primeiro campo
// → se estiver ok, mostrar a mensagem de confirmação.
// Por enquanto o pedido fica só no navegador (não envia para um servidor).
// Depois você pode ligar isso a um e-mail, WhatsApp ou backend.
// ==================================================

const formulario = document.getElementById('formulario-agendamento');
const caixaSucesso = document.getElementById('confirmacao-agendamento');
const mensagemSucesso = document.getElementById('sucesso-mensagem');
const botaoNovo = document.getElementById('novo-agendamento');

const campoNome = document.getElementById('nome');
const campoTelefone = document.getElementById('telefone');
const campoEmail = document.getElementById('email');
const campoEspecialista = document.getElementById('especialista');
const campoData = document.getElementById('data');
const campoObservacoes = document.getElementById('observacoes');
const radiosTurno = document.querySelectorAll('input[name="turno"]');

function doisDigitos(numero) {
    if (numero < 10) {
        return '0' + numero;
    }

    return String(numero);
}

function dataDeHoje() {
   const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = doisDigitos(hoje.getMonth() + 1);
    const dia = doisDigitos(hoje.getDate());

    return ano + '-' + mes + '-' + dia;
}

function formatarData(valor) {
    const partes = valor.split('-');
   const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));

    return data.toLocaleDateString('pt-BR');
}

function soNumeros(texto) {
    return texto.replace(/\D/g, '');
}

function eFinalDeSemana(valor) {
   const partes = valor.split('-');
    const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    const diaDaSemana = data.getDay();

    // 0 = domingo, 6 = sábado
    return diaDaSemana === 0 || diaDaSemana === 6;
}

function mostrarErro(campo, mensagem) {
    const erro = document.getElementById('erro-' + campo.id);
    campo.setAttribute('aria-invalid', 'true');
    erro.textContent = mensagem;
    erro.setAttribute('role', 'alert');
}

function limparErro(campo) {
    const erro = document.getElementById('erro-' + campo.id);

    campo.removeAttribute('aria-invalid');
   erro.textContent = '';
    erro.removeAttribute('role');
}

function mostrarErroTurno(mensagem) {
    const erro = document.getElementById('erro-turno');

    erro.textContent = mensagem;
    erro.setAttribute('role', 'alert');
}
function limparErroTurno() {
    const erro = document.getElementById('erro-turno');

    erro.textContent = '';
    erro.removeAttribute('role');
}

function turnoEscolhido() {
    const marcado = document.querySelector('input[name="turno"]:checked');
    if (marcado) {
        return marcado.value;
    }

    return '';
}


campoData.min = dataDeHoje();

campoNome.addEventListener('input', function () {
    limparErro(campoNome);
});

campoTelefone.addEventListener('input', function () {
    limparErro(campoTelefone);
});

campoEmail.addEventListener('input', function () {
    limparErro(campoEmail);
});

campoEspecialista.addEventListener('change', function () {
    limparErro(campoEspecialista);
});

campoData.addEventListener('change', function () {
    limparErro(campoData);
});

for (let i = 0; i < radiosTurno.length; i++) {
    radiosTurno[i].addEventListener('change', function () {
        limparErroTurno();
    });
}


formulario.addEventListener('submit', function (evento) {
   // Impede o envio tradicional da página para validarmos com JavaScript.
    evento.preventDefault();

    limparErro(campoNome);
    limparErro(campoTelefone);
    limparErro(campoEmail);
    limparErro(campoEspecialista);
    limparErro(campoData);
    limparErroTurno();

   const nome = campoNome.value.trim();
    const telefone = soNumeros(campoTelefone.value);
    const email = campoEmail.value.trim();
    const especialista = campoEspecialista.value;
    const data = campoData.value;
    const turno = turnoEscolhido();
    const observacoes = campoObservacoes.value.trim();

    let formularioValido = true;
    let primeiroCampoComErro = null;
    if (nome.length < 3) {
        mostrarErro(campoNome, 'Digite seu nome completo.');
        formularioValido = false;
        primeiroCampoComErro = campoNome;
    }

    if (telefone.length < 10 || telefone.length > 11) {
        mostrarErro(campoTelefone, 'Digite um telefone com DDD, usando 10 ou 11 números.');
        formularioValido = false;
        if (!primeiroCampoComErro) {
            primeiroCampoComErro = campoTelefone;
        }
    }

    if (email !== '' && (email.indexOf('@') === -1 || email.indexOf('.') === -1)) {
        mostrarErro(campoEmail, 'Digite um e-mail válido, como nome@exemplo.com.');
        formularioValido = false;

       if (!primeiroCampoComErro) {
            primeiroCampoComErro = campoEmail;
        }
    }

    if (especialista === '') {
        mostrarErro(campoEspecialista, 'Escolha um especialista.');
        formularioValido = false;

        if (!primeiroCampoComErro) {
           primeiroCampoComErro = campoEspecialista;
        }
    }

    if (data === '') {
        mostrarErro(campoData, 'Escolha uma data para a consulta.');
        formularioValido = false;

        if (!primeiroCampoComErro) {
            primeiroCampoComErro = campoData;
       }
    } else if (data < dataDeHoje()) {
        mostrarErro(campoData, 'A data precisa ser hoje ou um dia futuro.');
        formularioValido = false;

        if (!primeiroCampoComErro) {
            primeiroCampoComErro = campoData;
        }
    } else if (eFinalDeSemana(data)) {
        mostrarErro(campoData, 'A clínica não atende sábado e domingo. Escolha um dia de segunda a sexta.');
       formularioValido = false;

        if (!primeiroCampoComErro) {
            primeiroCampoComErro = campoData;
        }
    }

    if (turno === '') {
        mostrarErroTurno('Escolha o turno da manhã ou da tarde.');
        formularioValido = false;
        if (!primeiroCampoComErro) {
            primeiroCampoComErro = radiosTurno[0];
        }
    }

    if (!formularioValido) {
        primeiroCampoComErro.focus();
        return;
    }
    let texto = 'Olá, ' + nome + '. Recebemos seu pedido de consulta com ' + especialista;
    texto += ' para o dia ' + formatarData(data);
    texto += ', no período da ' + turno.toLowerCase() + '.';
    texto += ' A confirmação do horário escolhido será enviada em até 24 horas pelo telefone informado.';

    if (observacoes !== '') {
        texto += ' Observação registrada: ' + observacoes;
    }

   mensagemSucesso.textContent = texto;

    if (typeof obterPedidos === 'function' && typeof salvarPedidos === 'function') {
        const pedidos = obterPedidos();
        pedidos.unshift({
            id: 'p' + Date.now(),
            paciente: nome,
            especialista: especialista,
            data: formatarData(data),
            turno: turno,
            status: 'Pendente'
        });
        salvarPedidos(pedidos);
    }

    formulario.hidden = true;
    caixaSucesso.hidden = false;

    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    caixaSucesso.scrollIntoView({
        behavior: reduzirMovimento ? 'auto' : 'smooth',
        block: 'center'
   });

    caixaSucesso.focus({ preventScroll: true });
});


botaoNovo.addEventListener('click', function () {
    formulario.reset();
    campoData.min = dataDeHoje();

   caixaSucesso.hidden = true;
    formulario.hidden = false;
    formulario.scrollIntoView();
    campoNome.focus();
});

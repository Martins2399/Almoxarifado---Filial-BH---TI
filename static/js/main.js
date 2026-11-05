let listaGlobalProdutos = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

    document.getElementById('form-produto').addEventListener('submit', cadastrarOuAtualizarProduto);
    document.getElementById('form-movimentacao').addEventListener('submit', processarMovimentacao);
    
    // Se você tiver um input de pesquisa com o ID 'filtro-pesquisa', descomente a linha abaixo:
    // document.getElementById('filtro-pesquisa').addEventListener('input', filtrarProdutos);
});

async function carregarProdutos() {
    try {
        const res = await fetch('/api/produtos');
        listaGlobalProdutos = await res.json();
        renderizarTabela(listaGlobalProdutos);
    } catch (err) {
        console.error('Erro ao carregar itens:', err);
    }
}

function renderizarTabela(produtos) {
    const tbody = document.getElementById('tabela-produtos');
    tbody.innerHTML = '';

    let alertasAtivos = [];

    if (produtos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum item cadastrado no almoxarifado.</td></tr>`;
        exibirAlertaBanner([]);
        return;
    }

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        const isCritico = p.status_alerta;
        
        if (isCritico) {
            alertasAtivos.push(`${p.nome} (${p.quantidade} un)`);
        }

        tr.innerHTML = `
            <td style="color: var(--text-muted); font-weight: 500;">#${p.id}</td>
            <td><strong>${p.nome}</strong></td>
            <td><span class="category-pill">${p.categoria}</span></td>
            <td><span class="stock-number">${p.quantidade}</span></td>
            <td>
                <span class="badge ${isCritico ? 'badge-critical' : 'badge-normal'}">
                    ${isCritico ? '⚠️ Crítico (' + p.quantidade + ')' : 'Normal'}
                </span>
            </td>
            <td style="text-align: center;">
                <button class="btn btn-action" onclick="abrirModal(${p.id}, '${p.nome}')">Movimentar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    exibirAlertaBanner(alertasAtivos);
}

function filtrarProdutos() {
    const termo = document.getElementById('filtro-pesquisa').value.toLowerCase();
    const filtrados = listaGlobalProdutos.filter(p => 
        p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
}

function exibirAlertaBanner(itensCriticos) {
    const banner = document.getElementById('alert-banner');
    if (itensCriticos.length > 0) {
        banner.classList.remove('hidden');
        banner.innerHTML = `🚨 <strong>ATENÇÃO AO ESTOQUE CRÍTICO (<= 1 un):</strong> ${itensCriticos.join(' | ')}`;
    } else {
        banner.classList.add('hidden');
    }
}

async function cadastrarOuAtualizarProduto(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = document.getElementById('quantidade').value;

    const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, categoria, quantidade })
    });

    const resultado = await response.json();

    if (response.ok) {
        document.getElementById('form-produto').reset();
        carregarProdutos();
        alert(resultado.mensagem);
    } else {
        alert(resultado.erro || 'Erro ao processar item');
    }
}

function abrirModal(id, nome) {
    document.getElementById('modal-produto-id').value = id;
    document.getElementById('modal-titulo').innerText = `Movimentar: ${nome}`;
    document.getElementById('modal-movimentacao').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modal-movimentacao').classList.add('hidden');
}

async function processarMovimentacao(e) {
    e.preventDefault();
    const produto_id = document.getElementById('modal-produto-id').value;
    const tipo = document.getElementById('modal-tipo').value;
    const quantidade = document.getElementById('modal-qtd').value;
    const centro_custo = document.getElementById('modal-centro-custo').value;

    const response = await fetch('/api/movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id, tipo, quantidade, centro_custo })
    });

    const resultado = await response.json();

    if (response.ok) {
        fecharModal();
        carregarProdutos();
        if (resultado.alerta) {
            alert(resultado.alerta);
        }
    } else {
        alert(resultado.erro || 'Erro ao realizar movimentação');
    }
}
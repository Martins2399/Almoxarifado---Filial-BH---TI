let listaGlobalProdutos = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

    document.getElementById('form-produto').addEventListener('submit', salvarProduto);
    document.getElementById('form-movimentacao').addEventListener('submit', processarMovimentacao);
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
            <td style="text-align: center; white-space: nowrap;">
                <button class="btn btn-action" onclick="abrirModal(${p.id}, '${p.nome}')">Movimentar</button>
                <button class="btn btn-edit" onclick="prepararEdicao(${p.id}, '${p.nome}', '${p.categoria}', ${p.quantidade})" title="Editar Nome/Categoria">✏️</button>
                <button class="btn btn-delete" onclick="excluirProduto(${p.id}, '${p.nome}')" title="Excluir Item">🗑️</button>
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

async function salvarProduto(e) {
    e.preventDefault();
    const id = document.getElementById('edit-produto-id').value;
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = document.getElementById('quantidade').value;

    const payload = { nome, categoria, quantidade };
    if (id) payload.id = parseInt(id);

    const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const resultado = await response.json();

    if (response.ok) {
        cancelarEdicao();
        carregarProdutos();
        alert(resultado.mensagem);
    } else {
        alert(resultado.erro || 'Erro ao processar item');
    }
}

function prepararEdicao(id, nome, categoria, quantidade) {
    document.getElementById('edit-produto-id').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('categoria').value = categoria;
    document.getElementById('quantidade').value = quantidade;

    document.getElementById('form-titulo').innerText = `Editar Item #${id}`;
    document.getElementById('form-subtitulo').innerText = `Modifique os campos abaixo e clique em Atualizar.`;
    document.getElementById('btn-salvar').innerText = 'Atualizar Item';
    document.getElementById('btn-cancelar-edicao').classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-produto').reset();
    document.getElementById('edit-produto-id').value = '';
    document.getElementById('form-titulo').innerText = 'Cadastrar / Repor Item';
    document.getElementById('form-subtitulo').innerText = 'Se o item já existir, a quantidade será somada automaticamente.';
    document.getElementById('btn-salvar').innerText = 'Salvar no Estoque';
    document.getElementById('btn-cancelar-edicao').classList.add('hidden');
}

async function excluirProduto(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o item "${nome}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/produtos/${id}`, {
            method: 'DELETE'
        });
        const resultado = await response.json();

        if (response.ok) {
            alert(resultado.mensagem);
            carregarProdutos();
        } else {
            alert(resultado.erro || 'Erro ao excluir item');
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor.');
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
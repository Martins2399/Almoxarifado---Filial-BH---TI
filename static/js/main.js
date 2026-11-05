document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

    document.getElementById('form-produto').addEventListener('submit', cadastrarProduto);
    document.getElementById('form-movimentacao').addEventListener('submit', processarMovimentacao);
});

async function carregarProdutos() {
    try {
        const res = await fetch('/api/produtos');
        const produtos = await res.json();
        
        const tbody = document.getElementById('tabela-produtos');
        tbody.innerHTML = '';

        let alertasAtivos = [];

        produtos.forEach(p => {
            const tr = document.createElement('tr');
            
            // Verificação Dinâmica de Estoque Crítico
            const isCritico = p.status_alerta;
            if (isCritico) {
                alertasAtivos.push(p.nome);
            }

            tr.innerHTML = `
                <td>#${p.id}</td>
                <td><strong>${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td><strong>${p.quantidade}</strong></td>
                <td>
                    <span class="badge ${isCritico ? 'badge-critical' : 'badge-normal'}">
                        ${isCritico ? '⚠️ Resta ' + p.quantidade + ' un' : 'OK'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-action" onclick="abrirModal(${p.id}, '${p.nome}')">Movimentar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        exibirAlertaBanner(alertasAtivos);
    } catch (err) {
        console.error('Erro ao carregar itens:', err);
    }
}

function exibirAlertaBanner(itensCriticos) {
    const banner = document.getElementById('alert-banner');
    if (itensCriticos.length > 0) {
        banner.classList.remove('hidden');
        banner.innerHTML = `🚨 <strong>ATENÇÃO:</strong> Os seguintes itens estão em nível crítico de estoque (<= 1 un): ${itensCriticos.join(', ')}`;
    } else {
        banner.classList.add('hidden');
    }
}

async function cadastrarProduto(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = document.getElementById('quantidade').value;

    const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, categoria, quantidade })
    });

    if (response.ok) {
        document.getElementById('form-produto').reset();
        carregarProdutos();
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
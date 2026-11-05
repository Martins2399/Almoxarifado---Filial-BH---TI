import os
from flask import Flask, render_template, request, jsonify
from supabase import create_client, Client

app = Flask(__name__)

# Configurações do Supabase obtidas das variáveis de ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    response = supabase.table('produtos').select('*').order('nome').execute()
    produtos = response.data
    
    # Adiciona flag dinâmica de alerta
    for p in produtos:
        p['status_alerta'] = p['quantidade'] <= p['alerta_minimo']
        
    return jsonify(produtos)

@app.route('/api/produtos', methods=['POST'])
def adicionar_produto():
    dados = request.json
    nome = dados.get('nome')
    categoria = dados.get('categoria')
    quantidade = int(dados.get('quantidade', 0))
    alerta_minimo = int(dados.get('alerta_minimo', 1))

    response = supabase.table('produtos').insert({
        'nome': nome,
        'categoria': categoria,
        'quantidade': quantidade,
        'alerta_minimo': alerta_minimo
    }).execute()

    return jsonify({"mensagem": "Item cadastrado com sucesso!", "dados": response.data}), 201

@app.route('/api/movimentacao', methods=['POST'])
def registrar_movimentacao():
    dados = request.json
    produto_id = dados.get('produto_id')
    tipo = dados.get('tipo')  # 'ENTRADA' ou 'SAIDA'
    qtd_mov = int(dados.get('quantidade', 0))
    centro_custo = dados.get('centro_custo', 'N/A')

    # Busca produto atual
    prod_resp = supabase.table('produtos').select('*').eq('id', produto_id).execute()
    if not prod_resp.data:
        return jsonify({"erro": "Produto não encontrado!"}), 404
    
    produto = prod_resp.data[0]
    qtd_atual = produto['quantidade']

    if tipo == 'SAIDA' and qtd_atual < qtd_mov:
        return jsonify({"erro": "Estoque insuficiente para esta saída!"}), 400

    nova_qtd = (qtd_atual + qtd_mov) if tipo == 'ENTRADA' else (qtd_atual - qtd_mov)

    # Atualiza quantidade no banco
    supabase.table('produtos').update({'quantidade': nova_qtd}).eq('id', produto_id).execute()

    # Registra no histórico
    supabase.table('movimentacoes').insert({
        'produto_id': produto_id,
        'tipo': tipo,
        'quantidade': qtd_mov,
        'centro_custo': centro_custo
    }).execute()

    # Mensagem customizada de alerta se o estoque estiver em nível crítico (<= 1)
    alerta = None
    if nova_qtd <= produto['alerta_minimo']:
        alerta = f"ALERTA CRÍTICO: O item '{produto['nome']}' está com apenas {nova_qtd} unidade(s) restante(s)!"

    return jsonify({
        "mensagem": "Movimentação registrada com sucesso!",
        "nova_quantidade": nova_qtd,
        "alerta": alerta
    })

if __name__ == '__main__':
    app.run(debug=True)
import os
from flask import Flask, render_template, request, jsonify
from supabase import create_client, Client

app = Flask(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    if not supabase:
        return jsonify({"erro": "Banco de dados não configurado"}), 500
    response = supabase.table('produtos').select('*').order('nome').execute()
    produtos = response.data
    
    for p in produtos:
        p['status_alerta'] = p['quantidade'] <= p['alerta_minimo']
        
    return jsonify(produtos)

@app.route('/api/produtos', methods=['POST'])
def adicionar_produto():
    if not supabase:
        return jsonify({"erro": "Banco de dados não configurado"}), 500
    
    dados = request.json
    nome = dados.get('nome').strip()
    categoria = dados.get('categoria').strip()
    quantidade_adicionada = int(dados.get('quantidade', 0))
    alerta_minimo = int(dados.get('alerta_minimo', 1))

    # Verifica se o produto já existe no banco
    existente = supabase.table('produtos').select('*').eq('nome', nome).execute()

    if existente.data:
        # Se já existe, soma a quantidade nova à quantidade atual
        prod_atual = existente.data[0]
        nova_quantidade = prod_atual['quantidade'] + quantidade_adicionada
        
        response = supabase.table('produtos').update({
            'quantidade': nova_quantidade,
            'categoria': categoria # Atualiza categoria caso tenha mudado
        }).eq('id', prod_atual['id']).execute()

        return jsonify({"mensagem": f"O item '{nome}' já existe. Quantidade atualizada com sucesso!", "dados": response.data}), 200
    else:
        # Se não existe, cria um novo
        response = supabase.table('produtos').insert({
            'nome': nome,
            'categoria': categoria,
            'quantidade': quantidade_adicionada,
            'alerta_minimo': alerta_minimo
        }).execute()

        return jsonify({"mensagem": "Item cadastrado com sucesso!", "dados": response.data}), 201

@app.route('/api/movimentacao', methods=['POST'])
def registrar_movimentacao():
    if not supabase:
        return jsonify({"erro": "Banco de dados não configurado"}), 500
    
    dados = request.json
    produto_id = dados.get('produto_id')
    tipo = dados.get('tipo')
    qtd_mov = int(dados.get('quantidade', 0))
    centro_custo = dados.get('centro_custo', 'N/A')

    prod_resp = supabase.table('produtos').select('*').eq('id', produto_id).execute()
    if not prod_resp.data:
        return jsonify({"erro": "Produto não encontrado!"}), 404
    
    produto = prod_resp.data[0]
    qtd_atual = produto['quantidade']

    if tipo == 'SAIDA' and qtd_atual < qtd_mov:
        return jsonify({"erro": "Estoque insuficiente para esta saída!"}), 400

    nova_qtd = (qtd_atual + qtd_mov) if tipo == 'ENTRADA' else (qtd_atual - qtd_mov)

    supabase.table('produtos').update({'quantidade': nova_qtd}).eq('id', produto_id).execute()

    supabase.table('movimentacoes').insert({
        'produto_id': produto_id,
        'tipo': tipo,
        'quantidade': qtd_mov,
        'centro_custo': centro_custo
    }).execute()

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
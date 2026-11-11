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
    try:
        localidade = request.args.get('localidade', 'Belo Horizonte')
        
        # Filtra os produtos pela localidade selecionada
        response = supabase.table('produtos').select('*').eq('localidade', localidade).order('nome').execute()
        produtos = response.data or []
        
        for p in produtos:
            p['status_alerta'] = p['quantidade'] <= p.get('alerta_minimo', 1)
            
        return jsonify(produtos)
    except Exception as e:
        print("Erro ao listar produtos:", str(e))
        return jsonify([]), 200

@app.route('/api/produtos', methods=['POST'])
def adicionar_ou_atualizar_produto():
    if not supabase:
        return jsonify({"erro": "Banco de dados não configurado"}), 500
    
    dados = request.json or {}
    produto_id = dados.get('id') 
    nome_original = str(dados.get('nome', '')).strip()
    categoria = str(dados.get('categoria', '')).strip()
    quantidade_adicionada = int(dados.get('quantidade', 0))
    alerta_minimo = int(dados.get('alerta_minimo', 1))
    localidade = str(dados.get('localidade', 'Belo Horizonte')).strip()

    if not nome_original or not categoria:
        return jsonify({"erro": "Nome e categoria são obrigatórios!"}), 400

    try:
        if produto_id:
            supabase.table('produtos').update({
                'nome': nome_original,
                'categoria': categoria,
                'quantidade': quantidade_adicionada,
                'localidade': localidade
            }).eq('id', produto_id).execute()
            return jsonify({"mensagem": "Item atualizado com sucesso!"}), 200

        # Verifica existência considerando a localidade específica
        nome_chave = ' '.join(nome_original.lower().split())
        response_all = supabase.table('produtos').select('*').eq('localidade', localidade).execute()
        produtos_cadastrados = response_all.data or []

        produto_existente = None
        for p in produtos_cadastrados:
            p_chave = ' '.join(str(p['nome']).lower().split())
            if p_chave == nome_chave:
                produto_existente = p
                break

        if produto_existente:
            nova_quantidade = produto_existente['quantidade'] + quantidade_adicionada
            supabase.table('produtos').update({
                'quantidade': nova_quantidade,
                'categoria': categoria
            }).eq('id', produto_existente['id']).execute()

            return jsonify({"mensagem": f"Item já existente nesta localidade! Quantidade atualizada para {nova_quantidade}."}), 200
        else:
            supabase.table('produtos').insert({
                'nome': nome_original,
                'categoria': categoria,
                'quantidade': quantidade_adicionada,
                'alerta_minimo': alerta_minimo,
                'localidade': localidade
            }).execute()

            return jsonify({"mensagem": "Item cadastrado com sucesso!"}), 201
            
    except Exception as e:
        print("Erro ao salvar produto:", str(e))
        return jsonify({"erro": f"Erro no banco de dados: {str(e)}"}), 500

@app.route('/api/produtos/<int:produto_id>', methods=['DELETE'])
def excluir_produto(produto_id):
    if not supabase:
        return jsonify({"erro": "Banco de dados não configurado"}), 500
    try:
        supabase.table('produtos').delete().eq('id', produto_id).execute()
        return jsonify({"mensagem": "Item excluído com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao excluir: {str(e)}"}), 500

@app.route('/api/movimentacao', methods=['POST'])
def registrar_movimentacao():
    if not supabase:
        return jsonify({"erro": "Banco de dados não configurado"}), 500
    
    dados = request.json or {}
    produto_id = dados.get('produto_id')
    tipo = dados.get('tipo')
    qtd_mov = int(dados.get('quantidade', 0))
    centro_custo = dados.get('centro_custo', 'N/A')

    try:
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
        if nova_qtd <= produto.get('alerta_minimo', 1):
            alerta = f"ALERTA CRÍTICO: O item '{produto['nome']}' está com apenas {nova_qtd} unidade(s) restante(s)!"

        return jsonify({
            "mensagem": "Movimentação registrada com sucesso!",
            "nova_quantidade": nova_qtd,
            "alerta": alerta
        })
    except Exception as e:
        return jsonify({"erro": f"Erro na movimentação: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
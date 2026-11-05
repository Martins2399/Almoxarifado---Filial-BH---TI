ALMOXARIFADO - TECNOLOGIA DA INFORMAÇÃO
BELO HORIZONTE – MG

2026

ÍTALO MARTINS

SISTEMA DE CONTROLE DE INVENTÁRIO E ALMOXARIFADO DE TI

BELO HORIZONTE – MG

2026

1. APRESENTAÇÃO E ESCOPO DO PROJETO
O presente documento apresenta a especificação técnica e o manual de utilização do
sistema de controle de inventário e almoxarifado desenvolvido para a filial de Belo
Horizonte (MG). A aplicação web tem como finalidade otimizar o gerenciamento de
ativos de Tecnologia da Informação (TI), automatizando o controle de estoque, o
registro de movimentações de entrada e saída, e a emissão de alertas críticos de nível
mínimo de suprimentos.
O sistema foi estruturado com uma arquitetura moderna e leve, utilizando Flask
(Python) no lado do servidor e integração em nuvem com o banco de dados Supabase.

2. ARQUITETURA E TECNOLOGIAS UTILIZADAS
O projeto emprega as seguintes tecnologias e ferramentas:
 Linguagem de Programação: Python 3.11.9
 Framework Web: Flask 3.0.0
 Banco de Dados / BaaS: Supabase (PostgreSQL)
 Servidor WSGI de Produção: Gunicorn 21.2.0
 Gerenciador de Versão: Git (Repositório hospedado no GitHub sob o usuário
Martins2399)
 Plataforma de Hospedagem: Render

3. ESTRUTURA DE ARQUIVOS DO REPOSITÓRIO
A estrutura de diretórios e arquivos configurada no repositório do projeto (Almoxarifado-
--Filial-BH---TI) obedece à seguinte organização:
Arquivo / Diretório Descrição da Função
app.py Arquivo principal contendo as rotas e

regras de negócio Flask

requirements.txt Dependências e bibliotecas do projeto

Python

Procfile Instrução de inicialização para o servidor

de produção (Render)

runtime.txt Definição da versão do Python utilizada

(3.11.9)

4. ESPECIFICAÇÃO DAS ROTAS E API
A aplicação expõe endpoints RESTful para comunicação assíncrona com o front-end:
4.1. Listagem de Produtos
• Rota: GET /api/produtos
• Descrição: Retorna a lista completa de produtos cadastrados, ordenados
alfabeticamente por nome, calculando dinamicamente o status de alerta com base no
estoque mínimo configurado.
4.2. Cadastro e Atualização de Produtos
• Rota: POST /api/produtos
• Descrição: Gerencia o cadastro de novos itens ou a soma automática de quantidades
caso o produto já exista (validação por palavra-chave normalizada). Também suporta a
edição de registros existentes caso um identificador (id) seja fornecido.
4.3. Exclusão de Produtos
• Rota: DELETE /api/produtos/&lt;int:produto_id&gt;
• Descrição: Remove permanentemente um item do banco de dados com base no seu
identificador único.
4.4. Registro de Movimentações (Entrada e Saída)
• Rota: POST /api/movimentacao
• Descrição: Processa a movimentação de estoque. Valida a disponibilidade em caso de
saídas (SAIDA), atualiza a quantidade atual do produto e registra o histórico vinculado
ao centro de custo correspondente, disparando alertas caso o saldo atinja o limite
crítico.

5. CONFIGURAÇÃO E INSTALAÇÃO LOCAL
Para executar o projeto em ambiente de desenvolvimento local, siga os passos abaixo:
1. Clonar o Repositório: git clone https://github.com/Martins2399/Almoxarifado---Filial-
BH---TI.git
2. Criar e Ativar um Ambiente Virtual: python -m venv venv (ativando com
venv\Scripts\activate no Windows)
3. Instalar as Dependências: pip install -r requirements.txt
4. Configurar as Variáveis de Ambiente (SUPABASE_URL e SUPABASE_KEY)
5. Executar a Aplicação: python app.py (disponível em http://127.0.0.1:5000/)

6. CONSIDERAÇÕES FINAIS
Este sistema visa garantir a rastreabilidade, segurança e agilidade no controle dos
recursos tecnológicos da filial de Belo Horizonte. Modificações e melhorias evolutivas
podem ser submetidas via Pull Request no repositório oficial do projeto.

Documentação elaborada por Ítalo Martins — Belo Horizonte/MG, 2026.

/*
============================================================
  BANCO DE DADOS SIMPLES - E-COMMERCE
  Baseado no codigo em C do projeto

  Feito para Oracle SQL Developer
  Execute com F5

  Modelo usado:
  clientes 1:N pedidos
  pedidos 1:N itens_pedido
  produtos 1:N itens_pedido
  produtos 1:1 estoque
  pedidos 1:1 pagamentos, quando estiver pago
  pedidos 1:N vendas, uma venda para cada produto vendido
============================================================
*/

/* Apagar tabelas antigas, se existirem */
BEGIN EXECUTE IMMEDIATE 'DROP TABLE vendas CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE pagamentos CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE itens_pedido CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE pedidos CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE estoque CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE produtos CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE clientes CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

/* ============================================================
   TABELA CLIENTES
   Representa a struct Cliente do codigo em C
============================================================ */

CREATE TABLE clientes (
    id_cliente NUMBER PRIMARY KEY,
    nome       VARCHAR2(100) NOT NULL,
    email      VARCHAR2(100) NOT NULL,
    telefone   VARCHAR2(20),
    usuario    VARCHAR2(50) NOT NULL,
    senha      VARCHAR2(50) NOT NULL,
    saldo      NUMBER(10,2) NOT NULL
);

/* ============================================================
   TABELA PRODUTOS
   Representa a struct Produto
============================================================ */

CREATE TABLE produtos (
    id_produto NUMBER PRIMARY KEY,
    nome       VARCHAR2(100) NOT NULL,
    descricao  VARCHAR2(500),
    preco      NUMBER(10,2) NOT NULL
);

/* ============================================================
   TABELA ESTOQUE
   Guarda a quantidade de cada produto
============================================================ */

CREATE TABLE estoque (
    id_estoque  NUMBER PRIMARY KEY,
    id_produto  NUMBER NOT NULL,
    quantidade  NUMBER NOT NULL,

    CONSTRAINT fk_estoque_produto
        FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
);

/* ============================================================
   TABELA PEDIDOS
   Pedido feito por um cliente
============================================================ */

CREATE TABLE pedidos (
    id_pedido   NUMBER PRIMARY KEY,
    id_cliente  NUMBER NOT NULL,
    valor_total NUMBER(10,2) NOT NULL,
    status      VARCHAR2(20) NOT NULL,

    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

/* ============================================================
   TABELA ITENS_PEDIDO
   Relaciona pedido com produto
   Um pedido pode ter varios produtos
============================================================ */

CREATE TABLE itens_pedido (
    id_item    NUMBER PRIMARY KEY,
    id_pedido  NUMBER NOT NULL,
    id_produto NUMBER NOT NULL,
    quantidade NUMBER NOT NULL,
    subtotal   NUMBER(10,2) NOT NULL,

    CONSTRAINT fk_item_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),

    CONSTRAINT fk_item_produto
        FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
);

/* ============================================================
   TABELA PAGAMENTOS
   Pagamentos realizados pelos clientes
============================================================ */

CREATE TABLE pagamentos (
    id_pagamento NUMBER PRIMARY KEY,
    id_pedido    NUMBER NOT NULL,
    id_cliente   NUMBER NOT NULL,
    valor        NUMBER(10,2) NOT NULL,
    forma        VARCHAR2(30),

    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),

    CONSTRAINT fk_pagamento_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

/* ============================================================
   TABELA VENDAS
   Vendas registradas depois que um pedido e pago
============================================================ */

CREATE TABLE vendas (
    id_venda    NUMBER PRIMARY KEY,
    id_pedido   NUMBER NOT NULL,
    id_produto  NUMBER NOT NULL,
    quantidade  NUMBER NOT NULL,
    valor_total NUMBER(10,2) NOT NULL,

    CONSTRAINT fk_venda_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),

    CONSTRAINT fk_venda_produto
        FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
);

/* ============================================================
   INSERTS - CLIENTES
============================================================ */

INSERT INTO clientes VALUES (1, 'Cliente Padrao', 'cliente@email.com', '00000000000', 'cliente', '123', 500.00);
INSERT INTO clientes VALUES (2, 'Ana Ribeiro', 'ana@email.com', '11988887777', 'ana', '123', 1500.00);
INSERT INTO clientes VALUES (3, 'Bruno Almeida', 'bruno@email.com', '21977776666', 'bruno', '123', 850.00);
INSERT INTO clientes VALUES (4, 'Carla Mendes', 'carla@email.com', '31966665555', 'carla', '123', 300.00);
INSERT INTO clientes VALUES (5, 'Diego Torres', 'diego@email.com', '41955554444', 'diego', '123', 2000.00);

/* ============================================================
   INSERTS - PRODUTOS
============================================================ */

INSERT INTO produtos VALUES (
    1,
    'Mouse Gamer RGB',
    'Mouse gamer com iluminacao RGB e 7 botoes programaveis.',
    99.00
);

INSERT INTO produtos VALUES (
    2,
    'Teclado Mecanico',
    'Teclado mecanico com switches blue e layout ABNT2.',
    149.90
);

INSERT INTO produtos VALUES (
    3,
    'Headset Pro 7.1',
    'Headset com audio surround e microfone com cancelamento de ruido.',
    199.90
);

INSERT INTO produtos VALUES (
    4,
    'Monitor Full HD',
    'Monitor 24 polegadas Full HD 144Hz.',
    899.00
);

INSERT INTO produtos VALUES (
    5,
    'Webcam HD 1080p',
    'Webcam Full HD com microfone embutido.',
    159.90
);

INSERT INTO produtos VALUES (
    6,
    'Mousepad Grande',
    'Mousepad grande com bordas costuradas.',
    59.90
);

/* ============================================================
   INSERTS - ESTOQUE
============================================================ */

INSERT INTO estoque VALUES (1, 1, 8);
INSERT INTO estoque VALUES (2, 2, 5);
INSERT INTO estoque VALUES (3, 3, 6);
INSERT INTO estoque VALUES (4, 4, 3);
INSERT INTO estoque VALUES (5, 5, 10);
INSERT INTO estoque VALUES (6, 6, 20);

/* ============================================================
   INSERTS - PEDIDOS
   Status usados:
   PENDENTE, PAGO, CANCELADO
============================================================ */

INSERT INTO pedidos VALUES (1, 1, 347.90, 'PAGO');
INSERT INTO pedidos VALUES (2, 2, 1218.80, 'PAGO');
INSERT INTO pedidos VALUES (3, 3, 259.80, 'PAGO');
INSERT INTO pedidos VALUES (4, 4, 159.90, 'PENDENTE');
INSERT INTO pedidos VALUES (5, 5, 1148.90, 'PENDENTE');
INSERT INTO pedidos VALUES (6, 2, 99.00, 'CANCELADO');

/* ============================================================
   INSERTS - ITENS DO PEDIDO
============================================================ */

/* Pedido 1: Cliente Padrao comprou mouse e teclado */
INSERT INTO itens_pedido VALUES (1, 1, 1, 2, 198.00);
INSERT INTO itens_pedido VALUES (2, 1, 2, 1, 149.90);

/* Pedido 2: Ana comprou monitor, webcam e mousepad */
INSERT INTO itens_pedido VALUES (3, 2, 4, 1, 899.00);
INSERT INTO itens_pedido VALUES (4, 2, 5, 2, 319.80);

/* Pedido 3: Bruno comprou headset e mousepad */
INSERT INTO itens_pedido VALUES (5, 3, 3, 1, 199.90);
INSERT INTO itens_pedido VALUES (6, 3, 6, 1, 59.90);

/* Pedido 4: Carla fez pedido de webcam, mas ainda nao pagou */
INSERT INTO itens_pedido VALUES (7, 4, 5, 1, 159.90);

/* Pedido 5: Diego quer monitor e teclado, mas esta pendente */
INSERT INTO itens_pedido VALUES (8, 5, 4, 1, 899.00);
INSERT INTO itens_pedido VALUES (9, 5, 2, 1, 149.90);
INSERT INTO itens_pedido VALUES (10, 5, 1, 1, 99.00);

/* Pedido 6: Ana cancelou a compra de um mouse */
INSERT INTO itens_pedido VALUES (11, 6, 1, 1, 99.00);

/* ============================================================
   INSERTS - PAGAMENTOS
   Apenas pedidos pagos aparecem aqui
============================================================ */

INSERT INTO pagamentos VALUES (1, 1, 1, 347.90, 'Saldo da conta');
INSERT INTO pagamentos VALUES (2, 2, 2, 1218.80, 'Saldo da conta');
INSERT INTO pagamentos VALUES (3, 3, 3, 259.80, 'Saldo da conta');

/* ============================================================
   INSERTS - VENDAS
   Apenas produtos de pedidos pagos aparecem aqui
============================================================ */

INSERT INTO vendas VALUES (1, 1, 1, 2, 198.00);
INSERT INTO vendas VALUES (2, 1, 2, 1, 149.90);
INSERT INTO vendas VALUES (3, 2, 4, 1, 899.00);
INSERT INTO vendas VALUES (4, 2, 5, 2, 319.80);
INSERT INTO vendas VALUES (5, 3, 3, 1, 199.90);
INSERT INTO vendas VALUES (6, 3, 6, 1, 59.90);

COMMIT;

/* ============================================================
   CONSULTAS PARA TESTAR
============================================================ */

/* Ver todos os clientes */
SELECT * FROM clientes;

/* Ver produtos com estoque */
SELECT p.id_produto,
       p.nome,
       p.preco,
       e.quantidade
FROM produtos p
JOIN estoque e ON e.id_produto = p.id_produto;

/* Ver pedidos com nome do cliente */
SELECT pe.id_pedido,
       c.nome AS cliente,
       pe.valor_total,
       pe.status
FROM pedidos pe
JOIN clientes c ON c.id_cliente = pe.id_cliente;

/* Ver os itens de cada pedido */
SELECT pe.id_pedido,
       c.nome AS cliente,
       p.nome AS produto,
       i.quantidade,
       i.subtotal,
       pe.status
FROM pedidos pe
JOIN clientes c ON c.id_cliente = pe.id_cliente
JOIN itens_pedido i ON i.id_pedido = pe.id_pedido
JOIN produtos p ON p.id_produto = i.id_produto
ORDER BY pe.id_pedido;

/* Ver transacoes pagas */
SELECT c.nome AS cliente,
       pa.id_pagamento,
       pa.id_pedido,
       pa.valor,
       pa.forma
FROM pagamentos pa
JOIN clientes c ON c.id_cliente = pa.id_cliente;

/* Ver vendas */
SELECT v.id_venda,
       p.nome AS produto,
       v.quantidade,
       v.valor_total
FROM vendas v
JOIN produtos p ON p.id_produto = v.id_produto;

/* Ver pedidos pendentes */
SELECT * FROM pedidos WHERE status = 'PENDENTE';

/* Ver pedidos cancelados */
SELECT * FROM pedidos WHERE status = 'CANCELADO';

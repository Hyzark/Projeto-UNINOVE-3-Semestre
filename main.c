/*
 *Alex Sandro Limberg da Silva - RA 3126100804
 *Allan Sandes dos Santos - RA 3025106431
 *Felipe Aquino - RA 3025100415
 *Igor Silva Tomaz de Oliveira - RA 3025103357
 *John Christian Silva de Souza - RA 3025101771
 *Leonardo Messias Santos Marinho - RA 3025200813
 *Lucas Henrique Carvalho Xavier - RA 3026100022
 *Marcus Vinícius Roberto de Carvalho - RA 3025201763
 *Pedro Henrique Pereira da Silva - RA 3026103385
 *Vitor Silva Tomaz de Oliveira - RA 3025103356
 *
 * ============================================================
 *   E-COMMERCE - PROJETO FACULDADE
 *   Modulos: Login, Clientes, Produtos, Pedidos,
 *            Estoque, Vendas, Reajuste de Precos
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ============================================================
 *  CONSTANTES
 * ============================================================ */
#define MAX_CLIENTES  100
#define MAX_PRODUTOS  100
#define MAX_PEDIDOS   100
#define MAX_ITENS     10
#define MAX_VENDAS    100
#define MAX_PAGAMENTOS 100
#define ESTOQUE_BAIXO 5

/* ============================================================
 *  ESTRUTURAS
 * ============================================================ */

typedef struct {
    int   id;
    char  nome[100];
    char  email[100];
    char  telefone[20];
    char  usuario[50];
    char  senha[50];
    float saldo;
} Cliente;

typedef struct {
    int   id;
    char  nome[100];
    char  descricao[500];
    float preco;
    int   quantidade;
} Produto;

typedef struct {
    int id_produto;
    int quantidade;
} ItemPedido;

typedef struct {
    int        id;
    int        id_cliente;
    ItemPedido itens[MAX_ITENS];
    int        num_itens;
    float      valor_total;
    int        pago;        /* 0 = pendente, 1 = pago */
} Pedido;

typedef struct {
    int   id;
    int   id_pedido;
    int   id_cliente;
    float valor;
} Pagamento;

typedef struct {
    int   id;
    int   id_produto;
    int   quantidade;
    float valor_total;
} Venda;

/* ============================================================
 *  VARIAVEIS GLOBAIS
 * ============================================================ */

Cliente    clientes[MAX_CLIENTES];
int        num_clientes = 0;

Produto    produtos[MAX_PRODUTOS];
int        num_produtos = 0;

Pedido     pedidos[MAX_PEDIDOS];
int        num_pedidos = 0;

Pagamento  pagamentos[MAX_PAGAMENTOS];
int        num_pagamentos = 0;

Venda      vendas[MAX_VENDAS];
int        num_vendas = 0;

/* cliente logado no momento (-1 = nenhum) */
int        cliente_logado = -1;

/* ============================================================
 *  UTILITARIOS
 * ============================================================ */

void limpar_buffer() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

/* Retorna 1 se a string for vazia ou contiver apenas espacos */
int str_vazio(const char *s) {
    while (*s) {
        if (!isspace((unsigned char)*s)) return 0;
        s++;
    }
    return 1;
}

/* Le uma string nao-vazia do stdin, repetindo ate o usuario digitar algo valido */
void ler_string(const char *prompt, char *dest, int tamanho) {
    do {
        printf("%s", prompt);
        fgets(dest, tamanho, stdin);
        dest[strcspn(dest, "\n")] = '\0';
        if (str_vazio(dest))
            printf("  Entrada invalida! O campo nao pode ser vazio.\n");
    } while (str_vazio(dest));
}

/* Le um float estritamente positivo, rejeita letras e valores <= 0 */
float ler_float_positivo(const char *campo) {
    char buf[50];
    while (1) {
        fgets(buf, sizeof(buf), stdin);
        buf[strcspn(buf, "\n")] = '\0';

        /* Verifica se e numero valido: permite digitos, um ponto e sinal inicial */
        int valido = 1;
        int tem_digito = 0;
        int tem_ponto = 0;
        int inicio = (buf[0] == '-') ? 1 : 0; /* captura negativo para rejeitar depois */
        for (int i = inicio; buf[i] != '\0' && valido; i++) {
            if (buf[i] == '.' && !tem_ponto) { tem_ponto = 1; }
            else if (isdigit((unsigned char)buf[i])) { tem_digito = 1; }
            else { valido = 0; }
        }
        if (!tem_digito) valido = 0;

        if (valido) {
            float val = (float)atof(buf);
            if (val > 0.0f) return val;
        }
        printf("  Valor de \"%s\" invalido, tente novamente: ", campo);
    }
}

/* Le um inteiro estritamente positivo, rejeita letras e valores <= 0 */
int ler_int_positivo(const char *campo) {
    char buf[50];
    while (1) {
        fgets(buf, sizeof(buf), stdin);
        buf[strcspn(buf, "\n")] = '\0';

        int valido = 1;
        int tem_digito = 0;
        for (int i = 0; buf[i] != '\0' && valido; i++) {
            if (isdigit((unsigned char)buf[i])) { tem_digito = 1; }
            else { valido = 0; }
        }
        if (!tem_digito) valido = 0;

        if (valido) {
            int val = atoi(buf);
            if (val > 0) return val;
        }
        printf("  Valor de \"%s\" invalido, tente novamente: ", campo);
    }
}

void pausar() {
    printf("\nPressione ENTER para continuar...\n");
    getchar();
}

void cabecalho(const char *titulo) {
    printf("\n");
    printf("========================================\n");
    printf("  %s\n", titulo);
    printf("========================================\n");
}

Cliente* buscar_cliente_por_id(int id) {
    for (int i = 0; i < num_clientes; i++)
        if (clientes[i].id == id) return &clientes[i];
    return NULL;
}

Produto* buscar_produto_por_id(int id) {
    for (int i = 0; i < num_produtos; i++)
        if (produtos[i].id == id) return &produtos[i];
    return NULL;
}

/* ============================================================
 *  TELA DE LOGIN
 *  Retorna: 0 = cliente, 1 = adm, -1 = falhou
 * ============================================================ */

int tela_login() {
    cabecalho("LOGIN - E-COMMERCE");

    char usuario[50];
    char senha[50];

    ler_string("Usuario: ", usuario, sizeof(usuario));
    ler_string("Senha  : ", senha, sizeof(senha));

    /* Verifica ADM */
    if (strcmp(usuario, "adm") == 0 && strcmp(senha, "123") == 0) {
        printf("\nBem-vindo, Administrador!\n");
        return 1;
    }

    /* Verifica clientes cadastrados */
    for (int i = 0; i < num_clientes; i++) {
        if (strcmp(clientes[i].usuario, usuario) == 0 &&
            strcmp(clientes[i].senha,   senha)   == 0) {
            cliente_logado = i;
            printf("\nBem-vindo, %s!\n", clientes[i].nome);
            printf("Saldo disponivel: R$ %.2f\n", clientes[i].saldo);
            return 0;
        }
    }

    printf("\nUsuario ou senha incorretos.\n");
    return -1;
}

/* ============================================================
 *  CADASTRO INICIAL (cliente "cliente" / senha "123")
 *  Chamado uma vez no inicio para garantir conta padrao
 * ============================================================ */

void criar_cliente_padrao() {
    /* Evita duplicar se ja existir */
    for (int i = 0; i < num_clientes; i++)
        if (strcmp(clientes[i].usuario, "cliente") == 0) return;

    Cliente c;
    c.id = num_clientes + 1;
    strcpy(c.nome,     "Cliente Padrao");
    strcpy(c.email,    "cliente@email.com");
    strcpy(c.telefone, "00000000000");
    strcpy(c.usuario,  "cliente");
    strcpy(c.senha,    "123");
    c.saldo = 500.00f;

    clientes[num_clientes++] = c;
}

/* ============================================================
 *  CADASTRO INICIAL DE PRODUTOS PADRAO
 *  Chamado uma vez no inicio para garantir produtos padrao
 * ============================================================ */

void criar_produtos_padrao() {
    /* Evita duplicar se ja existirem produtos */
    if (num_produtos > 0) return;

    Produto p;

    /* Produto 1 */
    p.id = 1;
    strcpy(p.nome, "Mouse Gamer RGB");
    strcpy(p.descricao, "Mouse gamer com iluminacao RGB customizavel, sensor optico de alta precisao e 7 botoes programaveis.");
    p.preco = 99.00f;
    p.quantidade = 10;
    produtos[num_produtos++] = p;

    /* Produto 2 */
    p.id = 2;
    strcpy(p.nome, "Teclado Mecanico");
    strcpy(p.descricao, "Teclado mecanico com switches blue, retroiluminacao LED branca, layout ABNT2 e construcao em aluminio.");
    p.preco = 149.90f;
    p.quantidade = 4;
    produtos[num_produtos++] = p;

    /* Produto 3 */
    p.id = 3;
    strcpy(p.nome, "Headset Pro 7.1");
    strcpy(p.descricao, "Headset com audio surround virtual 7.1, microfone com cancelamento de ruido e almofadas de espuma memory foam.");
    p.preco = 199.90f;
    p.quantidade = 8;
    produtos[num_produtos++] = p;

    /* Produto 4 */
    p.id = 4;
    strcpy(p.nome, "Monitor Full HD");
    strcpy(p.descricao, "Monitor 24 polegadas Full HD 1080p, taxa de atualizacao de 144Hz, tempo de resposta 1ms e painel IPS.");
    p.preco = 899.00f;
    p.quantidade = 5;
    produtos[num_produtos++] = p;

    /* Produto 5 */
    p.id = 5;
    strcpy(p.nome, "Webcam HD 1080p");
    strcpy(p.descricao, "Webcam Full HD 1080p com microfone embutido, angulo de visao 90 graus e compatibilidade plug-and-play.");
    p.preco = 159.90f;
    p.quantidade = 12;
    produtos[num_produtos++] = p;
}

/* ============================================================
 *  AREA DO CLIENTE
 * ============================================================ */

/* --- Exibir descricao de um produto --- */
void mostrar_descricao_produto(Produto *p) {
    printf("\n");
    printf("========================================\n");

    /* Centraliza o nome na largura de 40 caracteres */
    int largura = 40;
    int len = (int)strlen(p->nome);
    int espacos = (largura - len) / 2;
    if (espacos < 0) espacos = 0;
    printf("%*s%s\n", espacos, "", p->nome);

    printf("========================================\n\n");
    printf("%s\n", p->descricao);
    printf("\n----------------------------------------\n");
    printf("Pressione Enter para voltar a aba Ver Produtos...\n");
    getchar();
}

/* --- Listar produtos (somente leitura) --- */
void cli_listar_produtos() {
    char resp;
    do {
        cabecalho("PRODUTOS DISPONIVEIS");

        if (num_produtos == 0) {
            printf("Nenhum produto disponivel no momento.\n");
            pausar();
            return;
        }

        printf("%-5s %-25s %10s %10s\n", "ID", "Nome", "Preco", "Estoque");
        printf("------------------------------------------------------\n");
        for (int i = 0; i < num_produtos; i++) {
            printf("%-5d %-25s R$%8.2f %10d\n",
                   produtos[i].id,
                   produtos[i].nome,
                   produtos[i].preco,
                   produtos[i].quantidade);
        }

        printf("\nDeseja ver as descricoes dos produtos? (s/n): ");
        scanf(" %c", &resp);
        limpar_buffer();

        if (resp == 's' || resp == 'S') {
            char buf_id[50];
            printf("Digite o numero ID do produto para visualizar a descricao: ");
            fgets(buf_id, sizeof(buf_id), stdin);
            buf_id[strcspn(buf_id, "\n")] = '\0';

            /* Valida se a entrada e estritamente um numero inteiro positivo */
            int valido = 1;
            if (str_vazio(buf_id)) valido = 0;
            for (int k = 0; buf_id[k] != '\0' && valido; k++) {
                if (!isdigit((unsigned char)buf_id[k])) valido = 0;
            }

            if (!valido) {
                printf("Produto nao encontrado.\n");
                pausar();
            } else {
                int id = atoi(buf_id);
                Produto *p = buscar_produto_por_id(id);
                if (p == NULL) {
                    printf("Produto nao encontrado.\n");
                    pausar();
                } else {
                    mostrar_descricao_produto(p);
                }
            }
            /* Apos ver a descricao, a listagem se repete */
        } else {
            int voltar;
            do {
                printf("Digite 0 para voltar a pagina anterior: ");
                scanf("%d", &voltar);
                limpar_buffer();
            } while (voltar != 0);
            return;
        }
    } while (1);
}

/* --- Realizar pedido --- */
void cli_realizar_pedido() {
    cabecalho("REALIZAR PEDIDO");

    if (num_pedidos >= MAX_PEDIDOS) {
        printf("Limite de pedidos atingido.\n");
        pausar();
        return;
    }

    Cliente *cli = &clientes[cliente_logado];

    Pedido ped;
    ped.id          = num_pedidos + 1;
    ped.id_cliente  = cli->id;
    ped.num_itens   = 0;
    ped.valor_total = 0.0f;
    ped.pago        = 0;

    char continuar = 's';
    while (continuar == 's' || continuar == 'S') {
        if (ped.num_itens >= MAX_ITENS) {
                    printf("Limite de itens por pedido atingido.\n");
                    break;
                }

                /* --- INÍCIO DA MUDANÇA --- */
                /* Listagem direta para agilizar o pedido, sem invocar o menu interativo */
                if (num_produtos == 0) {
                    printf("Nenhum produto disponivel no momento.\n");
                    break;
                }

                printf("\n--- PRODUTOS DISPONIVEIS ---\n");
                printf("%-5s %-25s %10s %10s\n", "ID", "Nome", "Preco", "Estoque");
                printf("------------------------------------------------------\n");
                for (int i = 0; i < num_produtos; i++) {
                    printf("%-5d %-25s R$%8.2f %10d\n",
                        produtos[i].id,
                        produtos[i].nome,
                        produtos[i].preco,
                        produtos[i].quantidade);
                }
                printf("------------------------------------------------------\n");

        int id_prod;
        printf("\nID do produto (0 para cancelar): ");
        scanf("%d", &id_prod);
        limpar_buffer();

        if (id_prod == 0) break;

        Produto *p = buscar_produto_por_id(id_prod);
        if (p == NULL) {
            printf("Produto nao encontrado.\n");
            continue;
        }

        if (p->quantidade == 0) {
            printf("Produto sem estoque.\n");
            continue;
        }

        int qtd;
        printf("Quantidade (disponivel: %d): ", p->quantidade);
        scanf("%d", &qtd);
        limpar_buffer();

        if (qtd <= 0 || qtd > p->quantidade) {
            printf("Quantidade invalida.\n");
            continue;
        }

        ped.itens[ped.num_itens].id_produto = id_prod;
        ped.itens[ped.num_itens].quantidade = qtd;
        ped.num_itens++;
        ped.valor_total += p->preco * qtd;

        printf("  Adicionado: %s x%d  (subtotal R$ %.2f)\n",
               p->nome, qtd, p->preco * qtd);

        printf("Adicionar outro produto? (s/n): ");
        scanf(" %c", &continuar);
        limpar_buffer();
    }

    if (ped.num_itens == 0) {
        printf("Pedido cancelado.\n");
        pausar();
        return;
    }

    printf("\n--- Resumo do Pedido ---\n");
    for (int j = 0; j < ped.num_itens; j++) {
        Produto *p = buscar_produto_por_id(ped.itens[j].id_produto);
        printf("  %-25s x%d  R$ %.2f\n",
               p ? p->nome : "?",
               ped.itens[j].quantidade,
               p ? p->preco * ped.itens[j].quantidade : 0);
    }
    printf("Total: R$ %.2f\n", ped.valor_total);
    printf("Seu saldo: R$ %.2f\n", cli->saldo);
    printf("\nConfirmar pedido? (s/n): ");

    char conf;
    scanf(" %c", &conf);
    limpar_buffer();

    if (conf != 's' && conf != 'S') {
        printf("Pedido cancelado.\n");
        pausar();
        return;
    }

    pedidos[num_pedidos++] = ped;
    printf("\nPedido #%d registrado! Status: PENDENTE DE PAGAMENTO\n", ped.id);
    pausar();
}

/* --- Consultar pedidos do cliente logado --- */
void cli_consultar_pedidos() {
    cabecalho("MEUS PEDIDOS");

    Cliente *cli = &clientes[cliente_logado];
    int encontrou = 0;

    for (int i = 0; i < num_pedidos; i++) {
        if (pedidos[i].id_cliente != cli->id) continue;
        encontrou = 1;

        Pedido *ped = &pedidos[i];
        printf("\nPedido #%d  |  Status: %s\n",
               ped->id, ped->pago ? "PAGO" : "PENDENTE");
        for (int j = 0; j < ped->num_itens; j++) {
            Produto *p = buscar_produto_por_id(ped->itens[j].id_produto);
            printf("  - %-25s x%d\n",
                   p ? p->nome : "?", ped->itens[j].quantidade);
        }
        printf("  Total: R$ %.2f\n", ped->valor_total);
        printf("  --------------------------------\n");
    }

    if (!encontrou) printf("Voce nao possui pedidos.\n");
    pausar();
}

/* --- Realizar pagamento --- */
void cli_realizar_pagamento() {
    cabecalho("REALIZAR PAGAMENTO");

    Cliente *cli = &clientes[cliente_logado];

    /* Listar pedidos pendentes do cliente */
    int encontrou = 0;
    printf("Pedidos pendentes:\n\n");
    printf("%-5s %12s\n", "ID", "Total");
    printf("-------------------\n");
    for (int i = 0; i < num_pedidos; i++) {
        if (pedidos[i].id_cliente == cli->id && !pedidos[i].pago) {
            printf("%-5d R$%9.2f\n", pedidos[i].id, pedidos[i].valor_total);
            encontrou = 1;
        }
    }

    if (!encontrou) {
        printf("Nenhum pedido pendente.\n");
        pausar();
        return;
    }

    printf("\nSeu saldo atual: R$ %.2f\n", cli->saldo);

    int id_ped;
    printf("\nID do pedido a pagar (0 para voltar): ");
    scanf("%d", &id_ped);
    limpar_buffer();

    if (id_ped == 0) { pausar(); return; }

    /* Localiza pedido */
    Pedido *ped = NULL;
    for (int i = 0; i < num_pedidos; i++) {
        if (pedidos[i].id == id_ped &&
            pedidos[i].id_cliente == cli->id &&
            !pedidos[i].pago) {
            ped = &pedidos[i];
            break;
        }
    }

    if (ped == NULL) {
        printf("Pedido nao encontrado ou nao pertence a voce.\n");
        pausar();
        return;
    }

    printf("\nValor do pedido #%d: R$ %.2f\n", ped->id, ped->valor_total);

    if (cli->saldo < ped->valor_total) {
        printf("Saldo insuficiente! Saldo: R$ %.2f  |  Necessario: R$ %.2f\n",
               cli->saldo, ped->valor_total);
        pausar();
        return;
    }

    printf("Confirmar pagamento? (s/n): ");
    char conf;
    scanf(" %c", &conf);
    limpar_buffer();

    if (conf != 's' && conf != 'S') {
        printf("Pagamento cancelado.\n");
        pausar();
        return;
    }

    /* Debitar saldo e marcar pedido como pago */
    cli->saldo -= ped->valor_total;
    ped->pago   = 1;

    /* Registrar pagamento */
    if (num_pagamentos < MAX_PAGAMENTOS) {
        pagamentos[num_pagamentos].id         = num_pagamentos + 1;
        pagamentos[num_pagamentos].id_pedido  = ped->id;
        pagamentos[num_pagamentos].id_cliente = cli->id;
        pagamentos[num_pagamentos].valor      = ped->valor_total;
        num_pagamentos++;
    }

    /* Baixar estoque e registrar vendas */
    for (int j = 0; j < ped->num_itens; j++) {
        Produto *p = buscar_produto_por_id(ped->itens[j].id_produto);
        if (p) {
            p->quantidade -= ped->itens[j].quantidade;
            if (num_vendas < MAX_VENDAS) {
                vendas[num_vendas].id          = num_vendas + 1;
                vendas[num_vendas].id_produto  = p->id;
                vendas[num_vendas].quantidade  = ped->itens[j].quantidade;
                vendas[num_vendas].valor_total = p->preco * ped->itens[j].quantidade;
                num_vendas++;
            }
        }
    }

    printf("\nPagamento realizado com sucesso!\n");
    printf("Saldo restante: R$ %.2f\n", cli->saldo);
    pausar();
}

/* --- Consultar pagamentos do cliente logado --- */
void cli_consultar_pagamentos() {
    cabecalho("MEUS PAGAMENTOS");

    Cliente *cli = &clientes[cliente_logado];
    int encontrou = 0;

    printf("%-5s %-10s %12s\n", "ID", "Pedido #", "Valor");
    printf("-------------------------------\n");
    for (int i = 0; i < num_pagamentos; i++) {
        if (pagamentos[i].id_cliente == cli->id) {
            printf("%-5d %-10d R$%9.2f\n",
                   pagamentos[i].id,
                   pagamentos[i].id_pedido,
                   pagamentos[i].valor);
            encontrou = 1;
        }
    }

    if (!encontrou) printf("Nenhum pagamento encontrado.\n");
    pausar();
}

/* --- Atualizar cadastro do cliente logado --- */
void cli_atualizar_cadastro() {
    cabecalho("ATUALIZAR CADASTRO");

    Cliente *cli = &clientes[cliente_logado];

    printf("Dados atuais:\n");
    printf("  Nome    : %s\n", cli->nome);
    printf("  Email   : %s\n", cli->email);
    printf("  Telefone: %s\n", cli->telefone);
    printf("  Usuario : %s\n", cli->usuario);
    printf("  Senha   : %s\n", cli->senha);
    printf("\n");

    int op;
    do {
        printf("O que deseja alterar?\n");
        printf("1. Nome\n");
        printf("2. Email\n");
        printf("3. Telefone\n");
        printf("4. Nome de usuario\n");
        printf("5. Senha\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        char novo[100];
        switch (op) {
            case 1:
                ler_string("Novo nome: ", novo, sizeof(novo));
                strcpy(cli->nome, novo);
                printf("Nome atualizado!\n");
                break;
            case 2:
                ler_string("Novo email: ", novo, sizeof(novo));
                strcpy(cli->email, novo);
                printf("Email atualizado!\n");
                break;
            case 3:
                ler_string("Novo telefone: ", novo, sizeof(novo));
                strcpy(cli->telefone, novo);
                printf("Telefone atualizado!\n");
                break;
            case 4:
                ler_string("Novo usuario: ", novo, sizeof(novo));
                strcpy(cli->usuario, novo);
                printf("Usuario atualizado!\n");
                break;
            case 5:
                ler_string("Nova senha: ", novo, sizeof(novo));
                strcpy(cli->senha, novo);
                printf("Senha atualizada!\n");
                break;
            case 0:
                break;
            default:
                printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- Menu principal do cliente --- */
void menu_cliente() {
    int op;
    do {
        Cliente *cli = &clientes[cliente_logado];
        printf("\n");
        printf("+------------------------------------+\n");
        printf("|         AREA DO CLIENTE            |\n");
        printf("+------------------------------------+\n");
        printf("|  Ola, %-28s|\n", cli->nome);
        printf("|  Saldo: R$ %-24.2f|\n", cli->saldo);
        printf("+------------------------------------+\n");
        printf("|  1. Ver produtos                   |\n");
        printf("|  2. Realizar pedido                |\n");
        printf("|  3. Meus pedidos                   |\n");
        printf("|  4. Realizar pagamento             |\n");
        printf("|  5. Meus pagamentos                |\n");
        printf("|  6. Atualizar cadastro             |\n");
        printf("|  0. Sair                           |\n");
        printf("+------------------------------------+\n");
        printf("Opcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: cli_listar_produtos();    break;
            case 2: cli_realizar_pedido();    break;
            case 3: cli_consultar_pedidos();  break;
            case 4: cli_realizar_pagamento(); break;
            case 5: cli_consultar_pagamentos(); break;
            case 6: cli_atualizar_cadastro(); break;
            case 0: printf("\nSaindo... Ate logo!\n\n"); break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);

    cliente_logado = -1;
}

/* ============================================================
 *  AREA DO ADM
 * ============================================================ */

/* --- 1. Clientes --- */
void cadastrar_cliente() {
    cabecalho("CADASTRAR CLIENTE");

    if (num_clientes >= MAX_CLIENTES) {
        printf("Limite de clientes atingido!\n");
        pausar();
        return;
    }

    Cliente c;
    c.id = num_clientes + 1;

    ler_string("Nome: ",     c.nome,     sizeof(c.nome));
    ler_string("Email: ",    c.email,    sizeof(c.email));
    ler_string("Telefone: ", c.telefone, sizeof(c.telefone));
    ler_string("Usuario: ",  c.usuario,  sizeof(c.usuario));
    ler_string("Senha: ",    c.senha,    sizeof(c.senha));

    printf("Saldo inicial: R$ ");
    scanf("%f", &c.saldo);
    limpar_buffer();

    clientes[num_clientes++] = c;
    printf("\nCliente cadastrado com ID #%d!\n", c.id);
    pausar();
}

void adm_listar_clientes() {
    cabecalho("LISTA DE CLIENTES");

    if (num_clientes == 0) {
        printf("Nenhum cliente cadastrado.\n");
        pausar();
        return;
    }

    printf("%-4s %-20s %-25s %-14s %-12s\n",
           "ID", "Nome", "Email", "Telefone", "Usuario");
    printf("------------------------------------------------------------------------\n");
    for (int i = 0; i < num_clientes; i++) {
        printf("%-4d %-20s %-25s %-14s %-12s\n",
               clientes[i].id,
               clientes[i].nome,
               clientes[i].email,
               clientes[i].telefone,
               clientes[i].usuario);
    }
    pausar();
}

void adm_buscar_cliente() {
    cabecalho("BUSCAR CLIENTE POR ID");
    int id;
    printf("ID do cliente: ");
    scanf("%d", &id);
    limpar_buffer();

    Cliente *c = buscar_cliente_por_id(id);
    if (c == NULL) {
        printf("Cliente nao encontrado.\n");
    } else {
        printf("\nID      : %d\n",    c->id);
        printf("Nome    : %s\n",      c->nome);
        printf("Email   : %s\n",      c->email);
        printf("Telefone: %s\n",      c->telefone);
        printf("Usuario : %s\n",      c->usuario);
        printf("Saldo   : R$ %.2f\n", c->saldo);
    }
    pausar();
}

void menu_adm_clientes() {
    int op;
    do {
        cabecalho("MENU CLIENTES");
        printf("1. Listar clientes\n");
        printf("2. Buscar cliente por ID\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: adm_listar_clientes();   break;
            case 2: adm_buscar_cliente();    break;
            case 0: break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- 2. Produtos --- */
void adm_cadastrar_produto() {
    cabecalho("CADASTRAR PRODUTO");

    if (num_produtos >= MAX_PRODUTOS) {
        printf("Limite de produtos atingido!\n");
        pausar();
        return;
    }

    Produto p;
    p.id = num_produtos + 1;

    ler_string("Nome: ", p.nome, sizeof(p.nome));

    /* Descricao: campo opcional */
    char buf_desc[500];
    while (1) {
        printf("Descricao (deixe em branco para omitir): ");
        fgets(buf_desc, sizeof(buf_desc), stdin);
        buf_desc[strcspn(buf_desc, "\n")] = '\0';

        if (str_vazio(buf_desc)) {
            char confirma;
            printf("  Deseja realmente deixar o produto sem descricao? (s/n): ");
            scanf(" %c", &confirma);
            limpar_buffer();
            if (confirma == 's' || confirma == 'S') {
                strcpy(p.descricao, "Produto sem descricao");
                break;
            }
            /* senao repete o loop */
        } else {
            strcpy(p.descricao, buf_desc);
            break;
        }
    }

    printf("Preco: R$ ");
    p.preco = ler_float_positivo("Preco");

    printf("Quantidade em estoque: ");
    p.quantidade = ler_int_positivo("Quantidade");

    produtos[num_produtos++] = p;
    printf("\nProduto cadastrado com ID #%d!\n", p.id);
    pausar();
}

void adm_listar_produtos() {
    cabecalho("LISTA DE PRODUTOS");

    if (num_produtos == 0) {
        printf("Nenhum produto cadastrado.\n");
        pausar();
        return;
    }

    printf("%-5s %-25s %10s %10s\n", "ID", "Nome", "Preco", "Estoque");
    printf("------------------------------------------------------\n");
    for (int i = 0; i < num_produtos; i++) {
        printf("%-5d %-25s R$%8.2f %10d\n",
               produtos[i].id,
               produtos[i].nome,
               produtos[i].preco,
               produtos[i].quantidade);
    }
    pausar();
}

void adm_buscar_produto() {
    cabecalho("BUSCAR PRODUTO POR ID");
    int id;
    printf("ID do produto: ");
    scanf("%d", &id);
    limpar_buffer();

    Produto *p = buscar_produto_por_id(id);
    if (p == NULL) {
        printf("Produto nao encontrado.\n");
    } else {
        printf("\nID      : %d\n",    p->id);
        printf("Nome    : %s\n",      p->nome);
        printf("Descricao: %s\n",     p->descricao);
        printf("Preco   : R$ %.2f\n", p->preco);
        printf("Estoque : %d un.\n",  p->quantidade);
    }
    pausar();
}

void menu_adm_produtos() {
    int op;
    do {
        cabecalho("MENU PRODUTOS");
        printf("1. Cadastrar produto\n");
        printf("2. Buscar produto por ID\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: adm_cadastrar_produto(); break;
            case 2: adm_buscar_produto();    break;
            case 0: break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- 3. Pedidos --- */
void adm_listar_pedidos() {
    cabecalho("LISTA DE PEDIDOS");

    if (num_pedidos == 0) {
        printf("Nenhum pedido registrado.\n");
        pausar();
        return;
    }

    for (int i = 0; i < num_pedidos; i++) {
        Pedido  *ped = &pedidos[i];
        Cliente *c   = buscar_cliente_por_id(ped->id_cliente);
        printf("\nPedido #%d  |  Cliente: %-20s  |  Status: %s\n",
               ped->id,
               c ? c->nome : "Desconhecido",
               ped->pago ? "PAGO" : "PENDENTE");
        for (int j = 0; j < ped->num_itens; j++) {
            Produto *p = buscar_produto_por_id(ped->itens[j].id_produto);
            printf("  - %-25s x%d\n",
                   p ? p->nome : "?", ped->itens[j].quantidade);
        }
        printf("  Total: R$ %.2f\n", ped->valor_total);
        printf("  --------------------------------\n");
    }
    pausar();
}

void adm_consultar_pedido() {
    cabecalho("CONSULTAR PEDIDO");
    int id;
    printf("ID do pedido: ");
    scanf("%d", &id);
    limpar_buffer();

    for (int i = 0; i < num_pedidos; i++) {
        if (pedidos[i].id == id) {
            Pedido  *ped = &pedidos[i];
            Cliente *c   = buscar_cliente_por_id(ped->id_cliente);
            printf("\nPedido #%d\n", ped->id);
            printf("Cliente: %s\n",  c ? c->nome : "Desconhecido");
            printf("Status : %s\n",  ped->pago ? "PAGO" : "PENDENTE");
            printf("Itens:\n");
            for (int j = 0; j < ped->num_itens; j++) {
                Produto *p = buscar_produto_por_id(ped->itens[j].id_produto);
                printf("  - %-25s x%d  R$ %.2f\n",
                       p ? p->nome : "?",
                       ped->itens[j].quantidade,
                       p ? p->preco * ped->itens[j].quantidade : 0);
            }
            printf("Total: R$ %.2f\n", ped->valor_total);
            pausar();
            return;
        }
    }
    printf("Pedido nao encontrado.\n");
    pausar();
}

void menu_adm_pedidos() {
    int op;
    do {
        cabecalho("MENU PEDIDOS");
        printf("1. Listar todos os pedidos\n");
        printf("2. Consultar pedido por ID\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: adm_listar_pedidos();  break;
            case 2: adm_consultar_pedido(); break;
            case 0: break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- 4. Controle de Estoque --- */
void adm_entrada_estoque() {
    cabecalho("ENTRADA DE ESTOQUE");
    int id, qtd;
    printf("ID do produto: ");
    scanf("%d", &id);
    limpar_buffer();

    Produto *p = buscar_produto_por_id(id);
    if (p == NULL) { printf("Produto nao encontrado.\n"); pausar(); return; }

    printf("Quantidade a adicionar: ");
    scanf("%d", &qtd);
    limpar_buffer();

    p->quantidade += qtd;
    printf("Estoque atualizado! %s agora tem %d unidades.\n", p->nome, p->quantidade);
    pausar();
}

void adm_saida_estoque() {
    cabecalho("SAIDA DE ESTOQUE");
    int id, qtd;
    printf("ID do produto: ");
    scanf("%d", &id);
    limpar_buffer();

    Produto *p = buscar_produto_por_id(id);
    if (p == NULL) { printf("Produto nao encontrado.\n"); pausar(); return; }

    printf("Quantidade a remover: ");
    scanf("%d", &qtd);
    limpar_buffer();

    if (qtd > p->quantidade) {
        printf("Estoque insuficiente! Disponivel: %d\n", p->quantidade);
        pausar();
        return;
    }

    p->quantidade -= qtd;
    printf("Saida registrada! %s agora tem %d unidades.\n", p->nome, p->quantidade);
    pausar();
}

void adm_estoque_baixo() {
    cabecalho("PRODUTOS COM ESTOQUE BAIXO");
    int encontrou = 0;

    printf("%-5s %-25s %10s\n", "ID", "Nome", "Estoque");
    printf("------------------------------------------\n");
    for (int i = 0; i < num_produtos; i++) {
        if (produtos[i].quantidade <= ESTOQUE_BAIXO) {
            printf("%-5d %-25s %10d  (!)\n",
                   produtos[i].id, produtos[i].nome, produtos[i].quantidade);
            encontrou = 1;
        }
    }
    if (!encontrou) printf("Nenhum produto com estoque baixo.\n");
    pausar();
}

void menu_adm_estoque() {
    int op;
    do {
        cabecalho("MENU ESTOQUE");
        printf("1. Entrada de produtos\n");
        printf("2. Saida de produtos\n");
        printf("3. Estoque Geral\n");
        printf("4. Produtos com estoque baixo\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: adm_entrada_estoque(); break;
            case 2: adm_saida_estoque();   break;
            case 3: adm_listar_produtos(); break;
            case 4: adm_estoque_baixo();   break;
            case 0: break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- 5. Vendas --- */
void adm_listar_vendas() {
    cabecalho("REGISTRO DE VENDAS");

    if (num_vendas == 0) {
        printf("Nenhuma venda registrada.\n");
        pausar();
        return;
    }

    printf("%-5s %-25s %8s %12s\n", "ID", "Produto", "Qtd", "Valor");
    printf("------------------------------------------------------\n");
    float total_geral = 0;
    for (int i = 0; i < num_vendas; i++) {
        Produto *p = buscar_produto_por_id(vendas[i].id_produto);
        printf("%-5d %-25s %8d R$%9.2f\n",
               vendas[i].id,
               p ? p->nome : "?",
               vendas[i].quantidade,
               vendas[i].valor_total);
        total_geral += vendas[i].valor_total;
    }
    printf("------------------------------------------------------\n");
    printf("TOTAL VENDIDO: R$ %.2f\n", total_geral);
    pausar();
}

void adm_total_vendido() {
    cabecalho("TOTAL VENDIDO");
    float total = 0;
    for (int i = 0; i < num_vendas; i++) total += vendas[i].valor_total;
    printf("Vendas realizadas: %d\n", num_vendas);
    printf("Valor total      : R$ %.2f\n", total);
    pausar();
}

void menu_adm_vendas() {
    int op;
    do {
        cabecalho("MENU VENDAS");
        printf("1. Listar vendas\n");
        printf("2. Calcular total vendido\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: adm_listar_vendas(); break;
            case 2: adm_total_vendido(); break;
            case 0: break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- 6. Reajuste de Precos --- */
void adm_reajuste_todos() {
    cabecalho("REAJUSTE - TODOS OS PRODUTOS");

    if (num_produtos == 0) { printf("Nenhum produto cadastrado.\n"); pausar(); return; }

    float percentual;
    printf("Percentual (positivo = aumento, negativo = desconto): ");
    scanf("%f", &percentual);
    limpar_buffer();

    float fator = 1.0f + (percentual / 100.0f);
    for (int i = 0; i < num_produtos; i++) {
        float antes = produtos[i].preco;
        produtos[i].preco *= fator;
        printf("  %-25s  R$ %.2f  ->  R$ %.2f\n",
               produtos[i].nome, antes, produtos[i].preco);
    }
    printf("\nReajuste de %.1f%% aplicado!\n", percentual);
    pausar();
}

void adm_reajuste_um() {
    cabecalho("REAJUSTE - UM PRODUTO");
    int id;
    printf("ID do produto: ");
    scanf("%d", &id);
    limpar_buffer();

    Produto *p = buscar_produto_por_id(id);
    if (p == NULL) { printf("Produto nao encontrado.\n"); pausar(); return; }

    float percentual;
    printf("Produto: %s | Preco atual: R$ %.2f\n", p->nome, p->preco);
    printf("Percentual (positivo = aumento, negativo = desconto): ");
    scanf("%f", &percentual);
    limpar_buffer();

    float antes = p->preco;
    p->preco *= (1.0f + percentual / 100.0f);
    printf("\nPreco atualizado: R$ %.2f  ->  R$ %.2f (%.1f%%)\n",
           antes, p->preco, percentual);
    pausar();
}

void menu_adm_reajuste() {
    int op;
    do {
        cabecalho("MENU REAJUSTE DE PRECOS");
        printf("1. Reajustar todos os produtos\n");
        printf("2. Reajustar um produto\n");
        printf("0. Voltar\n");
        printf("\nOpcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: adm_reajuste_todos(); break;
            case 2: adm_reajuste_um();    break;
            case 0: break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* --- Menu principal do ADM --- */
void menu_adm() {
    int op;
    do {
        printf("\n");
        printf("+------------------------------------+\n");
        printf("|        PAINEL ADMINISTRADOR        |\n");
        printf("+------------------------------------+\n");
        printf("|  1. Clientes                       |\n");
        printf("|  2. Produtos                       |\n");
        printf("|  3. Pedidos                        |\n");
        printf("|  4. Controle de Estoque            |\n");
        printf("|  5. Vendas                         |\n");
        printf("|  6. Reajuste de Precos             |\n");
        printf("|  0. Sair                           |\n");
        printf("+------------------------------------+\n");
        printf("Opcao: ");
        scanf("%d", &op);
        limpar_buffer();

        switch (op) {
            case 1: menu_adm_clientes();  break;
            case 2: menu_adm_produtos();  break;
            case 3: menu_adm_pedidos();   break;
            case 4: menu_adm_estoque();   break;
            case 5: menu_adm_vendas();    break;
            case 6: menu_adm_reajuste();  break;
            case 0: printf("\nSaindo... Ate logo!\n\n"); break;
            default: printf("Opcao invalida!\n");
        }
    } while (op != 0);
}

/* ============================================================
 *  MAIN
 * ============================================================ */

int main() {
    /* Cria conta padrao de cliente */
    criar_cliente_padrao();

    /* Cria produtos padrao */
    criar_produtos_padrao();

    int opcao;
    do {
        printf("\n");
        printf("+------------------------------------+\n");
        printf("|             TECHZONE               |\n");
        printf("+------------------------------------+\n");
        printf("|  1. Login                          |\n");
        printf("|  2. Cadastrar                      |\n");
        printf("|  0. Sair                           |\n");
        printf("+------------------------------------+\n");
        printf("Opcao: ");
        scanf("%d", &opcao);
        limpar_buffer();

        if (opcao == 1) {
            int tipo = tela_login();
            if (tipo == 1) {
                menu_adm();
            } else if (tipo == 0) {
                menu_cliente();
            }
            /* tipo == -1: login falhou, volta ao menu */
        } else if (opcao == 2) {
            cadastrar_cliente();
        } else if (opcao != 0) {
            printf("Opcao invalida!\n");
        }

    } while (opcao != 0);

    printf("Sistema encerrado.\n\n");
    return 0;
    
}
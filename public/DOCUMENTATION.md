
# Documentação do Sistema de Controle de Acesso

**Versão:** 1.0
**Data:** 2024-07-26

---

## 1. Visão Geral do Sistema

O Sistema de Controle de Acesso é uma aplicação web moderna, desenvolvida para gerenciar de forma eficiente e segura o fluxo de pessoas e veículos no terminal. A plataforma foi construída com foco em resiliência, usabilidade e segurança, garantindo a continuidade da operação mesmo em ambientes com conectividade limitada.

### 1.1. Principais Objetivos

*   **Centralizar o Registro:** Unificar o controle de acesso de Visitantes, Trabalhadores Portuários Avulsos (TPAs), Consumo de Bordo e o registro de Refeições para forças de segurança.
*   **Operação Ininterrupta:** Garantir que o sistema funcione perfeitamente online e offline, sincronizando os dados automaticamente quando a conexão é restabelecida.
*   **Segurança e Compliance:** Integrar um sistema de verificação de compliance para identificar e bloquear o acesso de indivíduos com restrições.
*   **Interface Intuitiva:** Oferecer uma experiência de usuário clara e eficiente, otimizada tanto para desktops quanto para dispositivos móveis.
*   **Geração de Relatórios:** Fornecer dados estruturados que facilitem a criação de relatórios e a análise do fluxo de acesso.

---

## 2. Arquitetura Técnica

O sistema é uma Single-Page Application (SPA) construída com tecnologias web modernas, utilizando o Firebase como backend.

### 2.1. Tecnologias Principais

*   **Frontend:**
    *   **Next.js (React):** Framework principal para a construção da interface do usuário.
    *   **Tailwind CSS:** Para estilização rápida e consistente.
    *   **Zustand:** Gerenciamento de estado global da aplicação (UI e dados offline).
    *   **Shadcn/ui:** Biblioteca de componentes de UI acessíveis e reutilizáveis.

*   **Backend & Banco de Dados:**
    *   **Firebase Realtime Database:** Banco de dados NoSQL em tempo real para armazenamento e sincronização de todos os registros.
    *   **Firebase Authentication:** Para gerenciamento de login e identidade dos usuários.

*   **Suporte Offline:**
    *   **IndexedDB (via `utils/db.ts`):** Utilizado como uma "Caixa de Saída" (Outbox) para armazenar ações (criação, atualização) realizadas enquanto o aplicativo está offline.
    *   **Service Worker & Background Sync API:** O Service Worker (`sw.js`) escuta por eventos de sincronização (`sync-new-items`) para enviar os dados da Outbox para o Firebase assim que a conexão é restaurada.
    *   **LocalStorage:** Utilizado como um cache rápido para os dados principais, permitindo que a aplicação carregue instantaneamente enquanto busca as atualizações mais recentes do Firebase.

### 2.2. Fluxo de Dados (Online vs. Offline)

A arquitetura de dados é projetada para ser "Offline-First".

1.  **Carregamento Inicial:** A aplicação primeiro tenta carregar os dados do `LocalStorage`. Isso torna a inicialização quase instantânea.
2.  **Sincronização Ativa:** Em paralelo, ela se conecta ao Firebase Realtime Database. Assim que os dados são recebidos, a interface é atualizada e o `LocalStorage` é atualizado com os dados mais recentes.
3.  **Ações Offline:**
    *   Quando uma ação de criação ou atualização é realizada sem conexão, o registro é salvo na **Outbox (IndexedDB)**.
    *   A interface é atualizada imediatamente, mostrando o novo item com um indicador visual de "Aguardando Sincronização" (ícone de Wi-Fi cortado).
    *   Um evento `sync` é registrado com o Service Worker.
4.  **Sincronização em Background:** Quando a conectividade é restaurada, o Service Worker é ativado pelo navegador e processa a fila da Outbox, enviando cada item para o Firebase.

---

## 3. Estrutura de Dados (Modelos)

Abaixo estão as principais estruturas de dados utilizadas no sistema.

*   **`Visitante`**: Representa um visitante geral no terminal.
*   **`Tpa`**: Representa um Trabalhador Portuário Avulso.
*   **`RefeicaoPolicial`**: Representa um registro de refeição para um grupo de policiais.
*   **`ConsumoBordo`**: Representa um registro de entrega de produto ou serviço a um navio.
*   **`OcorrenciaCompliance`**: Representa um registro de bloqueio ou alerta para um indivíduo.

*(Uma descrição detalhada de cada campo de cada modelo será incluída em um apêndice no final deste documento para referência técnica.)*

---

## 4. Documentação dos Módulos

### 4.1. Módulo de Visitantes (`visitantes-section.tsx`)

Este é o módulo principal para o controle de acesso de visitantes.

**Funcionalidades:**

*   **Visão Rápida:** Cards no topo exibem o total de visitantes **presentes**, o total que **saiu no dia** e os **navios atracados** nos terminais TEG e TEAG.
*   **Busca e Filtro:** Permite pesquisar por nome, documento (CPF), placa do veículo e filtrar por um intervalo de datas.
*   **Registro de Entrada:**
    *   Um formulário completo permite registrar a entrada de um ou **múltiplos visitantes** de uma só vez.
    *   Validações rigorosas são aplicadas a campos como CPF e datas.
    *   Possui a opção "Informações Adicionais" para capturar dados de RG, CNH, etc.
*   **Registro de Saída:** Uma ação simples de um clique na tabela para registrar a data e a hora de saída.
*   **Reentrada Rápida:** Para um visitante que já saiu, o botão "Nova Entrada" reutiliza seus dados cadastrais, agilizando o processo.
*   **Integração com Compliance:** Ao digitar o CPF, o sistema verifica em tempo real se há restrições. Se uma ocorrência **crítica** for encontrada, o formulário de registro é bloqueado.
*   **Gerenciamento de Estacionamento:** Ao marcar "Usa Estacionamento" e preencher a placa, o sistema integra-se com o controle de vagas.
*   **Layout Responsivo:** A tabela de dados se transforma em cards em dispositivos móveis para melhor visualização.
*   **Suporte Offline:** O registro de novas entradas e saídas funciona perfeitamente sem conexão com a internet.

### 4.2. Módulo de Refeições (`refeicoes-section.tsx`)

Este módulo gerencia o fornecimento de refeições para as forças de segurança (PM, PC, PR).

**Funcionalidades:**

*   **Visão Rápida:** Cards exibem o total de refeições servidas por categoria no período filtrado.
*   **Registro em Grupo:** O formulário permite registrar **múltiplos policiais** em uma única operação, associando-os a uma viatura e categoria.
*   **Controle Individual:** Embora registrados em grupo, a tabela principal exibe cada policial em uma linha separada, permitindo o **registro de saída individual**.
*   **Compatibilidade com Dados Legados:** O sistema é capaz de interpretar e exibir corretamente os registros feitos no formato antigo da aplicação.
*   **Suporte Offline:** O registro de novas refeições (em grupo) e o registro de saídas (individual) funcionam offline, com sincronização automática.

### 4.3. Módulo de TPAs (`tpas-section.tsx`)

Gerencia o acesso dos Trabalhadores Portuários Avulsos.

**Funcionalidades:**

*   **Destaque Visual por Credencial:** A principal característica deste módulo é o uso de cores para identificar o nível de acesso do TPA:
    *   **Linha Verde:** Credencial **Verde** (acesso liberado ao navio).
    *   **Linha Vermelha:** Credencial **Vermelha** (acesso liberado ao píer).
*   **Formulário Detalhado:** Captura informações específicas do TPA, como **Função**, **Número CIP** e **Meio de Acesso** (Terra ou Mar).
*   **Validação de CPF Único:** Impede uma nova entrada se o CPF do TPA já tiver um registro de acesso ativo (status "presente").
*   **Fluxo de Reentrada:** Facilita o registro de um TPA que retorna.
*   **Integração com Compliance e Suporte Offline:** Segue o mesmo padrão robusto de verificação de CPF e funcionamento sem conectividade.

### 4.4. Módulo de Consumo de Bordo (`consumo-section.tsx`)

Módulo para registrar a entrada de produtos e serviços a bordo de navios.

**Funcionalidades:**

*   **Registro Completo:** Controla a operação de ponta a ponta, registrando o **veículo** (tipo e placa), o **produto/serviço** (descrição e nota fiscal), o **destino** (navio e terminal) e os **indivíduos** (motoristas, técnicos) envolvidos.
*   **Visão Rápida:** Cards de estatísticas informam o total de registros, quantos indivíduos estão atualmente a bordo, o total de pessoas no período e a divisão de operações por terminal (TEG/TEAG).
*   **Gerenciamento Individual:** Assim como no módulo de refeições, permite registrar múltiplos indivíduos em uma única operação e, posteriormente, gerenciar a **saída** e **reentrada** de cada um deles separadamente.
*   **Visualização Inteligente:** A tabela de histórico agrupa informações comuns (do veículo e da carga) em uma única linha visual, mesmo que haja vários indivíduos, tornando a leitura mais limpa e organizada.
*   **Validação Avançada:** Além da verificação de compliance e de acesso ativo, o sistema também impede que o mesmo CPF seja inserido duas vezes **no mesmo formulário** de registro.
*   **Suporte Offline:** Garante que novos registros de consumo e as saídas individuais possam ser feitos offline.

### 4.5. Módulo de Compliance (`compliance-section.tsx`)

Este é o centro de controle de segurança do sistema, responsável por gerenciar restrições de acesso.

**Funcionalidades:**

*   **Gestão de Ocorrências:** Permite que usuários autorizados (tipicamente administradores) criem, editem e excluam ocorrências de compliance associadas a um CPF.
*   **Rastreabilidade:** Cada ocorrência salva registra o email do usuário que a criou (`Registrado por`), garantindo a responsabilidade e o histórico das ações.
*   **Alerta Crítico vs. Alerta Simples:** Esta é a funcionalidade central do módulo.
    *   **Alerta Crítico (`isCritical: true`):** Se uma ocorrência é marcada como "crítica", o sistema **bloqueia automaticamente** qualquer tentativa de registro (em Visitantes, TPAs, Consumo) para o CPF associado. Uma mensagem clara com o motivo é exibida para o operador.
    *   **Alerta Simples (`isCritical: false`):** Se não for crítica, a ocorrência serve como um aviso. O sistema exibe um alerta nos outros módulos, mas **permite** que o operador continue com o registro, ciente da informação.
*   **Destaque Visual:** Ocorrências críticas são destacadas visualmente na tabela com a cor vermelha e um ícone de alerta, facilitando a identificação.
*   **Operação Exclusivamente Online:** Devido à natureza crítica da segurança, este módulo **não possui suporte offline**. Todas as alterações nas ocorrências são feitas em tempo real para garantir que as regras de segurança sejam aplicadas de forma consistente e imediata para todos os usuários.

### 4.6. Módulo de Estacionamento (`parking-section.tsx`)

Fornece uma visualização em tempo real do estado do estacionamento.

**Funcionalidades:**

*   **Dashboard Visual:** Apresenta um grid onde cada célula numerada representa uma vaga no estacionamento.
*   **Status por Cor:** O status de cada vaga é instantaneamente reconhecível pela cor:
    *   **Verde:** Vaga disponível.
    *   **Vermelho:** Vaga ocupada.
*   **Informação Detalhada:** Ao passar o mouse sobre uma vaga ocupada, uma dica de ferramenta (tooltip) exibe a **placa do veículo** que a está utilizando.
*   **Integração Passiva:** Este é um módulo de **apenas leitura**. Ele não altera o estado das vagas. Em vez disso, ele reflete as mudanças que ocorrem nos módulos de "Visitantes" e "Consumo de Bordo" quando um veículo com a opção "Usa Estacionamento" tem sua entrada ou saída registrada.

### 4.7. Configurações do Sistema (`settings-section.tsx`)

Permite a personalização de preferências e comportamentos do sistema no navegador do usuário.

**Funcionalidades:**

*   **Configurações Locais:** Todas as opções definidas nesta seção são salvas **localmente no navegador** do usuário (usando `localStorage`). Isso significa que as preferências de um operador não afetam as de outro.
*   **Tempo Máximo de Permanência:** Permite definir um limite de horas que um visitante pode permanecer no terminal. Este valor é a base para futuros alertas de permanência excedida.
*   **Alertas de Voz:** O recurso principal desta seção. O usuário pode ativar ou desativar **alertas de voz** granulares que anunciam a entrada de:
    *   Novos Visitantes
    *   Novas Refeições
    *   Novos TPAs
    *   Novo Consumo de Bordo
    
    Esta funcionalidade de acessibilidade e conveniência permite que o operador da portaria tenha consciência situacional dos eventos sem precisar olhar constantemente para a tela.

---

## 5. Guia de Funcionalidades Futuras (Sugestão)

### 5.1. Controle de Acesso por Função (RBAC)

O próximo passo natural para a evolução do sistema é a implementação de um controle de acesso baseado em funções.

*   **Funções Propostas:**
    *   **Administrador:** Acesso total a todos os módulos, incluindo a capacidade de editar e excluir qualquer registro e gerenciar as permissões de outros usuários.
    *   **Operador:** Acesso aos módulos operacionais (Visitantes, TPAs, Refeições) com permissão para criar e editar, mas **não** para excluir.
    *   **Visualizador:** Acesso de apenas leitura a determinados módulos.

*   **Implementação Técnica:**
    *   Utilizar **Custom Claims** do Firebase Authentication para atribuir uma função (`role`) a cada usuário.
    *   Criar uma **Cloud Function** para que apenas administradores possam modificar as funções de outros usuários.
    *   Atualizar as **Regras de Segurança** do Realtime Database para que o próprio banco de dados imponha as restrições de leitura e escrita com base na função do usuário (`auth.token.role`).
    *   Na interface, os botões de ação (Excluir, Editar) seriam condicionalmente renderizados com base na função do usuário logado.

Este documento serve como um guia completo para o entendimento, operação e futura manutenção do Sistema de Controle de Acesso.

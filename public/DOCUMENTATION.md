# Documentação do Sistema de Controle

## Visão Geral e Benefícios Essenciais

Este sistema foi desenvolvido para ser um **Ecossistema de Inteligência e Controle de Acesso de Alta Disponibilidade**, otimizando a segurança e a gestão operacional em ambientes críticos como terminais portuários ou industriais.

### Resiliência Operacional (Offline-First)

O sistema continua funcionando perfeitamente mesmo sem conexão com a internet. Os dados são salvos localmente e sincronizados automaticamente quando a conexão é restabelecida, garantindo a continuidade das operações de segurança sem interrupções. **Nunca mais perca um registro por falha de rede.**

### Compliance Integrado e Prevenção de Riscos

Consulta instantânea a uma lista de indivíduos com alertas de compliance (lista negra). Em caso de um "Alerta Crítico", o sistema bloqueia o registro de entrada e dispara um aviso visual imediato, impedindo o acesso de pessoas não autorizadas ou de alto risco.

### Rigor Técnico e Validação de Dados

Uso de máscaras de entrada inteligentes para documentos (CPF, RG), placas (Mercosul e antigo) e telefones, garantindo a integridade dos dados. Validações robustas para evitar duplicidade de entrada, verificar validade de documentos e garantir datas lógicas.

### Customização e Setorização

Flexibilidade para registrar múltiplas pessoas de uma só vez (entrada em lote) com dados comuns à visita e específicos a cada indivíduo. Credenciais de acesso por cores (Azul, Vermelho, Verde) para facilitar a identificação visual rápida e controle de acesso a diferentes áreas.

### Eficiência e Agilidade

Funcionalidade de "Nova Entrada" (Re-entry) que pré-preenche dados de visitantes recorrentes, agilizando o processo. Busca instantânea e filtros por nome, empresa, documento, placa e período para acesso rápido ao histórico.

### Redução de Custos e Sustentabilidade

Dispensa infraestrutura de hardware complexa, rodando como PWA (Progressive Web App) em qualquer navegador moderno. Eliminação do uso de papel, contribuindo para a sustentabilidade e facilitando auditorias digitais.

## Módulos e Funcionalidades de Segurança

### Controle de Visitantes

*   Registro detalhado de entrada e saída (nome, documento, empresa, motivo, destino, data/hora).
*   Campos adicionais para segurança: Nota Fiscal, Placa do veículo, Observações.
*   Informações complementares para "Diversos": RG, CNH (com categoria e validades), Data de Nascimento, Telefone.
*   Status de presença em tempo real ("Presente", "Saiu").
*   Funcionalidade de "Reentrada" para agilizar o registro de visitantes frequentes.
*   Alerta visual para documentos vencidos (RG/CNH).

### Sistema de Compliance

*   Verificação automática do CPF/Documento contra lista de ocorrências.
*   Classificação de alertas (Ex: "Crítico", "Atenção").
*   Bloqueio de registro de entrada para alertas "Críticos" com notificação clara.
*   Armazenamento de histórico de ocorrências de compliance para auditoria.

### Gerenciamento de Credenciais de Acesso

*   Atribuição de credenciais por nível de acesso (Azul: Administrativo, Vermelho: Pier, Verde: Navio).
*   Badges visuais no dashboard e nos registros para rápida identificação do nível de permissão.

### Auditoria e Rastreabilidade

*   Registro de timestamp de criação e atualização de cada entrada no banco de dados.
*   Histórico completo de visitantes com filtros avançados para buscas rápidas.
*   Dados consistentes e validados para relatórios de segurança e conformidade.

## Como Usar o Sistema

### Acesso e Login

O acesso ao sistema é realizado através de uma página de login segura, utilizando autenticação via Firebase. Somente usuários autorizados com credenciais válidas podem acessar o painel de controle.

*   Navegue até a URL do sistema.
*   Insira seu email e senha cadastrados.
*   Clique em "Entrar".

### Dashboard Principal

Após o login, você será direcionado ao dashboard principal, que oferece uma visão geral das operações de controle de visitantes.

*   **Cartões de Estatísticas:** Veja rapidamente o número de visitantes "Presentes", "Saíram Hoje" e informações sobre navios nos piers (TEG/TEAG).
*   **Barra de Busca e Filtros:** Utilize a caixa de busca para encontrar visitantes por nome, empresa, documento ou placa. Filtre por "Data Início" e "Data Fim" para visualizar registros de períodos específicos.
*   **Botão "Registrar Entrada":** Clique para abrir o formulário de registro de novos visitantes.

### Registrar Nova Entrada (Modo Multi-Pessoas)

Este modo é ideal para registrar múltiplos visitantes que chegam juntos, como em uma van ou equipe.

*   Clique em "Registrar Entrada".
*   **Seção "Pessoas":**
    *   Preencha o "Nome Completo" e "Documento (CPF)" de cada visitante.
    *   Marque "Diversos" para incluir RG, CNH, Data de Nascimento e Telefone (campos de segurança adicionais).
    *   Utilize "Adicionar Pessoa" para incluir mais indivíduos no mesmo registro de visita.
    *   O sistema realizará a verificação de compliance para cada CPF inserido.
*   **Seção "Detalhes da Visita":**
    *   Preencha "Empresa", "Motivo da Visita", "Credencial de Acesso" e "Destino".
    *   Se "Destino" for "Outros", especifique o local no campo adicional.
    *   Insira "Data Entrada", "Hora Entrada", "Nota Fiscal", "Placa" e "Observações".
    *   Clique em "Registrar Pessoa(s)" para salvar.

### Editar um Registro Existente (Modo Single-Pessoa)

Para corrigir informações ou adicionar dados a um visitante já registrado.

*   Na lista de "Histórico de Visitantes", encontre o visitante desejado.
*   Clique no ícone de lápis () na coluna "Ações" para abrir o formulário de edição.
*   Modifique os campos necessários.
*   Clique em "Salvar Alterações".

### Registrar Saída

Para marcar a saída de um visitante.

*   Na lista de "Histórico de Visitantes", localize o visitante com status "Presente".
*   Clique no botão "Sair" () na coluna "Ações".
*   A data e hora de saída serão preenchidas automaticamente.

### Nova Entrada (Re-entry)

Para agilizar o registro de um visitante que já esteve no terminal e está retornando.

*   Na lista de "Histórico de Visitantes", encontre um visitante que já "Saiu".
*   Clique no botão "Nova Entrada" () na coluna "Ações".
*   O sistema pré-preencherá os dados do visitante, restando apenas atualizar os detalhes da nova visita.

### Excluir Registro

Para remover permanentemente um registro (requer confirmação).

*   Na lista de "Histórico de Visitantes", encontre o registro a ser excluído.
*   Clique no ícone de lixeira () na coluna "Ações".
*   Confirme a exclusão no diálogo que aparecer.

## Observações Técnicas e de Desenvolvimento

### Tecnologias Utilizadas

*   **Frontend:** Next.js (App Router), React, Tailwind CSS, Radix UI (componentes).
*   **Backend/Banco de Dados:** Firebase Realtime Database, Firebase Authentication, Firebase Admin.
*   **Armazenamento Offline:** IndexedDB via `idb` e Service Workers (`serwist`).
*   **Sincronização:** API Route (`/api/sync`) para sincronização de dados offline.
*   **Validação de Formulários:** `react-hook-form` e `zod`.
*   **Máscaras de Input:** `react-imask`.

### Arquitetura Offline-First

A aplicação utiliza Service Workers para cache de ativos e uma estratégia de "outbox" com IndexedDB para armazenar operações (criação/atualização) realizadas offline. Uma vez que a conexão é restaurada, essas operações são enviadas para a API de sincronização (`/api/sync`) e, em seguida, para o Firebase Realtime Database.

### Segurança de Dados e Acesso

Autenticação de usuários via Firebase Authentication. Regras de segurança no Firebase Realtime Database (`database.rules.json`) para controlar o acesso de leitura e escrita. O uso de variáveis de ambiente (`.env.local`) garante a segurança das credenciais Firebase.

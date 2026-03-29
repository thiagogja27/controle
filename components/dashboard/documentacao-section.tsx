'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Eye, Lock, BookOpenCheck, Code } from "lucide-react"

const sections = [
  {
    icon: Eye,
    title: "Visão Geral e Benefícios Essenciais",
    content: (
      <>
        <p className="mb-4">Este sistema foi desenvolvido para ser um <strong>Ecossistema de Inteligência e Controle de Acesso de Alta Disponibilidade</strong>, otimizando a segurança e a gestão operacional em ambientes críticos como terminais portuários ou industriais.</p>
        <ul className="list-disc pl-5 space-y-3">
          <li><strong>Resiliência Operacional (Offline-First):</strong> O sistema continua funcionando perfeitamente mesmo sem conexão com a internet. Os dados são salvos localmente e sincronizados automaticamente quando a conexão é restabelecida, garantindo a continuidade das operações. <strong>Nunca mais perca um registro por falha de rede.</strong></li>
          <li><strong>Compliance Integrado e Prevenção de Riscos:</strong> Consulta instantânea a uma lista de indivíduos com alertas de compliance. Em caso de "Alerta Crítico", o sistema bloqueia a entrada e dispara um aviso imediato.</li>
          <li><strong>Rigor Técnico e Validação de Dados:</strong> Uso de máscaras de entrada inteligentes e validações robustas para garantir a integridade dos dados e evitar duplicidade.</li>
          <li><strong>Customização e Setorização:</strong> Flexibilidade para registrar múltiplas pessoas de uma só vez e atribuir credenciais de acesso por cores para fácil identificação visual.</li>
          <li><strong>Eficiência e Agilidade:</strong> Funcionalidade de "Nova Entrada" (Re-entry) que pré-preenche dados de visitantes recorrentes, agilizando o processo.</li>
          <li><strong>Redução de Custos e Sustentabilidade:</strong> Dispensa infraestrutura complexa, rodando como PWA em qualquer navegador moderno e eliminando o uso de papel.</li>
        </ul>
      </>
    )
  },
  {
    icon: Lock,
    title: "Módulos e Funcionalidades de Segurança",
    content: (
      <div className="space-y-6">
        <div>
            <h4 className="font-semibold mb-2">Controle de Visitantes</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Registro detalhado de entrada e saída (nome, documento, empresa, etc.).</li>
                <li>Campos adicionais para segurança: Nota Fiscal, Placa, Observações.</li>
                <li>Status de presença em tempo real e função "Reentrada".</li>
                <li>Alerta visual para documentos vencidos.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Sistema de Compliance</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Verificação automática do documento contra lista de ocorrências.</li>
                <li>Bloqueio de registro de entrada para alertas "Críticos".</li>
                <li>Armazenamento de histórico de ocorrências para auditoria.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Gerenciamento de Credenciais de Acesso</h4>
             <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Atribuição de credenciais por nível de acesso (Azul, Vermelho, Verde).</li>
                <li>Badges visuais no sistema para rápida identificação.</li>
            </ul>
        </div>
         <div>
            <h4 className="font-semibold mb-2">Auditoria e Rastreabilidade</h4>
             <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Registro de timestamp de criação e atualização de cada entrada.</li>
                <li>Histórico completo de visitantes com filtros avançados.</li>
            </ul>
        </div>
      </div>
    )
  },
  {
      icon: BookOpenCheck,
      title: "Como Usar o Sistema",
      content: (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold mb-2">Acesso e Login</h4>
                <p className="text-sm">O acesso é realizado via Firebase Authentication. Somente usuários autorizados podem acessar o painel de controle inserindo seu email e senha.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Dashboard Principal</h4>
                <p className="text-sm">A tela inicial oferece estatísticas rápidas, barra de busca com filtros, e o botão para registrar novas entradas.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-2">Registrar Nova Entrada (Modo Multi-Pessoas)</h4>
                <p className="text-sm">Ideal para registrar múltiplos visitantes de uma vez. Preencha os dados de cada pessoa e os detalhes da visita. O sistema verifica o compliance de cada CPF automaticamente.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Ações Rápidas no Histórico</h4>
                 <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><strong>Editar um Registro Existente:</strong> Clique no ícone de lápis para corrigir informações.</li>
                    <li><strong>Registrar Saída:</strong> Clique no botão "Sair" para marcar a saída de um visitante.</li>
                    <li><strong>Nova Entrada (Re-entry):</strong> Clique no botão "Nova Entrada" para agilizar o cadastro de um visitante recorrente.</li>
                    <li><strong>Excluir Registro:</strong> Clique no ícone de lixeira para remover um registro (requer confirmação).</li>
                </ul>
            </div>
        </div>
      )
  },
  {
      icon: Code,
      title: "Observações Técnicas e de Desenvolvimento",
      content: (
          <div className="space-y-6">
            <div>
                <h4 className="font-semibold mb-2">Tecnologias Utilizadas</h4>
                <p className="text-sm"><strong>Frontend:</strong> Next.js, React, Tailwind CSS, Radix UI.<br/><strong>Backend/DB:</strong> Firebase (Realtime DB, Auth, Admin).<br/><strong>Offline:</strong> IndexedDB via `idb` e Service Workers (`serwist`).<br/><strong>Validação:</strong> `react-hook-form` e `zod`.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Arquitetura Offline-First</h4>
                <p className="text-sm">A aplicação usa uma estratégia de "outbox" com IndexedDB para armazenar operações offline. Quando a conexão retorna, os dados são sincronizados via uma API Route para o Firebase.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-2">Segurança de Dados e Acesso</h4>
                <p className="text-sm">Autenticação via Firebase Auth e regras de segurança no Realtime Database. As credenciais são protegidas usando variáveis de ambiente (`.env.local`).</p>
            </div>
          </div>
      )
  }
];

export function DocumentacaoSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentação do Sistema de Controle</CardTitle>
        <CardDescription>
          Encontre aqui todas as informações sobre as funcionalidades, arquitetura e modo de uso do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
            {sections.map((section, index) => (
                 <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                            <section.icon className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-base">{section.title}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground pl-12 pt-4">
                        {section.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

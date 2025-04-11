// app/(dashboard)/nelogica-test/_actions/index.ts
"use server";

import {
  NelogicaUatClient,
  CreateSubscriptionParams,
} from "@/lib/services/nelogica-uat-client";
import { NELOGICA_PROFILES } from "@/lib/services/nelogica-service";

// Configurações do ambiente UAT da Nelogica
const NELOGICA_UAT_IP = process.env.NELOGICA_UAT_IP || "191.252.154.12";
const NELOGICA_UAT_PORT = parseInt(process.env.NELOGICA_UAT_PORT || "36302");
const NELOGICA_UAT_TOKEN =
  process.env.NELOGICA_UAT_TOKEN || "3dBtHNwjxWZmcPL8YzGSjLfSfM6xTveV";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NELOGICA_ENVIRONMENT_ID =
  process.env.NELOGICA_ENVIRONMENT_ID || "environment_id";

/**
 * Testa a conexão com a API da Nelogica
 */
export async function testNelogicaAuth() {
  try {
    console.log("Iniciando teste de conexão com Nelogica UAT...");
    console.log(`Conectando a ${NELOGICA_UAT_IP}:${NELOGICA_UAT_PORT}`);

    const apiClient = new NelogicaUatClient(
      NELOGICA_UAT_IP,
      NELOGICA_UAT_PORT,
      NELOGICA_UAT_TOKEN
    );

    const isConnected = await apiClient.testConnection();

    if (isConnected) {
      console.log("Conexão com Nelogica UAT estabelecida com sucesso");
      return {
        success: true,
        expiresAt: "Token estático - sem data de expiração",
      };
    } else {
      console.log("Falha ao conectar com Nelogica UAT");
      return {
        success: false,
        error: "Não foi possível estabelecer conexão com o servidor",
      };
    }
  } catch (error) {
    console.error("Erro ao testar conexão Nelogica UAT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface CreateSubscriptionRequest {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  plan: string;
}

/**
 * Testa a criação de assinatura na Nelogica
 */
export async function testNelogicaCreateSubscription(
  request: CreateSubscriptionRequest
) {
  try {
    console.log("Iniciando criação de assinatura na Nelogica UAT...");

    const apiClient = new NelogicaUatClient(
      NELOGICA_UAT_IP,
      NELOGICA_UAT_PORT,
      NELOGICA_UAT_TOKEN
    );

    const params: CreateSubscriptionParams = {
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      document: {
        documentType: 1, // 1 = CPF
        document: request.cpf.replace(/\D/g, ""),
      },
      PhoneNumber: request.phone,
      countryNationality: "BRA",
      address: {
        street: "Endereço de Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        country: "BRA",
        zipCode: "01000-000",
      },
      // Não inclua conta aqui, vamos criar separadamente para melhor controle
    };

    const response = await apiClient.createSubscription(params);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Assinatura criada com sucesso:", response.data);

    return {
      success: true,
      customerId: response.data.customerId,
      subscriptionId: response.data.subscriptionId,
      licenseId: response.data.licenseId,
    };
  } catch (error) {
    console.error("Erro ao criar assinatura Nelogica UAT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface CreateAccountRequest {
  licenseId: string;
  name: string;
  plan: string;
}

/**
 * Testa a criação de conta na Nelogica
 */
export async function testNelogicaCreateAccount(request: CreateAccountRequest) {
  try {
    console.log("Iniciando criação de conta na Nelogica UAT...");

    const apiClient = new NelogicaUatClient(
      NELOGICA_UAT_IP,
      NELOGICA_UAT_PORT,
      NELOGICA_UAT_TOKEN
    );

    // Obtém o ID do perfil a partir do plano
    const profileId =
      NELOGICA_PROFILES[request.plan as keyof typeof NELOGICA_PROFILES];

    if (!profileId) {
      return {
        success: false,
        error: `Perfil não encontrado para o plano: ${request.plan}`,
      };
    }

    const accounts = [
      {
        name: request.name.substring(0, 20), // Limitando o nome a 20 caracteres
        profileId: profileId,
      },
    ];

    const response = await apiClient.createAccount(request.licenseId, accounts);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Conta criada com sucesso:", response.data);

    return {
      success: true,
      account: response.data[0].account,
      profileId: response.data[0].profileId,
    };
  } catch (error) {
    console.error("Erro ao criar conta Nelogica UAT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface SetRiskRequest {
  licenseId: string;
  account: string;
  plan: string;
}

/**
 * Testa a configuração de perfil de risco na Nelogica
 */
export async function testNelogicaSetRisk(request: SetRiskRequest) {
  try {
    console.log("Iniciando configuração de perfil de risco na Nelogica UAT...");

    const apiClient = new NelogicaUatClient(
      NELOGICA_UAT_IP,
      NELOGICA_UAT_PORT,
      NELOGICA_UAT_TOKEN
    );

    // Obtém o ID do perfil a partir do plano
    const profileId =
      NELOGICA_PROFILES[request.plan as keyof typeof NELOGICA_PROFILES];

    if (!profileId) {
      return {
        success: false,
        error: `Perfil não encontrado para o plano: ${request.plan}`,
      };
    }

    // Define o tipo de conta como Desafio (0)
    const response = await apiClient.setAccountRisk(
      request.licenseId,
      request.account,
      profileId,
      0
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Perfil de risco configurado com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao configurar perfil de risco Nelogica UAT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface AccountActionRequest {
  licenseId: string;
  account: string;
}

/**
 * Testa o bloqueio de conta na Nelogica
 */
export async function testNelogicaBlockAccount(request: AccountActionRequest) {
  try {
    console.log("Iniciando bloqueio de conta na Nelogica UAT...");

    const apiClient = new NelogicaUatClient(
      NELOGICA_UAT_IP,
      NELOGICA_UAT_PORT,
      NELOGICA_UAT_TOKEN
    );

    const response = await apiClient.blockAccount(
      request.licenseId,
      request.account
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Conta bloqueada com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao bloquear conta Nelogica UAT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa o desbloqueio de conta na Nelogica
 */
export async function testNelogicaUnblockAccount(
  request: AccountActionRequest
) {
  try {
    console.log("Iniciando desbloqueio de conta na Nelogica UAT...");

    const apiClient = new NelogicaUatClient(
      NELOGICA_UAT_IP,
      NELOGICA_UAT_PORT,
      NELOGICA_UAT_TOKEN
    );

    const response = await apiClient.unblockAccount(
      request.licenseId,
      request.account
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Conta desbloqueada com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao desbloquear conta Nelogica UAT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-api-client.ts
import axios, { AxiosInstance } from "axios";

/**
 * Interfaces de resposta da API
 */

interface NelogicaBaseResponse {
  message: string;
  status: number;
  isSuccess: boolean;
  notifications: Record<string, string[]>;
}

interface NelogicaAuthResponse extends NelogicaBaseResponse {
  data: {
    token: string;
    type: string;
    expiresAt: string;
  };
}

interface NelogicaSubscriptionResponse extends NelogicaBaseResponse {
  data: {
    customerId: string;
    subscriptionId: string;
    licenseId: string;
    accounts: {
      account: string;
      profileId: string;
    }[];
  };
}

interface NelogicaCreateAccountResponse extends NelogicaBaseResponse {
  data: {
    account: string;
    profileId: string;
  }[];
}

interface NelogicaEnvironmentsResponse extends NelogicaBaseResponse {
  data: {
    parameters: {
      pagination: {
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    };
    environments: {
      environmentId: string;
      name: string;
      description: string;
      isTest: boolean;
      isSimulator: boolean;
      softwareId: number;
    }[];
  };
}

interface NelogicaRiskProfilesResponse extends NelogicaBaseResponse {
  data: {
    parameters: {
      pagination: {
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    };
    riskProfiles: {
      profileId: string;
      initialBalance: number;
      trailing: boolean;
      stopOutRule: number;
      leverage: number;
      commissionsEnabled: boolean;
      enableContractExposure: boolean;
      contractExposure: number;
      enableLoss: boolean;
      lossRule: number;
      enableGain: boolean;
      gainRule: number;
    }[];
  };
}

interface NelogicaSubscriptionsResponse extends NelogicaBaseResponse {
  data: {
    parameters: {
      pagination: {
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    };
    subscriptions: {
      subscriptionId: string;
      licenseId: string;
      customerId: string;
      createdAt: string;
      accounts: {
        account: string;
        name: string;
        profileId: string;
        validadedAt: string;
      }[];
    }[];
  };
}

interface NelogicaGenericResponse extends NelogicaBaseResponse {
  data: any;
}

interface NelogicaCreateRiskResponse extends NelogicaBaseResponse {
  data: {
    profileId: string;
  };
}

/**
 * Interfaces de parâmetros de requisição
 */

export interface CreateSubscriptionParams {
  firstName: string;
  lastName: string;
  gender?: number;
  birth?: string;
  email: string;
  PhoneNumber?: string;
  countryNationality?: string;
  document?: {
    documentType: number;
    document: string;
  };
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    complement?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  account?: {
    name: string;
    profileId: string;
  }[];
}

export interface CreateAccountParams {
  name: string;
  profileId: string;
}

export interface RiskProfileParams {
  initialBalance?: number;
  trailing?: boolean;
  stopOutRule?: number;
  leverage?: number;
  commissionsEnabled?: boolean;
  enableContractExposure?: boolean;
  contractExposure?: number;
  enableLoss?: boolean;
  lossRule?: number;
  enableGain?: boolean;
  gainRule?: number;
}

export interface UpdateRiskProfileParams extends RiskProfileParams {
  profileId: string;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Cliente principal para a API da Nelogica
 */
export class NelogicaApiClient {
  private baseUrl: string;
  private apiClient: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private isLoggingIn: boolean = false;

  constructor(
    baseUrl: string,
    private username: string,
    private password: string
  ) {
    this.baseUrl = baseUrl;
    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para adicionar o token às requisições
    this.apiClient.interceptors.request.use(async (config) => {
      // Não adiciona token à requisição de login
      if (config.url === "api/v2/auth/login") {
        return config;
      }

      // Verifica se o token está válido, caso contrário, obtém um novo
      if (this.token) {
        config.headers["Authorization"] = `Bearer ${this.token}`;
      }

      return config;
    });
  }

  private isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiry) {
      return false;
    }
    // Verifica se o token expira em menos de 5 minutos
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return this.tokenExpiry > fiveMinutesFromNow;
  }

  /**
   * Autentica na API da Nelogica e obtém um token
   */
  public async login(): Promise<void> {
    // Evita múltiplas tentativas de login simultâneas
    if (this.isLoggingIn) {
      console.log("[Nelogica API] Login já está em andamento, aguardando...");

      // Espera até que o login em andamento termine
      while (this.isLoggingIn) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Se já temos um token válido após o login anterior, retornamos
      if (this.isTokenValid()) {
        return;
      }
    }

    // Se o token já é válido, não precisamos fazer login novamente
    if (this.isTokenValid()) {
      return;
    }

    try {
      this.isLoggingIn = true;
      console.log("[Nelogica API] Iniciando autenticação...");

      const response = await this.apiClient.post<NelogicaAuthResponse>(
        "api/v2/auth/login",
        {
          username: this.username,
          password: this.password,
        }
      );

      if (response.data.isSuccess) {
        this.token = response.data.data.token;
        this.tokenExpiry = new Date(response.data.data.expiresAt);
        console.log(
          "[Nelogica API] Autenticação bem-sucedida, token válido até:",
          this.tokenExpiry
        );
      } else {
        throw new Error(`Falha na autenticação: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro de autenticação:",
        error.response?.data || error.message
      );
      throw new Error("Falha na autenticação com a API da Nelogica");
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * Registra uma nova assinatura e cliente na Nelogica
   */
  public async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<NelogicaSubscriptionResponse> {
    try {
      console.log("[Nelogica API] Criando nova assinatura para:", params.email);

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.post<NelogicaSubscriptionResponse>(
        "api/v2/manager/subscriptions",
        params
      );

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica API] Assinatura criada com sucesso:",
          response.data.data.subscriptionId
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao criar assinatura:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao criar assinatura: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cria uma nova conta para uma licença
   */
  public async createAccount(
    licenseId: string,
    accounts: CreateAccountParams[]
  ): Promise<NelogicaCreateAccountResponse> {
    try {
      console.log(
        `[Nelogica API] Criando ${accounts.length} conta(s) para a licença:`,
        licenseId
      );

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.post<NelogicaCreateAccountResponse>(
        `api/v2/manager/${licenseId}/accounts`,
        accounts
      );

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica API] Contas criadas com sucesso:",
          response.data.data
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao criar conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao criar conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cancela uma assinatura
   */
  public async cancelSubscription(
    subscriptionId: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Cancelando assinatura:", subscriptionId);

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.delete<NelogicaGenericResponse>(
        `api/v2/commerce/subscriptions/products/${subscriptionId}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Assinatura cancelada com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao cancelar assinatura:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao cancelar assinatura: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Bloqueia uma conta
   */
  public async blockAccount(
    licenseId: string,
    account: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Bloqueando conta:", account);

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.put<NelogicaGenericResponse>(
        `api/v2/manager/licenses/${licenseId}/block/accounts/${account}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Conta bloqueada com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao bloquear conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao bloquear conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Desbloqueia uma conta
   */
  public async unblockAccount(
    licenseId: string,
    account: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Desbloqueando conta:", account);

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.delete<NelogicaGenericResponse>(
        `api/v2/manager/licenses/${licenseId}/block/accounts/${account}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Conta desbloqueada com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao desbloquear conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao desbloquear conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Define o perfil de risco para uma conta
   */
  public async setAccountRisk(
    licenseId: string,
    account: string,
    profileId: string,
    accountType: number = 0
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log(
        "[Nelogica API] Configurando perfil de risco para conta:",
        account
      );

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.post<NelogicaGenericResponse>(
        `api/v2/manager/${licenseId}/accounts/${account}`,
        {
          profileId,
          accountType,
        }
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Perfil de risco configurado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao definir perfil de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao definir perfil de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Remove uma conta
   */
  public async removeAccount(
    licenseId: string,
    account: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Removendo conta:", account);

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response = await this.apiClient.delete<NelogicaGenericResponse>(
        `api/v2/manager/license/${licenseId}/accounts/${account}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Conta removida com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao remover conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao remover conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Lista ambientes disponíveis
   */
  public async listEnvironments(
    params?: PaginationParams
  ): Promise<NelogicaEnvironmentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/commerce/environments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log("[Nelogica API] Listando ambientes");

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response =
        await this.apiClient.post<NelogicaEnvironmentsResponse>(url);

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica API] Ambientes obtidos com sucesso:",
          response.data.data.environments.length
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao listar ambientes:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao listar ambientes: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Lista perfis de risco
   */
  public async listRiskProfiles(
    environmentId: string,
    params?: PaginationParams
  ): Promise<NelogicaRiskProfilesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/manager/risk/${environmentId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log(
        "[Nelogica API] Listando perfis de risco para o ambiente:",
        environmentId
      );

      // Certifique-se de que estamos autenticados
      if (!this.isTokenValid()) {
        await this.login();
      }

      const response =
        await this.apiClient.get<NelogicaRiskProfilesResponse>(url);

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica API] Perfis de risco obtidos com sucesso:",
          response.data.data.riskProfiles.length
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao listar perfis de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao listar perfis de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cria um perfil de risco
   */
  public async createRiskProfile(
    environmentId: string,
    params: RiskProfileParams
  ): Promise<NelogicaCreateRiskResponse> {
    try {
      console.log(
        "[Nelogica API] Criando perfil de risco para o ambiente:",
        environmentId
      );
      const response = await this.apiClient.post<NelogicaCreateRiskResponse>(
        `api/v2/manager/risk/${environmentId}`,
        params
      );

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica API] Perfil de risco criado com sucesso:",
          response.data.data.profileId
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao criar perfil de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao criar perfil de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Atualiza um perfil de risco
   */
  public async updateRiskProfile(
    environmentId: string,
    params: UpdateRiskProfileParams
  ): Promise<NelogicaCreateRiskResponse> {
    try {
      console.log(
        "[Nelogica API] Atualizando perfil de risco:",
        params.profileId
      );
      const response = await this.apiClient.put<NelogicaCreateRiskResponse>(
        `api/v2/manager/risk/${environmentId}`,
        params
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Perfil de risco atualizado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao atualizar perfil de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao atualizar perfil de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Lista suas assinaturas
   */
  public async listSubscriptions(
    params?: { account?: string; customerId?: string } & PaginationParams
  ): Promise<NelogicaSubscriptionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.account) queryParams.append("account", params.account);
      if (params?.customerId)
        queryParams.append("customerId", params.customerId);
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/manager/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log("[Nelogica API] Listando assinaturas");
      const response =
        await this.apiClient.get<NelogicaSubscriptionsResponse>(url);

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica API] Assinaturas obtidas com sucesso:",
          response.data.data.subscriptions.length
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao listar assinaturas:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao listar assinaturas: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Atualiza um cliente
   */
  public async updateCustomer(
    customerId: string,
    firstName: string,
    lastName: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Atualizando cliente:", customerId);
      const response = await this.apiClient.put<NelogicaGenericResponse>(
        `api/v2/manager/customers/${customerId}`,
        {
          firstName,
          lastName,
        }
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica API] Cliente atualizado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao atualizar cliente:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao atualizar cliente: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

#![no_std]

use multiversx_sc::{derive_imports::*, imports::*};

/// Sistema de gestió de contractes de lloguer sense intermediaris
#[multiversx_sc::contract]
pub trait RentalContract {
    #[init]
    fn init(&self) {}

    #[upgrade]
    fn upgrade(&self) {}



    /// Crea un nou contracte de lloguer
    #[endpoint(createRentalContract)]
    fn create_rental_contract(
        &self,
        tenant: ManagedAddress,
        deposit_amount: BigUint,
        monthly_rent: BigUint,
        duration_months: u64,
        contract_reference: ManagedBuffer,
    ) -> u64 {
        let landlord = self.blockchain().get_caller();

        require!(tenant != landlord, "Landlord and tenant must be different");
        require!(deposit_amount > 0, "Deposit must be greater than 0");
        require!(monthly_rent > 0, "Monthly rent must be greater than 0");
        require!(duration_months > 0, "Duration must be at least 1 month");

        let contract_id = self.next_contract_id().get();

        let rental_contract = RentalContractData {
            landlord: landlord.clone(),
            tenant: tenant.clone(),
            deposit: deposit_amount.clone(),
            monthly_rent: monthly_rent.clone(),
            duration_months,
            contract_reference: contract_reference.clone(),
            start_timestamp: 0, // S'estableix quan el tenant accepta
            end_timestamp: 0, // S'estableix quan el tenant accepta
            payments_made: 0,
            total_payments_expected: duration_months,
            status: ContractStatus::Pending,
        };

        // Emmagatzemar el contracte
        self.contracts(contract_id).set(&rental_contract);
        // Actualitzar següent ID
        self.next_contract_id().set(contract_id + 1);
        
        // Indexar per landlord i tenant
        self.contract_by_landlord(&landlord).insert(contract_id);
        self.contract_by_tenant(&tenant).insert(contract_id);

        contract_id
    }

    /// El tenant accepta el contracte i paga la fiança
    #[endpoint(acceptContract)]
    #[payable("EGLD")]
    fn accept_contract(&self, contract_id: u64) {
        require!(!self.contracts(contract_id).is_empty(), "Contract does not exist");
        
        let mut contract = self.contracts(contract_id).get();
        let caller = self.blockchain().get_caller();
        let payment = self.call_value().egld().clone_value();

        require!(caller == contract.tenant, "Only designated tenant can accept");
        require!(contract.status == ContractStatus::Pending, "Contract is not pending");
        require!(payment == contract.deposit, "Payment must match deposit amount");

        let current_timestamp = self.blockchain().get_block_timestamp();
        
        contract.status = ContractStatus::Active;
        contract.start_timestamp = current_timestamp;
        contract.end_timestamp = current_timestamp + (contract.duration_months * 30 * 24 * 3600);

        self.contracts(contract_id).set(&contract);
    }

    // ========== PAGAMENTS ==========

    /// Realitza un pagament periòdic del lloguer
    #[endpoint(makePayment)]
    #[payable("EGLD")]
    fn make_payment(&self, contract_id: u64) {
        require!(!self.contracts(contract_id).is_empty(), "Contract does not exist");
        
        let mut contract = self.contracts(contract_id).get();
        let caller = self.blockchain().get_caller();
        let payment = self.call_value().egld().clone_value();
        let current_timestamp = self.blockchain().get_block_timestamp();

        require!(caller == contract.tenant, "Only tenant can make payments");
        require!(contract.status == ContractStatus::Active, "Contract is not active");
        require!(payment == contract.monthly_rent, "Payment amount must match monthly rent");

        // Verificar que no s'ha acabat el contracte
        require!(current_timestamp <= contract.end_timestamp, "Contract has ended");

        // Enviar pagament al propietari
        self.send().direct_egld(&contract.landlord, &payment);

        // Actualitzar estat del contracte
        contract.payments_made += 1;

        // Si s'han fet tots els pagaments, marcar com completat
        if contract.payments_made >= contract.total_payments_expected {
            contract.status = ContractStatus::Completed;
        }

        self.contracts(contract_id).set(&contract);
    }

    // ========== FINALITZACIÓ DEL CONTRACTE ==========

    /// El propietari indica si vol retornar la fiança al llogater
    #[endpoint(landlordDecision)]
    fn landlord_decision(&self, contract_id: u64, return_deposit: bool) {
        require!(!self.contracts(contract_id).is_empty(), "Contract does not exist");
        
        let mut contract = self.contracts(contract_id).get();
        let caller = self.blockchain().get_caller();
        let current_timestamp = self.blockchain().get_block_timestamp();

        require!(caller == contract.landlord, "Only landlord can make this decision");
        require!(
            contract.status == ContractStatus::Active || contract.status == ContractStatus::Completed,
            "Contract is not in valid status"
        );
        require!(
            current_timestamp >= contract.end_timestamp || contract.status == ContractStatus::Completed,
            "Contract has not ended yet and is not completed"
        );

        // Comprovar que el propietari no hagi pres ja una decisió
        if !self.deposit_decisions(contract_id).is_empty() {
            let decision = self.deposit_decisions(contract_id).get();
            require!(decision.landlord_decision.is_none(), "Landlord already made decision");
        }

        // Obtenir decisió existent o crear-ne una nova
        let mut decision = if self.deposit_decisions(contract_id).is_empty() {
            DepositDecision {
                landlord_decision: None,
                tenant_decision: None,
            }
        } else {
            self.deposit_decisions(contract_id).get()
        };

        // Emmagatzemar decisió
        decision.landlord_decision = Some(return_deposit);
        self.deposit_decisions(contract_id).set(&decision);

        // Si ambdós han decidit el mateix, executar
        if let Some(tenant_dec) = decision.tenant_decision {
            if tenant_dec == return_deposit {
                self.execute_deposit_return(contract_id, return_deposit);
            } else {
                // Desacord - activar arbitratge
                contract.status = ContractStatus::InDispute;
                self.contracts(contract_id).set(&contract);
            }
        }
    }

    /// El llogater indica si vol rebre la fiança de tornada
    #[endpoint(tenantDecision)]
    fn tenant_decision(&self, contract_id: u64, return_deposit: bool) {
        require!(!self.contracts(contract_id).is_empty(), "Contract does not exist");
        
        let mut contract = self.contracts(contract_id).get();
        let caller = self.blockchain().get_caller();
        let current_timestamp = self.blockchain().get_block_timestamp();

        require!(caller == contract.tenant, "Only tenant can make this decision");
        require!(
            contract.status == ContractStatus::Active || contract.status == ContractStatus::Completed,
            "Contract is not in valid status"
        );
        require!(
            current_timestamp >= contract.end_timestamp || contract.status == ContractStatus::Completed,
            "Contract has not ended yet and is not completed"
        );

        if !self.deposit_decisions(contract_id).is_empty() {
            let decision = self.deposit_decisions(contract_id).get();
            require!(decision.tenant_decision.is_none(), "Tenant already made decision");
        }

        // Obtenir decisió existent o crear-ne una nova
        let mut decision = if self.deposit_decisions(contract_id).is_empty() {
            DepositDecision {
                landlord_decision: None,
                tenant_decision: None,
            }
        } else {
            self.deposit_decisions(contract_id).get()
        };

        // Emmagatzemar decisió
        decision.tenant_decision = Some(return_deposit);
        self.deposit_decisions(contract_id).set(&decision);

        // Si ambdós han decidit el mateix, executar
        if let Some(landlord_dec) = decision.landlord_decision {
            if landlord_dec == return_deposit {
                self.execute_deposit_return(contract_id, return_deposit);
            } else {
                // Desacord - activar arbitratge
                contract.status = ContractStatus::InDispute;
                self.contracts(contract_id).set(&contract);
            }
        }
    }

    // ========== HELPERS ==========

    fn execute_deposit_return(&self, contract_id: u64, return_to_tenant: bool) {
        let mut contract = self.contracts(contract_id).get();

        let recipient = if return_to_tenant {
            contract.tenant.clone()
        } else {
            contract.landlord.clone()
        };

        self.send().direct_egld(&recipient, &contract.deposit);

        contract.status = ContractStatus::Finalized;
        self.contracts(contract_id).set(&contract);
    }

    // ========== VIEWS ==========

    /// Obté els detalls d'un contracte
    #[view(getContractDetails)]
    fn get_contract_details(
        &self,
        contract_id: u64,
    ) -> MultiValue11<
        ManagedAddress,
        ManagedAddress,
        BigUint,
        BigUint,
        u64,
        ManagedBuffer,
        u64,
        u64,
        u64,
        u64,
        u8,
    > {
        require!(!self.contracts(contract_id).is_empty(), "Contract does not exist");
        
        let contract = self.contracts(contract_id).get();
        
        (
            contract.landlord,
            contract.tenant,
            contract.deposit,
            contract.monthly_rent,
            contract.duration_months,
            contract.contract_reference,
            contract.start_timestamp,
            contract.end_timestamp,
            contract.payments_made,
            contract.total_payments_expected,
            contract.status as u8,
        )
            .into()
    }

    /// Obté els contractes d'un propietari
    #[view(getContractsByLandlord)]
    fn get_contracts_by_landlord(&self, landlord: ManagedAddress) -> MultiValueEncoded<u64> {
        let mut result = MultiValueEncoded::new();
        for contract_id in self.contract_by_landlord(&landlord).iter() {
            result.push(contract_id);
        }
        result
    }

    /// Obté els contractes d'un llogater
    #[view(getContractsByTenant)]
    fn get_contracts_by_tenant(&self, tenant: ManagedAddress) -> MultiValueEncoded<u64> {
        let mut result = MultiValueEncoded::new();
        for contract_id in self.contract_by_tenant(&tenant).iter() {
            result.push(contract_id);
        }
        result
    }

    /// Obté l'estat de les decisions sobre la fiança
    #[view(getDepositDecisionDetails)]
    fn get_deposit_decision_details(&self, contract_id: u64) -> MultiValue4<u8, u8, u8, u8> {
        require!(
            !self.deposit_decisions(contract_id).is_empty(),
            "No decisions made yet"
        );

        let decision = self.deposit_decisions(contract_id).get();

        let (landlord_decided, landlord_wants_return) = match decision.landlord_decision {
            Some(true) => (1u8, 1u8),
            Some(false) => (1u8, 0u8),
            None => (0u8, 0u8),
        };

        let (tenant_decided, tenant_wants_return) = match decision.tenant_decision {
            Some(true) => (1u8, 1u8),
            Some(false) => (1u8, 0u8),
            None => (0u8, 0u8),
        };

        (
            landlord_decided,
            landlord_wants_return,
            tenant_decided,
            tenant_wants_return,
        )
            .into()
    }

    /// Obté l'estat dels pagaments d'un contracte
    #[view(getPaymentsStatus)]
    fn get_payments_status(&self, contract_id: u64) -> MultiValue2<u64, u64> {
        require!(!self.contracts(contract_id).is_empty(), "Contract does not exist");
        
        let contract = self.contracts(contract_id).get();
        (contract.payments_made, contract.total_payments_expected).into()
    }

    // ========== STORAGE ==========

    #[storage_mapper("nextContractId")]
    fn next_contract_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("contracts")]
    fn contracts(&self, contract_id: u64) -> SingleValueMapper<RentalContractData<Self::Api>>;

    #[storage_mapper("contractByLandlord")]
    fn contract_by_landlord(&self, landlord: &ManagedAddress) -> UnorderedSetMapper<u64>;

    #[storage_mapper("contractByTenant")]
    fn contract_by_tenant(&self, tenant: &ManagedAddress) -> UnorderedSetMapper<u64>;
    
    #[storage_mapper("depositDecisions")]
    fn deposit_decisions(&self, contract_id: u64) -> SingleValueMapper<DepositDecision>;
}

// ========== STRUCTS ==========

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Debug)]
pub enum ContractStatus {
    Pending,
    Active,
    Completed,
    InDispute,
    Finalized,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode)]
pub struct RentalContractData<M: ManagedTypeApi> {
    pub landlord: ManagedAddress<M>,
    pub tenant: ManagedAddress<M>,
    pub deposit: BigUint<M>,
    pub monthly_rent: BigUint<M>,
    pub duration_months: u64,
    pub contract_reference: ManagedBuffer<M>,
    pub start_timestamp: u64,
    pub end_timestamp: u64,
    pub payments_made: u64,
    pub total_payments_expected: u64,
    pub status: ContractStatus,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode)]
pub struct DepositDecision {
    pub landlord_decision: Option<bool>,
    pub tenant_decision: Option<bool>,
}

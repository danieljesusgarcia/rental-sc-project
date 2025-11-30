#!/bin/bash

CONTRACT="erd1qqqqqqqqqqqqqpgq3q7w23lqhdderlnvn7ck7ec26rnlrj0tanlsh0uvkp"
PROXY="https://devnet-api.multiversx.com"

# Función para seleccionar wallet
select_wallet() {
  echo ""
  echo "=== Selecciona la wallet a utilitzar ==="
  echo "1) wallet-owner.pem (Propietari del SC)"
  echo "2) wallet-landlord.pem (Propietari del pis)"
  echo "3) wallet-tenant.pem (Llogater)"
  echo "4) Especificar una altra ruta"
  read -p "Tria una opció: " wallet_option
  
  case $wallet_option in
    1) 
      PEM="~/wallet-owner.pem"
      echo "Utilitzant: wallet-owner.pem (Propietari del SC)"
      ;;
    2)
      PEM="~/wallet-landlord.pem"
      echo "Utilitzant: wallet-landlord.pem (Propietari del pis)"
      ;;
    3)
      PEM="~/wallet-tenant.pem"
      echo "Utilitzant: wallet-tenant.pem (Llogater)"
      ;;
    4)
      read -p "Ruta completa al fitxer .pem: " custom_pem
      PEM="$custom_pem"
      echo "Utilitzant: $custom_pem"
      ;;
    *)
      echo "Opció no vàlida, utilitzant wallet-owner.pem per defecte"
      PEM="~/wallet-owner.pem"
      ;;
  esac
}

# Función para convertir hex a decimal (maneja números grandes)
hex_to_decimal() {
  local hex_value=$1
  if [[ $hex_value == "0x"* ]]; then
    hex_value=${hex_value#0x}
  fi
  if [[ -z "$hex_value" || "$hex_value" == "00" || "$hex_value" == "" ]]; then
    echo "0"
  else
    python3 -c "print(int('$hex_value', 16))" 2>/dev/null || echo "0"
  fi
}

# Función para convertir timestamp a fecha
timestamp_to_date() {
  local timestamp=$1
  if [[ $timestamp -eq 0 ]]; then
    echo "No definido"
  else
    date -r "$timestamp" "+%d/%m/%y %H:%M:%S" 2>/dev/null || \
    date -d "@$timestamp" "+%d/%m/%y %H:%M:%S" 2>/dev/null || \
    echo "Fecha inválida"
  fi
}

# Función para convertir denominación mínima a EGLD
denomination_to_egld() {
  local denomination=$1
  if [[ $denomination -eq 0 ]]; then
    echo "0 EGLD"
  else
    python3 -c "print(f'{$denomination / 10**18:.18f} EGLD')" 2>/dev/null || echo "$denomination"
  fi
}

# Función para convertir string hex a texto
hex_to_string() {
  local hex_value=$1
  if [[ -z "$hex_value" ]]; then
    echo ""
  else
    # Convertir hex a text utilitzant printf i od
    printf "%b" "$(echo "$hex_value" | sed 's/../\\x&/g')" 2>/dev/null || echo "$hex_value"
  fi
}

# Parsear estado del contracte
parse_status() {
  local status=$1
  case $status in
    ""|"0") echo "Pending (Pendent)" ;;
    "1") echo "Active (Actiu)" ;;
    "2") echo "Completed (Completat)" ;;
    "3") echo "InDispute (En disputa)" ;;
    "4") echo "Finalized (Finalitzat)" ;;
    *) echo "Estat desconegut: $status" ;;
  esac
}

# ============ CREAR CONTRACTE DE LLOGUER (LANDLORD) ============
create_rental_contract() {
  echo ""
  echo "=== Crear nou contracte de lloguer (Landlord) ==="
  read -p "Adreça del llogater (tenant): " tenant
  read -p "Fiança requerida (en EGLD, ex: 1.5): " deposit_egld
  read -p "Lloguer mensual (en EGLD, ex: 0.5): " monthly_rent_egld
  read -p "Durada en mesos: " duration_months
  read -p "Referència del contracte (text): " contract_ref
  
  # Convertir EGLD a denominació mínima
  deposit=$(python3 -c "print(int($deposit_egld * 10**18))")
  monthly_rent=$(python3 -c "print(int($monthly_rent_egld * 10**18))")
  
  # Convertir referència a hex
  contract_ref_hex=$(echo -n "$contract_ref" | od -A n -t x1 | tr -d ' \n')
  
  echo ""
  echo "Creant contracte..."
  result=$(mxpy contract call $CONTRACT \
    --pem $PEM \
    --gas-limit=10000000 \
    --function createRentalContract \
    --arguments addr:$tenant $deposit $monthly_rent $duration_months 0x$contract_ref_hex \
    --proxy $PROXY \
    --chain D \
    --send 2>&1)
  
  echo "$result"
  
  # Extreure el hash de la transacció correcte (emittedTransactionHash, no la signatura)
  tx_hash=$(echo "$result" | grep '"emittedTransactionHash"' | grep -o '[0-9a-f]\{64\}')
  
  echo ""
  echo "╔═══════════════════════════════════════════════╗"
  echo "║     CONTRACTE CREAT AMB ÈXIT!                ║"
  echo "╚═══════════════════════════════════════════════╝"
  
  if [[ -n "$tx_hash" ]]; then
    echo "Hash de la transacció: $tx_hash"
    echo ""
  fi
}

# ============ ACCEPTAR CONTRACTE I PAGAR FIANÇA (TENANT) ============
accept_contract() {
  echo ""
  echo "=== Acceptar contracte i pagar fiança (Tenant) ==="
  read -p "ID del contracte: " contract_id
  read -p "Import de la fiança (en EGLD): " deposit_egld
  
  deposit=$(python3 -c "print(int($deposit_egld * 10**18))")
  
  mxpy contract call $CONTRACT \
    --pem $PEM \
    --gas-limit=10000000 \
    --value $deposit \
    --function acceptContract \
    --arguments $contract_id \
    --proxy $PROXY \
    --chain D \
    --send
}

# ============ FER PAGAMENT ============
make_payment() {
  echo ""
  echo "=== Fer pagament de lloguer ==="
  read -p "ID del contracte: " contract_id
  read -p "Import del lloguer (en EGLD): " amount_egld
  
  amount=$(python3 -c "print(int($amount_egld * 10**18))")
  
  mxpy contract call $CONTRACT \
    --pem $PEM \
    --gas-limit=10000000 \
    --value $amount \
    --function makePayment \
    --arguments $contract_id \
    --proxy $PROXY \
    --chain D \
    --send
}

# ============ DECISIÓ PROPIETARI ============
landlord_decision() {
  echo ""
  echo "=== Decisió del propietari sobre la fiança ==="
  read -p "ID del contracte: " contract_id
  read -p "Retornar fiança al llogater? (1=Sí, 0=No): " return_deposit
  
  mxpy contract call $CONTRACT \
    --pem $PEM \
    --gas-limit=10000000 \
    --function landlordDecision \
    --arguments $contract_id $return_deposit \
    --proxy $PROXY \
    --chain D \
    --send
}

# ============ DECISIÓ LLOGATER ============
tenant_decision() {
  echo ""
  echo "=== Decisió del llogater sobre la fiança ==="
  read -p "ID del contracte: " contract_id
  read -p "Acceptar retornar fiança? (1=Sí, 0=No): " return_deposit
  
  mxpy contract call $CONTRACT \
    --pem $PEM \
    --gas-limit=10000000 \
    --function tenantDecision \
    --arguments $contract_id $return_deposit \
    --proxy $PROXY \
    --chain D \
    --send
}

# ============ CONSULTAR CONTRACTE ============
get_contract() {
  echo ""
  read -p "ID del contracte a consultar: " contract_id
  echo "Consultant contracte $contract_id..."
  
  result=$(mxpy contract query $CONTRACT \
    --function getContractDetails \
    --arguments $contract_id \
    --proxy $PROXY 2>/dev/null)
  
  if [[ $? -eq 0 ]]; then
    # Parsing simplificat: array JSON amb 13 elements (EGLD-only)
    landlord=$(echo "$result" | jq -r '.[0]' 2>/dev/null)
    tenant=$(echo "$result" | jq -r '.[1]' 2>/dev/null)
    deposit_hex=$(echo "$result" | jq -r '.[2]' 2>/dev/null)
    rent_hex=$(echo "$result" | jq -r '.[3]' 2>/dev/null)
    duration_hex=$(echo "$result" | jq -r '.[4]' 2>/dev/null)
    ref_hex=$(echo "$result" | jq -r '.[5]' 2>/dev/null)
    start_ts_hex=$(echo "$result" | jq -r '.[6]' 2>/dev/null)
    end_ts_hex=$(echo "$result" | jq -r '.[7]' 2>/dev/null)
    payments_made_hex=$(echo "$result" | jq -r '.[8]' 2>/dev/null)
    payments_expected_hex=$(echo "$result" | jq -r '.[9]' 2>/dev/null)
    status_hex=$(echo "$result" | jq -r '.[10]' 2>/dev/null)
    
    if [[ -n "$landlord" && "$landlord" != "null" ]]; then
      # Conversions
      deposit=$(hex_to_decimal "$deposit_hex")
      rent=$(hex_to_decimal "$rent_hex")
      duration=$(hex_to_decimal "$duration_hex")
      contract_ref=$(hex_to_string "$ref_hex")
      start_ts=$(hex_to_decimal "$start_ts_hex")
      end_ts=$(hex_to_decimal "$end_ts_hex")
      payments_made=$(hex_to_decimal "$payments_made_hex")
      total_payments=$(hex_to_decimal "$payments_expected_hex")
      status_dec=$(hex_to_decimal "$status_hex")
      status=$(parse_status "$status_dec")
      
      echo ""
      echo "╔══════════════════════════════════════════════════════════════════╗"
      echo "║                   CONTRACTE DE LLOGUER #$contract_id                          ║"
      echo "╠══════════════════════════════════════════════════════════════════╣"
      echo "║ Propietari: $landlord"
      echo "║ Llogater:   $tenant"
      echo "╠══════════════════════════════════════════════════════════════════╣"
      echo "║ Fiança:                $(denomination_to_egld $deposit)"
      echo "║ Lloguer mensual:       $(denomination_to_egld $rent)"
      echo "║ Durada:                $duration mesos"
      echo "╠══════════════════════════════════════════════════════════════════╣"
      echo "║ Data inici:            $(timestamp_to_date $start_ts)"
      echo "║ Data fi:               $(timestamp_to_date $end_ts)"
      echo "╠══════════════════════════════════════════════════════════════════╣"
      echo "║ Pagaments:             $payments_made de $total_payments"
      echo "║ Estat:                 $status"
      echo "║ Referència:            $contract_ref"
      echo "╚══════════════════════════════════════════════════════════════════╝"
    else
      echo "Contracte no trobat o no existeix"
    fi
  else
    echo "Error al consultar el contracte"
  fi
}

# ============ CONSULTAR DECISIÓ DE FIANÇA ============
get_deposit_decision() {
  echo ""
  read -p "ID del contracte: " contract_id
  echo "Consultant decisions sobre la fiança..."
  
  result=$(mxpy contract query $CONTRACT \
    --function getDepositDecisionDetails \
    --arguments $contract_id \
    --proxy $PROXY 2>/dev/null)
  
  if [[ $? -eq 0 ]]; then
    # Parsing: array amb 4 elements [landlord_decided, landlord_wants_return, tenant_decided, tenant_wants_return]
    landlord_decided=$(echo "$result" | jq -r '.[0]' 2>/dev/null)
    landlord_wants=$(echo "$result" | jq -r '.[1]' 2>/dev/null)
    tenant_decided=$(echo "$result" | jq -r '.[2]' 2>/dev/null)
    tenant_wants=$(echo "$result" | jq -r '.[3]' 2>/dev/null)
    
    if [[ -n "$landlord_decided" && "$landlord_decided" != "null" ]]; then
      # Convertir hex a decimal
      landlord_decided=$(hex_to_decimal "$landlord_decided")
      landlord_wants=$(hex_to_decimal "$landlord_wants")
      tenant_decided=$(hex_to_decimal "$tenant_decided")
      tenant_wants=$(hex_to_decimal "$tenant_wants")
      
      echo ""
      echo "╔══════════════════════════════════════════════════════════════════╗"
      echo "║             DECISIONS SOBRE LA FIANÇA - Contracte #$contract_id              ║"
      echo "╠══════════════════════════════════════════════════════════════════╣"
      
      # Decisió propietari
      if [[ $landlord_decided -eq 1 ]]; then
        if [[ $landlord_wants -eq 1 ]]; then
          echo "║ Propietari:  ✓ Decideix retornar la fiança al llogater          ║"
        else
          echo "║ Propietari:  ✓ Decideix NO retornar la fiança (la conserva)     ║"
        fi
      else
        echo "║ Propietari:  ✗ Encara no ha pres cap decisió                    ║"
      fi
      
      # Decisió llogater
      if [[ $tenant_decided -eq 1 ]]; then
        if [[ $tenant_wants -eq 1 ]]; then
          echo "║ Llogater:    ✓ Vota per rebre la fiança                      ║"
        else
          echo "║ Llogater:    ✓ Vota per NO rebre la fiança                   ║"
        fi
      else
        echo "║ Llogater:    ✗ Encara no ha pres cap decisió                    ║"
      fi
      
      echo "╚══════════════════════════════════════════════════════════════════╝"
    else
      echo "No s'han trobat decisions per aquest contracte"
    fi
  else
    echo "Error al consultar les decisions (potser no n'hi ha cap encara)"
  fi
}

# ============ CONSULTAR ESTAT DE PAGAMENTS ============
get_payments_status() {
  echo ""
  read -p "ID del contracte: " contract_id
  echo "Consultant estat dels pagaments..."
  
  result=$(mxpy contract query $CONTRACT \
    --function getPaymentsStatus \
    --arguments $contract_id \
    --proxy $PROXY 2>/dev/null)
  
  if [[ $? -eq 0 ]]; then
    # Extreure els valors del returnData (només 2 u64: payments_made i total_payments)
    payments_made_hex=$(echo "$result" | jq -r '.[0]' 2>/dev/null)
    total_payments_hex=$(echo "$result" | jq -r '.[1]' 2>/dev/null)
    
    if [[ -n "$payments_made_hex" && "$payments_made_hex" != "null" ]]; then
      # Convertir hex a decimal
      payments_made=$(hex_to_decimal "$payments_made_hex")
      total_payments=$(hex_to_decimal "$total_payments_hex")
      
      # Calcular percentatge
      if [[ $total_payments -gt 0 ]]; then
        percentage=$((payments_made * 100 / total_payments))
      else
        percentage=0
      fi
      
      # Calcular pagaments pendents
      pending=$((total_payments - payments_made))
      
      echo ""
      echo "╔══════════════════════════════════════════════════════╗"
      echo "║        ESTAT DE PAGAMENTS - Contracte #$contract_id            ║"
      echo "╠══════════════════════════════════════════════════════╣"
      echo "║ Pagaments realitzats:    $payments_made"
      echo "║ Total pagaments:         $total_payments"
      echo "║ Pagaments pendents:      $pending"
      echo "║ Progrés:                 $percentage%"
      echo "╚══════════════════════════════════════════════════════╝"
    else
      echo "Contracte no trobat o no existeix"
    fi
  else
    echo "Error al consultar l'estat dels pagaments"
  fi
}

# ============ CONTRACTES PER LANDLORD ============
get_contracts_by_landlord() {
  echo ""
  read -p "Adreça del landlord: " landlord
  
  result=$(mxpy contract query $CONTRACT \
    --proxy=$PROXY \
    --function=getContractsByLandlord \
    --arguments addr:$landlord 2>&1)
  
  # La resposta és un array JSON simple: ["0d", "0e", ...]
  ids=$(echo "$result" | grep -o '"[0-9a-fA-F]\+"' | sed 's/"//g')
  
  if [[ -n "$ids" ]]; then
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  CONTRACTES DEL LANDLORD                  ║"
    echo "╚════════════════════════════════════════════╝"
    
    for id_hex in $ids; do
      id_dec=$(hex_to_decimal "$id_hex")
      echo "  → Contracte ID: $id_dec"
    done
  else
    echo "No hi ha contractes per aquest landlord"
  fi
}

# ============ CONTRACTES PER TENANT ============
get_contracts_by_tenant() {
  echo ""
  read -p "Adreça del tenant: " tenant
  
  result=$(mxpy contract query $CONTRACT \
    --proxy=$PROXY \
    --function=getContractsByTenant \
    --arguments addr:$tenant 2>&1)
  
  # La resposta és un array JSON simple: ["0d", "0e", ...]
  ids=$(echo "$result" | grep -o '"[0-9a-fA-F]\+"' | sed 's/"//g')
  
  if [[ -n "$ids" ]]; then
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  CONTRACTES DEL TENANT                    ║"
    echo "╚════════════════════════════════════════════╝"
    
    for id_hex in $ids; do
      id_dec=$(hex_to_decimal "$id_hex")
      echo "  → Contracte ID: $id_dec"
    done
  else
    echo "No hi ha contractes per aquest tenant"
  fi
}

# ============ MENÚ PRINCIPAL ============
while true; do
  echo ""
  echo "===== Rental Contract Manager ====="
  echo "1) Crear nou contracte (Propietari)"
  echo "2) Acceptar contracte i pagar fiança (Llogater)"
  echo "3) Fer pagament de lloguer"
  echo "4) Decisió propietari (retornar fiança)"
  echo "5) Decisió llogater (acceptar retorn fiança)"
  echo "6) Consultar contracte"
  echo "7) Consultar decisions sobre fiança"
  echo "8) Consultar estat de pagaments"
  echo "9) Llistar contractes per propietari"
  echo "10) Llistar contractes per llogater"
  echo "0) Sortir"
  echo "==================================="
  read -p "Tria una opció: " opcio

  case $opcio in
    1) select_wallet; create_rental_contract ;;
    2) select_wallet; accept_contract ;;
    3) select_wallet; make_payment ;;
    4) select_wallet; landlord_decision ;;
    5) select_wallet; tenant_decision ;;
    6) get_contract ;;
    7) get_deposit_decision ;;
    8) get_payments_status ;;
    9) get_contracts_by_landlord ;;
    10) get_contracts_by_tenant ;;
    0) echo "Adéu!"; break ;;
    *) echo "Opció no vàlida." ;;
  esac
done

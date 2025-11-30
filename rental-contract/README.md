# Rental Contract - Smart Contract de Lloguer

Sistema descentralitzat de gestió de contractes de lloguer a la blockchain MultiversX, sense intermediaris.

[![MultiversX](https://img.shields.io/badge/MultiversX-Devnet-blue)](https://devnet-explorer.multiversx.com/accounts/)
[![Rust](https://img.shields.io/badge/Rust-1.86.0-orange)](https://www.rust-lang.org/)
[![Contract Size](https://img.shields.io/badge/Contract%20Size-7461%20bytes-green)](output/rental-contract.wasm)

## Descripció

Smart contract que permet crear, gestionar i finalitzar contractes de lloguer entre propietaris i llogaters, amb dipòsit de fiança, pagaments i retorn/retenció de la fiança al final del contracte.

### Flux principal:

- **Creació del contracte** per part del propietari
- **Acceptació i pagament de fiança** pel llogater
- **Pagaments mensuals** pel llogater
- **Sistema de decisió de fiança** al finalitzar. Si hi ha acord, es retorna la fiança al llogater o la reté el propietari.
- **Si no hi ha acord, el contracte queda en disputa** i serà resolt per un àrbitre (no forma part del contracte)

## Estructura del Contracte

### Estats del Contracte

```rust
pub enum ContractStatus {
    Pending,      // Pendent d'acceptació pel llogater
    Active,       // Actiu amb pagaments en curs
    Completed,    // Tots els pagaments realitzats
    InDispute,    // Desacord sobre la fiança
    Finalized,    // Finalitzat amb fiança retornada
}
```

### Flux del Contracte

```mermaid
graph LR
    A[Pending] -->|acceptContract| B[Active]
    B -->|makePayment| B
    B -->|Fi contracte| C[Completed]
    C -->|Acord fiança| D[Finalized]
    C -->|Desacord| E[InDispute]
```

## Endpoints

### Transaccions

| Endpoint | Descripció | Caller |
|----------|------------|--------|
| `createRentalContract` | Crea un nou contracte de lloguer | Propietari |
| `acceptContract` | Accepta el contracte i paga la fiança | Llogater |
| `makePayment` | Realitza un pagament mensual | Llogater |
| `landlordDecision` | Decisió del propietari sobre la fiança | Propietari |
| `tenantDecision` | Decisió del llogater sobre la fiança | Llogater |

### Views (Només lectura)

| View | Descripció |
|------|------------|
| `getContractDetails` | Obté tots els detalls d'un contracte |
| `getContractsByLandlord` | Llista contractes d'un propietari |
| `getContractsByTenant` | Llista contractes d'un llogater |
| `getDepositDecisionDetails` | Obté l'estat de les decisions sobre la fiança |
| `getPaymentsStatus` | Obté l'estat dels pagaments |

## Desenvolupament

### Prerequisits

- Rust 1.86.0 o superior
- MultiversX SDK (`mxpy`)
- `sc-meta` tool

### Build

```bash
# Compilar el contracte
sc-meta all build

# Output: output/rental-contract.wasm
```

### Test

```bash
# Tests Rust
cargo test

# Tests Go (scenarios)
cd tests && go test -v
```

### Deploy

El contracte es desplega a partir d'un wallet "wallet-owner.pem".

```bash
# Desplegar a devnet
mxpy contract deploy \
  --bytecode=output/rental-contract.wasm \
  --pem=~/wallet-owner.pem \
  --gas-limit=60000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

### Upgrade

El contracte s'actualitza fent referència al hash del contracte previ.

```bash
# Actualitzar a devnet
mxpy contract upgrade <hash_contracte> \
  --bytecode=output/rental-contract.wasm \
  --pem=~/wallet-owner.pem \
  --gas-limit=60000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

## Documentació i Clients

### Documentació del Contracte

- **[Documentació Rustdoc](docs/rental_contract/index.html)** - Documentació completa del codi font

### Clients Disponibles

#### Client Web (dApp React)

- **Tecnologies**: React 18 + TypeScript + Vite + Tailwind CSS
- **Característiques**:
  - Interfície web reactiva
  - Connexió amb DeFi Wallet, xPortal, Ledger
  - Dashboard amb totes les funcionalitats del contracte
  - Gestió visual de contractes com a propietari o llogater
  - Notificacions de transaccions en temps real
- **Instal·lació**:
  ```bash
  
  cd rental-dapp
  npm install
  npm run start:devnet
  ```

#### Client CLI (Shell Script)

- **Fitxer**: [client.sh](client.sh)
- **Ús**: Interfície de línia de comandos per interactuar amb el contracte
- **Execució**:

```bash
  cd rental-contract
  ./client.sh
```

**Menú interactiu:**
1. Crear nou contracte (Propietari)
2. Acceptar contracte i pagar fiança (Llogater)
3. Fer pagament de lloguer
4. Decisió propietari (retornar fiança)
5. Decisió llogater (acceptar retorn fiança)
6. Consultar contracte
7. Consultar decisions sobre fiança
8. Consultar estat de pagaments
9. Llistar contractes per propietari
10. Llistar contractes per llogater

**Wallets requerits:**

El client assumeix que existeixen tres wallets en el directori home:
- `wallet-owner.pem` - Propietari del Smart Contract
- `wallet-landlord.pem` - Propietari de l'immoble
- `wallet-tenant.pem` - Llogater

En els endpoints de transacció, cal seleccionar amb quina wallet es vol operar. El client també permet especificar una ruta personalitzada.

**Configuració del contracte:**

client.sh ja incorpora un paràmetre `CONTRACT` per identificar el hash del contracte

## Estructura del Projecte

```
rental-contract/
├── src/
│   └── rental_contract.rs      # Codi principal del contracte
├── tests/
│   ├── rental_contract_scenario_rs_test.rs
│   └── rental_contract_scenario_go_test.rs
├── scenarios/
│   └── rental_contract.scen.json
├── output/
│   ├── rental-contract.wasm    # Contracte compilat
│   ├── rental-contract.abi.json
│   └── rental-contract.mxsc.json
├── docs/                       # Documentació Rustdoc
├── client.sh                   # Script d'interacció
├── Cargo.toml
└── README.md
```

## Validacions del Contracte

- Verificació que el contracte existeix abans de qualsevol operació
- Control d'estats: només es permeten operacions en estats vàlids
- Pagaments: verificació d'import exacte i que el contracte està actiu
- Decisions sobre fiança:
  - Només es poden prendre quan el contracte ha acabat **O** està en estat `Completed`
  - Això permet provar la funcionalitat sense esperar que acabi el temps del contracte
  - Cada part només pot decidir una vegada
  - Si hi ha acord, la fiança es retorna/reté automàticament
  - Si hi ha desacord, el contracte passa a estat `InDispute`

## Exemples d'Ús amb mxpy

### Crear un contracte

```bash
# Com a propietari
mxpy contract call <CONTRACT> \
  --pem=landlord.pem \
  --function=createRentalContract \
  --arguments <tenant_address> <deposit_egld> <monthly_rent_egld> <duration_months> <contract_reference_hex> \
  --gas-limit=10000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

### Acceptar contracte

```bash
# Com a llogater (pagar fiança)
mxpy contract call <CONTRACT> \
  --pem=tenant.pem \
  --function=acceptContract \
  --arguments <contract_id> \
  --value=<deposit_amount> \
  --gas-limit=10000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

### Fer pagament de lloguer

```bash
# Com a llogater (pagament mensual)
mxpy contract call <CONTRACT> \
  --pem=tenant.pem \
  --function=makePayment \
  --arguments <contract_id> \
  --value=<monthly_rent_amount> \
  --gas-limit=10000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

### Decisió del propietari sobre la fiança

```bash
# Com a propietari (return_deposit: 1=Sí retornar, 0=No retornar)
mxpy contract call <CONTRACT> \
  --pem=landlord.pem \
  --function=landlordDecision \
  --arguments <contract_id> <return_deposit> \
  --gas-limit=10000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

### Decisió del llogater sobre la fiança

```bash
# Com a llogater (return_deposit: 1=Sí accepto retornar, 0=No)
mxpy contract call <CONTRACT> \
  --pem=tenant.pem \
  --function=tenantDecision \
  --arguments <contract_id> <return_deposit> \
  --gas-limit=10000000 \
  --proxy=https://devnet-api.multiversx.com \
  --chain=D \
  --send
```

### Consultar detalls d'un contracte

```bash
# Query (no gasta gas)
mxpy contract query <CONTRACT> \
  --function=getContractDetails \
  --arguments <contract_id> \
  --proxy=https://devnet-api.multiversx.com
```

### Llistar contractes per propietari

```bash
# Query: Obtenir tots els contractes d'un propietari
mxpy contract query <CONTRACT> \
  --function=getContractsByLandlord \
  --arguments <landlord_address> \
  --proxy=https://devnet-api.multiversx.com
```

### Llistar contractes per llogater

```bash
# Query: Obtenir tots els contractes d'un llogater
mxpy contract query <CONTRACT> \
  --function=getContractsByTenant \
  --arguments <tenant_address> \
  --proxy=https://devnet-api.multiversx.com
```

### Consultar decisions sobre la fiança

```bash
# Query: Veure l'estat de les decisions sobre la fiança
mxpy contract query <CONTRACT> \
  --function=getDepositDecisionDetails \
  --arguments <contract_id> \
  --proxy=https://devnet-api.multiversx.com
```

### Consultar estat dels pagaments

```bash
# Query: Veure pagaments realitzats i pendents
mxpy contract query <CONTRACT> \
  --function=getPaymentsStatus \
  --arguments <contract_id> \
  --proxy=https://devnet-api.multiversx.com
```

## Llicència

Aquest projecte està sota llicència MIT. Consulta el fitxer `LICENSE` per més detalls.

## Autor

- **Daniel Garcia** - Desenvolupament inicial

## 🔗 Enllaços

### Projectes Relacionats
- **[Rental dApp](https://github.com/tu-usuario/rental-dapp)** - Aplicació web React per interactuar amb el contracte

### Recursos MultiversX
- [MultiversX Docs](https://docs.multiversx.com/)
- [Rust Smart Contracts Guide](https://docs.multiversx.com/developers/developer-reference/sc-api-functions/)
- [MultiversX Explorer](https://explorer.multiversx.com/)
- [MultiversX Devnet Explorer](https://devnet-explorer.multiversx.com/)

---

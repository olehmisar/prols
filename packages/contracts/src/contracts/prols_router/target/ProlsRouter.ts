
/* Autogenerated file, do not edit! */

/* eslint-disable */
import {
  AztecAddress,
  type AztecAddressLike,
  CompleteAddress,
  Contract,
  type ContractArtifact,
  ContractBase,
  ContractFunctionInteraction,
  type ContractInstanceWithAddress,
  type ContractMethod,
  type ContractStorageLayout,
  type ContractNotes,
  DeployMethod,
  EthAddress,
  type EthAddressLike,
  EventSelector,
  type FieldLike,
  Fr,
  type FunctionSelectorLike,
  L1EventPayload,
  loadContractArtifact,
  type NoirCompiledContract,
  NoteSelector,
  Point,
  type PublicKey,
  type Wallet,
  type WrappedFieldLike,
} from '@aztec/aztec.js';
import ProlsRouterContractArtifactJson from './prols_router-ProlsRouter.json' assert { type: 'json' };
export const ProlsRouterContractArtifact = loadContractArtifact(ProlsRouterContractArtifactJson as NoirCompiledContract);



/**
 * Type-safe interface for contract ProlsRouter;
 */
export class ProlsRouterContract extends ContractBase {
  
  private constructor(
    instance: ContractInstanceWithAddress,
    wallet: Wallet,
  ) {
    super(instance, ProlsRouterContractArtifact, wallet);
  }
  

  
  /**
   * Creates a contract instance.
   * @param address - The deployed contract's address.
   * @param wallet - The wallet to use when interacting with the contract.
   * @returns A promise that resolves to a new Contract instance.
   */
  public static async at(
    address: AztecAddress,
    wallet: Wallet,
  ) {
    return Contract.at(address, ProlsRouterContract.artifact, wallet) as Promise<ProlsRouterContract>;
  }

  
  /**
   * Creates a tx to deploy a new instance of this contract.
   */
  public static deploy(wallet: Wallet, ) {
    return new DeployMethod<ProlsRouterContract>(Fr.ZERO, wallet, ProlsRouterContractArtifact, ProlsRouterContract.at, Array.from(arguments).slice(1));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified public keys hash to derive the address.
   */
  public static deployWithPublicKeysHash(publicKeysHash: Fr, wallet: Wallet, ) {
    return new DeployMethod<ProlsRouterContract>(publicKeysHash, wallet, ProlsRouterContractArtifact, ProlsRouterContract.at, Array.from(arguments).slice(2));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified constructor method.
   */
  public static deployWithOpts<M extends keyof ProlsRouterContract['methods']>(
    opts: { publicKeysHash?: Fr; method?: M; wallet: Wallet },
    ...args: Parameters<ProlsRouterContract['methods'][M]>
  ) {
    return new DeployMethod<ProlsRouterContract>(
      opts.publicKeysHash ?? Fr.ZERO,
      opts.wallet,
      ProlsRouterContractArtifact,
      ProlsRouterContract.at,
      Array.from(arguments).slice(1),
      opts.method ?? 'constructor',
    );
  }
  

  
  /**
   * Returns this contract's artifact.
   */
  public static get artifact(): ContractArtifact {
    return ProlsRouterContractArtifact;
  }
  

  public static get storage(): ContractStorageLayout<'admin' | 'minters' | 'balances' | 'total_supply' | 'pending_shields' | 'public_balances' | 'symbol' | 'name' | 'decimals'> {
      return {
        admin: {
      slot: new Fr(1n),
    },
minters: {
      slot: new Fr(2n),
    },
balances: {
      slot: new Fr(3n),
    },
total_supply: {
      slot: new Fr(4n),
    },
pending_shields: {
      slot: new Fr(5n),
    },
public_balances: {
      slot: new Fr(6n),
    },
symbol: {
      slot: new Fr(7n),
    },
name: {
      slot: new Fr(8n),
    },
decimals: {
      slot: new Fr(9n),
    }
      } as ContractStorageLayout<'admin' | 'minters' | 'balances' | 'total_supply' | 'pending_shields' | 'public_balances' | 'symbol' | 'name' | 'decimals'>;
    }
    

  public static get notes(): ContractNotes<'TransparentNote' | 'TokenNote'> {
    return {
      TransparentNote: {
          id: new NoteSelector(3193649735),
        },
TokenNote: {
          id: new NoteSelector(2350566847),
        }
    } as ContractNotes<'TransparentNote' | 'TokenNote'>;
  }
  

  /** Type-safe wrappers for the public methods exposed by the contract. */
  public declare methods: {
    
    /** compute_note_hash_and_optionally_a_nullifier(contract_address: struct, nonce: field, storage_slot: field, note_type_id: field, compute_nullifier: boolean, serialized_note: array) */
    compute_note_hash_and_optionally_a_nullifier: ((contract_address: AztecAddressLike, nonce: FieldLike, storage_slot: FieldLike, note_type_id: FieldLike, compute_nullifier: boolean, serialized_note: FieldLike[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** swap(sell_token: struct, buy_token: struct, sell_amount: field, buy_amount: field, secret_hash: field, nonce: field) */
    swap: ((sell_token: AztecAddressLike, buy_token: AztecAddressLike, sell_amount: FieldLike, buy_amount: FieldLike, secret_hash: FieldLike, nonce: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** withdraw(token: struct, amount: field, to: struct) */
    withdraw: ((token: AztecAddressLike, amount: FieldLike, to: AztecAddressLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;
  };

  
}

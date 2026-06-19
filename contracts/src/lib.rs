#![no_std]
use soroban_sdk::{contract, contractimpl, contracterror, contracttype, panic_with_error, Address, Env, String, Vec};

mod test;

// === Errors ===

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotOwner = 1,
    NameTooLong = 2,
    DescriptionTooLong = 3,
    BlobIdEmpty = 4,
    HashInvalid = 5,
    AgentNotFound = 6,
    MemoryNotFound = 7,
    NameEmpty = 8,
    MimeTypeTooLong = 9,
}

// === Constants ===

const MAX_NAME_LENGTH: u32 = 128;
const MAX_DESCRIPTION_LENGTH: u32 = 1024;
const HASH_HEX_LENGTH: u32 = 64;
const MAX_BLOB_ID_LENGTH: u32 = 256;
const MAX_MIME_LENGTH: u32 = 64;

// === Data Types ===

#[contracttype]
pub struct Agent {
    pub name: String,
    pub description: String,
    pub created_by: Address,
    pub created_at: u64,
    pub memory_count: u32,
}

#[contracttype]
pub struct MemoryAnchor {
    pub agent_id: u32,
    pub walrus_blob_id: String,
    pub content_hash: String,
    pub size: u64,
    pub mime_type: String,
    pub description: String,
    pub timestamp: u64,
    pub created_by: Address,
}

#[contracttype]
pub enum DataKey {
    AgentCount,
    Agent(u32),
    AgentOwner(u32),
    AgentMemories(u32),
    Memory(u32, u32),
    OwnerAgents(Address),
}

// === Contract ===

#[contract]
pub struct MemProof;

#[contractimpl]
impl MemProof {
    // --- Agent Management ---

    pub fn register(env: Env, caller: Address, name: String, description: String) -> u32 {
        caller.require_auth();

        let name_len = name.len();
        let desc_len = description.len();
        if name_len == 0 || name_len > MAX_NAME_LENGTH {
            panic_with_error!(&env, Error::NameTooLong);
        }
        if desc_len > MAX_DESCRIPTION_LENGTH {
            panic_with_error!(&env, Error::DescriptionTooLong);
        }

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::AgentCount)
            .unwrap_or(0);
        let agent_id = count + 1;

        let agent = Agent {
            name,
            description,
            created_by: caller.clone(),
            created_at: env.ledger().timestamp(),
            memory_count: 0,
        };

        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
        env.storage()
            .persistent()
            .set(&DataKey::AgentOwner(agent_id), &agent.created_by);
        env.storage()
            .persistent()
            .set(&DataKey::AgentMemories(agent_id), &Vec::<u32>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::AgentCount, &agent_id);

        let mut owner_agents: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerAgents(caller.clone()))
            .unwrap_or(Vec::new(&env));
        owner_agents.push_back(agent_id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerAgents(caller), &owner_agents);

        env.events().publish(
            ("agent_created",),
            (agent_id, agent.name, agent.created_by, agent.created_at),
        );

        agent_id
    }

    pub fn rename(env: Env, agent_id: u32, new_name: String) {
        let name_len = new_name.len();
        if name_len == 0 || name_len > MAX_NAME_LENGTH {
            panic_with_error!(&env, Error::NameTooLong);
        }

        Self::require_owner(&env, agent_id);

        let mut agent: Agent = env
            .storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); });

        agent.name = new_name;

        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
    }

    pub fn update_description(env: Env, agent_id: u32, new_description: String) {
        let desc_len = new_description.len();
        if desc_len > MAX_DESCRIPTION_LENGTH {
            panic_with_error!(&env, Error::DescriptionTooLong);
        }

        Self::require_owner(&env, agent_id);

        let mut agent: Agent = env
            .storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); });

        agent.description = new_description;

        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
    }

    // --- Memory Anchoring ---

    pub fn anchor(
        env: Env,
        agent_id: u32,
        walrus_blob_id: String,
        content_hash: String,
        size: u64,
        mime_type: String,
        description: String,
    ) {
        Self::require_owner(&env, agent_id);

        let blob_len = walrus_blob_id.len();
        if blob_len == 0 || blob_len > MAX_BLOB_ID_LENGTH {
            panic_with_error!(&env, Error::BlobIdEmpty);
        }

        let hash_len = content_hash.len();
        if hash_len != HASH_HEX_LENGTH {
            panic_with_error!(&env, Error::HashInvalid);
        }

        let desc_len = description.len();
        if desc_len > MAX_DESCRIPTION_LENGTH {
            panic_with_error!(&env, Error::DescriptionTooLong);
        }

        let mime_len = mime_type.len();
        if mime_len > MAX_MIME_LENGTH {
            panic_with_error!(&env, Error::MimeTypeTooLong);
        }

        let mut agent: Agent = env
            .storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); });

        let memory_index = agent.memory_count;
        let timestamp = env.ledger().timestamp();

        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::AgentOwner(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); });

        let memory = MemoryAnchor {
            agent_id,
            walrus_blob_id,
            content_hash,
            size,
            mime_type,
            description,
            timestamp,
            created_by: owner,
        };

        agent.memory_count += 1;

        let mut memories: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::AgentMemories(agent_id))
            .unwrap_or(Vec::new(&env));
        memories.push_back(memory_index);

        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
        env.storage()
            .persistent()
            .set(&DataKey::AgentMemories(agent_id), &memories);
        env.storage()
            .persistent()
            .set(&DataKey::Memory(agent_id, memory_index), &memory);

        env.events().publish(
            ("memory_anchored",),
            (
                agent_id,
                memory_index,
                memory.walrus_blob_id,
                memory.content_hash,
                memory.timestamp,
            ),
        );
    }

    // --- View Functions ---

    pub fn get_agent(env: Env, agent_id: u32) -> Agent {
        env.storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); })
    }

    pub fn get_agent_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::AgentCount)
            .unwrap_or(0)
    }

    pub fn get_agent_owner(env: Env, agent_id: u32) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::AgentOwner(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); })
    }

    pub fn get_agent_memory_count(env: Env, agent_id: u32) -> u32 {
        let agent: Agent = env
            .storage()
            .persistent()
            .get(&DataKey::Agent(agent_id))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::AgentNotFound); });
        agent.memory_count
    }

    pub fn get_agent_memories(env: Env, agent_id: u32) -> Vec<u32> {
        if !env.storage().persistent().has(&DataKey::Agent(agent_id)) {
            panic_with_error!(&env, Error::AgentNotFound);
        }
        env.storage()
            .persistent()
            .get(&DataKey::AgentMemories(agent_id))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_agents_by_owner(env: Env, owner: Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::OwnerAgents(owner))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_memory(env: Env, agent_id: u32, memory_index: u32) -> MemoryAnchor {
        env.storage()
            .persistent()
            .get(&DataKey::Memory(agent_id, memory_index))
            .unwrap_or_else(|| { panic_with_error!(&env, Error::MemoryNotFound); })
    }

    // --- Internal ---

    fn require_owner(env: &Env, agent_id: u32) {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::AgentOwner(agent_id))
            .unwrap_or_else(|| { panic_with_error!(env, Error::AgentNotFound); });
        owner.require_auth();
    }
}

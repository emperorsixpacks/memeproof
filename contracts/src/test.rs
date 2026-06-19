#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

#[test]
fn test_register() {
    let e = Env::default();
    let user = Address::generate(&e);

    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    e.mock_all_auths();

    let id = client.register(
        &user,
        &String::from_str(&e, "MyAgent"),
        &String::from_str(&e, "Description"),
    );

    assert_eq!(id, 1);
    assert_eq!(client.get_agent_count(), 1);

    let agent = client.get_agent(&id);
    assert_eq!(agent.name, String::from_str(&e, "MyAgent"));
    assert_eq!(agent.description, String::from_str(&e, "Description"));
    assert_eq!(agent.memory_count, 0);
}

#[test]
fn test_rename() {
    let e = Env::default();
    let user = Address::generate(&e);

    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    e.mock_all_auths();

    let id = client.register(
        &user,
        &String::from_str(&e, "OldName"),
        &String::from_str(&e, "Desc"),
    );

    client.rename(&id, &String::from_str(&e, "NewName"));

    let agent = client.get_agent(&id);
    assert_eq!(agent.name, String::from_str(&e, "NewName"));
}

#[test]
fn test_anchor_memory() {
    let e = Env::default();
    let user = Address::generate(&e);

    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    e.mock_all_auths();

    let id = client.register(
        &user,
        &String::from_str(&e, "MyAgent"),
        &String::from_str(&e, "Desc"),
    );

    client.anchor(
        &id,
        &String::from_str(&e, "blob123"),
        &String::from_str(&e, "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
        &1024u64,
        &String::from_str(&e, "application/json"),
        &String::from_str(&e, "Test memory"),
    );

    let agent = client.get_agent(&id);
    assert_eq!(agent.memory_count, 1);

    let memories = client.get_agent_memories(&id);
    assert_eq!(memories.len(), 1);
    assert_eq!(memories.get(0).unwrap(), 0);

    let memory = client.get_memory(&id, &0);
    assert_eq!(memory.walrus_blob_id, String::from_str(&e, "blob123"));
    assert_eq!(memory.size, 1024);
}

#[test]
fn test_multiple_memories() {
    let e = Env::default();
    let user = Address::generate(&e);

    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    e.mock_all_auths();

    let id = client.register(
        &user,
        &String::from_str(&e, "MyAgent"),
        &String::from_str(&e, "Desc"),
    );

    let blob_ids = ["blob0", "blob1", "blob2"];
    let hashes = [
        "0000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000001",
        "0000000000000000000000000000000000000000000000000000000000000002",
    ];
    let descs = ["Memory 0", "Memory 1", "Memory 2"];

    for i in 0..3 {
        client.anchor(
            &id,
            &String::from_str(&e, blob_ids[i]),
            &String::from_str(&e, hashes[i]),
            &(i as u64 * 100),
            &String::from_str(&e, "text/plain"),
            &String::from_str(&e, descs[i]),
        );
    }

    let agent = client.get_agent(&id);
    assert_eq!(agent.memory_count, 3);

    let memories = client.get_agent_memories(&id);
    assert_eq!(memories.len(), 3);
    assert_eq!(memories.get(0).unwrap(), 0);
    assert_eq!(memories.get(1).unwrap(), 1);
    assert_eq!(memories.get(2).unwrap(), 2);

    let memory = client.get_memory(&id, &1);
    assert_eq!(memory.size, 100);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_get_nonexistent_agent() {
    let e = Env::default();
    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    client.get_agent(&999);
}

#[test]
fn test_get_agents_by_owner() {
    let e = Env::default();
    let user = Address::generate(&e);

    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    e.mock_all_auths();

    let id1 = client.register(
        &user,
        &String::from_str(&e, "Agent1"),
        &String::from_str(&e, "First"),
    );
    let id2 = client.register(
        &user,
        &String::from_str(&e, "Agent2"),
        &String::from_str(&e, "Second"),
    );

    let agents = client.get_agents_by_owner(&user);
    assert_eq!(agents.len(), 2);
    assert_eq!(agents.get(0).unwrap(), id1);
    assert_eq!(agents.get(1).unwrap(), id2);
}

#[test]
fn test_get_agent_memory_count() {
    let e = Env::default();
    let user = Address::generate(&e);

    let contract_id = e.register(MemProof, ());
    let client = MemProofClient::new(&e, &contract_id);
    e.mock_all_auths();

    let id = client.register(
        &user,
        &String::from_str(&e, "Agent"),
        &String::from_str(&e, "Desc"),
    );

    assert_eq!(client.get_agent_memory_count(&id), 0);

    client.anchor(
        &id,
        &String::from_str(&e, "blob"),
        &String::from_str(&e, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        &1u64,
        &String::from_str(&e, "text/plain"),
        &String::from_str(&e, "Mem"),
    );

    assert_eq!(client.get_agent_memory_count(&id), 1);
}

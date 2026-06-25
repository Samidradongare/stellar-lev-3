#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ItemStatus {
    Lost,
    Claimed,
    Verified,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ClaimStatus {
    Pending,
    Verified,
    Rejected,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Item {
    pub id: u32,
    pub owner: Address,
    pub description: String,
    pub photo_ipfs: String,
    pub token: Address,
    pub reward: i128,
    pub status: ItemStatus,
    pub timestamp: u64,
    pub location: String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Claim {
    pub id: u32,
    pub item_id: u32,
    pub claimant: Address,
    pub proof_ipfs: String,
    pub status: ClaimStatus,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    NextItemId,
    NextClaimId,
    Item(u32),
    Claim(u32),
    OwnerItems(Address),
    ItemClaims(u32),
}

#[contract]
pub struct LostAndFoundContract;

#[contractimpl]
impl LostAndFoundContract {
    pub fn post_lost_item(
        env: Env,
        owner: Address,
        token: Address,
        description: String,
        photo_ipfs: String,
        location: String,
        reward: i128,
    ) -> u32 {
        owner.require_auth();

        if reward <= 0 {
            panic!("Reward amount must be greater than 0");
        }

        // Transfer reward from owner to the contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&owner, &env.current_contract_address(), &reward);

        let item_id: u32 = env.storage().instance().get(&DataKey::NextItemId).unwrap_or(1);
        env.storage().instance().set(&DataKey::NextItemId, &(item_id + 1));

        let timestamp = env.ledger().timestamp();

        let item = Item {
            id: item_id,
            owner: owner.clone(),
            description,
            photo_ipfs,
            token,
            reward,
            status: ItemStatus::Lost,
            timestamp,
            location,
        };

        env.storage().persistent().set(&DataKey::Item(item_id), &item);

        let mut owner_items: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerItems(owner.clone()))
            .unwrap_or(Vec::new(&env));
        owner_items.push_back(item_id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerItems(owner), &owner_items);

        // Emit event
        env.events().publish(
            (symbol_short!("ItemPost"), item_id),
            item,
        );

        item_id
    }

    pub fn submit_claim(
        env: Env,
        claimant: Address,
        item_id: u32,
        proof_ipfs: String,
    ) -> u32 {
        claimant.require_auth();

        let mut item: Item = env.storage().persistent().get(&DataKey::Item(item_id)).unwrap();

        if item.status != ItemStatus::Lost && item.status != ItemStatus::Claimed {
            panic!("Item is not open for claims");
        }

        if item.owner == claimant {
            panic!("Owner cannot claim their own item");
        }

        let claim_id: u32 = env.storage().instance().get(&DataKey::NextClaimId).unwrap_or(1);
        env.storage().instance().set(&DataKey::NextClaimId, &(claim_id + 1));

        let timestamp = env.ledger().timestamp();

        let claim = Claim {
            id: claim_id,
            item_id,
            claimant: claimant.clone(),
            proof_ipfs,
            status: ClaimStatus::Pending,
            timestamp,
        };

        env.storage().persistent().set(&DataKey::Claim(claim_id), &claim);

        let mut item_claims: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::ItemClaims(item_id))
            .unwrap_or(Vec::new(&env));
        item_claims.push_back(claim_id);
        env.storage()
            .persistent()
            .set(&DataKey::ItemClaims(item_id), &item_claims);

        if item.status == ItemStatus::Lost {
            item.status = ItemStatus::Claimed;
            env.storage().persistent().set(&DataKey::Item(item_id), &item);
        }

        env.events().publish(
            (symbol_short!("ClaimSub"), claim_id, item_id),
            claim,
        );

        claim_id
    }

    pub fn verify_claim(env: Env, owner: Address, claim_id: u32) {
        owner.require_auth();

        let mut claim: Claim = env.storage().persistent().get(&DataKey::Claim(claim_id)).unwrap();
        let item_id = claim.item_id;
        let mut item: Item = env.storage().persistent().get(&DataKey::Item(item_id)).unwrap();

        if owner != item.owner {
            panic!("Only owner can verify claim");
        }
        if claim.status != ClaimStatus::Pending {
            panic!("Claim is not pending");
        }
        if item.status != ItemStatus::Claimed {
            panic!("Item is not in claimed state");
        }

        // Release reward
        let token_client = token::Client::new(&env, &item.token);
        token_client.transfer(&env.current_contract_address(), &claim.claimant, &item.reward);

        // Update statuses
        claim.status = ClaimStatus::Verified;
        item.status = ItemStatus::Verified;

        env.storage().persistent().set(&DataKey::Claim(claim_id), &claim);
        env.storage().persistent().set(&DataKey::Item(item_id), &item);

        env.events().publish(
            (symbol_short!("ClaimVeri"), claim_id, item_id),
            claim,
        );
    }

    pub fn reject_claim(env: Env, owner: Address, claim_id: u32) {
        owner.require_auth();

        let mut claim: Claim = env.storage().persistent().get(&DataKey::Claim(claim_id)).unwrap();
        let item_id = claim.item_id;
        let mut item: Item = env.storage().persistent().get(&DataKey::Item(item_id)).unwrap();

        if owner != item.owner {
            panic!("Only owner can reject claim");
        }
        if claim.status != ClaimStatus::Pending {
            panic!("Claim is not pending");
        }
        if item.status != ItemStatus::Claimed {
            panic!("Item is not in claimed state");
        }

        // Refund reward
        let token_client = token::Client::new(&env, &item.token);
        token_client.transfer(&env.current_contract_address(), &item.owner, &item.reward);

        claim.status = ClaimStatus::Rejected;
        item.status = ItemStatus::Completed;

        env.storage().persistent().set(&DataKey::Claim(claim_id), &claim);
        env.storage().persistent().set(&DataKey::Item(item_id), &item);

        env.events().publish(
            (symbol_short!("ClaimRej"), claim_id, item_id),
            claim,
        );
    }

    pub fn get_total_items(env: Env) -> u32 {
        let next_item_id: u32 = env.storage().instance().get(&DataKey::NextItemId).unwrap_or(1);
        if next_item_id == 1 {
            0
        } else {
            next_item_id - 1
        }
    }

    pub fn get_item(env: Env, item_id: u32) -> Item {
        env.storage().persistent().get(&DataKey::Item(item_id)).unwrap()
    }

    pub fn get_claim(env: Env, claim_id: u32) -> Claim {
        env.storage().persistent().get(&DataKey::Claim(claim_id)).unwrap()
    }

    pub fn get_items_by_owner(env: Env, owner: Address) -> Vec<u32> {
        env.storage().persistent().get(&DataKey::OwnerItems(owner)).unwrap_or(Vec::new(&env))
    }

    pub fn get_claims_by_item(env: Env, item_id: u32) -> Vec<u32> {
        env.storage().persistent().get(&DataKey::ItemClaims(item_id)).unwrap_or(Vec::new(&env))
    }
}
